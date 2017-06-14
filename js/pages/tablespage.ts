declare var apiHost: string;

import * as ko from "knockout";
import { App } from "../app";
import { appConfig } from "../appconfig";
import * as metadataManager from "../metadatamanager";
import { tableManager } from "../table/tablemanager";
import {
    connectionService,
    reloadManager,
    deviceEvents,
    soundManager,
    orientationService
} from "../services";
import { TableView } from "../table/tableview";
import * as timeService from "../timeservice";
import { uiManager } from "../services/uimanager";
import { PageBase } from "../ui/pagebase";
import { debugSettings } from "../debugsettings";
import { settings } from "../settings";
import * as commandManager from "../commandmanager";

declare var app: App;

export class TablesPage extends PageBase {
    currentTable: KnockoutComputed<TableView>;
    selectedTables: KnockoutComputed<TableView[]>;
    currentIndex: KnockoutComputed<number>;
    currentIndex1: KnockoutComputed<number>;
    slideWidth: KnockoutObservable<number>;
    loading: KnockoutComputed<boolean>;
    activeHandler: SignalBinding;
    resignHandler: SignalBinding;
    slowConnectionHandler: SignalBinding;
    reconnectedHandler: SignalBinding;
    disconnectedHandler: SignalBinding;
    isConnectionSlow: KnockoutObservable<boolean>;
    lastConnecton: string;
    frozen: KnockoutComputed<boolean>;
    opened: KnockoutComputed<boolean>;
    public splashShown = ko.observable(false);
    public tablesShown = ko.observable(true);
    constructor() {
        super();
        const self = this;
        this.slideWidth = ko.observable(0);
        this.isConnectionSlow = ko.observable(false);
        this.calculateLandscapeWidth();
        this.currentIndex = ko.computed<number>({
            read: function () {
                return tableManager.currentIndex();
            },
            write: function (value) {
                tableManager.currentIndex(value);
                self.log("Switched to table with index " + value);
            }
        });
        this.currentIndex1 = ko.computed<number>({
            read: function () {
                return self.currentIndex() + 1;
            },
            write: function (value) {
                self.currentIndex(value - 1);
            },
            owner: this
        });
        this.currentTable = ko.computed(function () {
            const tables = tableManager.tables();
            if (tables.length === 0) {
                return new TableView(0, null);
            }

            const index = this.currentIndex();
            if (!tables.hasOwnProperty(index)) {
                return new TableView(0, null);
            }

            return tables[index];
        }, this);
        this.selectedTables = ko.computed(function () {
            const tables = tableManager.tables();
            return tables;
        }, this);
        this.loading = ko.computed(function () {
            const ct = self.currentTable();
            if (ct == null) {
                return false;
            }

            return ct.connecting();
        }, this);
        this.frozen = ko.computed(function () {
            const ct = self.currentTable();
            if (ct === null) {
                return false;
            }

            return ct.frozen();
        }, this);
        this.opened = ko.computed(function () {
            const ct = self.currentTable();
            if (ct === null) {
                return false;
            }

            return ct.opened();
        }, this);
        this.currentTable.subscribe(function (value: TableView) {
            tableManager.tables().forEach(_ => {
                if (_ !== value) {
                    _.soundEnabled = false;
                    _.animationSuppressed(true);
                }
            });
            if (value != null) {
                value.soundEnabled = true;
                value.animationSuppressed(false);
            }
        });
    }
    calculateLandscapeWidth() {
        // When running not within browser, skip calculations.
        if (typeof window === "undefined") {
            return;
        }

        let viewportLandscapeWidth = 640;
        const currentWidth = $("body").width();
        if (currentWidth >= 1024 || (currentWidth === 768 && $("body").height() === 0)) {
            viewportLandscapeWidth = 1024;
            if (currentWidth >= 1920) {
                viewportLandscapeWidth = 1920;
            }

            if (currentWidth >= 3840) {
                viewportLandscapeWidth = 3840;
            }
        }

        if (currentWidth < 360) {
            if (window.innerHeight > 500) {
                viewportLandscapeWidth = 568;
            } else {
                viewportLandscapeWidth = 480;
            }
        }

        this.slideWidth(viewportLandscapeWidth);
    }
    recordConnection() {
        this.lastConnecton = navigator.connection.type;
    }
    setConnecting() {
        if (this.lastConnecton !== navigator.connection.type) {
            this.lastConnecton = navigator.connection.type;
            tableManager.tables().forEach((table) => table.connecting(true));
        }
    }
    deactivate() {
        super.deactivate();
        if (this.activeHandler != null) {
            this.activeHandler.detach();
        }

        if (this.resignHandler != null) {
            this.resignHandler.detach();
        }

        if (this.slowConnectionHandler != null) {
            this.slowConnectionHandler.detach();
        }

        if (this.reconnectedHandler != null) {
            this.reconnectedHandler.detach();
        }

        if (this.disconnectedHandler != null) {
            this.disconnectedHandler.detach();
        }

        uiManager.showPage("main");
        app.tabBar.visible(true);
        app.tabBar.select("tables", false);
        app.processing(true);
        const oldColor = $(".progress-background").css("background-color");
        $(".progress-background").css("background-color", "black");
        timeService.setTimeout(() => {
            app.processing(false);
            $(".progress-background").css("background-color", oldColor);
        }, 500);
        /* tslint:disable:no-string-literal no-unused-expression */
        window["StatusBar"] && StatusBar.show();
        /* tslint:enable:no-string-literal no-unused-expression */
        soundManager.tableSoundsEnabled(false);
        if (!PageBlock.useDoubleView) {
            orientationService.setOrientation("portrait");
        }
    }
    activate() {
        super.activate();
        this.activeHandler = deviceEvents.active.add(this.setConnecting, this);
        this.resignHandler = deviceEvents.resignActive.add(this.recordConnection, this);
        this.slowConnectionHandler = connectionService.connectionSlow.add(this.onConnectionSlow, this);
        this.reconnectedHandler = connectionService.reconnected.add(this.onResetConnectionSlow, this);
        this.disconnectedHandler = connectionService.disconnected.add(this.onResetConnectionSlow, this);
        uiManager.showPage("table");
        app.tabBar.visible(false);
        orientationService.setOrientation("landscape");
        timeService.setTimeout(function () {
            orientationService.lock();
        }, 200);
        const currentTable = this.currentTable();
        if (currentTable != null) {
            timeService.setTimeout(() => {
                currentTable.actionBlock.updateBounds();
            }, 300);
        }

        /* tslint:disable:no-string-literal no-unused-expression */
        window["StatusBar"] && StatusBar.hide();
        /* tslint:enable:no-string-literal no-unused-expression */
        if (appConfig.game.seatMode) {
            soundManager.enabled(false);
        } else {
            soundManager.enabled(settings.soundEnabled());
        }

        soundManager.tableSoundsEnabled(true);
        reloadManager.setReloadCallback(() => {
            if (debugSettings.application.reloadTablesDataOnResume) {
                tableManager.clearTables();
                tableManager.connectTables();
                tableManager.clearTournaments();
                tableManager.connectTournaments();
            }
        });
    }
    canActivate(): boolean {
        return tableManager.tables().length !== 0;
    }
    switchTable(index) {
        this.currentIndex(index());
    }
    prevTable() {
        tableManager.prevTable();
    }
    nextTable() {
        tableManager.nextTable();
    }
    addTable() {
        app.lobbyPageBlock.showLobby();
        this.deactivate();
    }
    toLobby() {
        const tableView = this.currentTable();
        if (tableView.myPlayer() != null) {
            app.lobbyPageBlock.showLobby();
            this.deactivate();
        } else {
            this.leave();
        }
    }
    leave() {
        const self = this;
        // Unsubscribe from table notifications.
        const tableView = this.currentTable();
        const removeCurrentTable = function () {
            // Navigate back to the lobby.
            if (tableManager.tables().length === 0) {
                app.lobbyPageBlock.showLobby();
                self.deactivate();
            }
        };
        const leaved = <JQueryDeferred<() => void>>commandManager.executeCommand("app.leaveTable", [tableView.tableId]);
        leaved.then(removeCurrentTable);
    }
    showMenu() {
        app.executeCommand("popup.tableMenu");
    }
    /**
    * Removes tournament tables which are finished.
    */
    private removeFinishedTournamentTable() {
        const finishedTournamentTables = tableManager.tables().filter((_) => {
            const tournament = _.tournament();
            if (tournament == null) {
                return false;
            }

            return tournament.finishedPlaying();
        });
        finishedTournamentTables.forEach(_ => tableManager.remove(_));
    }
    private onConnectionSlow() {
        const self = this;
        this.isConnectionSlow(true);

        // Clear message after some time passed by.
        timeService.setTimeout(function () {
            self.isConnectionSlow(false);
        }, 3000);
    }
    private onResetConnectionSlow() {
        this.isConnectionSlow(false);
    }
    private log(message: string, ...params: any[]) {
        if (debugSettings.tableView.trace) {
            console.log(message, params);
        }
    }
}
