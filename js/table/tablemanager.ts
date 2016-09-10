/// <reference path="../_references.ts" />
/// <reference path="../authmanager.ts" />
/// <reference path="../app.ts" />
/// <reference path="../commandmanager.ts" />
/// <reference path="../services/connectionservice.ts" />
/// <reference path="../services/broadcastservice.ts" />
/// <reference path="../services/duplicatefinder.ts" />
/* tslint:disable:no-bitwise no-use-before-declare */

import * as ko from "knockout";
import * as timeService from "../timeService";
import { TableView } from "./tableview";
import { TournamentView } from "./tournamentview";
import { slowInternetService, connectionService } from "../services";
import { ConnectionWrapper } from "../services/connectionwrapper";
import * as broadcastService from "../services/broadcastservice";
import { SimplePopup } from "../popups/simplepopup";
import * as authManager from "../authManager";

declare var apiHost: string;

class TableManager {
    tables: KnockoutObservableArray<TableView>;
    currentIndex: KnockoutObservable<number>;
    hasTurn: KnockoutComputed<boolean>;
    maxTablesReached: Signal;
    duplicators: DuplicateFinder[];
    private reserveTablesForTournaments = false;

    /**
    * Tournaments in which player registered.
    */
    tournaments: KnockoutObservableArray<TournamentView>;

    constructor() {
        var self = this;
        this.tables = ko.observableArray<TableView>([]);
        this.tournaments = ko.observableArray<TournamentView>([]);
        this.currentIndex = ko.observable(0);
        connectionService.reconnected.add(() => self.onReconnected());
        this.duplicators = [];
        this.maxTablesReached = new signals.Signal();
        this.hasTurn = ko.computed(function () {
            var tablesWithTurn = self.tables().filter(_ => _.isMyTurn());
            return tablesWithTurn.length > 0;
        }, this);
    }

    initialize() {
        var self = this;
        commandManager.registerCommand("app.selectTable", function (parameters?: any[]): void {
            if (parameters.length < 1) {
                console.log("Insufficient parameters to the 'app.selectTable' command");
                return;
            }

            var table = <GameTableModel>parameters[0];
            var update = parameters.length <= 1 ? true : <boolean>parameters[1];
            self.selectTable(table, update);
        });
        commandManager.registerCommand("app.leaveTable", function (parameters?: any[]): JQueryDeferred<void> {
            var result = $.Deferred<void>();
            if (parameters.length < 1) {
                console.log("Insufficient parameters to the 'app.leaveTable' command");
                result.reject();
                return result;
            }

            var tableId: number = parameters[0];
            var tableView = self.getTableById(tableId);
            console.log("Leaving table " + tableView.tableId.toString());
            if (tableView != null) {
                tableView.showStandupPrompt().pipe(function () {
                    tableView.disconnect();
                    tableView = self.remove(tableView);

                    // Adjust currently selected table.
                    self.adjustTablePosition();

                    result.resolve();
                }, function () {
                    result.reject();
                });
                return result;
            }

            result.reject();
            return result;
        });
        connectionService.newConnection.add(function () {
            if (authManager.authenticated()) {
                self.initializeChatHub(connectionService.currentConnection);
                self.initializeGameHub(connectionService.currentConnection);
            }
        });
        settings.autoHideCards.subscribe(function (newValue) {
            var api = new OnlinePoker.Commanding.API.Game(apiHost);
            self.tables().forEach(function (tableView) {
                api.SetOpenCardsParameters(tableView.tableId, !newValue, null);
            });

            settings.saveSettings();
        });
    }
    onReconnected() {
        this.connectTables();
        this.connectTournaments();
    }
    getCurrentTables() {
        var self = this;
        var api = new OnlinePoker.Commanding.API.Game(apiHost);
        var result = $.Deferred();
        api.GetTables(null, false, 0, 0, 1, 0, null).done(function (data) {
            var tablesData = <GameTableModel[]>data.Data;
            api.GetSitingTables().done(function (data) {
                var status = data.Status;
                if (status === "Ok") {
                    var tables = data.Data;
                    if (tables != null) {
                        for (var i = 0; i < tables.length; i++) {
                            var tableId = tables[i];
                            var model: GameTableModel;
                            for (var j = 0; j < tablesData.length; j++) {
                                model = tablesData[j];
                                if (model.TableId === tableId) {
                                    self.selectTable(model, false);
                                }
                            }
                        }
                    }

                    result.resolve(tables);
                } else {
                    if (status === "AuthorizationError") {
                        result.resolve([]);
                    } else {
                        result.reject();
                    }
                }
            });
        }).fail(function () {
            result.reject();
        });

        return result;
    }
    getCurrentTournaments() {
        var self = this;
        var gapi = new OnlinePoker.Commanding.API.Game(apiHost);
        var tapi = new OnlinePoker.Commanding.API.Tournament(apiHost);
        var result = $.Deferred<TournamentDefinition[]>();
        tapi.GetTournaments(0, 0, 0, 0, 0, null).done(function (data) {
            var tournamentsData = data.Data;
            tapi.GetRegisteredTournamentsStatus().then(function (data) {
                var status = data.Status;
                if (status === "Ok") {
                    var tournaments = data.Data;
                    if (tournaments !== null && tournaments.length !== 0) {
                        self.requestTournamentsInformation(tournaments).then(function (...args: TournamentDefinition[]) {
                            var tournaments = <TournamentDefinition[]>[];
                            for (var i = 0; i < arguments.length; i++) {
                                tournaments.push(<TournamentDefinition>arguments[i]);
                            }

                            result.resolve(tournaments);
                        }, function () {
                            result.reject();
                        });
                    } else {
                        result.resolve([]);
                    }
                } else {
                    if (status === "AuthorizationError") {
                        result.resolve([]);
                    } else {
                        result.reject();
                    }
                }
            });
        }).fail(function () {
                result.reject();
            });

        return result;
    }
    getCurrentTablesAndTournaments() {
        if (!authManager.authenticated()) {
            var result = $.Deferred();
            result.resolve();
            return result;
        }

        var tablesRequest = this.getCurrentTables();
        var tournamentsRequest = this.getCurrentTournaments().then(function (value) {
            var startedTournaments = value.filter(_ => {
				return _.Status === TournamentStatus.LateRegistration
					|| _.Status === TournamentStatus.Started;
			});
            if (startedTournaments.length === 0) {
                return;
            }

            var messages = [_("tournament.areYouInFollowingTournaments")];
            startedTournaments.forEach(_ => messages.push(_.TournamentName));
            timeService.setTimeout(() => {
                SimplePopup.display(_("tournament.tournaments"), messages);
            }, 2000);
        });
        return $.when<any>(tablesRequest, tournamentsRequest);
    }
    selectTableCommandHandler(parameters: any[]): void {
		// Do nothing.
    }

    initializeChatHub(wrapper: ConnectionWrapper) {
        var self = this;
        var chatHub = wrapper.connection.Chat;
        chatHub.client.ChatConnected = function (tableId, lastMessageId) {
            if (wrapper.terminated) {
                return;
            }

            self.logDataEvent("ChatConnected", tableId, lastMessageId);
            var tableView = tableManager.getTableById(tableId);
            if (tableView === null) {
                return;
            }

            tableView.lastMessageId = lastMessageId;
        };
        chatHub.client.Message = function (messageId, tableId, type, sender, message) {
            if (wrapper.terminated) {
                return;
            }

            self.logDataEvent("Message", messageId, tableId, type, sender, message);
            var tableView = tableManager.getTableById(tableId);
            if (tableView === null) {
                return;
            }

            if (type === "C") {
                tableView.addMessage(messageId, sender, message);
            }

            if (type === "S") {
                tableView.addSystemMessage(messageId, message);
            }

            if (type === "B") {
                broadcastService.displayMessage(message);
            }
        };
        chatHub.client.MessageChanged = function (messageId, tableId, type, sender, message) {
            if (wrapper.terminated) {
                return;
            }

            self.logDataEvent("MessageChanged", messageId, tableId, type, sender, message);
            var tableView = tableManager.getTableById(tableId);
            if (tableView === null) {
                return;
            }

            if (type === "C") {
                tableView.updateMessage(messageId, sender, message);
            }

            if (type === "S") {
                tableView.updateSystemMessage(messageId, message);
            }
        };
    }
    initializeGameHub(wrapper: ConnectionWrapper) {
        var self = this;
        var gameHub = wrapper.connection.Game;
        gameHub.client.TableStatusInfo = function (tableId, players, pots, cards, dealerSeat, buyIn,
			baseBuyIn, leaveTime, timePass, currentPlayerId, lastRaise, gameId, authenticated,
			actionsCount, frozen, opened, pauseDate, lastMessageId) {
            if (wrapper.terminated) {
                return;
            }

            var tableView = tableManager.getTableById(tableId);
            if (tableView == null) {
                return;
            }

            tableView.onTableStatusInfo(players, pots, cards, dealerSeat, buyIn, baseBuyIn, leaveTime,
				timePass, currentPlayerId, lastRaise, gameId, authenticated, actionsCount, frozen, opened,
				pauseDate, lastMessageId);

            var cardsArr = cards == null ? allNoneClasses : cardsArray(cards);
            self.logDataEvent("Table status info: TableId - ", tableId, " Players - ", players, players.length,
				" Pots - ", pots, " Cards - ", cardsArr.join(" "));
        };
        gameHub.client.GameStarted = function (tableId, gameId, players, actions, dealerSeat) {
            if (wrapper.terminated) {
                return;
            }

            self.clearBetEvents(tableId);
            self.registerEvent(tableId, ["Game", "GameStarted", tableId, gameId, players, actions, dealerSeat]);
            var tableView = tableManager.getTableById(tableId);
            if (tableView == null) {
                return;
            }

            tableView.onGameStarted(gameId, players, actions, dealerSeat);
            self.logDataEvent("Game started: TableId - ", tableId, " GameId - ", gameId, " Players - ", players);
        };
        gameHub.client.Bet = function (tableId, playerId, type, amount, nextPlayerId, actionId) {
            if (wrapper.terminated) {
                return;
            }

            if (type !== 2 && type !== 3) {
                self.registerEvent(tableId, ["Game", "Bet", tableId, playerId, type, amount, nextPlayerId, actionId]);
            }

            var tableView = tableManager.getTableById(tableId);
            if (tableView === null) {
                return;
            }

            tableView.onBet(playerId, type, amount, nextPlayerId);

            var typeString = "Unknown";
            switch (type) {
                case 0:
                    typeString = "Blind";
                    break;
                case 1:
                    typeString = "Ante";
                    break;
                case 2:
                    typeString = "Check/Call";
                    break;
                case 3:
                    typeString = "Bet/Raise";
                    break;
                case 4:
                    typeString = "Fold";
                    break;
                case 5:
                    typeString = "ForcedBet";
                    break;
                case 6:
                    typeString = "ReturnMoney";
                    break;
            }
            self.logDataEvent("Bet: TableId - ", tableId,
                " PlayerId - ", playerId,
                " Type - ", typeString,
                " Amount - ", amount,
                " Next Player Id - ", nextPlayerId);
        };
        gameHub.client.OpenCards = function (tableId, type, cards: string, pots: number[]) {
            if (wrapper.terminated) {
                return;
            }

            var tableView = tableManager.getTableById(tableId);
            if (tableView == null) {
                return;
            }

            tableView.onMoveMoneyToPot(pots);
            tableView.onOpenCards(decodeCardsArray(cards));
            switch (type) {
                case 0:
                    type = "Flop";
                    break;
                case 1:
                    type = "Turn";
                    break;
                case 2:
                    type = "River";
                    break;
            }

            var cardsStirngs = cardsArray(cards);
            self.logDataEvent("Open cards: TableId - ", tableId, " Type - ", type, " Cards - ", cardsStirngs.join(" "));
        };
        gameHub.client.MoneyAdded = function (tableId, playerId, amount) {
            if (wrapper.terminated) {
                return;
            }

            self.logDataEvent("Money added: TableId - ", tableId, " PlayerId - ", playerId, " Amount - ", amount);
            var tableView = tableManager.getTableById(tableId);
            if (tableView == null) {
                return;
            }

            tableView.onMoneyAdded(playerId, amount);
        };
        gameHub.client.PlayerCards = function (tableId, playerId, cards: string) {
            if (wrapper.terminated) {
                return;
            }

            var tableView = tableManager.getTableById(tableId);
            if (tableView == null) {
                return;
            }

            tableView.onPlayerCards(playerId, decodeCardsArray(cards));
            var cardsString = cardsArray(cards);
            self.logDataEvent("TableId - ", tableId, " PlayerId - ", playerId, " Cards - ", cardsString.join(" "));
        };
        gameHub.client.PlayerCardsMucked = function (tableId, playerId) {
            if (wrapper.terminated) {
                return;
            }

            var tableView = tableManager.getTableById(tableId);
            if (tableView == null) {
                return;
            }

            tableView.onPlayerCardsMucked(playerId);
            self.logDataEvent("Cards mucked. TableId - ", tableId, " PlayerId - ", playerId);
        };
        gameHub.client.MoveMoneyToPot = function (tableId, amount) {
            if (wrapper.terminated) {
                return;
            }

            self.logDataEvent("TableId - ", tableId, " Amount - ", amount);
            var tableView = tableManager.getTableById(tableId);
            if (tableView == null) {
                return;
            }

            //tableView.onMoveMoneyToPot(amount);
        };
        gameHub.client.GameFinished = function (tableId, gameId, winners, rake) {
            if (wrapper.terminated) {
                return;
            }

            self.registerEvent(tableId, ["Game", "GameFinished", tableId, gameId, winners, rake]);
            var tableView = tableManager.getTableById(tableId);
            if (tableView == null) {
                return;
            }

            tableView.onGameFinished(gameId, winners, rake);
            self.logDataEvent("TableId - ", tableId, " GameId - ", gameId, " Winners - ", winners, " Rake - ", rake);
        };
        gameHub.client.PlayerStatus = function (tableId, playerId, status) {
            if (wrapper.terminated) {
                return;
            }

            var statusString = new Array();
            if ((status & 1) !== 0) {
                statusString.push("Sitout");
            }

            if ((status & 2) !== 0) {
                statusString.push("Blocked");
            }

            if (statusString.length === 0) {
                statusString.push("Regular");
            }

            if ((status & 8) !== 0) {
                statusString.push("InGame");
            }

            self.logDataEvent("TableId - ", tableId, " PlayerId - ", playerId, " Status - ", statusString.join("+"));
            var tableView = tableManager.getTableById(tableId);
            if (tableView == null) {
                console.warn("Receive unexpected PlayerStatus(" + tableId + "," + playerId + "," + status + ")");
                return;
            }

            tableView.onPlayerStatus(playerId, status);
        };
        gameHub.client.Sit = function (tableId, playerId, playerName, seat, amount, playerUrl, points, stars) {
            if (wrapper.terminated) {
                return;
            }

            var tableView = tableManager.getTableById(tableId);
            if (tableView == null) {
                console.warn("Receive unexpected Sit(" + tableId + "," + playerId + "," + playerName + ")");
                return;
            }

            self.logDataEvent("Sit: TableId - ", tableId, " PlayerId - ", playerId, " PlayerName- ", playerName);
            tableView.onSit(playerId, seat, playerName, amount, playerUrl, points, stars);
        };
        gameHub.client.Standup = function (tableId, playerId) {
            if (wrapper.terminated) {
                return;
            }

            var tableView = tableManager.getTableById(tableId);
            if (tableView == null) {
                console.warn("Receive unexpected Standup(" + tableId + "," + playerId + ")");
                return;
            }

            self.logDataEvent("Standup: TableId - ", tableId, " PlayerId - ", playerId);
            tableView.onStandup(playerId);
        };
        gameHub.client.TableFrozen = function (tableId) {
            if (wrapper.terminated) {
                return;
            }

            var tableView = tableManager.getTableById(tableId);
            if (tableView == null) {
                console.warn("Receive unexpected TableFrozen(" + tableId + ")");
                return;
            }

            tableView.onFrozen();
        };
        gameHub.client.TableUnfrozen = function (tableId) {
            if (wrapper.terminated) {
                return;
            }

            var tableView = tableManager.getTableById(tableId);
            if (tableView == null) {
                console.warn("Receive unexpected TableUnfrozen(" + tableId + ")");
                return;
            }

            tableView.onUnfrozen();
        };
        gameHub.client.TableOpened = function (tableId) {
            if (wrapper.terminated) {
                return;
            }

            var tableView = tableManager.getTableById(tableId);
            if (tableView == null) {
                console.warn("Receive unexpected TableOpened(" + tableId + ")");
                return;
            }

            tableView.onOpened();
        };
        gameHub.client.TableClosed = function (tableId) {
            if (wrapper.terminated) {
                return;
            }

            var tableView = tableManager.getTableById(tableId);
            if (tableView == null) {
                console.warn("Receive unexpected TableClosed(" + tableId + ")");
                return;
            }

            tableView.onClosed();
        };

        gameHub.client.TablePaused = function (tableId) {
            if (wrapper.terminated) {
                return;
            }

            var tableView = tableManager.getTableById(tableId);
            if (tableView == null) {
                console.warn("Receive unexpected TablePaused(" + tableId + ")");
                return;
            }

            tableView.onPaused();
        };
        gameHub.client.TableResumed = function (tableId) {
            if (wrapper.terminated) {
                return;
            }

            var tableView = tableManager.getTableById(tableId);
            if (tableView == null) {
                console.warn("Receive unexpected TableResumed(" + tableId + ")");
                return;
            }

            tableView.onResumed();
        };
        gameHub.client.TournamentStatusChanged = function (tournamentId, status) {
            if (wrapper.terminated) {
                return;
            }

            var tournamentView = tableManager.getTournamentById(tournamentId);
            if (tournamentView == null) {
                console.warn("Receive unexpected TournamentStatusChanged(" + tournamentId + "," + status + ")");
                return;
            }

            tournamentView.onTournamentStatusChanged(status);
        };
        gameHub.client.TournamentTableChanged = function (tournamentId, tableId) {
            if (wrapper.terminated) {
                return;
            }

            var tournamentView = tableManager.getTournamentById(tournamentId);
            if (tournamentView == null) {
                console.warn("Receive unexpected TournamentTableChanged(" + tournamentId + "," + tableId + ")");
                return;
            }

            tournamentView.onTournamentTableChanged(tableId);
        };
        gameHub.client.TournamentPlayerGameCompleted = function (tournamentId, placeTaken) {
            if (wrapper.terminated) {
                return;
            }

            var tournamentView = tableManager.getTournamentById(tournamentId);
            if (tournamentView == null) {
                console.warn("Receive unexpected TournamentPlayerGameCompleted(" + tournamentId + "," + placeTaken + ")");
                return;
            }

            tournamentView.onTournamentPlayerGameCompleted(placeTaken);
        };
        gameHub.client.TournamentBetLevelChanged = function (tournamentId, level) {
            if (wrapper.terminated) {
                return;
            }

            var tournamentView = tableManager.getTournamentById(tournamentId);
            if (tournamentView == null) {
                console.warn("Receive unexpected TournamentBetLevelChanged(" + tournamentId + "," + level + ")");
                return;
            }

            tournamentView.onTournamentBetLevelChanged(level);
        };
        gameHub.client.TournamentRoundChanged = function (tournamentId, round) {
            if (wrapper.terminated) {
                return;
            }

            var tournamentView = tableManager.getTournamentById(tournamentId);
            if (tournamentView == null) {
                console.warn("Receive unexpected TournamentRoundChanged(" + tournamentId + "," + round + ")");
                return;
            }

            tournamentView.onTournamentRoundChanged(round);
        };
        gameHub.client.TournamentRebuyStatusChanged = function (tournamentId, rebuyAllowed, addonAllowed) {
            if (wrapper.terminated) {
                return;
            }

            var tournamentView = tableManager.getTournamentById(tournamentId);
            if (tournamentView == null) {
                console.warn("Receive unexpected TournamentRebuyStatusChanged(" + tournamentId + ","
					+ rebuyAllowed + "," + addonAllowed + ")");
                return;
            }

            tournamentView.onTournamentRebuyStatusChanged(rebuyAllowed, addonAllowed);
        };
        gameHub.client.TournamentRebuyCountChanged = function (tournamentId, rebuyCount, addonCount) {
            if (wrapper.terminated) {
                return;
            }

            var tournamentView = tableManager.getTournamentById(tournamentId);
            if (tournamentView == null) {
                console.warn("Receive unexpected TournamentRebuyCountChanged(" + tournamentId + "," + rebuyCount + "," + addonCount + ")");
                return;
            }

            tournamentView.onTournamentRebuyCountChanged(rebuyCount, addonCount);
        };
        gameHub.client.TournamentFrozen = function (tournamentId) {
            if (wrapper.terminated) {
                return;
            }

            var tournamentView = tableManager.getTournamentById(tournamentId);
            if (tournamentView == null) {
                console.warn("Receive unexpected TournamentFrozen(" + tournamentId + ")");
                return;
            }

            tournamentView.onTournamentFrozen();
        };
        gameHub.client.TournamentUnfrozen = function (tournamentId) {
            if (wrapper.terminated) {
                return;
            }

            var tournamentView = tableManager.getTournamentById(tournamentId);
            if (tournamentView == null) {
                console.warn("Receive unexpected TournamentUnfrozen(" + tournamentId + ")");
                return;
            }

            tournamentView.onTournamentUnfrozen();
        };

        gameHub.client.TournamentRegistration = function (tournamentId) {
            if (wrapper.terminated) {
                return;
            }

            var tournamentView = tableManager.getTournamentById(tournamentId);
            if (tournamentView != null) {
                console.warn("Receive unexpected TournamentRegistration(" + tournamentId + ")");
                return;
            }

            self.openTournamentById(tournamentId);
        };

        gameHub.client.TournamentRegistrationCancelled = function (tournamentId) {
            if (wrapper.terminated) {
                return;
            }

            var tournamentView = tableManager.getTournamentById(tournamentId);
            if (tournamentView === null) {
                console.warn("Receive unexpected TournamentRegistrationCancelled(" + tournamentId + ")");
                return;
            }

            tournamentView.onTournamentRegistrationCancelled();
            gameHub.server.unsubscribeTournament(tournamentId);
            tableManager.removeTournamentById(tournamentId);
        };
    }
    clear() {
        this.currentIndex(0);
        this.tables([]);
        this.tournaments([]);
    }
    clearTables() {
        var self = this;
        this.tables().forEach((table) => {
            table.clearInformation();
        });
    }
    connectTables() {
        var self = this;
        this.tables().forEach((table) => {
            table.updateTableInformation();
        });
    }
    stopConnectingToTables() {
        var self = this;
        this.tables().forEach((table) => {
            table.cancelUpdateTableInformation();
        });
    }

    clearTournaments() {
        var self = this;
        this.tournaments().forEach((tournament) => {
            tournament.clearInformation();
        });
    }
    connectTournaments() {
        var self = this;
        this.tournaments().forEach((tournament) => {
            tournament.updateTournamentInformation();
        });
    }
    openTournamentById(tournamentId: number, attempts: number = 3) {
        if (attempts === 0) {
            SimplePopup.display(_("tournament.error"), _("tournament.errorConnectonToTournament"));
            return;
        }

        var self = this;
        var tournamentApi = new OnlinePoker.Commanding.API.Tournament(apiHost);
        tournamentApi.GetTournament(tournamentId).then((_) => {
            if (_.Status === "Ok") {
                var tournamentData = _.Data;
                tableManager.selectTournament(tournamentData, true);
            } else {
                self.openTournamentById(tournamentId, attempts - 1);
            }
        });
    }
    getTablesReservation() {
        var tablesWithoutTournament = this.tables().filter(_ => _.tournament() === null);
        var notFinishedTournaments = this.tournaments().filter(_ => {
            var tdata = _.tournamentData();
            var tplayer = tdata.TournamentPlayers.filter(_ => {
                return _.PlayerId === authManager.loginId();
            });
            if (tplayer.length === 0) {
                return false;
            }

            if (tplayer[0].Status !== TournamentPlayerStatus.Playing) {
                return false;
            }

            return tdata.Status !== TournamentStatus.Completed
                && tdata.Status !== TournamentStatus.Cancelled
                && tdata.Status !== TournamentStatus.RegistrationCancelled;
        });
        this.logDataEvent("Count of tables: " + tablesWithoutTournament.length + ", "
			+ "count of tournaments: " + notFinishedTournaments.length);
        if (this.reserveTablesForTournaments) {
            return Math.max(tablesWithoutTournament.length + notFinishedTournaments.length, this.tables().length);
        }

        return this.tables().length;
    }
    selectTournament(model: TournamentDefinition, update: boolean) {
        var self = this;
        var tournamentId = model.TournamentId;
        var tournamentView = this.getTournamentById(tournamentId);
        var append = function () {
            if (tournamentView === null) {
                tournamentView = self.addTournament(tournamentId, model);
            }

            if (update && connectionService.currentConnection !== null) {
                tournamentView.updateTournamentInformation();
            }
        };
        if (this.getTablesReservation() >= 4 && tournamentView === null && this.reserveTablesForTournaments) {
            this.maxTablesReached.dispatch(append);
        }

        append();
    }
    selectTable(model: GameTableModel, update: boolean) {
        var self = this;
        var tableId = model.TableId;
        var tableView = this.getTableById(tableId);
        var append = function () {
            if (tableView === null) {
                tableView = self.addTable(tableId, model);
            }

            self.selectById(tableId);
            if (update && connectionService.currentConnection !== null) {
                tableView.updateTableInformation();
            }
        };
        if (tableView == null) {
            this.removeTournamentTables(model.TournamentId);
        }

        if (this.getTablesReservation() >= 4 && tableView === null) {
            this.removeClosedTables();
            if (this.getTablesReservation() >= 4 && tableView === null) {
                this.maxTablesReached.dispatch(append);
            }

            append();
        } else {
            append();
        }
    }
    addTable(tableId: number, model: GameTableModel) {
        var table = new TableView(tableId, model);
        this.tables.push(table);
        table.onMyTurn.add(this.onMyTurn, this);
        return table;
    }

    remove(table: TableView) {
        var tables = this.tables().filter(function (value: TableView) {
            return value !== table;
        });
        this.tables(tables);
        table.onMyTurn.remove(this.onMyTurn, this);

        return table;
    }

    removeTableById(tableId: number) {
        var view = this.getTableById(tableId);
        if (view === null) {
            return null;
        }

        return this.remove(view);
    }

    adjustTablePosition() {
        var maxIndex = this.tables().length - 1;
        maxIndex = maxIndex < 0 ? 0 : maxIndex;
        if (this.currentIndex() > maxIndex) {
            this.currentIndex(maxIndex);
        }
    }

    prevTable() {
        var length = this.tables().length;
        if (length <= 1) {
            return;
        }

        var maxIndex = this.tables().length - 1;
        var index = this.currentIndex();
        var nextIndex = (index - 1 + this.tables().length) % this.tables().length;
        this.currentIndex(nextIndex);
    }

    nextTable() {
        var length = this.tables().length;
        if (length <= 1) {
            return;
        }

        var maxIndex = this.tables().length - 1;
        var index = this.currentIndex();
        var nextIndex = (index + 1 + this.tables().length) % this.tables().length;
        this.currentIndex(nextIndex);
    }

    addTournament(tournamentId: number, model: TournamentDefinition) {
        var tournament = new TournamentView(tournamentId, model);
        this.tournaments.push(tournament);
        return tournament;
    }

    removeTournament(tournament: TournamentView) {
        var tournaments = this.tournaments().filter(function (value) {
            return value !== tournament;
        });
        this.tournaments(tournaments);
        return tournament;
    }

    removeTournamentById(tableId: number) {
        var view = this.getTournamentById(tableId);
        if (view === null) {
            return null;
        }

        return this.removeTournament(view);
    }

    /**
    * Handles notification about current turn of the player.
    * @param tableId Number Id of the table where table playing.
    */
    onMyTurn(tableId: number) {
        if (settings.autoSwitchTables()) {
            this.selectById(tableId);
        }

        if (settings.soundEnabled()) {
            // Added vibration.
        }
    }

    getTableById(tableId: number) {
        /// <signature>
        ///     <summary>Gets table view by id.</summary>
        ///     <param name="tableId" type="Number">Id of the player which join the table</param>
        ///     <returns type="TableView">Table view for the table with given id</returns>
        /// </signature>
        var result = this.tables().filter(function (value: TableView) {
            return value.tableId === tableId;
        });

        if (result.length === 0) {
            return null;
        }

        return result[0];
    }

    /**
    * Gets tournament by it's id.
    * tournamentId Number If of the tournament to retreive.
    */
    getTournamentById(tournamentId: number) {
        var result = this.tournaments().filter(function (value: TournamentView) {
            return value.tournamentId === tournamentId;
        });

        if (result.length === 0) {
            return null;
        }

        return result[0];
    }

    isOpened(tableId: number) {
        return this.getTableById(tableId) != null;
    }

    selectById(tableId: number): void {
        /// <signature>
        ///     <summary>Selects current table view by id.</summary>
        ///     <param name="tableId" type="Number">Id of the table which selected</param>
        /// </signature>
        var tables = this.tables();
        for (var i = 0; i < tables.length; i++) {
            var tableView = tables[i];
            if (tableView.tableId === tableId) {
                this.currentIndex(i);
                return;
            }
        }

        this.currentIndex(0);
    }

    /** 
    * Remove all tables from the given tournament
    */
    private removeTournamentTables(tournamentId: number) {
        var tables = this.tables()
            .filter(_ => _.tournament() === null || _.tournament().tournamentId !== tournamentId);
        this.tables(tables);
    }

    private requestTournamentsInformation(tournaments: TournamentPlayerStateDefinition[]) {
        var self = this;
        var result = $.Deferred();
        var deferreds = <JQueryPromise<JQueryPromise<TournamentDefinition>>[]>[];
        for (var i = 0; i < tournaments.length; i++) {
            var tournamentPlayerState = tournaments[i];
            var d = this.buildTournamentInformationRequest(
                tournamentPlayerState.TournamentId,
                tournamentPlayerState.TableId);
            deferreds.push(d);
        }

        return <JQueryPromise<any>>$.when.apply($, deferreds);
    }

    private buildTournamentInformationRequest(tournamentId: number, tableId: number) {
        var self = this;
        var gapi = new OnlinePoker.Commanding.API.Game(apiHost);
        var tapi = new OnlinePoker.Commanding.API.Tournament(apiHost);
        var d = tapi.GetTournament(tournamentId).then(function (data: ApiResult<TournamentDefinition>) {
            var tournamentData = data.Data;
            self.selectTournament(tournamentData, false);
            if (tableId != null) {
                return gapi.GetTable(tableId).then((data) => {
                    self.selectTable(data.Data, false);
                    var tournamentTableView = self.getTableById(tableId);
                    var tournamentView = self.getTournamentById(tournamentId);
                    tournamentTableView.tournament(tournamentView);
                    return data;
                }).then(function (value) {
                        return tournamentData;
                    });
            }
            var temp = $.Deferred();
            temp.resolve(tournamentData);
            return temp.promise();
        });

        return d;
    }

    /**
    * Remove closed table
    */
    private removeClosedTables() {
        var tables = this.tables();
        var tableId = null;
        for (var t in tables) {
			if (!tables.hasOwnProperty(t)) {
				continue;
			}

            var table = tables[t];
            if (!table.opened()) {
                tableId = table.tableId;
                break;
            }
        }

        if (tableId === null) {
            return;
        }

        this.removeTableById(tableId);
    }

    private registerEvent(tableId: number, data: any[]) {
        var finder = this.getDuplicator(tableId);

        finder.registerEvent(data);
        if (finder.validateDuplicateEvents()) {
            finder.printDebug();
            slowInternetService.showDuplicatedConnectionPopup();
        }
    }

    private clearBetEvents(tableId: number) {
        var finder = this.getDuplicator(tableId);
        finder.erase((value, index, c) => {
            return value[1] !== "Bet";
        });
    }

    private getDuplicator(tableId: number) {
        var finder = this.duplicators[tableId];
        if (finder == null) {
            finder = new DuplicateFinder();
            this.duplicators[tableId] = finder;
        }

        return finder;
    }

    private logDataEvent(message: any, ...optionalParams: any[]) {
        if (debugSettings.connection.signalR && debugSettings.connection.dataEvents) {
            console.log(message, optionalParams);
        }
    }
}

var tableManager = new TableManager();
export = tableManager;
