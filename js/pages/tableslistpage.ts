/// <reference path="../poker.commanding.api.ts" />

import { Game } from "../api/game";
import { App } from "../app";
import { appConfig } from "../appconfig";
import { debugSettings } from "../debugsettings";
import { _ } from "../languagemanager";
import { reloadManager } from "../services";
import { tableManager } from "../table/tablemanager";
import { PageBase } from "../ui/pagebase";

declare var apiHost: string;
declare var host: string;
declare var app: App;

export class TablesListPage extends PageBase {
    public tablesCaption: KnockoutComputed<string>;
    public tables: KnockoutObservableArray<any>;
    public loading: KnockoutObservable<boolean>;

    constructor() {
        super();
        this.tables = ko.observableArray([]);
        this.tablesCaption = ko.computed(function () {
            return _("tablesList.headerCaption")
                .replace("#count", this.tables().length.toString());
        }, this);
        this.loading = ko.observable(false);

        tableManager.tables.subscribe(() => {
            this.updateOpenedTables();
        });
    }
    public deactivate() {
        super.deactivate();
    }
    public activate() {
        super.activate();
        this.refreshTables(false);

        reloadManager.setReloadCallback(() => this.refreshTables(true));
    }
    public async refreshTables(force: boolean) {
        if (this.loading() && !force) {
            return;
        }

        this.loading(true);
        const self = this;
        const gameApi = new Game(host);
        const privateTables = 0;
        const fullTables = null;

        const lobbyPage = app.lobbyPageBlock.lobbyPage;
        /* tslint:disable:no-bitwise */
        const maxPlayers = lobbyPage.cashOptions.maxPlayers() === 0 ? 0 : 1 << lobbyPage.cashOptions.maxPlayers();
        const betLevels = lobbyPage.cashOptions.bets() === 0 ? 0 : 1 << (lobbyPage.cashOptions.bets() - 1);
        /* tslint:enable:no-bitwise */
        const moneyType = lobbyPage.cashOptions.currency();
        const limitType = lobbyPage.cashOptions.limits();
        const data = await gameApi.getTables(appConfig.game.showTournamentTables);
        self.loading(false);
        if (!self.visible()) {
            return;
        }

        if (data.Status === "Ok") {
            self.log("Informaton about tables received: ", data.Data);
            const tables = data.Data as any[];
            tables.forEach(function (item) {
                item.IsOpened = tableManager.isOpened(item.TableId);
            });
            self.tables(tables);
        }
    }
    public updateOpenedTables() {
        const tables = this.tables();
        tables.forEach(function (item) {
            item.IsOpened = tableManager.isOpened(item.TableId);
        });
        this.tables([]);
        this.tables(tables);
    }
    public back() {
        app.lobbyPageBlock.showLobby();
    }
    public selectTable(table: GameTableModel) {
        app.executeCommand("app.selectTable", [table]);
        if (appConfig.game.seatMode) {
            app.executeCommand("page.seats");
        } else {
            app.executeCommand("page.tables");
        }
    }
    private log(message: string, ...params: any[]) {
        if (debugSettings.lobby.trace) {
            console.log(message, params);
        }
    }
}
