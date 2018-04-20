/// <reference path="../poker.commanding.api.ts" />

import {
    Game,
    Tournament,
    TournamentBetStructure,
    TournamentDefinition,
    TournamentPlayerDefinition,
    TournamentPlayerStatus,
    TournamentPrizeStructure,
    TournamentStatus,
    TournamentTableDefinition,
} from "@poker/api-server";
import * as ko from "knockout";
import * as moment from "moment";
import { authManager } from "poker/authmanager";
import { App } from "../app";
import { appConfig } from "../appconfig";
import { debugSettings } from "../debugsettings";
import { _ } from "../languagemanager";
import * as metadataManager from "../metadatamanager";
import { PageBlock } from "../pageblock";
import { SimplePopup } from "../popups/simplepopup";
import { reloadManager } from "../services";
import { AccountManager } from "../services/accountManager";
import { tableManager } from "../table/tablemanager";
import * as timeService from "../timeservice";
import { PageBase } from "../ui/pagebase";

declare var host: string;
declare var app: App;

interface TournamentTablePlayerView {
    id: number;
    login: string;
}

interface TournamentTableListView {
    id: number;
    name: string;
    isClosed: boolean;
    selected: KnockoutObservable<boolean>;
    players: TournamentTablePlayerView[];
}

export class TournamentLobbyPage extends PageBase {
    public loading: KnockoutObservable<boolean>;
    public tournamentId = 0;
    public tournamentData: KnockoutObservable<TournamentDefinition>;
    public tournamentCaption: KnockoutComputed<string>;
    public authenticated: KnockoutComputed<boolean>;
    public tablesAvailable: KnockoutComputed<boolean>;
    public lateRegistrationAllowed: KnockoutComputed<boolean>;
    public stackInformation: KnockoutComputed<string>;
    public participantsInformation: KnockoutComputed<string>;
    public betLevelInformation: KnockoutComputed<string>;
    public parentView: string;
    public currentView: KnockoutObservable<number>;
    public getBetStructure: KnockoutComputed<TournamentBetStructure[]>;
    public playersSortOrder = ko.observable("asc");
    public playersColumnOrder = ko.observable("Login");
    public getTournamentPlayers: KnockoutComputed<TournamentPlayerDefinition[]>;
    public tablesData: KnockoutObservable<TournamentTableListView[]>;
    public getSelectedTablePlayers: KnockoutComputed<TournamentTablePlayerView[]>;
    public couldRegister: KnockoutComputed<boolean>;
    public couldUnregister: KnockoutComputed<boolean>;
    public couldContinueGame: KnockoutComputed<boolean>;
    public couldView: KnockoutComputed<boolean>;
    public currentTime: KnockoutComputed<string>;
    public duration: KnockoutComputed<string>;
    public lateRegistrationLeft: KnockoutComputed<string>;
    public lateRegistrationRunning: KnockoutComputed<boolean>;
    public totalPrize: KnockoutComputed<number>;
    public prizesCount: KnockoutComputed<number>;
    public scrollTrigger: KnockoutComputed<number>;

    constructor() {
        super();
        const self = this;
        this.tournamentData = ko.observable<TournamentDefinition>(null);
        this.tablesData = ko.observableArray<TournamentTableListView>([]);
        this.tournamentData.subscribe(function(data) {
            if (data == null) {
                self.tablesData([]);
                return;
            }

            const result = [];
            for (let i = 0; i < data.TournamentTables.length; i++) {
                const table = data.TournamentTables[i];
                const tableModel: TournamentTableListView = {
                    id: table.TableId,
                    name: table.TableName,
                    isClosed: table.IsClosed,
                    selected: ko.observable(false),
                    players: [],
                };
                if (!table.IsClosed) {
                    table.Players.forEach(function(item) {
                        tableModel.players.push({ id: item.PlayerId, login: item.PlayerName });
                    });
                }

                result.push(tableModel);
            }

            if (result.length > 0) {
                result[0].selected(true);
            }

            self.tablesData(result);
        });
        this.loading = ko.observable(true);
        this.currentView = ko.observable(1);
        authManager.registerAuthenticationChangedHandler(function(newValue) {
            self.refreshTournament();
        });
        this.lateRegistrationAllowed = ko.computed(function() {
            const data = self.tournamentData();
            if (data === null) {
                return false;
            }

            return data.RegistrationEndDate > data.StartDate;
        }, this);
        this.totalPrize = ko.computed(function() {
            const tdata = self.tournamentData();
            if (tdata === null) {
                return null;
            }

            if (tdata.PrizeAmountType === 1) {
                return Math.max(tdata.PrizeAmount || 0, tdata.CollectedPrizeAmount || 0);
            }

            if (tdata.PrizeAmountType === 2) {
                return tdata.PrizeAmount || 0;
            }

            return tdata.PrizeAmount + (tdata.CollectedPrizeAmount || 0);
        }, this);
        this.stackInformation = ko.computed(function() {
            const data = self.tournamentData();
            if (data === null) {
                return null;
            }

            const activePlayers = data.TournamentPlayers.filter(function(item) {
                return item.Status === 2;
            });
            let maxStack = 0;
            let minStack = 10000000000;
            let stackSum = 0;
            activePlayers.forEach(function(item) {
                const stack = item.Stack === null ? 0 : item.Stack;
                if (stack > maxStack) {
                    maxStack = stack;
                }

                if (stack < minStack) {
                    minStack = stack;
                }

                stackSum += stackSum;
            });

            const avgStack = stackSum / activePlayers.length;
            const result = _("tournamentLobby.stackInformation")
                .replace("#max", maxStack.toString())
                .replace("#min", minStack.toString())
                .replace("#avg", avgStack.toFixed(0));
            return result;
        }, this);
        this.participantsInformation = ko.computed(function() {
            const data = self.tournamentData();
            if (data == null) {
                return null;
            }

            const activePlayers = data.TournamentPlayers.filter(function(item) {
                return item.Status === 2;
            });
            return _("tournamentLobby.participantsInformation")
                .replace("#joined", data.JoinedPlayers.toString())
                .replace("#tablesCount", data.TournamentTables.length.toString())
                .replace("#playersCount", activePlayers.length.toString());
        }, this);
        this.betLevelInformation = ko.computed(function() {
            const data = self.tournamentData();
            if (data == null) {
                return null;
            }

            if (data.BetLevel == null) {
                return null;
            }

            const betStructure = metadataManager.bets[data.WellKnownBetStructure]
                .sort((a, b) => a.Level - b.Level);

            // Values in the betStructure is starting from 1, be caution.
            // Different methods could produce different indexation.
            const betLevel = betStructure.length < data.BetLevel ? betStructure.length : data.BetLevel;
            const currentBets = betStructure.filter((bs) => bs.Level === betLevel)[0];
            if (currentBets.Ante !== null && currentBets.Ante !== 0) {
                return _("tournamentLobby.betStructureWithAnte")
                    .replace("#sb", currentBets.SmallBlind.toString())
                    .replace("#bb", currentBets.BigBlind.toString())
                    .replace("#ante", currentBets.Ante.toString());
            }

            return _("tournamentLobby.betStructureWithoutAnte")
                .replace("#sb", currentBets.SmallBlind.toString())
                .replace("#bb", currentBets.BigBlind.toString());
        }, this);

        this.getBetStructure = ko.computed(function() {
            const data = self.tournamentData();
            if (data == null) {
                return [];
            }

            const prizeStructure = metadataManager.bets[data.WellKnownBetStructure];
            const sortedPrizes = prizeStructure.sort(function(a, b) {
                return a.Level > b.Level
                    ? 1
                    : (a.Level < b.Level ? -1 : 0);
            });
            return sortedPrizes;
        }, this);
        this.getTournamentPlayers = ko.computed(() => {
            const tdata = self.tournamentData();
            if (tdata === null || tdata === undefined) {
                return null;
            }
            let players = tdata.TournamentPlayers;
            const modifier = self.playersSortOrder() === "asc" ? 1 : -1;
            const sortByName = (a: TournamentPlayerDefinition, b: TournamentPlayerDefinition) => {
                return a.PlayerName > b.PlayerName ? modifier : a.PlayerName < b.PlayerName ? -modifier : 0;
            };
            const sortByPlace = (a: TournamentPlayerDefinition, b: TournamentPlayerDefinition) => {
                const aPrize = a.Prize === null ? 0 : a.Prize;
                const bPrize = b.Prize === null ? 0 : b.Prize;
                return aPrize > bPrize ? modifier : aPrize < bPrize ? -modifier : sortByName(a, b);
            };
            const sortByStack = (a: TournamentPlayerDefinition, b: TournamentPlayerDefinition) => {
                if (a.Prize === null && b.Prize === null) {
                    const aStack = a.Stack === null ? 0 : a.Stack;
                    const bStack = b.Stack === null ? 0 : b.Stack;
                    return aStack > bStack ? modifier : aStack < bStack ? -modifier : -sortByPlace(a, b);
                } else {
                    if (a.Prize === null) {
                        return modifier;
                    }

                    if (b.Prize === null) {
                        return -modifier;
                    }

                    return -sortByPlace(a, b);
                }
            };
            if (self.playersColumnOrder() === "Login") {
                players = players.sort(sortByName);
            }

            if (self.playersColumnOrder() === "Stack") {
                players = players.sort(sortByStack);
            }

            if (self.playersColumnOrder() === "Prize") {
                players = players.sort(sortByPlace);
            }

            return players;
        }, this);
        this.authenticated = ko.computed(function() {
            const value = authManager.authenticated();
            return value;
        }, this);
        this.tablesAvailable = ko.computed(function() {
            const data = self.tournamentData();
            return data != null
                && data.TournamentTables != null
                && data.TournamentTables.length > 0;
        }, this);
        this.tournamentCaption = ko.computed(function() {
            const data = self.tournamentData();
            if (data === null) {
                return;
            }

            if (debugSettings.lobby.useTournamentNameForTournamentCaption) {
                return data.TournamentName;
            }

            return _("tournamentLobby.caption")
                .replace("#number", data.TournamentId.toString());
        }, this);
        this.getSelectedTablePlayers = ko.computed(function() {
            const selectedTables = self.tablesData().filter(function(item) {
                return item.selected();
            });
            if (selectedTables.length < 1) {
                return [];
            }

            return selectedTables[0].players;
        }, this);

        this.couldRegister = ko.computed(function() {
            if (!self.authenticated()) {
                return false;
            }

            const tdata = self.tournamentData();
            if (tdata === null) {
                return false;
            }

            return !tdata.IsRegistered
                && (tdata.Status === TournamentStatus.RegistrationStarted
                || tdata.Status === TournamentStatus.LateRegistration);
        }, this);
        this.couldUnregister = ko.computed(function() {
            if (!self.authenticated()) {
                return false;
            }

            const tdata = self.tournamentData();
            if (tdata === null) {
                return false;
            }

            return tdata.IsRegistered
                && tdata.Status === TournamentStatus.RegistrationStarted;
        }, this);
        this.couldContinueGame = ko.computed(function() {
            if (!self.authenticated()) {
                return false;
            }

            const tdata = self.tournamentData();
            if (tdata === null) {
                return false;
            }

            const tplayer = tdata.TournamentPlayers.filter(function(item) {
                return item.PlayerId === authManager.loginId();
            });

            if (tplayer.length === 0 || tplayer[0].Status !== TournamentPlayerStatus.Playing) {
                return false;
            }

            return tdata.Status === TournamentStatus.LateRegistration
                || tdata.Status === TournamentStatus.Started;
        }, this);
        this.couldView = ko.computed(function() {
            if (!self.authenticated()) {
                return false;
            }

            const tdata = self.tournamentData();
            if (tdata === null) {
                return false;
            }

            const tplayer = tdata.TournamentPlayers.filter(function(item) {
                return item.PlayerId === authManager.loginId();
            });

            if (tplayer.length === 0) {
                return tdata.Status === TournamentStatus.Started;
            }

            if (tplayer[0].Status !== TournamentPlayerStatus.Playing) {
                return tdata.Status === TournamentStatus.LateRegistration
                    || tdata.Status === TournamentStatus.Started;
            }

            return false;
        }, this);
        this.currentTime = ko.pureComputed(function() {
            return timeService.currentTime();
        }, this);
        this.duration = ko.pureComputed(function() {
            const tdata = self.tournamentData();
            if (tdata == null) {
                return "";
            }

            const startDate = moment(tdata.StartDate);
            const currentMoment = moment().add(timeService.timeDiff, "ms");
            const duration = moment.duration(currentMoment.diff(startDate));
            const m = duration.minutes();
            return duration.hours() + _("common.hours") + _("common.timeseparator")
                + (m < 10 ? "0" + m : "" + m) + _("common.minutes");
        }, this);
        this.lateRegistrationLeft = ko.pureComputed(function() {
            const tdata = self.tournamentData();
            if (tdata == null) {
                return "";
            }

            const registrationEndDate = moment(tdata.RegistrationEndDate);
            const currentMoment = moment().add(timeService.timeDiff, "ms");
            const duration = moment.duration(currentMoment.diff(registrationEndDate));
            const m = duration.minutes();
            return duration.hours() + _("common.hours") + _("common.timeseparator")
                + (m < 10 ? "0" + m : "" + m) + _("common.minutes");
        }, this);
        this.lateRegistrationRunning = ko.pureComputed(function() {
            const tdata = self.tournamentData();
            if (tdata == null) {
                return false;
            }

            const registrationEndDate = moment(tdata.RegistrationEndDate);
            const currentMoment = moment().add(timeService.timeDiff, "ms");
            if (currentMoment.diff(registrationEndDate)) {
                return false;
            }

            return true;
        }, this);

        this.prizesCount = ko.computed(function() {
            const data = self.tournamentData();
            if (data === null) {
                return null;
            }

            const currentPlayers = data.JoinedPlayers;
            const prizeStructure = metadataManager.prizes[data.WellKnownPrizeStructure];
            const sortedPrizes = prizeStructure.sort(function(a, b) {
                return a.MaxPlayer > b.MaxPlayer
                    ? 1
                    : (a.MaxPlayer < b.MaxPlayer ? -1 : 0);
            });
            const filteredPrizes = sortedPrizes.filter(function(a) {
                return a.MaxPlayer > currentPlayers;
            });
            let currentPrize: TournamentPrizeStructure;
            if (filteredPrizes.length === 0) {
                currentPrize = sortedPrizes[0];
            } else {
                currentPrize = filteredPrizes[0];
            }

            return currentPrize.PrizeLevel.length;
        }, this);
        let scrollTriggerCounter = 0;
        this.scrollTrigger = ko.computed(function() {
            self.loading();
            self.currentView();
            return scrollTriggerCounter++;
        }, this);
    }
    public deactivate() {
        super.deactivate();
        if (PageBlock.useDoubleView) {
            app.lobbyPageBlock.lobbyPage.filterLocked(false);
        }
    }
    public activate() {
        super.activate();
        this.refreshTournament();
        if (PageBlock.useDoubleView) {
            app.lobbyPageBlock.lobbyPage.filterLocked(true);
        }

        reloadManager.setReloadCallback(() => this.refreshTournament());
    }
    public selectTable(table: TournamentTableListView) {
        const tables = this.tablesData();
        tables.forEach(function(item) {
            item.selected(false);
        });

        table.selected(true);
        this.tablesData(tables);
    }
    public setTournament(tournamentId: number, parentView: string): void {
        this.tournamentId = tournamentId || 0;
        this.parentView = parentView;
    }
    public async refreshTournament(): Promise<ApiResult<TournamentDefinition>> {
        if (this.tournamentId === 0) {
            return Promise.resolve({ Status: "Ok", Data: null });
        }

        const self = this;
        const tournamentApi = new Tournament(host);
        this.loading(true);
        try {
            const data = await tournamentApi.getTournament(this.tournamentId);
            if (data.Status === "Ok") {
                const tournamentData = data.Data;
                self.log("Informaton about tournament ", self.tournamentId, " received: ", data.Data);
                self.log(tournamentData.TournamentName);
                self.tournamentData(tournamentData);
                if (tournamentData.Status === TournamentStatus.Started
                    || tournamentData.Status === TournamentStatus.LateRegistration) {
                    // Connect to the tournament so player could monitor game on it
                    tableManager.selectTournament(tournamentData, true);
                }

                if (tournamentData.Status === TournamentStatus.Started
                    || tournamentData.Status === TournamentStatus.LateRegistration) {
                    self.setDefaultSortOrder("Stack");
                } else if (tournamentData.Status === TournamentStatus.Completed) {
                    self.setDefaultSortOrder("Prize");
                } else {
                    self.setDefaultSortOrder("Login");
                }
            }

            self.loading(false);
        } catch (e) {
            self.log("Failed to get information about tournament " + self.tournamentId);
            self.loading(false);
        }
    }
    public back() {
        app.lobbyPageBlock.showSecondary(this.parentView);
    }
    public async register() {
        const self = this;
        const manager = new AccountManager();
        self.loading(true);
        try {
            const data = await manager.getAccount();
            self.loading(false);
            if (data.Status === "Ok") {
                const personalAccountData = data.Data;
                let balance = 0;
                const tournament = self.tournamentData();
                if (tournament.CurrencyId === 1) {
                    balance = personalAccountData.RealMoney;
                } else {
                    balance = personalAccountData.GameMoney;
                }

                await self.promptRegister(balance);
            } else {
                SimplePopup.display(_("tournamentLobby.registrationSuccess"), _("errors." + data.Status));
            }
        } catch (e) {
            self.loading(false);
            SimplePopup.display(_("tournamentLobby.registrationSuccess"), _("tournamentLobby.registrationError"));
        }
    }
    /**
     * Initiates cancelling registration in the tournament.
     */
    public async unregister() {
        const self = this;
        const tournament = self.tournamentData();
        const name = tournament.TournamentName;
        const operationTitle = _("tournamentLobby.registrationCancelled");
        const approved = await app.promptAsync(
            _("tournamentLobby.tournamentRegistrationCancelPromptCaption"),
            [_("tournamentLobby.tournamentRegistrationCancelPrompt").replace("#name", name)]);
        if (approved) {
            self.loading(true);
            const tournamentApi = new Tournament(host);
            try {
                const data = await tournamentApi.cancelRegistration(self.tournamentId);
                self.loading(false);
                if (data.Status === "Ok") {
                    self.log("Registration cancelled");
                    tableManager.removeTournamentById(self.tournamentId);
                    SimplePopup.display(operationTitle, _("tournamentLobby.registrationCancelledCompleteSuccess"));
                    try {
                        await self.refreshTournament();
                    } catch (e) {
                        SimplePopup.display(operationTitle, _("tournamentLobby.registrationCancelError"));
                    }
                } else {
                    SimplePopup.display(operationTitle, _("errors." + data.Status));
                }
            } catch (e) {
                SimplePopup.display(operationTitle, _("tournamentLobby.registrationCancelError"));
            }
        }
    }
    public selectView(view: number) {
        this.currentView(view);
    }
    public viewGame() {
        const tablesView = 2;
        if (this.currentView() !== tablesView) {
            this.currentView(tablesView);
        } else {
            const selectedTable = this.tablesData().filter((tablePage) => {
                return tablePage.selected();
            });
            if (selectedTable.length !== 0) {
                const table = selectedTable[0];
                if (!table.isClosed) {
                    this.showTournamentTable(selectedTable[0].id);
                }
            }
        }
    }
    public continueGame() {
        const tournamentView = tableManager.getTournamentById(this.tournamentId);
        this.showTournamentTable(tournamentView.currentTableId);
    }
    public showTable(table: TournamentTableDefinition) {
        if (!this.couldView() && this.couldContinueGame()) {
            return;
        }

        this.showTournamentTable(table.TableId);
    }
    public applyPlayersSort(sortColumn: string) {
        if (this.playersColumnOrder() === sortColumn) {
            this.playersSortOrder(this.playersSortOrder() === "asc" ? "desc" : "asc");
            return;
        }

        this.playersColumnOrder(sortColumn);
        switch (sortColumn) {
            case "Login":
                this.playersSortOrder("asc");
                break;
            case "Stack":
                this.playersSortOrder("desc");
                break;
            case "Prize":
                this.playersSortOrder("asc");
                break;
            default:
                this.playersSortOrder("asc");
                break;
        }
    }
    public setDefaultSortOrder(sortColumn: string) {
        this.playersColumnOrder(sortColumn);
        switch (sortColumn) {
            case "Login":
                this.playersSortOrder("asc");
                break;
            case "Stack":
                this.playersSortOrder("desc");
                break;
            case "Prize":
                this.playersSortOrder("asc");
                break;
            default:
                this.playersSortOrder("asc");
                break;
        }
    }
    /**
     * Shows already opened tournament table, or load new one if needed.
     * @param tableId Number Id of the tournament table to show.
     */
    private async showTournamentTable(tableId: number) {
        const self = this;
        const tableView = tableManager.getTableById(tableId);
        if (tableView === null) {
            this.loading(true);
            const tdata = this.tournamentData();
            const api = new Game(host);
            const currentTournamentTitle = _("tournamentLobby.caption", { number: tdata.TournamentId });
            try {
                const data = await api.getTableById(tableId);
                if (data.Status === "Ok") {
                    const tapi = new Tournament(host);
                    try {
                        const tournamentData = await tapi.getTournament(tdata.TournamentId);
                        if (data.Status === "Ok") {
                            self.loading(false);
                            tableManager.selectTournament(tournamentData.Data, false);
                            tableManager.selectTable(data.Data, true);
                            const currentTable = tableManager.getTableById(tableId);
                            if (currentTable != null) {
                                currentTable.tournament(tableManager.getTournamentById(tdata.TournamentId));
                                if (appConfig.game.seatMode) {
                                    app.executeCommand("page.seats");
                                } else {
                                    app.executeCommand("page.tables");
                                }
                            }
                        } else {
                            self.loading(false);
                            SimplePopup.display(currentTournamentTitle, _("errors." + data.Status));
                        }
                    } catch (e) {
                        self.loading(false);
                        self.log("Could not get tournament information for tournament #" + tdata.TournamentId);
                        SimplePopup.display(currentTournamentTitle, _("tournamentLobby.showTableError"));
                    }
                } else {
                    self.loading(false);
                    SimplePopup.display(currentTournamentTitle, _("errors." + data.Status));
                }
            } catch (e) {
                self.loading(false);
                self.log("Could not get table information for table #" + tableId);
                SimplePopup.display(currentTournamentTitle, _("tournamentLobby.showTableError"));
            }
        } else {
            tableManager.selectById(tableId);
            if (appConfig.game.seatMode) {
                app.executeCommand("page.seats");
            } else {
                app.executeCommand("page.tables");
            }
        }
    }
    private async promptRegister(currentBalance: number) {
        const self = this;
        const tournament = self.tournamentData();
        const name = tournament.TournamentName;
        const joinAmount = tournament.JoinFee + tournament.BuyIn;
        /* tslint:disable:no-string-literal */
        const numericTextBinding = ko.bindingHandlers["numericText"] as any;
        /* tslint:enable:no-string-literal */
        const joinAmountString = numericTextBinding.withCommas(joinAmount.toFixed(0), numericTextBinding.separator);
        if (currentBalance < joinAmount) {
            await SimplePopup.display(
                _("tournamentLobby.tournamentRegistrationPromptCaption"),
                _("tournamentLobby.insufficientFunds"));
            return;
        }

        const balanceString = numericTextBinding.withCommas(currentBalance.toFixed(0), numericTextBinding.separator);
        app.okcancelPopup.customStyle("popup-container-left");
        const approved = await app.promptAsync(
            _("tournamentLobby.tournamentRegistrationPromptCaption"),
            [
                _("tournamentLobby.tournamentRegistrationPrompt", { name }),
                _("tournamentLobby.tournamentRegistrationAmount").replace("#amount", joinAmountString),
                _("tournamentLobby.tournamentRegistrationPromptBalance").replace("#amount", balanceString),
            ]);
        if (approved) {
            self.loading(true);
            const tournamentApi = new Tournament(host);
            try {
                const data = await tournamentApi.register(self.tournamentId);
                self.loading(false);
                if (data.Status === "Ok") {
                    tableManager.openTournamentById(self.tournamentId);
                    self.log("Registration success");
                    SimplePopup.display(
                        _("tournamentLobby.registrationSuccess"),
                        _("tournamentLobby.registrationCompleteSuccess"));
                    try {
                        await self.refreshTournament();
                    } catch (e) {
                        SimplePopup.display(
                            _("tournamentLobby.registrationSuccess"),
                            _("tournamentLobby.registrationError"));
                    }
                } else {
                    SimplePopup.display(_("tournamentLobby.registrationSuccess"), _("errors." + data.Status));
                }
            } catch (e) {
                self.loading(false);
                SimplePopup.display(_("tournamentLobby.registrationSuccess"), _("tournamentLobby.registrationError"));
            }
        }
    }
    private log(message: string, ...params: any[]) {
        if (debugSettings.lobby.trace) {
            console.log(message, params);
        }
    }
}
