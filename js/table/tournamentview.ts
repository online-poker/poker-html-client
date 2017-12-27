import * as ko from "knockout";
import { Game } from "../api/game";
import { TournamentPrizeStructure } from "../api/information";
import { Tournament, TournamentDefinition, TournamentPlayerStatus, TournamentStatus } from "../api/tournament";
import { App } from "../app";
import { appConfig } from "../appconfig";
import * as authManager from "../authmanager";
import { debugSettings } from "../debugsettings";
import { _ } from "../languagemanager";
import * as metadataManager from "../metadatamanager";
import { SimplePopup } from "../popups/simplepopup";
import { connectionService, slowInternetService } from "../services";
import { ConnectionWrapper } from "../services/connectionwrapper";
import * as timeService from "../timeservice";
import { tableManager } from "./tablemanager";

declare var host: string;
declare var app: App;

export class TournamentView {
    public tournamentData = ko.observable<TournamentDefinition>(null);
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
    public currentTableId: number = null;

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
    public finishedPlace: number = null;

    /**
     * Request which performs connecting to the table.
     */
    public connectingRequest: JQueryDeferred<any> = null;

    /**
     * Status of the tournament.
     */
    public status = ko.observable(TournamentStatus.Pending);

    /**
     * Total prize.
     */
    public totalPrize: KnockoutComputed<number>;

    constructor(public tournamentId: number, data: TournamentDefinition) {
        const self = this;
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

        this.totalPrize = ko.computed(function() {
            const tdata = self.tournamentData();
            if (tdata === null) {
                return null;
            }

            return tdata.PrizeAmount + (tdata.CollectedPrizeAmount || 0);
        }, this);
    }

    public async refreshTournament(): Promise<ApiResult<TournamentDefinition>> {
        if (this.tournamentId === 0) {
            return Promise.resolve({ Status: "Ok", Data: null });
        }

        const self = this;
        const tournamentApi = new Tournament(host);
        this.loading(true);
        const data = await tournamentApi.getTournament(this.tournamentId);
        if (data.Status === "Ok") {
            const tournamentData: TournamentDefinition = data.Data;
            self.log("Informaton about tournament " + self.tournamentId + " received: ", data.Data);
            self.log(tournamentData.TournamentName);
            self.tournamentData(tournamentData);
        }

        self.loading(false);
        return data;
    }
    public clearInformation() {
        // Do nothing.
    }
    /**
     * Updates information about tournament.
     */
    public async updateTournamentInformation() {
        const self = this;
        if (this.connectingRequest !== null && this.connectingRequest.state() === "pending") {
            // Re-schedule updating information.
            this.connectingRequest.then(null, function() {
                self.log("Rescheduling the updating information.");
                self.updateTournamentInformation();
            });
            self.log("Cancelling the connection request process");
            self.cancelUpdateTableInformation();
            return;
        }

        // this.connecting(true);
        const currentLoadingRequest = $.Deferred();
        const wrapper = connectionService.currentConnection;
        let hubId = wrapper.connection.id;
        const connectionInfo = "HID:" + hubId;
        this.log("Connecting to tournament " + this.tournamentId + " on connection " + connectionInfo);
        const startConnection = app.buildStartConnection();
        startConnection.then(function() {
            if (wrapper.terminated) {
                return;
            }

            hubId = wrapper.connection.id;
            self.log("Attempting to connect to table and chat over connection " + hubId);

            const joinTournamentRequest = self.joinTournament(wrapper);
            const joinRequest = $.when(joinTournamentRequest);
            currentLoadingRequest.progress(function(command: string) {
                self.log("Receiving request to cancel all joining operations");
                joinTournamentRequest.notify(command);
            });
            joinRequest.then(function() {
                if (wrapper.terminated) {
                    currentLoadingRequest.reject("Cancelled");
                    return;
                }

                self.log("Joining to tournament finished");
                currentLoadingRequest.resolve();
            }, function(result1) {
                    if (wrapper.terminated) {
                        return;
                    }

                    const message = "Rejecting request due to join tournament failure in the connection."
                        + "Failed request: " + result1[0];

                    self.log(message);
                    currentLoadingRequest.reject(message);
                });
        }, function(message) {
            self.log("Tournament connection failed. Error: " + message);
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
        const self = this;
        const result = $.Deferred();
        if (maxAttempts === 0 || wrapper.terminated) {
            this.log("Stop connecting to tournament");
            result.reject("Stop connecting to tournament", false);
            return result;
        }

        const hubId = connectionService.currentConnection.connection.id;
        const connectionInfo = "HID:" + hubId;
        this.log("Joining tournament on connection " + connectionInfo);
        const cancelled = false;
        let subsequentDeferred: JQueryDeferred<any> = null;
        const cancelOperation = function() {
            self.log("Cancelling join tournament request");
            result.reject("Cancelled", true);
        };

        wrapper.buildStartConnection()().then(function() {
            if (wrapper.terminated) {
                cancelOperation();
                return;
            }

            const connectionId = wrapper.connection.id;
            const connectionState = wrapper.connection.state;
            self.log(`Executing Game.subscribeTournament on connection ${connectionId} in state ${connectionState}`);
            const operation = wrapper.connection.Game.server.subscribeTournament(self.tournamentId)
                .then(function() {
                    if (wrapper.terminated) {
                        cancelOperation();
                        return;
                    }

                    result.resolve();
                }, function(error: any) {
                    if (wrapper.terminated || cancelled || error === "Cancelled") {
                        cancelOperation();
                        return;
                    }

                    const message = "" + error as string;
                    self.log(`Failed to join tournament ${self.tournamentId}, ${connectionInfo}. Reason: ${message}`);
                    if (message.indexOf("Connection was disconnected before invocation result was received.") >= 0) {
                        self.log("Stopped connecting to table since underlying connection is broken");
                        slowInternetService.showReconnectFailedPopup();
                        result.reject("Stopped connecting to table since underlying connection is broken", false);
                        return;
                    } else {
                        subsequentDeferred = self.joinTournament(wrapper, maxAttempts - 1);
                        return subsequentDeferred.then(function() {
                            result.resolve();
                        }, function(subsequentError, subsequentCancelled: boolean) {
                                result.reject(subsequentError, subsequentCancelled);
                            });
                    }
                });

            result.progress(function(command: string) {
                this.cancelled = true;
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
        const self = this;
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

            await self.openTournamentTableUI();
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

            await self.openTournamentTableUI();
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
                self.log("Tournament " + self.tournamentId + " cancelled");
                app.lobbyPageBlock.showLobby();
                app.tablesPage.deactivate();
            }
        }

        if (status === TournamentStatus.Completed) {
            this.executeOnCurrentTable(() => {
                self.displayTournamentFinished();
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
        const self = this;
        this.finishedPlaying(true);
        this.finishTime(new Date().valueOf());
        this.finishedPlace = placeTaken;

        const data = this.tournamentData();
        const structure = this.getPrizeStructure(data.WellKnownPrizeStructure);
        const ascendingSort = (a, b) => {
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
            self.displayGameFinishedNotification(prize, placeTaken);
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
        tableManager.removeTableById(this.currentTableId);
        tableManager.adjustTablePosition();
        this.currentTableId = null;
    }
    private async openTournamentTableUI() {
        const self = this;
        const data = this.tournamentData();
        const messageKey = appConfig.tournament.openTableAutomatically
            ? "tournament.tournamentStarted"
            : "tournament.tournamentStartedNoOpen";
        try {
            await SimplePopup.display(
                _("tournament.caption", { tournament: data.TournamentName }),
                _(messageKey, { tournament: data.TournamentName }));
        } finally {
            self.log("Tournament " + self.tournamentId + " started");
            if (appConfig.tournament.openTableAutomatically) {
                await this.openTournamentTable(this.currentTableId);
                self.log("Opening table for tournament " + self.tournamentId + "");
                if (appConfig.game.seatMode) {
                    app.executeCommand("page.seats");
                } else {
                    app.executeCommand("page.tables");
                }
            }
        }
    }
    private displayTournamentFinished() {
        const self = this;
        const data = this.tournamentData();
        const currentDate = new Date().valueOf();
        if (this.finishedPlaying() && (currentDate - this.finishTime()) > 2000) {
            return;
        }

        if (this.finishedPlace !== 1 && this.finishedPlace !== 2) {
            self.log("Tournament " + self.tournamentId + " completed");
            timeService.setTimeout(async () => {
                if (app.tablesPage.tablesShown()/* && app.tablesPage.currentTable().tournament() == self*/) {
                    try {
                        await SimplePopup.display(_("tournament.caption", { tournament: data.TournamentName }),
                        _("tournament.tournamentCompleted", { tournament: data.TournamentName }));
                    } finally {
                        self.finalizeTournament();
                    }
                } else {
                    self.finalizeTournament();
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
        const self = this;
        const table = tableManager.getTableById(this.currentTableId);
        if (table !== null) {
            return table;
        }

        const tournamentTables = tableManager.tables().filter((tournamentTable) => tournamentTable.tournament() !== null
            && tournamentTable.tournament().tournamentId === self.tournamentId);
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
            const winAmount = (this.totalPrize() * prize.PrizeLevel[placeTaken - 1] / 100).toFixed();
            const onTournamentCompleted = () => {
                if (placeTaken === 1 || placeTaken === 2) {
                    this.finalizeTournament();
                } else {
                    const currentTable = tableManager.getTableById(this.currentTableId);
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
        const self = this;
        const api = new Game(host);
        const data = await api.getTableById(tableId);
        tableManager.selectTable(data.Data, true);
        const currentTable = tableManager.getTableById(tableId);
        currentTable.tournament(self);
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
