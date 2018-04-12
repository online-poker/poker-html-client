/* tslint:disable:no-bitwise */
declare var host: string;

import { Game, LobbyTournamentItem, Tournament, TournamentDefinition } from "@poker/api-server";
import * as ko from "knockout";
import * as moment from "moment";
import { authManager } from "poker/authmanager";
import { AccountManager } from "poker/services/accountManager";
import { settings } from "poker/settings";
import { App } from "../app";
import { appConfig } from "../appconfig";
import { debugSettings } from "../debugsettings";
import { _ } from "../languagemanager";
import * as metadataManager from "../metadatamanager";
import { PageBlock } from "../pageblock";
import { reloadManager } from "../services";
import { Slider } from "../slider";
import { tableManager } from "../table/tablemanager";
import * as timeService from "../timeservice";
import { PageBase } from "../ui/pagebase";

declare var app: App;

/** Filter options for cash table */
export class CashOptions {
    public currency: KnockoutObservable<number>;
    public limits: KnockoutObservable<number>;
    public bets: KnockoutObservable<number>;
    public maxPlayers: KnockoutObservable<number>;

    constructor() {
        // require("extenders");
        this.currency = ko.observable(2).extend({
            options: {
                caption: "currency.caption",
                items: [
                    { text: "currency.realmoney", value: 1 },
                    { text: "currency.gamemoney", value: 2 },
                ],
            },
        });
        this.limits = ko.observable(0).extend({
            options: {
                caption: "limits.caption",
                items: [
                    { text: "common.any", value: 0 },
                    { text: "limits.limit1", value: 1 },
                    { text: "limits.limit2", value: 2 },
                    { text: "limits.limit3", value: 3 },
                ],
            },
        });
        this.bets = ko.observable(0).extend({
            options: {
                caption: "bets.caption",
                items: [
                    { text: "common.any", value: 0 },
                    { text: "bets.level1", value: 1 << 0 | 1 << 1 | 1 << 2 },
                    { text: "bets.level2", value: 1 << 3 | 1 << 4 | 1 << 5 | 1 << 6 },
                    { text: "bets.level3", value: 1 << 7 | 1 << 8 | 1 << 9 },
                ],
            },
        });
        this.maxPlayers = ko.observable(0).extend({
            options: {
                caption: "players.caption",
                items: [
                    { text: "common.any", value: 0 },
                    { text: "players.players2", value: 2 },
                    { text: "players.players6", value: 6 },
                    { text: "players.players10", value: 10 },
                ],
            },
        });
    }
}

/** Filter options for tournaments */
export class TournamentOptions {
    public currency: KnockoutObservable<number>;
    public buyin: KnockoutObservable<number>;
    public speed: KnockoutObservable<number>;
    public maxPlayers: KnockoutObservable<number>;

    constructor() {
        // require("extenders");
        this.currency = ko.observable(2).extend({
            options: {
                caption: "currency.caption",
                items: [
                    { text: "currency.realmoney", value: 1 },
                    { text: "currency.gamemoney", value: 2 },
                ],
            },
        });
        this.buyin = ko.observable(0).extend({
            options: {
                caption: "buyin.caption",
                items: [
                    { text: "common.any", value: 0 },
                    { text: "buyin.freeroll", value: 1 },
                    { text: "buyin.level1", value: 1 << 1 | 1 << 2 | 1 << 3 },
                    { text: "buyin.level2", value: 1 << 4 | 1 << 5 | 1 << 6 },
                    { text: "buyin.level3", value: 1 << 7 | 1 << 8 | 1 << 9 },
                ],
            },
        });
        this.speed = ko.observable(0).extend({
            options: {
                caption: "speed.caption",
                items: [
                    { text: "common.any", value: 0 },
                    { text: "speed.normal", value: 1 },
                    { text: "speed.turbo", value: 2 },
                    { text: "speed.turbo2x", value: 3 },
                ],
            },
        });
        this.maxPlayers = ko.observable(0).extend({
            options: {
                caption: "players.caption",
                items: [
                    { text: "common.any", value: 0 },
                    { text: "players.players2", value: 1 },
                    { text: "players.players6", value: 2 },
                    { text: "players.players10", value: 3 },
                ],
            },
        });
    }
}

interface LobbyTournamentItemEx extends LobbyTournamentItem {
    duration: string;
}

/** Page for players lobby */
export class LobbyPage extends PageBase {
    public online: KnockoutObservable<string>;
    public registered: KnockoutObservable<string>;
    public captionLabel: KnockoutComputed<string>;
    public slider: Slider;
    public cashOptions: CashOptions;
    public tournamentOptions: TournamentOptions;
    public sngOptions: TournamentOptions;
    public showFilterSlider: KnockoutObservable<boolean>;
    public showItemsListSlider: KnockoutObservable<boolean>;
    public filterLocked: KnockoutObservable<boolean>;

    public tournamentsCaption: KnockoutComputed<string>;
    public selectionCaption: KnockoutComputed<string>;
    public tournaments: KnockoutObservableArray<LobbyTournamentItemEx>;
    public sngs: KnockoutObservableArray<LobbyTournamentItemEx>;
    public tables: KnockoutObservableArray<any>;
    public loading: KnockoutObservable<boolean>;
    public currentTime: KnockoutComputed<string>;

    public authenticated: KnockoutObservable<boolean>;
    public login: KnockoutComputed<string>;
    public amount: KnockoutObservable<number>;

    constructor() {
        super();
        const self = this;

        this.currentTime = ko.computed(function () {
            return timeService.currentTime();
        }, this);
        this.online = metadataManager.online;
        this.registered = metadataManager.registered;
        this.captionLabel = ko.computed(() => {
            return _("header.onlinePlayersShort")
                .replace("#registered", this.registered())
                .replace("#online", this.online());
        });
        this.tournamentsCaption = ko.computed(function () {
            return _("tournamentsList.headerCaption")
                .replace("#count", "0".toString());
        }, this);
        this.cashOptions = new CashOptions();
        this.tournamentOptions = new TournamentOptions();
        this.sngOptions = new TournamentOptions();
        this.tournaments = ko.observableArray<LobbyTournamentItemEx>([]);
        this.sngs = ko.observableArray<LobbyTournamentItemEx>([]);
        this.tables = ko.observableArray([]);
        this.showFilterSlider = ko.observable(false);
        this.showItemsListSlider = ko.observable(true);
        this.filterLocked = ko.observable(false);
        this.slider = new Slider();
        this.slider.addOption(_("lobby.cashGames"), "cash", null);
        this.slider.addOption(_("lobby.tournaments"), "tournaments", null);
        this.slider.addOption(_("lobby.sitAndGo"), "sng", null);
        if (!appConfig.tournament.enabled) {
            this.slider.enabled(false);
        }

        this.loading = ko.observable(false);
        this.selectionCaption = ko.computed(function () {
            if (self.slider.currentIndex() === 0) {
                return _("tablesList.headerCaption")
                    .replace("#count", self.tables().length.toString());
            }

            if (self.slider.currentIndex() === 1) {
                return _("tournamentsList.headerCaption")
                    .replace("#count", self.tournaments().length.toString());
            }

            return _("tournamentsList.sngCaption")
                .replace("#count", self.sngs().length.toString());
        }, this);

        tableManager.tables.subscribe(function () {
            self.updateOpenedTables();
        });

        this.authenticated = ko.computed(function () {
            return authManager.authenticated();
        }, this);
        this.login = ko.computed(function () {
            return authManager.login();
        }, this);
        authManager.registerAuthenticationChangedHandler(function (newValue) {
            if (authManager.login() === null) {
                self.amount(0);
            } else {
                self.updateAccount();
            }
        });
        this.amount = ko.observable(0);
    }

    public deactivate(pageName?: string) {
        super.deactivate(pageName);

        // Clear tables and tournaments since this is
        // show page faster and it could quicker respond
        // to the user input.
        this.tables([]);
        this.tournaments([]);
        this.sngs([]);
    }
    public activate(pageName?: string) {
        if (this.visible()) {
            return;
        }

        const self = this;
        this.showFilterSlider(PageBlock.useDoubleView);
        this.showItemsListSlider(!PageBlock.useDoubleView);
        if (pageName === "lobby") {
            this.update(false);
            if (!PageBlock.useDoubleView) {
                if (ko.contextFor($(".sub-page.filter .swipe")[0]).$swiper) {
                    ko.contextFor($(".sub-page.filter .swipe")[0]).$swiper.enable(false);
                }
            }

            reloadManager.setReloadCallback(() => self.update(true));
        }

        this.updateAccount();
        super.activate(pageName);
    }
    public updateOpenedTables() {
        const tables = this.tables();
        tables.forEach(function (item) {
            item.IsOpened = tableManager.isOpened(item.TableId);
        });
        this.tables([]);
        this.tables(tables);
    }
    public async update(force: boolean) {
        if (this.loading() && !force) {
            return;
        }

        const self = this;
        metadataManager.updateOnline();

        // Added reloading of the all information.
        const resetLoading = function () {
            self.loading(false);
        };
        this.loading(true);
        try {
            await Promise.all([this.refreshTables(), this.refreshTournaments(2), this.refreshTournaments(3)]);
        } finally {
            resetLoading();
        }
    }
    public showGames() {
        if (this.slider.currentIndex() === 0) {
            app.lobbyPageBlock.showSecondary("tablesList");
        } else {
            if (this.slider.currentIndex() === 1) {
                app.lobbyPageBlock.tournamentsListPage.setOptions(2, this.tournamentOptions);

                app.lobbyPageBlock.showSecondary("tournamentsList");
            } else {
                app.lobbyPageBlock.sngListPage.setOptions(3, this.sngOptions);

                app.lobbyPageBlock.showSecondary("sngList");
            }
        }
    }
    public async refreshTables() {
        const gameApi = new Game(host);
        const privateTables = 0;
        const fullTables: boolean | null = null;

        const options = this.cashOptions;
        const maxPlayers = options.maxPlayers() === 0 ? 0 : 1 << options.maxPlayers();
        const betLevels = options.bets();
        const moneyType = options.currency();
        const limitType = options.limits();
        const data = await gameApi.getTables(fullTables, privateTables, maxPlayers, betLevels, moneyType, limitType, appConfig.game.showTournamentTables);
        if (!this.visible()) {
            return;
        }

        if (data.Status === "Ok") {
            this.log("Informaton about tables received: ", data.Data);
            const tables = data.Data as any[];
            tables.forEach(function (item) {
                item.IsOpened = tableManager.isOpened(item.TableId);
            });
            this.tables(tables);
            if (appConfig.auth.automaticTableSelection && tables.length === 1) {
                this.selectTable(tables[0]);
            }

            if (appConfig.game.seatMode || appConfig.game.tablePreviewMode) {
                const tableIdString = localStorage.getItem("tableId");
                if (tableIdString !== null) {
                    const tableIdInt = parseInt(tableIdString, 10);
                    const tableData = await gameApi.getTableById(tableIdInt);
                    if (tableData.Data) {
                        this.selectTable(tableData.Data);
                    }
                }
            }
        }
    }

    public async refreshTournaments(tournamentType: number) {
        const self = this;
        const tournamentApi = new Tournament(host);

        const options = tournamentType === 2 ? this.tournamentOptions : this.sngOptions;
        const prizeCurrency = options.currency();
        const tournamentTypeMask = 1 << tournamentType;
        const speed = options.speed() === 0 ? 0 : 1 << options.speed();
        const buyin = options.buyin();
        const maxPlayers = options.maxPlayers() === 0 ? 0 : 1 << (options.maxPlayers() - 1);
        const data = await tournamentApi.getTournaments(prizeCurrency, tournamentTypeMask, speed, buyin, maxPlayers);
        if (!self.visible()) {
            return;
        }

        if (data.Status === "Ok") {
            self.log("Informaton about tournaments received: ", data.Data);
            const enchance = (item: LobbyTournamentItem) => {
                const result = item as LobbyTournamentItemEx;
                const startDate = moment(item.StartDate);
                const currentMoment = moment().add(timeService.timeDiff, "ms");
                const duration = moment.duration(currentMoment.diff(startDate));
                const m = duration.minutes();
                result.duration = duration.hours() + _("common.hours")
                    + _("common.timeseparator")
                    + (m < 10 ? "0" + m : "" + m) + _("common.minutes");
                return result;
            };
            if (tournamentType === 2) {
                self.tournaments(data.Data.map(enchance));
            } else {
                self.sngs(data.Data.map(enchance));
            }
        }
    }
    public async selectTable(table: GameTableModel) {
        app.processing(true);
        const notAuthenticatedResult = {
            authenticated: false,
            wasAuthenticated: false,
        };
        const authResult = appConfig.lobby.openTableRequireAuthentication
            ? appConfig.auth.allowGuest ? await app.requireGuestAuthentication() : await app.requireAuthentication()
            : notAuthenticatedResult;
        if (authResult.authenticated) {
            app.executeCommand("app.selectTable", [table, authResult.wasAuthenticated]);

            if (appConfig.game.seatMode || appConfig.game.tablePreviewMode) {
                const tableId = table.TableId.toString();
                console.log("Save table id " + tableId + " for future auto select of this table.");
                localStorage.setItem("tableId", tableId);
            }

            if (appConfig.game.seatMode) {
                app.executeCommand("page.seats");
            } else {
                app.executeCommand("page.tables");
            }

            app.processing(false);
        } else {
            app.processing(false);
        }
    }
    public selectTournament(tournament: TournamentDefinition) {
        app.lobbyPageBlock.selectTournament(tournament);
    }
    public showFilterOptions() {
        if (this.slider.currentIndex() === 0) {
            app.lobbyPageBlock.showSecondary("filter");
        }

        if (this.slider.currentIndex() === 1) {
            app.lobbyPageBlock.showSecondary("filter");
        }

        if (this.slider.currentIndex() === 2) {
            app.lobbyPageBlock.showSecondary("filter");
        }
    }
    public showLobby() {
        if (this.slider.currentIndex() === 0) {
            app.lobbyPageBlock.showSecondary("lobby");
        }

        if (this.slider.currentIndex() === 1) {
            app.lobbyPageBlock.showSecondary("lobby");
        }

        if (this.slider.currentIndex() === 2) {
            app.lobbyPageBlock.showSecondary("lobby");
        }
    }
    public selectFilterParameter<T>(parameter: KnockoutObservable<T>, value: T) {
        parameter(value);
        if (PageBlock.useDoubleView) {
            app.lobbyPageBlock.showSecondary("lobby");
        }
    }
    public async refresh() {
        metadataManager.updateOnline();
        if (this.slider.currentIndex() === 0) {
            this.loading(true);
            try {
                await this.refreshTables();
            } finally {
                this.loading(false);
            }
        }

        if (this.slider.currentIndex() === 1) {
            this.loading(true);
            try {
                await this.refreshTournaments(2);
            } finally {
                this.loading(false);
            }
        }

        if (this.slider.currentIndex() === 2) {
            this.loading(true);
            try {
                await this.refreshTournaments(3);
            } finally {
                this.loading(false);
            }
        }
    }
    public touchLock(e: Event) {
        if (this.filterLocked()) {
            e.preventDefault();
        }
    }
    public async updateAccount() {
        if (!authManager.authenticated()) {
            return;
        }

        const self = this;
        try {
            await this.updateAccountData();
        } catch (e) {
            self.updateAccount();
        }
    }
    public showAccount() {
        app.executeCommand("pageblock.cashier");
    }
    /**
     * Starts request for the account data.
     */
    private async updateAccountData() {
        const self = this;
        const manager = new AccountManager();
        const data = await manager.getAccount();
        if (data.Status === "Ok") {
            const personalAccountData = data.Data;
            const total = settings.isGuest() ? personalAccountData.GameMoney : personalAccountData.RealMoney;
            self.amount(total);
        } else {
            console.error("Error during making call to Account.GetPlayerDefinition in lobby page");
        }

        return data;
    }
    private log(message: string, ...params: any[]) {
        if (debugSettings.lobby.trace) {
            console.log(message, params);
        }
    }
}
