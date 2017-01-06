/* tslint:disable:no-bitwise */

declare var apiHost: string;

import * as ko from "knockout";
import * as moment from "moment";
import { App } from "../app";
import * as metadataManager from "../metadatamanager";
import * as timeService from "../timeservice";
import * as tableManager from "../table/tablemanager";
import { PageBase } from "../ui/pagebase";
import { appConfig } from "../appconfig";
import { debugSettings } from "../debugsettings";
import { reloadManager } from "../services";
import { _ } from "../languagemanager";

declare var app: App;

export class CashOptions {
    currency: KnockoutObservable<number>;
    limits: KnockoutObservable<number>;
    bets: KnockoutObservable<number>;
    maxPlayers: KnockoutObservable<number>;

    constructor() {
        // require("extenders");
        this.currency = ko.observable(2).extend({
            options: {
                caption: "currency.caption",
                items: [
                    { text: "currency.realmoney", value: 1 },
                    { text: "currency.gamemoney", value: 2 },
                ]
            }
        });
        this.limits = ko.observable(0).extend({
            options: {
                caption: "limits.caption",
                items: [
                    { text: "common.any", value: 0 },
                    { text: "limits.limit1", value: 1 },
                    { text: "limits.limit2", value: 2 },
                    { text: "limits.limit3", value: 3 },
                ]
            }
        });
        this.bets = ko.observable(0).extend({
            options: {
                caption: "bets.caption",
                items: [
                    { text: "common.any", value: 0 },
                    { text: "bets.level1", value: 1 << 0 | 1 << 1 | 1 << 2 },
                    { text: "bets.level2", value: 1 << 3 | 1 << 4 | 1 << 5 | 1 << 6 },
                    { text: "bets.level3", value: 1 << 7 | 1 << 8 | 1 << 9 },
                ]
            }
        });
        this.maxPlayers = ko.observable(0).extend({
            options: {
                caption: "players.caption",
                items: [
                    { text: "common.any", value: 0 },
                    { text: "players.players2", value: 2 },
                    { text: "players.players6", value: 6 },
                    { text: "players.players10", value: 10 },
                ]
            }
        });
    }
}

export class TournamentOptions {
    currency: KnockoutObservable<number>;
    buyin: KnockoutObservable<number>;
    speed: KnockoutObservable<number>;
    maxPlayers: KnockoutObservable<number>;

    constructor() {
        // require("extenders");
        this.currency = ko.observable(2).extend({
            options: {
                caption: "currency.caption",
                items: [
                    { text: "currency.realmoney", value: 1 },
                    { text: "currency.gamemoney", value: 2 },
                ]
            }
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
                ]
            }
        });
        this.speed = ko.observable(0).extend({
            options: {
                caption: "speed.caption",
                items: [
                    { text: "common.any", value: 0 },
                    { text: "speed.normal", value: 1 },
                    { text: "speed.turbo", value: 2 },
                    { text: "speed.turbo2x", value: 3 },
                ]
            }
        });
        this.maxPlayers = ko.observable(0).extend({
            options: {
                caption: "players.caption",
                items: [
                    { text: "common.any", value: 0 },
                    { text: "players.players2", value: 1 },
                    { text: "players.players6", value: 2 },
                    { text: "players.players10", value: 3 },
                ]
    }
        });
}
}

interface LobbyTournamentItemEx extends LobbyTournamentItem {
    duration: string;
}

export class LobbyPage extends PageBase {
    online: KnockoutObservable<string>;
    registered: KnockoutObservable<string>;
    captionLabel: KnockoutComputed<string>;
    slider: Slider;
    cashOptions: CashOptions;
    tournamentOptions: TournamentOptions;
    sngOptions: TournamentOptions;
    showFilterSlider: KnockoutObservable<boolean>;
    showItemsListSlider: KnockoutObservable<boolean>;
    filterLocked: KnockoutObservable<boolean>;

    tournamentsCaption: KnockoutComputed<string>;
    selectionCaption: KnockoutComputed<string>;
    tournaments: KnockoutObservableArray<LobbyTournamentItemEx>;
    sngs: KnockoutObservableArray<LobbyTournamentItemEx>;
    tables: KnockoutObservableArray<any>;
    loading: KnockoutObservable<boolean>;
    currentTime: KnockoutComputed<string>;

    constructor() {
        super();
        const self = this;

        App.addTabBarItemMapping("lobby", "tablesFilter");
        App.addTabBarItemMapping("lobby", "tournamentsFilter");
        App.addTabBarItemMapping("lobby", "sngFilter");
        this.currentTime = ko.computed(function () {
            return timeService.currentTime();
        }, this);
        this.online = metadataManager.online;
        this.registered = metadataManager.registered;
        this.captionLabel = ko.computed(function () {
            return _("header.onlinePlayersShort")
                .replace("#registered", this.registered())
                .replace("#online", this.online());
        }, this);
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
    }

    deactivate(pageName?: string) {
        super.deactivate(pageName);

        // Clear tables and tournaments since this is 
        // show page faster and it could quicker respond
        // to the user input.
        this.tables([]);
        this.tournaments([]);
        this.sngs([]);
    }
    activate(pageName?: string) {
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
        super.activate(pageName);
    }
    updateOpenedTables() {
        const tables = this.tables();
        tables.forEach(function (item) {
            item.IsOpened = tableManager.isOpened(item.TableId);
        });
        this.tables([]);
        this.tables(tables);
    }
    update(force: boolean) {
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
        $.when<any>(this.refreshTables(), this.refreshTournaments(2), this.refreshTournaments(3)).pipe(resetLoading, resetLoading);
    }
    showGames() {
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
    refreshTables() {
        const self = this;
        const gameApi = new OnlinePoker.Commanding.API.Game(apiHost);
        const privateTables = 0;
        const fullTables = null;

        const options = this.cashOptions;
        const maxPlayers = options.maxPlayers() === 0 ? 0 : 1 << options.maxPlayers();
        const betLevels = options.bets();
        const moneyType = options.currency();
        const limitType = options.limits();
        return gameApi.GetTables(fullTables, privateTables, maxPlayers, betLevels, moneyType, limitType, (data) => {
            if (!self.visible()) {
                return;
            }

            if (data.Status === "Ok") {
                self.log("Informaton about tables received: ", data.Data);
                const tables = <any[]>data.Data;
                tables.forEach(function (item) {
                    item.IsOpened = tableManager.isOpened(item.TableId);
                });
                self.tables(tables);
                if (appConfig.auth.automaticTableSelection && tables.length == 1) {
                    this.selectTable(tables[0]);
                }
            }
        });
    }
    refreshTournaments(tournamentType) {
        const self = this;
        const tournamentApi = new OnlinePoker.Commanding.API.Tournament(apiHost);

        const options = tournamentType === 2 ? this.tournamentOptions : this.sngOptions;
        const prizeCurrency = options.currency();
        const tournamentTypeMask = 1 << tournamentType;
        const speed = options.speed() === 0 ? 0 : 1 << options.speed();
        const buyin = options.buyin();
        const maxPlayers = options.maxPlayers() === 0 ? 0 : 1 << (options.maxPlayers() - 1);
        return tournamentApi.GetTournaments(prizeCurrency, tournamentTypeMask, speed, buyin, maxPlayers, function (data) {
            if (!self.visible()) {
                return;
            }

            if (data.Status === "Ok") {
                self.log("Informaton about tournaments received: ", data.Data);
                const enchance = (item: LobbyTournamentItem) => {
                    const result = <LobbyTournamentItemEx>item;
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
        });
    }
    selectTable(table) {
        app.processing(true);
        app.requireGuestAuthentication().done(function (newValue, wasAuthenticated) {
            if (newValue) {
                app.executeCommand("app.selectTable", [table, wasAuthenticated]);
                if (appConfig.game.seatMode) {
                    app.executeCommand("page.seats");
                } else {
                    app.executeCommand("page.tables");
                }

                app.processing(false);
            } else {
                app.processing(false);
            }
        });
    }
    selectTournament(tournament) {
        app.lobbyPageBlock.selectTournament(tournament);
    }
    showFilterOptions() {
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
    showLobby() {
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
    selectFilterParameter(parameter, value) {
        parameter(value);
        if (PageBlock.useDoubleView) {
            app.lobbyPageBlock.showSecondary("lobby");
        }
    }
    refresh() {
        const self = this;
        const resetLoading = function () {
            self.loading(false);
        };
        metadataManager.updateOnline();
        if (this.slider.currentIndex() === 0) {
            this.loading(true);
            this.refreshTables().pipe(resetLoading, resetLoading);
        }

        if (this.slider.currentIndex() === 1) {
            this.loading(true);
            this.refreshTournaments(2).pipe(resetLoading, resetLoading);
        }

        if (this.slider.currentIndex() === 2) {
            this.loading(true);
            this.refreshTournaments(3).pipe(resetLoading, resetLoading);
        }
    }
    touchLock(e: Event) {
        if (this.filterLocked()) {
            e.preventDefault();
        }
    }
    private log(message: string, ...params: any[]) {
        if (debugSettings.lobby.trace) {
            console.log(message, params);
        }
    }
}
