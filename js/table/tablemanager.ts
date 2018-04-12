﻿/* tslint:disable:no-bitwise no-use-before-declare */
import {
    TournamentDefinition,
    TournamentPlayerStateDefinition,
    TournamentPlayerStatus,
    TournamentStatus,
} from "@poker/api-server";
import * as ko from "knockout";
import { DefaultApiProvider, IApiProvider } from "poker/api";
import { authManager } from "poker/authmanager";
import { ICommandManager } from "poker/commandmanager";
import { TablePlaceModel } from "poker/table/tabpleplacemodel";
import * as signals from "signals";
import { appConfig } from "../appconfig";
import { debugSettings } from "../debugsettings";
import { _ } from "../languagemanager";
import { SimplePopup } from "../popups/simplepopup";
import { appReloadService, connectionService, slowInternetService } from "../services";
import * as broadcastService from "../services/broadcastservice";
import { ConnectionWrapper } from "../services/connectionwrapper";
import { DuplicateFinder } from "../services/duplicatefinder";
import { settings } from "../settings";
import * as timeService from "../timeservice";
import { allNoneClassesFourCards, allNoneClassesTwoCards, cardsArray, decodeCardsArray } from "./cardsHelper";
import { TableView } from "./tableview";
import { TournamentView } from "./tournamentview";

declare var host: string;

export enum CardsDealedCodes {
    PlayerCardsDealed = 0,
    FlopDealed = 1,
    TurnDealed = 2,
    RiverDealed = 3,
}

/** Manages player tables */
export class TableManager {
    public tables: KnockoutObservableArray<TableView>;
    public currentIndex: KnockoutObservable<number>;
    public hasTurn: KnockoutComputed<boolean>;
    public maxTablesReached: Signal;
    public duplicateEventFound: Signal = new signals.Signal();

    /**
     * Tournaments in which player registered.
     */
    public tournaments: KnockoutObservableArray<TournamentView>;

    private duplicators: DuplicateFinder[];
    private reserveTablesForTournaments = false;

    constructor(private apiProvider: IApiProvider) {
        const self = this;
        this.tables = ko.observableArray<TableView>([]);
        this.tournaments = ko.observableArray<TournamentView>([]);
        this.currentIndex = ko.observable(0);
        connectionService.reconnected.add(() => self.onReconnected());
        this.duplicators = [];
        this.maxTablesReached = new signals.Signal();
        this.hasTurn = ko.computed(function () {
            const tablesWithTurn = self.tables().filter((table) => table.isMyTurn());
            return tablesWithTurn.length > 0;
        }, this);
    }

    public initialize(commandManager: ICommandManager) {
        const self = this;
        commandManager.registerCommand("app.selectTable", function (parameters?: any[]): void {
            if (!parameters || parameters.length < 1) {
                // tslint:disable-next-line:no-console
                console.log("Insufficient parameters to the 'app.selectTable' command");
                return;
            }

            const table = parameters[0] as GameTableModel;
            const update = parameters.length <= 1
                ? true
                : parameters[1] as boolean;
            self.selectTable(table, update);
            if (appConfig.game.tableReloadSupported) {
                appReloadService.startMonitoring(table.TableId);
            }
        });
        commandManager.registerCommand("app.leaveTable", function (parameters?: any[]): JQueryDeferred<void> {
            const result = $.Deferred<void>();
            if (!parameters || parameters.length < 1) {
                // tslint:disable-next-line:no-console
                console.log("Insufficient parameters to the 'app.leaveTable' command");
                result.reject();
                return result;
            }

            const tableId: number = parameters[0];
            const tableView = self.getTableById(tableId);
            if (tableView != null) {
                let tableViewSafe = tableView;
                // tslint:disable-next-line:no-console
                console.log("Leaving table " + tableView.tableId.toString());
                tableView.showStandupPrompt().then(function () {
                    tableViewSafe.disconnect();
                    tableViewSafe = self.remove(tableViewSafe);

                    // appReloadService.clearMonitoring(table.TableId);

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
        connectionService.newConnection.add(function(currentConnection: ConnectionWrapper) {
            if (authManager.authenticated()) {
                self.initializeChatHub(currentConnection);
                self.initializeGameHub(currentConnection);
            }
        });
        settings.autoHideCards.subscribe((newValue) => {
            const api = this.apiProvider.getGame();
            self.tables().forEach(function(tableView) {
                // Set open card parameters in parallel for all tables.
                api.setTableParameters(tableView.tableId, !newValue);
            });

            settings.saveSettings();
        });
        this.duplicateEventFound.add((finder: DuplicateFinder) => {
            this.printFinderDebugInfo(finder);
            slowInternetService.showDuplicatedConnectionPopup();
        });
    }
    public onReconnected() {
        this.connectTables();
        this.connectTournaments();
    }
    public async getCurrentTables() {
        const api = this.apiProvider.getGame();
        const data = await api.getTables(null, 0, 0, 0, 1, 0, appConfig.game.showTournamentTables);
        const tablesData = data.Data as GameTableModel[];
        const sittingTables = !(appConfig.game.seatMode || appConfig.game.tablePreviewMode)
            ? await this.getSittingTablesFromServer()
            : await this.getSavedSittingTables();
        for (const tableId of sittingTables) {
            for (const model of tablesData) {
                if (model.TableId === tableId) {
                    this.selectTable(model, false);
                }
            }
        }

        return sittingTables;
    }
    public async getCurrentTournaments() {
        const self = this;
        const gapi = this.apiProvider.getGame();
        const tapi = this.apiProvider.getTournament();
        const data = await tapi.getTournaments(0, 0, 0, 0, 0);
        const tournamentsData = data.Data;
        const registeredTournamentsData = await tapi.getRegisteredTournaments();
        const status = registeredTournamentsData.Status;
        if (status === "Ok") {
            const rtournaments = registeredTournamentsData.Data;
            if (rtournaments !== null && rtournaments.length !== 0) {
                const args = await self.requestTournamentsInformation(rtournaments);
                const tournaments = [] as TournamentDefinition[];
                for (let i = 0; i < args.length; i++) {
                    tournaments.push(args[i]);
                }

                return tournaments;
            } else {
                return [];
            }
        } else {
            if (status === "AuthorizationError") {
                return [];
            } else {
                throw new Error("Could not get status of registered tournaments");
            }
        }
    }
    public async getCurrentTablesAndTournaments() {
        if (!authManager.authenticated()) {
            return;
        }

        const tablesRequest = this.getCurrentTables();
        const tournamentsRequest = async () => {
            const value = await this.getCurrentTournaments();
            const startedTournaments = value.filter((tournament) => {
                return tournament.Status === TournamentStatus.LateRegistration
                    || tournament.Status === TournamentStatus.Started;
            });
            if (startedTournaments.length === 0) {
                return;
            }

            const messages = [_("tournament.areYouInFollowingTournaments")];
            startedTournaments.forEach((tournament) => messages.push(tournament.TournamentName));
            timeService.setTimeout(() => {
                SimplePopup.display(_("tournament.tournaments"), messages);
            }, 2000);
        };
        await Promise.all([tablesRequest, tournamentsRequest]);
    }
    public selectTableCommandHandler(parameters: any[]): void {
        // Do nothing.
    }
    public clear() {
        this.currentIndex(0);
        this.tables([]);
        this.tournaments([]);
    }
    public clearTables() {
        this.tables().forEach((table) => {
            table.clearInformation();
        });
    }
    public connectTables() {
        this.tables().forEach((table) => {
            table.updateTableInformation();
        });
    }
    public stopConnectingToTables() {
        this.tables().forEach((table) => {
            table.cancelUpdateTableInformation();
        });
    }

    public clearTournaments() {
        this.tournaments().forEach((tournament) => {
            tournament.clearInformation();
        });
    }
    public connectTournaments() {
        this.tournaments().forEach((tournament) => {
            tournament.updateTournamentInformation();
        });
    }
    public async openTournamentById(tournamentId: number, attempts: number = 3) {
        if (attempts === 0) {
            SimplePopup.display(_("tournament.error"), _("tournament.errorConnectonToTournament"));
            return;
        }

        const tournamentApi = this.apiProvider.getTournament();
        const tournamentInfo = await tournamentApi.getTournament(tournamentId);
        if (tournamentInfo.Status === "Ok") {
            const tournamentData = tournamentInfo.Data;
            this.selectTournament(tournamentData, true);
        } else {
            this.openTournamentById(tournamentId, attempts - 1);
        }
    }
    public getTablesReservation() {
        const tablesWithoutTournament = this.tables().filter((table) => table.tournament() === null);
        const notFinishedTournaments = this.tournaments().filter((tournamentView) => {
            const tdata = tournamentView.tournamentData();
            const tplayer = tdata.TournamentPlayers.filter((tournamentPlayer) => {
                return tournamentPlayer.PlayerId === authManager.loginId();
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
    public selectTournament(model: TournamentDefinition, update: boolean) {
        const self = this;
        const tournamentId = model.TournamentId;
        let tournamentView = this.getTournamentById(tournamentId);
        const append = function() {
            if (tournamentView === null) {
                tournamentView = self.addTournament(tournamentId, model);
            }

            if (update && connectionService.currentConnection !== null) {
                tournamentView.updateTournamentInformation();
            }
        };
        if (this.getTablesReservation() >= 4 && tournamentView === null && this.reserveTablesForTournaments) {
            this.maxTablesReached.dispatch(append);
        } else {
            append();
        }
    }
    public selectTable(model: GameTableModel, update: boolean) {
        const tableId = model.TableId;
        let tableView = this.getTableById(tableId);
        const append = () => {
            if (tableView === null) {
                tableView = this.addTable(tableId, model);
            }

            this.selectById(tableId);
            if (update) {
                if (connectionService.currentConnection !== null) {
                    console.log("Update table information");
                    tableView.updateTableInformation();
                } else {
                    console.log(`The table ${tableId} added to list of tables, but not updated since no active connection`);
                }
            } else {
                console.log(`The table ${tableId} added to list of tables, but not updated`);
            }
        };
        if (tableView == null && model.TournamentId) {
            this.removeTournamentTables(model.TournamentId);
        }

        if (this.getTablesReservation() >= 4 && tableView === null) {
            this.removeClosedTables();
            if (this.getTablesReservation() >= 4 && tableView === null) {
                this.maxTablesReached.dispatch(append);
            } else {
                append();
            }
        } else {
            append();
        }
    }
    public addTable(tableId: number, model: GameTableModel) {
        const table = new TableView(tableId, model, this.apiProvider);
        this.tables.push(table);
        table.onMyTurn.add(this.onMyTurn, this);
        table.onGamefinished.add(this.onGameFinished, this);
        table.onPlayerCardsDealed.add(this.onPlayerCardsDealed, this);
        table.onFlopDealed.add(this.onFlopDealed, this);
        table.onTurnDealed.add(this.onTurnDealed, this);
        table.onRiverDealed.add(this.onRiverDealed, this);
        return table;
    }

    public remove(table: TableView) {
        const tables = this.tables().filter(function (value: TableView) {
            return value !== table;
        });
        this.tables(tables);
        table.onMyTurn.remove(this.onMyTurn, this);
        table.onGamefinished.remove(this.onGameFinished, this);
        return table;
    }
    public onGameFinished(tableId: number) {
        const tableView = this.getTableById(tableId);
        if (!tableView) {
            return;
        }
        tableView.proposeRebuyOrAddon();
        tableView.clearTable();
        tableView.displayRebuyOrAddonTime();
    }
    public removeTableById(tableId: number) {
        const view = this.getTableById(tableId);
        if (view === null) {
            return null;
        }

        return this.remove(view);
    }

    public adjustTablePosition() {
        let maxIndex = this.tables().length - 1;
        maxIndex = maxIndex < 0 ? 0 : maxIndex;
        if (this.currentIndex() > maxIndex) {
            this.currentIndex(maxIndex);
        }
    }

    public prevTable() {
        const length = this.tables().length;
        if (length <= 1) {
            return;
        }

        const maxIndex = this.tables().length - 1;
        const index = this.currentIndex();
        const nextIndex = (index - 1 + this.tables().length) % this.tables().length;
        this.currentIndex(nextIndex);
    }

    public nextTable() {
        const length = this.tables().length;
        if (length <= 1) {
            return;
        }

        const maxIndex = this.tables().length - 1;
        const index = this.currentIndex();
        const nextIndex = (index + 1 + this.tables().length) % this.tables().length;
        this.currentIndex(nextIndex);
    }

    public addTournament(tournamentId: number, model: TournamentDefinition) {
        const tournament = new TournamentView(tournamentId, model);
        this.tournaments.push(tournament);
        return tournament;
    }

    public removeTournament(tournament: TournamentView) {
        const tournaments = this.tournaments().filter(function(value) {
            return value !== tournament;
        });
        this.tournaments(tournaments);
        return tournament;
    }

    public removeTournamentById(tableId: number) {
        const view = this.getTournamentById(tableId);
        if (view === null) {
            return null;
        }

        return this.removeTournament(view);
    }

    /**
     * Handles notification about current turn of the player.
     * @param tableId Number Id of the table where table playing.
     */
    public onMyTurn(tableId: number) {
        if (settings.autoSwitchTables()) {
            this.selectById(tableId);
        }

        if (settings.soundEnabled()) {
            // Added vibration.
        }
    }

    /**
     * Gets table view by id
     * @param tableId Id of the player which join the table
     * @returns Table view for the table with given id
     */
    public getTableById(tableId: number) {
        const result = this.tables().filter(function(value: TableView) {
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
    public getTournamentById(tournamentId: number) {
        const result = this.tournaments().filter(function(value: TournamentView) {
            return value.tournamentId === tournamentId;
        });

        if (result.length === 0) {
            return null;
        }

        return result[0];
    }

    public isOpened(tableId: number) {
        return this.getTableById(tableId) != null;
    }

    /**
     * Selects current table view by id.
     * @param tableId Id of the table which selected
     */
    public selectById(tableId: number): void {
        const tables = this.tables();
        for (let i = 0; i < tables.length; i++) {
            const tableView = tables[i];
            if (tableView.tableId === tableId) {
                this.currentIndex(i);
                return;
            }
        }

        this.currentIndex(0);
    }
    public registerEvent(tableId: number, data: any[]) {
        const finder = this.getDuplicator(tableId);

        finder.registerEvent(data);
        if (finder.validateDuplicateEvents()) {
            this.duplicateEventFound.dispatch(finder);
        }
    }

    public getNonExistingTable(): TableView {
        const nonExistingTableModel: GameTableModel = {
            TableId: 0,
            TableName: "NON-EXISTING",
            SmallBlind: 0,
            BigBlind: 0,
            AveragePotSize: 0,
            CurrencyId: 1,
            HandsPerHour: 0,
            JoinedPlayers: 0,
            MaxPlayers: 10,
            PotLimitType: 2,
        };
        return new TableView(0, nonExistingTableModel, this.apiProvider);
    }
    private onPlayerCardsDealed(tableId: number) {
        const tableView = this.getTableById(tableId);
        if (!tableView) {
            return;
        }
        this.setRoundNotificationCaption(CardsDealedCodes.PlayerCardsDealed, tableView);
        this.clearRoundNotification(tableView);
    }

    private onFlopDealed(tableId: number) {
        const tableView = this.getTableById(tableId);
        if (!tableView) {
            return;
        }
        this.setRoundNotificationCaption(CardsDealedCodes.FlopDealed, tableView);
        this.clearRoundNotification(tableView);
    }

    private onTurnDealed(tableId: number) {
        const tableView = this.getTableById(tableId);
        if (!tableView) {
            return;
        }
        this.setRoundNotificationCaption(CardsDealedCodes.TurnDealed, tableView);
        this.clearRoundNotification(tableView);
    }

    private onRiverDealed(tableId: number) {
        const tableView = this.getTableById(tableId);
        if (!tableView) {
            return;
        }
        this.setRoundNotificationCaption(CardsDealedCodes.RiverDealed, tableView);
        this.clearRoundNotification(tableView);
    }
    /**
     * Sets round notification caption
     * @param round
     * 0 - preflop
     * 1 - flop
     * 2 - turn
     * 3 - river
     */
    private setRoundNotificationCaption(round: number, tableView: TableView) {
        let caption = "";
        switch (round) {
            case CardsDealedCodes.PlayerCardsDealed: {
                caption = _("rounds.preFlop");
                break;
            }
            case CardsDealedCodes.FlopDealed: {
                caption = _("rounds.flop");
                break;
            }
            case CardsDealedCodes.TurnDealed: {
                caption = _("rounds.turn");
                break;
            }
            case CardsDealedCodes.RiverDealed: {
                caption = _("rounds.river");
                break;
            }
            default:
                caption = "";
        }
        tableView.roundNotification(caption);
    }
    private clearRoundNotification(tableView: TableView) {
        timeService.setTimeout(() => {
            tableView.roundNotification("");
        }, 3000);
    }
    private async getSittingTablesFromServer() {
        const api = this.apiProvider.getGame();
        const sittingTablesData = await api.getSitingTables();
        const status = sittingTablesData.Status;
        if (status === "Ok") {
            const sittingTables = sittingTablesData.Data;
            return sittingTables;
        } else {
            if (status === "AuthorizationError") {
                return [];
            } else {
                throw new Error("Could not get current tables from server");
            }
        }
    }
    private async getSavedSittingTables() {
        const tableIdString = localStorage.getItem("tableId");
        if (tableIdString !== null) {
            const tableId = parseInt(tableIdString, 10);
            return [tableId];
        }

        return [];
    }

    private initializeChatHub(wrapper: ConnectionWrapper) {
        const chatHub = wrapper.connection.Chat;
        chatHub.client.ChatConnected = (tableId, lastMessageId) => {
            if (wrapper.terminated) {
                return;
            }

            this.logDataEvent("ChatConnected", tableId, lastMessageId);
            const tableView = this.getTableById(tableId);
            if (tableView === null) {
                return;
            }

            tableView.lastMessageId = lastMessageId;
        };
        chatHub.client.Message = (messageId, tableId, type, sender, message) => {
            if (wrapper.terminated) {
                return;
            }

            this.logDataEvent("Message", messageId, tableId, type, sender, message);
            const tableView = this.getTableById(tableId);
            if (tableView === null) {
                return;
            }

            if (type === "C") {
                tableView.addMessage(messageId, new Date(), sender, message);
            }

            if (type === "S") {
                tableView.addSystemMessage(messageId, message);
            }

            if (type === "B") {
                broadcastService.displayMessage(message);
            }
        };
        chatHub.client.MessageChanged = (messageId, tableId, type, sender, message) => {
            if (wrapper.terminated) {
                return;
            }

            this.logDataEvent("MessageChanged", messageId, tableId, type, sender, message);
            const tableView = this.getTableById(tableId);
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
    private initializeGameHub(wrapper: ConnectionWrapper) {
        const gameHub = wrapper.connection.Game;
        gameHub.client.TableStatusInfo = (
            tableId, players, pots, cards, dealerSeat, buyIn,
            baseBuyIn, leaveTime, timePass, currentPlayerId, lastRaise, gameId, authenticated,
            actionsCount, frozen, opened, pauseDate, lastMessageId, gameType) => {
            if (wrapper.terminated) {
                return;
            }

            const tableView = this.getTableById(tableId);
            if (tableView == null) {
                return;
            }

            // Make sure that for old servers we will fallback to correct game type.
            gameType = gameType || 1;
            tableView.onTableStatusInfo(players, pots, cards, dealerSeat, buyIn, baseBuyIn, leaveTime,
                timePass, currentPlayerId, lastRaise, gameId, authenticated, actionsCount, frozen, opened,
                pauseDate, lastMessageId, gameType);

            const allNoneClasses = gameType === 1 ? allNoneClassesTwoCards : allNoneClassesFourCards;
            const cardsArr = cards == null ? allNoneClasses : cardsArray(cards);
            this.logDataEvent(`Table status info: TableId - ${tableId}, Game type: ${gameType} Players - `, players, players.length,
                " Pots - ", pots, " Cards - ", cardsArr.join(" "));
        };
        gameHub.client.GameStarted = (tableId, gameId, players, actions, dealerSeat) => {
            if (wrapper.terminated) {
                return;
            }

            this.clearBetEvents(tableId);
            this.registerEvent(tableId, ["Game", "GameStarted", tableId, gameId, players, actions, dealerSeat]);
            const tableView = this.getTableById(tableId);
            if (tableView == null) {
                return;
            }

            tableView.onGameStarted(gameId, players, actions, dealerSeat);
            this.logDataEvent("Game started: TableId - ", tableId, " GameId - ", gameId, " Players - ", players);
        };
        gameHub.client.Bet = (tableId, playerId, type, amount, nextPlayerId, actionId) => {
            if (wrapper.terminated) {
                return;
            }

            if (type !== 2 && type !== 3) {
                this.registerEvent(tableId, ["Game", "Bet", tableId, playerId, type, amount, nextPlayerId, actionId]);
            }

            const tableView = this.getTableById(tableId);
            if (tableView === null) {
                return;
            }

            tableView.onBet(playerId, type, amount, nextPlayerId);

            let typeString = "Unknown";
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
                default:
                    typeString = "Unknown bet type: " + type.toString();
                    break;
            }
            this.logDataEvent("Bet: TableId - ", tableId,
                " PlayerId - ", playerId,
                " Type - ", typeString,
                " Amount - ", amount,
                " Next Player Id - ", nextPlayerId);
        };
        gameHub.client.OpenCards = (tableId, type, cards: string, pots: number[]) => {
            if (wrapper.terminated) {
                return;
            }

            const tableView = this.getTableById(tableId);
            if (tableView == null) {
                return;
            }

            tableView.executeMoveMoneyToPot(pots);
            tableView.onOpenCards(decodeCardsArray(cards));
            let typeString: string;
            switch (type) {
                case 0:
                    typeString = "Flop";
                    break;
                case 1:
                    typeString = "Turn";
                    break;
                case 2:
                    typeString = "River";
                    break;
                default:
                    typeString = "Unknown open cards type: " + type.toString();
                    break;
            }

            const cardsStrings = cardsArray(cards).join(" ");
            this.logDataEvent(`Open cards: TableId - ${tableId} Type - ${typeString} Cards - ${cardsStrings}`);
        };
        gameHub.client.MoneyAdded = (tableId, playerId, amount) => {
            if (wrapper.terminated) {
                return;
            }

            this.logDataEvent("Money added: TableId - ", tableId, " PlayerId - ", playerId, " Amount - ", amount);
            const tableView = this.getTableById(tableId);
            if (tableView == null) {
                return;
            }

            tableView.onMoneyAdded(playerId, amount);
        };
        gameHub.client.MoneyRemoved = (tableId, playerId, amount) => {
            if (wrapper.terminated) {
                return;
            }

            this.logDataEvent("Money removed: TableId - ", tableId, " PlayerId - ", playerId, " Amount - ", amount);
            const tableView = this.getTableById(tableId);
            if (tableView == null) {
                return;
            }

            tableView.onMoneyRemoved(playerId, amount);
        };
        gameHub.client.PlayerCards = (tableId, playerId, cards: string) => {
            if (wrapper.terminated) {
                return;
            }

            const tableView = this.getTableById(tableId);
            if (tableView == null) {
                return;
            }

            tableView.onPlayerCards(playerId, decodeCardsArray(cards));
            const cardsString = cardsArray(cards).join(" ");
            this.logDataEvent("Player cards: TableId - ", tableId, " PlayerId - ", playerId, " Cards - ", cardsString);
        };
        gameHub.client.PlayerCardOpened = (tableId, playerId, cardPosition, cardValue) => {
            if (wrapper.terminated) {
                return;
            }

            const tableView = this.getTableById(tableId);
            if (tableView == null) {
                return;
            }

            tableView.onPlayerCardOpened(playerId, cardPosition, cardValue);
            this.logDataEvent("Player cards: TableId - ", tableId, " PlayerId - ", playerId, " Card on position - ", cardPosition, " with value - ", cardValue);
        };
        gameHub.client.PlayerCardsMucked = (tableId, playerId) => {
            if (wrapper.terminated) {
                return;
            }

            const tableView = this.getTableById(tableId);
            if (tableView == null) {
                return;
            }

            tableView.onPlayerCardsMucked(playerId);
            this.logDataEvent("Cards mucked. TableId - ", tableId, " PlayerId - ", playerId);
        };
        gameHub.client.MoveMoneyToPot = (tableId, amount) => {
            if (wrapper.terminated) {
                return;
            }

            this.logDataEvent("TableId - ", tableId, " Amount - ", amount);
            const tableView = this.getTableById(tableId);
            if (tableView == null) {
                return;
            }

            tableView.onMoveMoneyToPot(amount);
        };
        gameHub.client.GameFinished = (tableId, gameId, winners, rake) => {
            if (wrapper.terminated) {
                return;
            }

            this.registerEvent(tableId, ["Game", "GameFinished", tableId, gameId, winners, rake]);
            const tableView = this.getTableById(tableId);
            if (tableView == null) {
                return;
            }

            tableView.onGameFinished(gameId, winners, rake);
            this.logDataEvent("TableId - ", tableId, " GameId - ", gameId, " Winners - ", winners, " Rake - ", rake);
        };
        gameHub.client.PlayerStatus = (tableId, playerId, status) => {
            if (wrapper.terminated) {
                return;
            }

            const statusString: string[] = [];
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

            this.logDataEvent("TableId - ", tableId, " PlayerId - ", playerId, " Status - ", statusString.join("+"));
            const tableView = this.getTableById(tableId);
            if (tableView == null) {
                // tslint:disable-next-line:no-console
                console.warn("Receive unexpected PlayerStatus(" + tableId + "," + playerId + "," + status + ")");
                return;
            }

            tableView.onPlayerStatus(playerId, status);
        };
        gameHub.client.Sit = (tableId, playerId, playerName, seat, amount, playerUrl, points, stars) => {
            if (wrapper.terminated) {
                return;
            }

            const tableView = this.getTableById(tableId);
            if (tableView == null) {
                console.warn("Receive unexpected Sit(" + tableId + "," + playerId + "," + playerName + ")");
                return;
            }

            this.logDataEvent("Sit: TableId - ", tableId, " PlayerId - ", playerId, " PlayerName- ", playerName);
            tableView.onSit(playerId, seat, playerName, amount, playerUrl, points, stars);
        };
        gameHub.client.Standup = (tableId, playerId) => {
            if (wrapper.terminated) {
                return;
            }

            const tableView = this.getTableById(tableId);
            if (tableView == null) {
                console.warn("Receive unexpected Standup(" + tableId + "," + playerId + ")");
                return;
            }

            this.logDataEvent("Standup: TableId - ", tableId, " PlayerId - ", playerId);
            tableView.onStandup(playerId);
        };
        gameHub.client.TableFrozen = (tableId) => {
            if (wrapper.terminated) {
                return;
            }

            const tableView = this.getTableById(tableId);
            if (tableView == null) {
                console.warn("Receive unexpected TableFrozen(" + tableId + ")");
                return;
            }

            tableView.onFrozen();
        };
        gameHub.client.TableUnfrozen = (tableId) => {
            if (wrapper.terminated) {
                return;
            }

            const tableView = this.getTableById(tableId);
            if (tableView == null) {
                console.warn("Receive unexpected TableUnfrozen(" + tableId + ")");
                return;
            }

            tableView.onUnfrozen();
        };
        gameHub.client.TableOpened = (tableId) => {
            if (wrapper.terminated) {
                return;
            }

            const tableView = this.getTableById(tableId);
            if (tableView == null) {
                console.warn("Receive unexpected TableOpened(" + tableId + ")");
                return;
            }

            tableView.onOpened();
        };
        gameHub.client.TableClosed = (tableId) => {
            if (wrapper.terminated) {
                return;
            }

            const tableView = this.getTableById(tableId);
            if (tableView == null) {
                console.warn("Receive unexpected TableClosed(" + tableId + ")");
                return;
            }

            tableView.onClosed();
        };

        gameHub.client.TablePaused = (tableId) => {
            if (wrapper.terminated) {
                return;
            }

            const tableView = this.getTableById(tableId);
            if (tableView == null) {
                console.warn("Receive unexpected TablePaused(" + tableId + ")");
                return;
            }

            tableView.onPaused();
        };
        gameHub.client.TableResumed = (tableId) => {
            if (wrapper.terminated) {
                return;
            }

            const tableView = this.getTableById(tableId);
            if (tableView == null) {
                console.warn("Receive unexpected TableResumed(" + tableId + ")");
                return;
            }

            tableView.onResumed();
        };

        gameHub.client.FinalTableCardsOpened = (tableId, cards) => {
            if (wrapper.terminated) {
                return;
            }

            const tableView = this.getTableById(tableId);
            if (tableView == null) {
                console.warn("Receive unexpected FinalTableCardsOpened(" + tableId + "," + cards + ")");
                return;
            }

            tableView.onFinalTableCardsOpened(decodeCardsArray(cards));
        };

        gameHub.client.TableBetParametersChanged = (tableId, smallBind, bigBlind, ante) => {
            if (wrapper.terminated) {
                return;
            }

            const tableView = this.getTableById(tableId);
            if (tableView == null) {
                console.warn(`Receive unexpected TableBetParametersChanged(${tableId},${smallBind},${bigBlind},${ante}`);
                return;
            }

            tableView.onTableBetParametersChanged(smallBind, bigBlind, ante);
        };
        gameHub.client.TableGameTypeChanged = (tableId, gameType) => {
            if (wrapper.terminated) {
                return;
            }

            const tableView = this.getTableById(tableId);
            if (tableView == null) {
                console.warn(`Receive unexpected TableGameTypeChanged(${tableId},${gameType}`);
                return;
            }

            tableView.onTableGameTypeChanged(gameType);
        };
        gameHub.client.TableTournamentChanged = (tableId, tournamentId) => {
            if (wrapper.terminated) {
                return;
            }

            const tableView = this.getTableById(tableId);
            if (tableView == null) {
                console.warn(`Receive unexpected TableTournamentChanged(${tableId}, ${tournamentId})`);
                return;
            }

            tableView.onTableTournamentChanged(tournamentId);
        };
        gameHub.client.TournamentStatusChanged = (tournamentId, status) => {
            if (wrapper.terminated) {
                return;
            }

            const tournamentView = this.getTournamentById(tournamentId);
            if (tournamentView == null) {
                console.warn("Receive unexpected TournamentStatusChanged(" + tournamentId + "," + status + ")");
                return;
            }

            tournamentView.onTournamentStatusChanged(status as any);
        };
        gameHub.client.TournamentTableChanged = (tournamentId, tableId) => {
            if (wrapper.terminated) {
                return;
            }

            const tournamentView = this.getTournamentById(tournamentId);
            if (tournamentView == null) {
                console.warn("Receive unexpected TournamentTableChanged(" + tournamentId + "," + tableId + ")");
                return;
            }

            tournamentView.onTournamentTableChanged(tableId);
        };
        gameHub.client.TournamentPlayerGameCompleted = (tournamentId, placeTaken) => {
            if (wrapper.terminated) {
                return;
            }

            const tournamentView = this.getTournamentById(tournamentId);
            if (tournamentView == null) {
                console.warn("Receive unexpected TournamentPlayerGameCompleted(" + tournamentId + "," + placeTaken + ")");
                return;
            }

            tournamentView.onTournamentPlayerGameCompleted(placeTaken);
        };
        gameHub.client.TournamentBetLevelChanged = (tournamentId, level) => {
            if (wrapper.terminated) {
                return;
            }

            const tournamentView = this.getTournamentById(tournamentId);
            if (tournamentView == null) {
                console.warn("Receive unexpected TournamentBetLevelChanged(" + tournamentId + "," + level + ")");
                return;
            }

            tournamentView.onTournamentBetLevelChanged(level);
        };
        gameHub.client.TournamentRoundChanged = (tournamentId, round) => {
            if (wrapper.terminated) {
                return;
            }

            const tournamentView = this.getTournamentById(tournamentId);
            if (tournamentView == null) {
                console.warn("Receive unexpected TournamentRoundChanged(" + tournamentId + "," + round + ")");
                return;
            }

            tournamentView.onTournamentRoundChanged(round);
        };
        gameHub.client.TournamentRebuyStatusChanged = (tournamentId, rebuyAllowed, addonAllowed) => {
            if (wrapper.terminated) {
                return;
            }

            const tournamentView = this.getTournamentById(tournamentId);
            if (tournamentView == null) {
                console.warn("Receive unexpected TournamentRebuyStatusChanged(" + tournamentId + ","
                    + rebuyAllowed + "," + addonAllowed + ")");
                return;
            }

            tournamentView.onTournamentRebuyStatusChanged(rebuyAllowed, addonAllowed);
        };
        gameHub.client.TournamentRebuyCountChanged = (tournamentId, rebuyCount, addonCount) => {
            if (wrapper.terminated) {
                return;
            }

            const tournamentView = this.getTournamentById(tournamentId);
            if (tournamentView == null) {
                console.warn("Receive unexpected TournamentRebuyCountChanged(" + tournamentId + "," + rebuyCount + "," + addonCount + ")");
                return;
            }

            tournamentView.onTournamentRebuyCountChanged(rebuyCount, addonCount);
        };
        gameHub.client.TournamentFrozen = (tournamentId) => {
            if (wrapper.terminated) {
                return;
            }

            const tournamentView = this.getTournamentById(tournamentId);
            if (tournamentView == null) {
                console.warn("Receive unexpected TournamentFrozen(" + tournamentId + ")");
                return;
            }

            tournamentView.onTournamentFrozen();
        };
        gameHub.client.TournamentUnfrozen = (tournamentId) => {
            if (wrapper.terminated) {
                return;
            }

            const tournamentView = this.getTournamentById(tournamentId);
            if (tournamentView == null) {
                console.warn("Receive unexpected TournamentUnfrozen(" + tournamentId + ")");
                return;
            }

            tournamentView.onTournamentUnfrozen();
        };

        gameHub.client.TournamentRegistration = (tournamentId) => {
            if (wrapper.terminated) {
                return;
            }

            const tournamentView = this.getTournamentById(tournamentId);
            if (tournamentView != null) {
                console.warn("Receive unexpected TournamentRegistration(" + tournamentId + ")");
                return;
            }

            this.openTournamentById(tournamentId);
        };

        gameHub.client.TournamentRegistrationCancelled = (tournamentId) => {
            if (wrapper.terminated) {
                return;
            }

            const tournamentView = this.getTournamentById(tournamentId);
            if (tournamentView === null) {
                console.warn("Receive unexpected TournamentRegistrationCancelled(" + tournamentId + ")");
                return;
            }

            tournamentView.onTournamentRegistrationCancelled();
            gameHub.server.unsubscribeTournament(tournamentId);
            this.removeTournamentById(tournamentId);
        };
    }

    /**
     * Remove all tables from the given tournament
     */
    private removeTournamentTables(tournamentId: number) {
        const tables = this.tables()
            .filter((table) => table.tournament() === null || table.tournament().tournamentId !== tournamentId);
        this.tables(tables);
    }

    private requestTournamentsInformation(tournaments: TournamentPlayerStateDefinition[]) {
        const self = this;
        const deferreds = [] as Array<Promise<TournamentDefinition>>;
        for (let i = 0; i < tournaments.length; i++) {
            const tournamentPlayerState = tournaments[i];
            const d = this.buildTournamentInformationRequest(
                tournamentPlayerState.TournamentId,
                tournamentPlayerState.TableId);
            deferreds.push(d);
        }

        return Promise.all(deferreds);
    }

    private async buildTournamentInformationRequest(tournamentId: number, tableId: number): Promise<TournamentDefinition> {
        const self = this;
        const gapi = this.apiProvider.getGame();
        const tapi = this.apiProvider.getTournament();
        const data = await tapi.getTournament(tournamentId);
        const tournamentData = data.Data;
        self.selectTournament(tournamentData, false);
        if (tableId != null) {
            const tableData = await gapi.getTableById(tableId);
            self.selectTable(tableData.Data, false);
            const tournamentTableView = self.getTableById(tableId);
            const tournamentView = self.getTournamentById(tournamentId);
            if (tournamentView && tournamentTableView) {
                tournamentTableView.tournament(tournamentView);
            }
        }

        return tournamentData;
    }

    /**
     * Remove closed table
     */
    private removeClosedTables() {
        const tables = this.tables();
        let tableId: number | null = null;
        for (const t in tables) {
            if (!tables.hasOwnProperty(t)) {
                continue;
            }

            const table = tables[t];
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

    private clearBetEvents(tableId: number) {
        const finder = this.getDuplicator(tableId);
        finder.erase((value, index, c) => {
            return value[1] !== "Bet";
        });
    }

    private getDuplicator(tableId: number) {
        let finder = this.duplicators[tableId];
        if (finder == null) {
            finder = new DuplicateFinder();
            this.duplicators[tableId] = finder;
        }

        return finder;
    }

    private printFinderDebugInfo(finder: DuplicateFinder) {
        this.logDataEvent("Duplicate events detected.");
        finder.getDataEvents().forEach((dataEvent) => {
            this.logDataEvent(JSON.stringify(dataEvent));
        });
    }

    private logDataEvent(message: any, ...optionalParams: any[]) {
        if (debugSettings.connection.signalR && debugSettings.connection.dataEvents) {
            console.log(message, optionalParams);
        }
    }
}

export const tableManager = new TableManager(DefaultApiProvider);
