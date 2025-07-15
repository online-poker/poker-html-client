import { Game } from "@poker/api-server";
import * as ko from "knockout";
import { settings } from "poker/settings";
import { App } from "../app";
import { appConfig } from "../appconfig";
import { debugSettings } from "../debugsettings";
import { _ } from "../languagemanager";
import { reloadManager } from "../services";
import { tableManager } from "../table/tablemanager";
import { PageBase } from "../ui/pagebase";

declare const host: string;
declare const app: App;

export class TablesListPage extends PageBase {
    public tablesCaption: ko.Computed<string>;
    public tables: ko.ObservableArray<any>;
    public loading: ko.Observable<boolean>;
    public showScreenOverlay: ko.Computed<boolean>;

    constructor() {
        super();
        this.showScreenOverlay = ko.computed(() => {
            if (!appConfig.ui.enableScreenOverlay) {
                return false;
            }

            if (document.body.classList.contains("poker-feature-single-seat")) {
                return settings.selectedTableId() !== 0;
            }

            return false;
        });
        this.tables = ko.observableArray([]);
        this.tablesCaption = ko.computed(() => {
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
        const gameApi = new Game(host);
        const privateTables = 0;
        const fullTables: boolean | null = null;

        const lobbyPage = app.lobbyPageBlock.lobbyPage;
        /* tslint:disable:no-bitwise */
        const maxPlayers = lobbyPage.cashOptions.maxPlayers() === 0 ? 0 : 1 << lobbyPage.cashOptions.maxPlayers();
        const betLevels = lobbyPage.cashOptions.bets() === 0 ? 0 : 1 << (lobbyPage.cashOptions.bets() - 1);
        /* tslint:enable:no-bitwise */
        const moneyType = lobbyPage.cashOptions.currency();
        const limitType = lobbyPage.cashOptions.limits();
        const data = await gameApi.getTables(fullTables, privateTables, maxPlayers, betLevels, moneyType, limitType, appConfig.game.showTournamentTables);
        this.loading(false);
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
