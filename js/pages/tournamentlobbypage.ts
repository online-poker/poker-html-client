/// <reference path="../poker.commanding.api.ts" />

import * as ko from "knockout";
import * as moment from "moment";
import { App } from "../app";
import * as metadataManager from "../metadatamanager";
import { SimplePopup } from "../popups/simplepopup";
import { tableManager } from "../table/tablemanager";
import * as timeService from "../timeservice";
import * as authManager from "../authmanager";
import { PageBase } from "../ui/pagebase";
import { debugSettings } from "../debugsettings";
import { reloadManager } from "../services";
import { _ } from "../languagemanager";

declare var apiHost: string;
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
    loading: KnockoutObservable<boolean>;
    tournamentId = 0;
    tournamentData: KnockoutObservable<TournamentDefinition>;
    tournamentCaption: KnockoutComputed<string>;
    authenticated: KnockoutComputed<boolean>;
    tablesAvailable: KnockoutComputed<boolean>;
    lateRegistrationAllowed: KnockoutComputed<boolean>;
    stackInformation: KnockoutComputed<string>;
    participantsInformation: KnockoutComputed<string>;
    betLevelInformation: KnockoutComputed<string>;
    parentView: string;
    currentView: KnockoutObservable<number>;
    getBetStructure: KnockoutComputed<TournamentBetStructure[]>;
    playersSortOrder = ko.observable("asc");
    playersColumnOrder = ko.observable("Login");
    getTournamentPlayers: KnockoutComputed<TournamentPlayerDefinition[]>;
    tablesData: KnockoutObservable<TournamentTableListView[]>;
    getSelectedTablePlayers: KnockoutComputed<TournamentTablePlayerView[]>;
    couldRegister: KnockoutComputed<boolean>;
    couldUnregister: KnockoutComputed<boolean>;
    couldContinueGame: KnockoutComputed<boolean>;
    couldView: KnockoutComputed<boolean>;
    currentTime: KnockoutComputed<string>;
    duration: KnockoutComputed<string>;
    lateRegistrationLeft: KnockoutComputed<string>;
    lateRegistrationRunning: KnockoutComputed<boolean>;
    totalPrize: KnockoutComputed<number>;
    prizesCount: KnockoutComputed<number>;
    scrollTrigger: KnockoutComputed<number>;

    constructor() {
        super();
        const self = this;
        this.tournamentData = ko.observable<TournamentDefinition>(null);
        this.tablesData = ko.observableArray<TournamentTableListView>([]);
        this.tournamentData.subscribe(function (data) {
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
                    players: []
                };
                if (!table.IsClosed) {
                    table.Players.forEach(function (item) {
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
        authManager.authenticated.subscribe(function (newValue) {
            self.refreshTournament();
        });
        this.lateRegistrationAllowed = ko.computed(function () {
            const data = self.tournamentData();
            if (data === null) {
                return false;
            }

            return data.RegistrationEndDate > data.StartDate;
        }, this);
        this.totalPrize = ko.computed(function () {
            const tdata = self.tournamentData();
            if (tdata === null) {
                return null;
            }

            return tdata.PrizeAmount + (tdata.CollectedPrizeAmount || 0);
        }, this);
        this.stackInformation = ko.computed(function () {
            const data = self.tournamentData();
            if (data === null) {
                return null;
            }

            const activePlayers = data.TournamentPlayers.filter(function (item) {
                return item.Status === 2;
            });
            let maxStack = 0;
            let minStack = 10000000000;
            let stackSum = 0;
            activePlayers.forEach(function (item) {
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
        this.participantsInformation = ko.computed(function () {
            const data = self.tournamentData();
            if (data == null) {
                return null;
            }

            const activePlayers = data.TournamentPlayers.filter(function (item) {
                return item.Status === 2;
            });
            return _("tournamentLobby.participantsInformation")
                .replace("#joined", data.JoinedPlayers.toString())
                .replace("#tablesCount", data.TournamentTables.length.toString())
                .replace("#playersCount", activePlayers.length.toString());
        }, this);
        this.betLevelInformation = ko.computed(function () {
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
            const currentBets = betStructure.filter(_ => _.Level === betLevel)[0];
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

        this.getBetStructure = ko.computed(function () {
            const data = self.tournamentData();
            if (data == null) {
                return [];
            }

            const currentPlayers = data.JoinedPlayers;
            const prizeStructure = metadataManager.bets[data.WellKnownBetStructure];
            const sortedPrizes = prizeStructure.sort(function (a, b) {
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
            let players = tdata.TournamentPlayers,
                modifier = self.playersSortOrder() === "asc" ? 1 : -1;
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
        this.authenticated = ko.computed(function () {
            const value = authManager.authenticated();
            return value;
        }, this);
        this.tablesAvailable = ko.computed(function () {
            const data = self.tournamentData();
            return data != null
                && data.TournamentTables != null
                && data.TournamentTables.length > 0;
        }, this);
        this.tournamentCaption = ko.computed(function () {
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
        this.getSelectedTablePlayers = ko.computed(function () {
            const selectedTables = self.tablesData().filter(function (item) {
                return item.selected();
            });
            if (selectedTables.length < 1) {
                return [];
            }

            return selectedTables[0].players;
        }, this);

        this.couldRegister = ko.computed(function () {
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
        this.couldUnregister = ko.computed(function () {
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
        this.couldContinueGame = ko.computed(function () {
            if (!self.authenticated()) {
                return false;
            }

            const tdata = self.tournamentData();
            if (tdata === null) {
                return false;
            }

            const tplayer = tdata.TournamentPlayers.filter(function (item) {
                return item.PlayerId === authManager.loginId();
            });

            if (tplayer.length === 0 || tplayer[0].Status !== TournamentPlayerStatus.Playing) {
                return false;
            }

            return tdata.Status === TournamentStatus.LateRegistration
                || tdata.Status === TournamentStatus.Started;
        }, this);
        this.couldView = ko.computed(function () {
            if (!self.authenticated()) {
                return false;
            }

            const tdata = self.tournamentData();
            if (tdata === null) {
                return false;
            }

            const tplayer = tdata.TournamentPlayers.filter(function (item) {
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
        this.currentTime = ko.pureComputed(function () {
            return timeService.currentTime();
        }, this);
        this.duration = ko.pureComputed(function () {
            const tdata = self.tournamentData();
            if (tdata == null) {
                return "";
            }

            const startDate = moment(tdata.StartDate);
            const currentMoment = moment().add(timeService.timeDiff, "ms");
            const duration = moment.duration(currentMoment.diff(startDate));
            const m = duration.minutes();
            return duration.hours() + _("common.hours") + _("common.timeseparator") + (m < 10 ? "0" + m : "" + m) + _("common.minutes");
        }, this);
        this.lateRegistrationLeft = ko.pureComputed(function () {
            const tdata = self.tournamentData();
            if (tdata == null) {
                return "";
            }

            const startDate = moment(tdata.StartDate);
            const registrationEndDate = moment(tdata.RegistrationEndDate);
            const currentMoment = moment().add(timeService.timeDiff, "ms");
            const duration = moment.duration(currentMoment.diff(registrationEndDate));
            const m = duration.minutes();
            return duration.hours() + _("common.hours") + _("common.timeseparator") + (m < 10 ? "0" + m : "" + m) + _("common.minutes");
        }, this);
        this.lateRegistrationRunning = ko.pureComputed(function () {
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

        this.prizesCount = ko.computed(function () {
            const data = self.tournamentData();
            if (data === null) {
                return null;
            }

            const currentPlayers = data.JoinedPlayers;
            const prizeStructure = metadataManager.prizes[data.WellKnownPrizeStructure];
            const sortedPrizes = prizeStructure.sort(function (a, b) {
                return a.MaxPlayer > b.MaxPlayer
                    ? 1
                    : (a.MaxPlayer < b.MaxPlayer ? -1 : 0);
            });
            const filteredPrizes = sortedPrizes.filter(function (a) {
                return a.MaxPlayer >= currentPlayers;
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
        this.scrollTrigger = ko.computed(function () {
            self.loading();
            self.currentView();
            return scrollTriggerCounter++;
        }, this);
    }
    deactivate() {
        super.deactivate();
        if (PageBlock.useDoubleView) {
            app.lobbyPageBlock.lobbyPage.filterLocked(false);
        }
    }
    activate() {
        super.activate();
        this.refreshTournament();
        if (PageBlock.useDoubleView) {
            app.lobbyPageBlock.lobbyPage.filterLocked(true);
        }

        reloadManager.setReloadCallback(() => this.refreshTournament());
    }
    selectTable(table: TournamentTableListView) {
        const tables = this.tablesData();
        tables.forEach(function (item) {
            item.selected(false);
        });

        table.selected(true);
        this.tablesData(tables);
    }
    setTournament(tournamentId: number, parentView: string): void {
        this.tournamentId = tournamentId || 0;
        this.parentView = parentView;
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
                self.log("Informaton about tournament ", self.tournamentId, " received: ", data.Data);
                self.log(tournamentData.TournamentName);
                self.tournamentData(tournamentData);
                const tplayer = tournamentData.TournamentPlayers.filter(_ => _.PlayerId === authManager.loginId());
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
        }).fail(function () {
            self.log("Failed to get information about tournament " + self.tournamentId);
            self.loading(false);
        });
    }
    back() {
        app.lobbyPageBlock.showSecondary(this.parentView);
    }
    register() {
        const self = this;
        const tournament = self.tournamentData();
        const name = tournament.TournamentName;
        const joinAmount = tournament.JoinFee + tournament.BuyIn;
        /* tslint:disable:no-string-literal */
        const numericTextBinding = <any>ko.bindingHandlers["numericText"];
        /* tslint:enable:no-string-literal */
        const joinAmountString = numericTextBinding.withCommas(joinAmount.toFixed(0));
        const api = new OnlinePoker.Commanding.API.Account(apiHost);
        self.loading(true);
        api.GetPersonalAccount(function (data) {
            self.loading(false);
            if (data.Status === "Ok") {
                const personalAccountData = <PersonalAccountData>data.Data;
                let balance = 0;
                const tournament = self.tournamentData();
                if (tournament.CurrencyId === 1) {
                    balance = personalAccountData.RealMoney;
                } else {
                    balance = personalAccountData.GameMoney;
                }

                self.promptRegister(balance);
            } else {
                SimplePopup.display(_("tournamentLobby.registrationSuccess"), _("errors." + data.Status));
            }
        }).fail(() => {
            self.loading(false);
            SimplePopup.display(_("tournamentLobby.registrationSuccess"), _("tournamentLobby.registrationError"));
        });
    }
    unregister() {
        const self = this;
        const tournament = self.tournamentData();
        const name = tournament.TournamentName;
        const operationTitle = _("tournamentLobby.registrationCancelled");
        app.prompt(
            _("tournamentLobby.tournamentRegistrationCancelPromptCaption"),
            [_("tournamentLobby.tournamentRegistrationCancelPrompt").replace("#name", name)])
            .then(function () {
                self.loading(true);
                const tournamentApi = new OnlinePoker.Commanding.API.Tournament(apiHost);
                tournamentApi.CancelRegistration(self.tournamentId, function (data) {
                    self.loading(false);
                    if (data.Status === "Ok") {
                        self.log("Registration cancelled");
                        tableManager.removeTournamentById(self.tournamentId);
                        SimplePopup.display(operationTitle, _("tournamentLobby.registrationCancelledCompleteSuccess"));
                        self.refreshTournament()
                            .fail(() => {
                                SimplePopup.display(operationTitle, _("tournamentLobby.registrationCancelError"));
                            });
                    } else {
                        SimplePopup.display(operationTitle, _("errors." + data.Status));
                    }
            }).fail(() => {
                SimplePopup.display(operationTitle, _("tournamentLobby.registrationCancelError"));
            });
        });
    }
    selectView(view: number) {
        this.currentView(view);
    }
    viewGame() {
        const tablesView = 2;
        if (this.currentView() !== tablesView) {
            this.currentView(tablesView);
        } else {
            const selectedTable = this.tablesData().filter((_) => {
                return _.selected();
            });
            if (selectedTable.length !== 0) {
                const table = selectedTable[0];
                if (!table.isClosed) {
                    this.showTournamentTable(selectedTable[0].id);
                }
            }
        }
    }
    continueGame() {
        const tournamentView = tableManager.getTournamentById(this.tournamentId);
        this.showTournamentTable(tournamentView.currentTableId);
    }
    showTable(table: TournamentTableDefinition) {
        if (!this.couldView() && this.couldContinueGame()) {
            return;
        }

        this.showTournamentTable(table.TableId);
    }
    applyPlayersSort(sortColumn: string) {
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
    setDefaultSortOrder(sortColumn: string) {
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
    private showTournamentTable(tableId: number) {
        const self = this;
        const tableView = tableManager.getTableById(tableId);
        if (tableView === null) {
            this.loading(true);
            const tdata = this.tournamentData();
            const api = new OnlinePoker.Commanding.API.Game(apiHost);
            const currentTournamentTitle = _("tournamentLobby.caption", { "number": tdata.TournamentId });
            api.GetTable(tableId).then(function (data) {
                if (data.Status === "Ok") {
                    const tapi = new OnlinePoker.Commanding.API.Tournament(apiHost);
                    tapi.GetTournament(tdata.TournamentId).then(function (tournamentData) {
                        if (data.Status === "Ok") {
                            self.loading(false);
                            tableManager.selectTournament(tournamentData.Data, false);
                            tableManager.selectTable(data.Data, true);
                            const currentTable = tableManager.getTableById(tableId);
                            if (currentTable != null) {
                                currentTable.tournament(tableManager.getTournamentById(tdata.TournamentId));
                                app.showSubPage("tables");
                            }
                        } else {
                            self.loading(false);
                            SimplePopup.display(currentTournamentTitle, _("errors." + data.Status));
                        }
                    }, function () {
                        self.loading(false);
                        self.log("Could not get tournament information for tournament #" + tdata.TournamentId);
                        SimplePopup.display(currentTournamentTitle, _("tournamentLobby.showTableError"));
                    });
                } else {
                    self.loading(false);
                    SimplePopup.display(currentTournamentTitle, _("errors." + data.Status));
                }
            }, function () {
                self.loading(false);
                self.log("Could not get table information for table #" + tableId);
                SimplePopup.display(currentTournamentTitle, _("tournamentLobby.showTableError"));
            });
        } else {
            tableManager.selectById(tableId);
            app.showSubPage("tables");
        }
    }
    private promptRegister(currentBalance: number) {
        const self = this;
        const tournament = self.tournamentData();
        const name = tournament.TournamentName;
        const joinAmount = tournament.JoinFee + tournament.BuyIn;
        /* tslint:disable:no-string-literal */
        const numericTextBinding = <any>ko.bindingHandlers["numericText"];
        /* tslint:enable:no-string-literal */
        const joinAmountString = numericTextBinding.withCommas(joinAmount.toFixed(0));
        if (currentBalance < joinAmount) {
            SimplePopup.display(_("tournamentLobby.tournamentRegistrationPromptCaption"), _("tournamentLobby.insufficientFunds"));
            return;
        }

        const balanceString = numericTextBinding.withCommas(currentBalance.toFixed(0));
        app.prompt(
            _("tournamentLobby.tournamentRegistrationPromptCaption"),
            [
                _("tournamentLobby.tournamentRegistrationPrompt", { name: name }),
                _("tournamentLobby.tournamentRegistrationAmount").replace("#amount", joinAmountString),
                _("tournamentLobby.tournamentRegistrationPromptBalance").replace("#amount", balanceString),
            ])
            .then(function () {
                self.loading(true);
                const tournamentApi = new OnlinePoker.Commanding.API.Tournament(apiHost);
                tournamentApi.Register(self.tournamentId, function (data) {
                    self.loading(false);
                    if (data.Status === "Ok") {
                        tableManager.openTournamentById(self.tournamentId);
                        self.log("Registration success");
                        SimplePopup.display(_("tournamentLobby.registrationSuccess"), _("tournamentLobby.registrationCompleteSuccess"));
                        self.refreshTournament()
                            .fail(() => {
                                SimplePopup.display(_("tournamentLobby.registrationSuccess"), _("tournamentLobby.registrationError"));
                            });
                    } else {
                        SimplePopup.display(_("tournamentLobby.registrationSuccess"), _("errors." + data.Status));
                    }
                }).fail(() => {
                        self.loading(false);
                        SimplePopup.display(_("tournamentLobby.registrationSuccess"), _("tournamentLobby.registrationError"));
                    });
            });
        app.okcancelPopup.customStyle("popup-container-left");
    }
    private log(message: string, ...params: any[]) {
        if (debugSettings.lobby.trace) {
            console.log(message, params);
        }
    }
}
