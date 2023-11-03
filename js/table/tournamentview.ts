import { Game, Tournament, TournamentDefinition, TournamentPlayerStatus, TournamentPrizeStructure, TournamentStatus } from "@poker/api-server";
import * as ko from "knockout";
import { authManager } from "poker/authmanager";
import { TableView } from "poker/table/tableview";
import { App } from "../app";
import { appConfig } from "../appconfig";
import { debugSettings } from "../debugsettings";
import { _ } from "../languagemanager";
import * as metadataManager from "../metadatamanager";
import { SimplePopup } from "../popups/simplepopup";
import { connectionService, slowInternetService } from "../services";
import { ConnectionWrapper } from "../services/connectionwrapper";
import * as timeService from "../timeservice";
import { tableManager } from "./tablemanager";

declare const host: string;
declare const app: App;

export class TournamentView {
    public tournamentData = ko.observable<TournamentDefinition>();
    public loading = ko.observable(false);

    /**
     * Indicates that rebuy is allowed in the tournament.
     */
    public rebuyAllowed = ko.observable(false);

    /**
     * Indicates that add-on is allowed in the tournament.
     */
    public addonAllowed = ko.observable(false);

    /**
     * Count of rebuys which player made in the tournament.
     */
    public rebuyCount = ko.observable(0);

    /**
     * Count of add-ons which player made in the tournament.
     */
    public addonCount = ko.observable(0);

    /**
     * Indicates that tournament is frozen
     */
    public frozen = ko.observable(false);

    /**
     * Id of the current table where player sitting.
     */
    public currentTableId: number | null = null;

    /**
     * Indicates that player is finished playing in the tournament.
     */
    public finishedPlaying = ko.observable(false);

    /**
     * Indicates when player finish tournament.
     */
    public finishTime = ko.observable(0);

    /**
     * Place which player take in the tournament.
     */
    public finishedPlace: number | null = null;

    /**
     * Request which performs connecting to the table.
     */
    public connectingRequest: JQueryDeferred<any> | null = null;

    /**
     * Status of the tournament.
     */
    public status = ko.observable(TournamentStatus.Pending);

    /**
     * Total prize.
     */
    public totalPrize: ko.Computed<number | null>;

    constructor(public tournamentId: number, data: TournamentDefinition) {
        this.tournamentData(data);
        this.status(data.Status);
        this.rebuyAllowed(data.IsRebuyAllowed);
        this.addonAllowed(data.IsAddonAllowed);
        const currentPlayerCandidates = data.TournamentPlayers.filter((tournamentPlayer) => tournamentPlayer.PlayerId === authManager.loginId());
        if (currentPlayerCandidates.length > 0) {
            const currentPlayer = currentPlayerCandidates[0];
            if (currentPlayer.Status === TournamentPlayerStatus.Playing) {
                this.currentTableId = currentPlayer.TableId;
            }
        }

        this.totalPrize = ko.computed(() => {
            const tdata = this.tournamentData();
            if (tdata === null) {
                return null;
            }

            return tdata.PrizeAmount + (tdata.CollectedPrizeAmount || 0);
        }, this);
    }

    public async refreshTournament(): Promise<ApiResult<TournamentDefinition | null>> {
        if (this.tournamentId === 0) {
            return Promise.resolve({ Status: "Ok", Data: null });
        }

        const tournamentApi = new Tournament(host);
        this.loading(true);
        const data = await tournamentApi.getTournament(this.tournamentId);
        if (data.Status === "Ok") {
            const tournamentData: TournamentDefinition = data.Data;
            this.log("Informaton about tournament " + this.tournamentId + " received: ", data.Data);
            this.log(tournamentData.TournamentName);
            this.tournamentData(tournamentData);
        }

        this.loading(false);
        return data;
    }
    public clearInformation() {
        // Do nothing.
    }
    /**
     * Updates information about tournament.
     */
    public async updateTournamentInformation() {
        if (this.connectingRequest !== null && this.connectingRequest.state() === "pending") {
            // Re-schedule updating information.
            this.connectingRequest.then(null, () => {
                this.log("Rescheduling the updating information.");
                this.updateTournamentInformation();
            });
            this.log("Cancelling the connection request process");
            this.cancelUpdateTableInformation();
            return;
        }

        // this.connecting(true);
        const currentLoadingRequest = $.Deferred();
        const wrapper = connectionService.currentConnection;
        let hubId = wrapper.connection.id;
        const connectionInfo = "HID:" + hubId;
        this.log("Connecting to tournament " + this.tournamentId + " on connection " + connectionInfo);
        const startConnection = app.buildStartConnection();
        startConnection.then(() => {
            if (wrapper.terminated) {
                return;
            }

            hubId = wrapper.connection.id;
            this.log("Attempting to connect to table and chat over connection " + hubId);

            const joinTournamentRequest = this.joinTournament(wrapper);
            const joinRequest = $.when(joinTournamentRequest);
            currentLoadingRequest.progress((command: string) => {
                this.log("Receiving request to cancel all joining operations");
                joinTournamentRequest.notify(command);
            });
            joinRequest.then(() => {
                if (wrapper.terminated) {
                    currentLoadingRequest.reject("Cancelled");
                    return;
                }

                this.log("Joining to tournament finished");
                currentLoadingRequest.resolve();
            }, (result1) => {
                    if (wrapper.terminated) {
                        return;
                    }

                    const message = "Rejecting request due to join tournament failure in the connection."
                        + "Failed request: " + result1[0];

                    this.log(message);
                    currentLoadingRequest.reject(message);
                });
        }, (message) => {
            this.log("Tournament connection failed. Error: " + message);
            currentLoadingRequest.reject("Table connection failed. Error: " + message);
        });
        this.connectingRequest = currentLoadingRequest;
    }
    public cancelUpdateTableInformation() {
        if (this.connectingRequest != null) {
            this.connectingRequest.notify("cancel");
            this.connectingRequest = null;
        }
    }
    public joinTournament(wrapper: ConnectionWrapper, maxAttempts = 3) {
        const result = $.Deferred();
        if (maxAttempts === 0 || wrapper.terminated) {
            this.log("Stop connecting to tournament");
            result.reject("Stop connecting to tournament", false);
            return result;
        }

        const hubId = connectionService.currentConnection.connection.id;
        const connectionInfo = "HID:" + hubId;
        this.log("Joining tournament on connection " + connectionInfo);
        let cancelled = false;
        let subsequentDeferred: JQueryDeferred<any> | null = null;
        const cancelOperation = () => {
            this.log("Cancelling join tournament request");
            result.reject("Cancelled", true);
        };

        wrapper.buildStartConnection()().then(() => {
            if (wrapper.terminated) {
                cancelOperation();
                return;
            }

            const connectionId = wrapper.connection.id;
            const connectionState = wrapper.connection.state;
            this.log(`Executing Game.subscribeTournament on connection ${connectionId} in state ${connectionState}`);
            const operation = wrapper.connection.Game.server.subscribeTournament(this.tournamentId)
                .then(function() {
                    if (wrapper.terminated) {
                        cancelOperation();
                        return;
                    }

                    result.resolve();
                }, (error: any) => {
                    if (wrapper.terminated || cancelled || error === "Cancelled") {
                        cancelOperation();
                        return;
                    }

                    const message = "" + error as string;
                    this.log(`Failed to join tournament ${this.tournamentId}, ${connectionInfo}. Reason: ${message}`);
                    if (message.indexOf("Connection was disconnected before invocation result was received.") >= 0) {
                        this.log("Stopped connecting to table since underlying connection is broken");
                        slowInternetService.showReconnectFailedPopup();
                        result.reject("Stopped connecting to table since underlying connection is broken", false);
                        return;
                    } else {
                        subsequentDeferred = this.joinTournament(wrapper, maxAttempts - 1);
                        return subsequentDeferred.then(function() {
                            result.resolve();
                        }, function(subsequentError, subsequentCancelled: boolean) {
                                result.reject(subsequentError, subsequentCancelled);
                            });
                    }
                });

            result.progress(function(command: string) {
                cancelled = true;
                result.reject("Cancelled");
                if (subsequentDeferred != null) {
                    subsequentDeferred.notify("cancel");
                    subsequentDeferred = null;
                }
            });
        }, function() {
                cancelOperation();
            });
        return result;
    }
    public async onTournamentStatusChanged(status: TournamentStatus) {
        const data = this.tournamentData();
        const oldStatus = this.status();
        this.status(status);
        let rebuyTime: number;
        let addonTime: number;
        if (status === TournamentStatus.LateRegistration) {
            rebuyTime = data.RebuyPeriodTime || 0;
            addonTime = data.AddonPeriodTime || 0;
            this.rebuyAllowed(rebuyTime > 0);
            this.addonAllowed(addonTime > 0 && rebuyTime === 0);
            if (this.finishedPlaying()) {
                return;
            }

            await this.openTournamentTableUI();
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

            await this.openTournamentTableUI();
        }

        if (status === TournamentStatus.Cancelled) {
            if (this.finishedPlaying()) {
                return;
            }

            try {
                await SimplePopup.display(
                    _("tournament.caption", { tournament: data.TournamentName }),
                    _("tournament.tournamentCancelled", { tournament: data.TournamentName }));
            } finally {
                this.log("Tournament " + this.tournamentId + " cancelled");
                app.lobbyPageBlock.showLobby();
                app.tablesPage.deactivate();
            }
        }

        if (status === TournamentStatus.Completed) {
            this.executeOnCurrentTable(() => {
                this.displayTournamentFinished();
            });
        }
    }
    public onTournamentTableChanged(tableId: number) {
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

        const data = this.tournamentData();
        if (this.currentTableId !== null) {
            const previousTableId = this.currentTableId;
            this.log(`Removing player from the tournament table ${previousTableId} in tournament ${this.tournamentId}`);
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
    public onTournamentPlayerGameCompleted(placeTaken: number) {
        this.finishedPlaying(true);
        this.finishTime(new Date().valueOf());
        this.finishedPlace = placeTaken;

        const data = this.tournamentData();
        const structure = this.getPrizeStructure(data.WellKnownPrizeStructure);
        const ascendingSort = (a: TournamentPrizeStructure, b: TournamentPrizeStructure) => {
            return a.MaxPlayer - b.MaxPlayer;
        };
        const prizes = structure.filter((prizeStructure) => {
            return prizeStructure.MaxPlayer > data.JoinedPlayers;
        }).sort(ascendingSort);
        let prize: TournamentPrizeStructure;
        if (prizes.length > 0) {
            prize = prizes[0];
        } else {
            prize = structure.sort(ascendingSort)[0];
        }

        this.executeOnCurrentTable(() => {
            this.displayGameFinishedNotification(prize, placeTaken);
        });
    }
    public onTournamentBetLevelChanged(level: number) {
        const data = this.tournamentData();
        const structure = this.getBetLevelStructure(data.WellKnownBetStructure).sort((a, b) => a.Level - b.Level);
        const betLevelCandidate = structure.filter((betStructure) => betStructure.Level === level);
        const betLevel = betLevelCandidate.length === 0
            ? structure[structure.length - 1]
            : betLevelCandidate[0];
        const currentTable = this.getTableForNotification();
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
            if (betLevel.Ante == null) {
                const notificationParameters = {
                    tournament: data.TournamentName,
                    sb: betLevel.SmallBlind,
                    bb: betLevel.BigBlind,
                };
                currentTable.showNotificationWithDelay(
                    _("tournament.betLevelChanged1", notificationParameters),
                    debugSettings.tableView.betLevelChangeDelay);
            } else {
                const notificationParameters = {
                    tournament: data.TournamentName,
                    sb: betLevel.SmallBlind,
                    bb: betLevel.BigBlind,
                    ante: betLevel.Ante,
                };
                currentTable.showNotificationWithDelay(
                    _("tournament.betLevelChanged2", notificationParameters),
                    debugSettings.tableView.betLevelChangeDelay);
            }
        }
    }
    public onTournamentRoundChanged(round: number) {
        // Do nothing.
    }
    public onTournamentRebuyStatusChanged(rebuyAllowed: boolean, addonAllowed: boolean) {
        if (this.finishedPlaying()) {
            // return;
        }

        this.rebuyAllowed(rebuyAllowed);
        this.addonAllowed(addonAllowed);
        if (addonAllowed) {
            const currentTable = this.getTableForNotification();
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
    public onTournamentRebuyCountChanged(rebuyCount: number, addonCount: number) {
        this.rebuyCount(rebuyCount);
        this.addonCount(addonCount);
    }

    public onTournamentFrozen() {
        this.frozen(true);
    }
    public onTournamentUnfrozen() {
        this.frozen(false);
    }
    public onTournamentRegistrationCancelled() {
        // Do nothing.
    }
    public getBetLevelStructure(level: number) {
        return metadataManager.bets[level];
    }
    public getPrizeStructure(structure: number) {
        return metadataManager.prizes[structure];
    }
    public removeCurrentTable() {
        if (!this.currentTableId) {
            // No current table, so return.
            this.log(`No current table for tournament ${this.tournamentId}, exiting.`);
            return;
        }

        tableManager.removeTableById(this.currentTableId);
        tableManager.adjustTablePosition();
        this.currentTableId = null;
    }
    private async openTournamentTableUI() {
        const data = this.tournamentData();
        const messageKey = appConfig.tournament.openTableAutomatically
            ? "tournament.tournamentStarted"
            : "tournament.tournamentStartedNoOpen";
        try {
            await SimplePopup.display(
                _("tournament.caption", { tournament: data.TournamentName }),
                _(messageKey, { tournament: data.TournamentName }));
        } finally {
            this.log("Tournament " + this.tournamentId + " started");
            if (appConfig.tournament.openTableAutomatically) {
                if (!this.currentTableId) {
                    this.log(`No current table for tournament ${this.tournamentId}. Stop opening tables page`);
                } else {
                    await this.openTournamentTable(this.currentTableId);
                    this.log("Opening table for tournament " + this.tournamentId + "");
                    if (appConfig.game.seatMode) {
                        app.executeCommand("page.seats");
                    } else {
                        app.executeCommand("page.tables");
                    }
                }
            }
        }
    }
    private displayTournamentFinished() {
        const data = this.tournamentData();
        const currentDate = new Date().valueOf();
        if (this.finishedPlaying() && (currentDate - this.finishTime()) > 2000) {
            return;
        }

        if (this.finishedPlace !== 1 && this.finishedPlace !== 2) {
            this.log("Tournament " + this.tournamentId + " completed");
            timeService.setTimeout(async () => {
                if (app.tablesPage.tablesShown()/* && app.tablesPage.currentTable().tournament() == self*/) {
                    try {
                        await SimplePopup.display(_("tournament.caption", { tournament: data.TournamentName }),
                        _("tournament.tournamentCompleted", { tournament: data.TournamentName }));
                    } finally {
                        this.finalizeTournament();
                    }
                } else {
                    this.finalizeTournament();
                }
            }, 2000);
        } else {
            app.closePopup();
            this.finalizeTournament();
        }
    }

    private isInTournament() {
        if (this.currentTableId == null) {
            return false;
        }

        return !this.finishedPlaying();
    }

    private getTableForNotification() {
        if (this.currentTableId == null) {
            return null;
        }

        const table = tableManager.getTableById(this.currentTableId);
        if (table !== null) {
            return table;
        }

        const tournamentTables = tableManager.tables().filter((tournamentTable: TableView) => tournamentTable.tournament() !== null
            && tournamentTable.tournament().tournamentId === this.tournamentId);
        if (tournamentTables.length !== 0) {
            return tournamentTables[0];
        }

        return null;
    }

    private displayGameFinishedNotification(prize: TournamentPrizeStructure, placeTaken: number) {
        const data = this.tournamentData();
        if (prize.PrizeLevel.length < placeTaken) {
            return SimplePopup.displayWithTimeout(_("tournament.caption", { tournament: data.TournamentName }),
                _("tournament.playerGameCompleted", { tournament: data.TournamentName, place: placeTaken }),
                10 * 1000);
        } else {
            const totalPrize = this.totalPrize() || 0;
            const winAmount = (totalPrize * prize.PrizeLevel[placeTaken - 1] / 100).toFixed();
            const onTournamentCompleted = () => {
                if (placeTaken === 1 || placeTaken === 2) {
                    this.finalizeTournament();
                } else {
                    if (this.currentTableId === null) {
                        console.warn("Could not show display notification about game fnish, since no current game to tournament is set.");
                        return;
                    }

                    const currentTable = tableManager.getTableById(this.currentTableId);
                    if (currentTable === null) {
                        console.warn(`Could not show display notification about game fnish, since no table with id ${this.currentTableId} is null.`);
                        return;
                    }

                    if (!currentTable.opened()) {
                        this.finalizeTournament();
                    }
                }
            };
            const message = _("tournament.playerGameCompletedAndWin", {
                tournament: data.TournamentName,
                place: placeTaken,
                win: winAmount,
            });
            return SimplePopup.displayWithTimeout(
                _("tournament.caption", { tournament: data.TournamentName }),
                message,
                10 * 1000)
                .then(onTournamentCompleted, onTournamentCompleted);
        }
    }

    private executeOnCurrentTable(callback: () => void) {
        if (!this.currentTableId) {
            callback();
            return;
        }

        const currentTable = tableManager.getTableById(this.currentTableId);
        if (app.tablesPage.visible() && currentTable != null) {
            currentTable.pushCallback(() => {
                callback();
            });
        } else {
            callback();
        }
    }

    private async openTournamentTable(tableId: number) {
        const api = new Game(host);
        const data = await api.getTableById(tableId);
        tableManager.selectTable(data.Data, true);
        const currentTable = tableManager.getTableById(tableId);
        if (!currentTable) {
            return;
        }

        currentTable.tournament(this);
    }
    private finalizeTournament() {
        if (tableManager.tables().length <= 1) {
            app.lobbyPageBlock.showLobby();
            app.tablesPage.deactivate();
        }

        this.removeCurrentTable();
    }
    private log(message: string, ...params: any[]) {
        // tslint:disable-next-line:no-console
        console.log(message);
    }
}
