/// <reference path="../_references.ts" />
/// <reference path="../commandmanager.ts" />
/// <reference path="../popups/_allpopups.ts" />
/// <reference path="runtimesettings.ts" />

import * as ko from "knockout";
import * as timeService from "../timeService";
import * as tableManager from "./tablemanager";
import * as authManager from "../authmanager";
import * as metadataManager from "../metadatamanager";
import { slowInternetService, connectionService } from "../services";
import { ConnectionWrapper } from "../services/connectionwrapper";
import { SimplePopup } from "../popups/simplepopup";
import { appConfig } from "../appconfig";
import { debugSettings } from "../debugsettings";
import { App } from "../app";

declare var apiHost: string;
declare var app: App;

export class TournamentView {
    tournamentData = ko.observable<TournamentDefinition>(null);
    loading = ko.observable(false);

    /**
    * Indicates that rebuy is allowed in the tournament.
    */
    rebuyAllowed = ko.observable(false);

    /**
    * Indicates that add-on is allowed in the tournament.
    */
    addonAllowed = ko.observable(false);

    /**
    * Count of rebuys which player made in the tournament.
    */
    rebuyCount = ko.observable(0);

    /**
    * Count of add-ons which player made in the tournament.
    */
    addonCount = ko.observable(0);

    /**
    * Indicates that tournament is frozen
    */
    frozen = ko.observable(false);

    /**
    * Id of the current table where player sitting.
    */
    currentTableId: number = null;

    /**
    * Indicates that player is finished playing in the tournament.
    */
    finishedPlaying = ko.observable(false);

    /**
    * Indicates when player finish tournament.
    */
    finishTime = ko.observable(0);

    /**
    * Place which player take in the tournament.
    */
    finishedPlace: number = null;

    /**
    * Request which performs connecting to the table.
    */
    public connectingRequest: JQueryDeferred<any> = null;

    /**
    * Status of the tournament.
    */
    status = ko.observable(TournamentStatus.Pending);

    /**
    * Total prize.
    */
    totalPrize: KnockoutComputed<number>;

    constructor(public tournamentId: number, data: TournamentDefinition) {
        var self = this;
        this.tournamentData(data);
        this.status(data.Status);
        this.rebuyAllowed(data.IsRebuyAllowed);
        this.addonAllowed(data.IsAddonAllowed);
        var currentPlayerCandidates = data.TournamentPlayers.filter(_ => _.PlayerId === authManager.loginId());
        if (currentPlayerCandidates.length > 0) {
            var currentPlayer = currentPlayerCandidates[0];
            if (currentPlayer.Status === TournamentPlayerStatus.Playing) {
                this.currentTableId = currentPlayer.TableId;
            }
        }

        this.totalPrize = ko.computed(function () {
            var tdata = self.tournamentData();
            if (tdata === null) {
                return null;
            }

            return tdata.PrizeAmount + (tdata.CollectedPrizeAmount || 0);
        }, this);
    }

    refreshTournament(): JQueryPromise<any> {
        if (this.tournamentId === 0) {
            var x: JQueryXHR;
            return $.Deferred().resolve({ Status: "Ok", Data: null });
        }

        var self = this;
        var tournamentApi = new OnlinePoker.Commanding.API.Tournament(apiHost);
        this.loading(true);
        return tournamentApi.GetTournament(this.tournamentId, function (data) {
            if (data.Status === "Ok") {
                var tournamentData: TournamentDefinition = data.Data;
                self.log("Informaton about tournament " + self.tournamentId + " received: ", data.Data);
                self.log(tournamentData.TournamentName);
                self.tournamentData(tournamentData);
            }

            self.loading(false);
        });
    }
    clearInformation() {
		// Do nothing.
    }
    updateTournamentInformation() {
        /// <signature>
        ///     <summary>Updates the information about the table from the server</summary>
        /// </signature>
        var self = this;
        if (this.connectingRequest !== null && this.connectingRequest.state() === "pending") {
            // Re-schedule updating information.
            this.connectingRequest.fail(function () {
                self.log("Rescheduling the updating information.");
                self.updateTournamentInformation();
            });
            self.log("Cancelling the connection request process");
            self.cancelUpdateTableInformation();
            return;
        }

        // this.connecting(true);
        var currentLoadingRequest = $.Deferred();
        var wrapper = connectionService.currentConnection;
        var hubId = wrapper.connection.id;
        var connectionInfo = "HID:" + hubId;
        this.log("Connecting to tournament " + this.tournamentId + " on connection " + connectionInfo);
        var startConnection = app.buildStartConnection();
        var api = new OnlinePoker.Commanding.API.Game(apiHost);
        startConnection().then(function () {
            if (wrapper.terminated) {
                return;
            }

            hubId = wrapper.connection.id;
            self.log("Attempting to connect to table and chat over connection " + hubId);

            var joinTournamentRequest = self.joinTournament(wrapper);
            var joinRequest = $.when(joinTournamentRequest);
            currentLoadingRequest.progress(function (command: string) {
                self.log("Receiving request to cancel all joining operations");
                joinTournamentRequest.notify(command);
            });
            joinRequest.then(function () {
                if (wrapper.terminated) {
                    currentLoadingRequest.reject("Cancelled");
                    return;
                }

                self.log("Joining to tournament finished");
                currentLoadingRequest.resolve();
            }, function (result1) {
                    if (wrapper.terminated) {
                        return;
                    }

                    var message = "Rejecting request due to join tournament failure in the connection."
                        + "Failed request: " + result1[0];

                    self.log(message);
                    currentLoadingRequest.reject(message);
                });
        }, function (message) {
            self.log("Tournament connection failed. Error: " + message);
            currentLoadingRequest.reject("Table connection failed. Error: " + message);
        });
        this.connectingRequest = currentLoadingRequest;
    }
    cancelUpdateTableInformation() {
        if (this.connectingRequest != null) {
            this.connectingRequest.notify("cancel");
            this.connectingRequest = null;
        }
    }
    joinTournament(wrapper: ConnectionWrapper, maxAttempts = 3) {
        var self = this;
        var result = $.Deferred();
        if (maxAttempts === 0 || wrapper.terminated) {
            this.log("Stop connecting to tournament");
            result.reject("Stop connecting to tournament", false);
            return result;
        }

        var hubId = connectionService.currentConnection.connection.id;
        var connectionInfo = "HID:" + hubId;
        this.log("Joining tournament on connection " + connectionInfo);
        var cancelled = false;
        var subsequentDeferred: JQueryDeferred<any> = null;
        var cancelOperation = function () {
            self.log("Cancelling join tournament request");
            result.reject("Cancelled", true);
        };

        wrapper.buildStartConnection()().pipe(function () {
            if (wrapper.terminated) {
                cancelOperation();
                return;
            }

            self.log("Executing Game.subscribeTournament on connection " + wrapper.connection.id + " in state " + wrapper.connection.state);
            var operation = wrapper.connection.Game.server.subscribeTournament(self.tournamentId)
                .then(function () {
                    if (wrapper.terminated) {
                        cancelOperation();
                        return;
                    }

                    result.resolve();
                }, function (error: any) {
                    if (wrapper.terminated || cancelled || error === "Cancelled") {
                        cancelOperation();
                        return;
                    }

                    var message = "" + <string>error;
                    self.log("Failed to join tournament " + self.tournamentId + ", " + connectionInfo + ". Reason: " + message);
                    if (message.indexOf("Connection was disconnected before invocation result was received.") >= 0) {
                        self.log("Stopped connecting to table since underlying connection is broken");
                        slowInternetService.showReconnectFailedPopup();
                        result.reject("Stopped connecting to table since underlying connection is broken", false);
                        return;
                    } else {
                        subsequentDeferred = self.joinTournament(wrapper, maxAttempts - 1);
                        return subsequentDeferred.then(function () {
                            result.resolve();
                        }, function (error, cancelled: boolean) {
                                result.reject(error, cancelled);
                            });
                    }
                });

            result.progress(function (command: string) {
                this.cancelled = true;
                result.reject("Cancelled");
                if (subsequentDeferred != null) {
                    subsequentDeferred.notify("cancel");
                    subsequentDeferred = null;
                }
            });
        }, function () {
                cancelOperation();
            });
        return result;
    }
    onTournamentStatusChanged(status: TournamentStatus) {
        var self = this;
        var data = this.tournamentData();
        var oldStatus = this.status();
        this.status(status);
		var rebuyTime: number;
		var addonTime: number;
        if (status === TournamentStatus.LateRegistration) {
            rebuyTime = data.RebuyPeriodTime || 0;
            addonTime = data.AddonPeriodTime || 0;
            this.rebuyAllowed(rebuyTime > 0);
            this.addonAllowed(addonTime > 0 && rebuyTime === 0);
            if (this.finishedPlaying()) {
                return;
            }

            self.openTournamentTableUI();
        }
        if (status === TournamentStatus.Started) {
            if (oldStatus === TournamentStatus.LateRegistration) {
                return;
            }

            rebuyTime = data.RebuyPeriodTime || 0;
            addonTime = data.AddonPeriodTime || 0;
            this.rebuyAllowed(rebuyTime > 0);
            this.addonAllowed(addonTime > 0 && rebuyTime === 0);
            if (this.finishedPlaying()) {
                return;
            }

            self.openTournamentTableUI();
        }

        if (status === TournamentStatus.Cancelled) {
            if (this.finishedPlaying()) {
                return;
            }

            SimplePopup.display(_("tournament.caption", { tournament: data.TournamentName }),
                _("tournament.tournamentCancelled", { tournament: data.TournamentName }))
                .always(() => {
                    self.log("Tournament " + self.tournamentId + " cancelled");
                    app.lobbyPageBlock.showLobby();
                    app.tablesPage.deactivate();
                });
        }

        if (status === TournamentStatus.Completed) {
            this.executeOnCurrentTable(() => {
                self.displayTournamentFinished();
            });
        }
    }
    private openTournamentTableUI() {
        var self = this;
        var data = this.tournamentData();
        var openTournamentPromise: JQueryPromise<void> = null;
        if (appConfig.tournament.openTableAutomatically) {
            openTournamentPromise = this.openTournamentTable(this.currentTableId);
        }

        var messageKey = appConfig.tournament.openTableAutomatically
            ? "tournament.tournamentStarted"
            : "tournament.tournamentStartedNoOpen";
        SimplePopup.display(_("tournament.caption", { tournament: data.TournamentName }),
            _(messageKey, { tournament: data.TournamentName }))
            .always(() => {
                self.log("Tournament " + self.tournamentId + " started");
                if (appConfig.tournament.openTableAutomatically) {
                    openTournamentPromise.then((value) => {
                        self.log("Opeinin table for tournament " + self.tournamentId + "");
                        app.showSubPage("tables");
                    });
                }
            });
    }
    private displayTournamentFinished() {
        var self = this;
        var data = this.tournamentData();
        var currentDate = new Date().valueOf();
        if (this.finishedPlaying() && (currentDate - this.finishTime()) > 2000) {
            return;
        }

        if (this.finishedPlace !== 1 && this.finishedPlace !== 2) {
            self.log("Tournament " + self.tournamentId + " completed");
            timeService.setTimeout(() => {
                if (app.tablesPage.tablesShown()/* && app.tablesPage.currentTable().tournament() == self*/) {
                    SimplePopup.display(_("tournament.caption", { tournament: data.TournamentName }),
                        _("tournament.tournamentCompleted", { tournament: data.TournamentName }))
                        .always(() => {
                            self.finalizeTournament();
                        });
                } else {
                    self.finalizeTournament();
                }
            }, 2000);
        } else {
            app.closePopup();
            this.finalizeTournament();
        }
    }
    onTournamentTableChanged(tableId: number) {
        var self = this;
        if (this.finishedPlaying()) {
            return;
        }

        if (this.currentTableId === tableId) {
            return;
        }

        if (this.status() !== TournamentStatus.Started
            && this.status() !== TournamentStatus.LateRegistration) {
            this.currentTableId = tableId;
            return;
        }

        var data = this.tournamentData();
        if (this.currentTableId !== null) {
            this.log("Removing player from the tournament table " + this.currentTableId + " in tournament " + this.tournamentId);
            this.removeCurrentTable();
            SimplePopup.display(_("tournament.caption", { tournament: data.TournamentName }),
                _("tournament.tableChanged", { tournament: data.TournamentName }));
        }

        if (tableId != null) {
            this.log("Put player on the tournament table " + tableId + " in tournament " + this.tournamentId);
            this.currentTableId = tableId;
            this.openTournamentTable(tableId);
        }
    }
    onTournamentPlayerGameCompleted(placeTaken: number) {
        var self = this;
        this.finishedPlaying(true);
        this.finishTime(new Date().valueOf());
        this.finishedPlace = placeTaken;

        var data = this.tournamentData();
        var structure = this.getPrizeStructure(data.WellKnownPrizeStructure);
        var ascendingSort = (a, b) => {
            return a.MaxPlayer - b.MaxPlayer;
        };
        var prizes = structure.filter((_) => {
            return _.MaxPlayer > data.JoinedPlayers;
        }).sort(ascendingSort);
        if (prizes.length > 0) {
            var prize = prizes[0];
        } else {
            prize = structure.sort(ascendingSort)[0];
        }

        this.executeOnCurrentTable(() => {
            self.displayGameFinishedNotification(prize, placeTaken);
        });
    }
    onTournamentBetLevelChanged(level: number) {
        var data = this.tournamentData();
        var structure = this.getBetLevelStructure(data.WellKnownBetStructure).sort((a, b) => a.Level - b.Level);
        var betLevelCandidate = structure.filter(_ => _.Level === level);
        var betLevel = betLevelCandidate.length === 0
            ? structure[structure.length - 1]
            : betLevelCandidate[0];
        var currentTable = this.getTableForNotification();
        if (currentTable === null) {
            this.log("Table " + this.currentTableId + " is no longer valid for the tournament " + this.tournamentId);
            return;
        }

        currentTable.bigBlind(betLevel.BigBlind);
        currentTable.smallBlind(betLevel.SmallBlind);
        currentTable.ante(betLevel.Ante);

        if (this.finishedPlaying()) {
            // return;
        }

        if (level > 1) {
			var notificationParameters: any;
            if (betLevel.Ante == null) {
				notificationParameters = {
					tournament: data.TournamentName,
					sb: betLevel.SmallBlind,
					bb: betLevel.BigBlind
				};
                currentTable.showNotificationWithDelay(
                    _("tournament.betLevelChanged1", notificationParameters),
                    debugSettings.tableView.betLevelChangeDelay);
            } else {
				notificationParameters = {
					tournament: data.TournamentName,
					sb: betLevel.SmallBlind,
					bb: betLevel.BigBlind,
					ante: betLevel.Ante
				};
                currentTable.showNotificationWithDelay(
                    _("tournament.betLevelChanged2", notificationParameters),
                    debugSettings.tableView.betLevelChangeDelay);
            }
        }
    }
    onTournamentRoundChanged(round: number) {
		// Do nothing.
    }
    onTournamentRebuyStatusChanged(rebuyAllowed: boolean, addonAllowed: boolean) {
        if (this.finishedPlaying()) {
            // return;
        }

        this.rebuyAllowed(rebuyAllowed);
        this.addonAllowed(addonAllowed);
        if (addonAllowed) {
            var currentTable = this.getTableForNotification();
            if (currentTable != null) {
                if (this.isInTournament()) {
                    currentTable.showNotificationWithDelay(
                        _("table.addonAllowed"),
                        debugSettings.tableView.addonPeriodStartedDelay);
                } else {
                    currentTable.showNotificationWithDelay(
                        _("table.addonAllowedNotPlaying"),
                        debugSettings.tableView.addonPeriodStartedDelay);
                }
            }
        }
    }

    /**
    * Notifies that in tournament count of made rebuy or addons changed.
    * @param rebuyCount Count of rebuys which player done.
    * @param addonCount Count of add-ons which player done.
    */
    onTournamentRebuyCountChanged(rebuyCount: number, addonCount: number) {
        this.rebuyCount(rebuyCount);
        this.addonCount(addonCount);
    }

    onTournamentFrozen() {
        this.frozen(true);
    }
    onTournamentUnfrozen() {
        this.frozen(false);
    }
    onTournamentRegistrationCancelled() {
		// Do nothing.
    }
    public getBetLevelStructure(level: number) {
        return metadataManager.bets[level];
    }
    public getPrizeStructure(structure: number) {
        return metadataManager.prizes[structure];
    }
    public removeCurrentTable() {
        tableManager.removeTableById(this.currentTableId);
        tableManager.adjustTablePosition();
        this.currentTableId = null;
    }

    private isInTournament() {
        if (this.currentTableId == null) {
            return false;
        }

        return !this.finishedPlaying();
    }

    private getTableForNotification() {
        var self = this;
        var table = tableManager.getTableById(this.currentTableId);
        if (table !== null) {
            return table;
        }

        var tournamentTables = tableManager.tables().filter(_ => _.tournament() !== null
            && _.tournament().tournamentId === self.tournamentId);
        if (tournamentTables.length !== 0) {
            return tournamentTables[0];
        }

        return null;
    }

    private displayGameFinishedNotification(prize: TournamentPrizeStructure, placeTaken: number) {
        var self = this;
        var data = this.tournamentData();
        if (prize.PrizeLevel.length < placeTaken) {
            SimplePopup.displayWithTimeout(_("tournament.caption", { tournament: data.TournamentName }),
                _("tournament.playerGameCompleted", { tournament: data.TournamentName, place: placeTaken }),
                10 * 1000);
        } else {
            var winAmount = (self.totalPrize() * prize.PrizeLevel[placeTaken - 1] / 100).toFixed();
            SimplePopup.displayWithTimeout(_("tournament.caption", { tournament: data.TournamentName }),
                _("tournament.playerGameCompletedAndWin", { tournament: data.TournamentName, place: placeTaken, win: winAmount }),
                10 * 1000)
                .always(() => {
                    if (placeTaken === 1 || placeTaken === 2) {
                        self.finalizeTournament();
                    } else {
                        var currentTable = tableManager.getTableById(this.currentTableId);
                        if (!currentTable.opened()) {
                            self.finalizeTournament();
                        }
                    }
                });
        }
    }

    private executeOnCurrentTable(callback: () => void) {
        var currentTable = tableManager.getTableById(this.currentTableId);
        if (app.tablesPage.visible() && currentTable != null) {
            currentTable.pushCallback(() => {
                callback();
            });
        } else {
            callback();
        }
    }

    private openTournamentTable(tableId: number) {
        var self = this;
        var api = new OnlinePoker.Commanding.API.Game(apiHost);
        return api.GetTable(tableId).then(function (data) {
            tableManager.selectTable(data.Data, true);
            var currentTable = tableManager.getTableById(tableId);
            currentTable.tournament(self);
        });
    }
    private finalizeTournament() {
        if (tableManager.tables().length <= 1) {
            app.lobbyPageBlock.showLobby();
            app.tablesPage.deactivate();
        }

        this.removeCurrentTable();
    }
    private log(message: string, ...params: any[]) {
        console.log(message);
    }
}
