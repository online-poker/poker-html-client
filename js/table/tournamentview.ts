import * as ko from "knockout";
import * as timeService from "../timeservice";
import * as tableManager from "./tablemanager";
import * as authManager from "../authmanager";
import * as metadataManager from "../metadatamanager";
import { slowInternetService, connectionService } from "../services";
import { ConnectionWrapper } from "../services/connectionwrapper";
import { SimplePopup } from "../popups/simplepopup";
import { appConfig } from "../appconfig";
import { debugSettings } from "../debugsettings";
import { App } from "../app";
import { _ } from "../languagemanager";

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
        const self = this;
        this.tournamentData(data);
        this.status(data.Status);
        this.rebuyAllowed(data.IsRebuyAllowed);
        this.addonAllowed(data.IsAddonAllowed);
        const currentPlayerCandidates = data.TournamentPlayers.filter(_ => _.PlayerId === authManager.loginId());
        if (currentPlayerCandidates.length > 0) {
            const currentPlayer = currentPlayerCandidates[0];
            if (currentPlayer.Status === TournamentPlayerStatus.Playing) {
                this.currentTableId = currentPlayer.TableId;
            }
        }

        this.totalPrize = ko.computed(function () {
            const tdata = self.tournamentData();
            if (tdata === null) {
                return null;
            }

            return tdata.PrizeAmount + (tdata.CollectedPrizeAmount || 0);
        }, this);
    }

    refreshTournament(): JQueryPromise<any> {
        if (this.tournamentId === 0) {
            return $.Deferred().resolve({ Status: "Ok", Data: null });
        }

        const self = this;
        const tournamentApi = new OnlinePoker.Commanding.API.Tournament(apiHost);
        this.loading(true);
        return tournamentApi.GetTournament(this.tournamentId, function (data) {
            if (data.Status === "Ok") {
                const tournamentData: TournamentDefinition = data.Data;
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
        const self = this;
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
        const currentLoadingRequest = $.Deferred();
        const wrapper = connectionService.currentConnection;
        let hubId = wrapper.connection.id;
        const connectionInfo = "HID:" + hubId;
        this.log("Connecting to tournament " + this.tournamentId + " on connection " + connectionInfo);
        const startConnection = app.buildStartConnection();
        const api = new OnlinePoker.Commanding.API.Game(apiHost);
        startConnection().then(function () {
            if (wrapper.terminated) {
                return;
            }

            hubId = wrapper.connection.id;
            self.log("Attempting to connect to table and chat over connection " + hubId);

            const joinTournamentRequest = self.joinTournament(wrapper);
            const joinRequest = $.when(joinTournamentRequest);
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

                    const message = "Rejecting request due to join tournament failure in the connection."
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
        const cancelOperation = function () {
            self.log("Cancelling join tournament request");
            result.reject("Cancelled", true);
        };

        wrapper.buildStartConnection()().pipe(function () {
            if (wrapper.terminated) {
                cancelOperation();
                return;
            }

            self.log("Executing Game.subscribeTournament on connection " + wrapper.connection.id + " in state " + wrapper.connection.state);
            const operation = wrapper.connection.Game.server.subscribeTournament(self.tournamentId)
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

                    const message = "" + <string>error;
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
    async onTournamentStatusChanged(status: TournamentStatus) {
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
    private async openTournamentTableUI() {
        const self = this;
        const data = this.tournamentData();
        let openTournamentPromise: JQueryPromise<void> = null;
        if (appConfig.tournament.openTableAutomatically) {
            openTournamentPromise = this.openTournamentTable(this.currentTableId);
        }

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
                openTournamentPromise.then((value) => {
                    self.log("Opeinin table for tournament " + self.tournamentId + "");
                    app.showSubPage("tables");
                });
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
    onTournamentTableChanged(tableId: number) {
        const self = this;
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
        const self = this;
        this.finishedPlaying(true);
        this.finishTime(new Date().valueOf());
        this.finishedPlace = placeTaken;

        const data = this.tournamentData();
        const structure = this.getPrizeStructure(data.WellKnownPrizeStructure);
        const ascendingSort = (a, b) => {
            return a.MaxPlayer - b.MaxPlayer;
        };
        const prizes = structure.filter((_) => {
            return _.MaxPlayer > data.JoinedPlayers;
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
    onTournamentBetLevelChanged(level: number) {
        const data = this.tournamentData();
        const structure = this.getBetLevelStructure(data.WellKnownBetStructure).sort((a, b) => a.Level - b.Level);
        const betLevelCandidate = structure.filter(_ => _.Level === level);
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
                let notificationParameters = {
                    tournament: data.TournamentName,
                    sb: betLevel.SmallBlind,
                    bb: betLevel.BigBlind
                };
                currentTable.showNotificationWithDelay(
                    _("tournament.betLevelChanged1", notificationParameters),
                    debugSettings.tableView.betLevelChangeDelay);
            } else {
                let notificationParameters = {
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
        const self = this;
        const table = tableManager.getTableById(this.currentTableId);
        if (table !== null) {
            return table;
        }

        const tournamentTables = tableManager.tables().filter(_ => _.tournament() !== null
            && _.tournament().tournamentId === self.tournamentId);
        if (tournamentTables.length !== 0) {
            return tournamentTables[0];
        }

        return null;
    }

    private displayGameFinishedNotification(prize: TournamentPrizeStructure, placeTaken: number) {
        const self = this;
        const data = this.tournamentData();
        if (prize.PrizeLevel.length < placeTaken) {
            SimplePopup.displayWithTimeout(_("tournament.caption", { tournament: data.TournamentName }),
                _("tournament.playerGameCompleted", { tournament: data.TournamentName, place: placeTaken }),
                10 * 1000);
        } else {
            const winAmount = (self.totalPrize() * prize.PrizeLevel[placeTaken - 1] / 100).toFixed();
            SimplePopup.displayWithTimeout(_("tournament.caption", { tournament: data.TournamentName }),
                _("tournament.playerGameCompletedAndWin", { tournament: data.TournamentName, place: placeTaken, win: winAmount }),
                10 * 1000)
                .always(() => {
                    if (placeTaken === 1 || placeTaken === 2) {
                        self.finalizeTournament();
                    } else {
                        const currentTable = tableManager.getTableById(this.currentTableId);
                        if (!currentTable.opened()) {
                            self.finalizeTournament();
                        }
                    }
                });
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

    private openTournamentTable(tableId: number) {
        const self = this;
        const api = new OnlinePoker.Commanding.API.Game(apiHost);
        return api.GetTable(tableId).then(function (data) {
            tableManager.selectTable(data.Data, true);
            const currentTable = tableManager.getTableById(tableId);
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
