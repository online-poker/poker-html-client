/// <reference types="knockout" />
/// <reference path="../app.ts" />
/// <reference path="../ui/pagebase.ts" />
/// <reference path="../messages.ts" />
/// <reference path="../languagemanager.ts" />
/// <reference path="../metadatamanager.ts" />
/// <reference path="../poker.commanding.api.ts" />
/// <reference path="../authmanager.ts" />

declare var apiHost: string;

import * as ko from "knockout";
import { App } from "../app";
import * as metadataManager from "../metadatamanager";
import * as tableManager from "../table/tablemanager";
import { connectionService } from "../services";
import { TableView } from "../table/tableview";
import * as timeService from "../timeservice";
import { uiManager } from "../services/uimanager";
import { PageBase } from "../ui/pagebase";

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
        var self = this;
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
            var tables = tableManager.tables();
            if (tables.length === 0) {
                return new TableView(0, null);
            }

			var index = this.currentIndex();
			if (!tables.hasOwnProperty(index)) {
				return new TableView(0, null);
            }

            return tables[index];
        }, this);
        this.selectedTables = ko.computed(function () {
            var tables = tableManager.tables();
            return tables;
        }, this);
        this.loading = ko.computed(function () {
            var ct = self.currentTable();
            if (ct == null) {
                return false;
            }

            return ct.connecting();
        }, this);
        this.frozen = ko.computed(function () {
            var ct = self.currentTable();
            if (ct === null) {
                return false;
            }

            return ct.frozen();
        }, this);
        this.opened = ko.computed(function () {
            var ct = self.currentTable();
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

        var viewportLandscapeWidth = 640;
        var currentWidth = $("body").width();
        if (currentWidth >= 1024 || (currentWidth == 768 && $("body").height() == 0)) {
            viewportLandscapeWidth = 1024;
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
        this.lastConnecton = Connection.type;
    }
    setConnecting() {
        if (this.lastConnecton !== Connection.type) {
            this.lastConnecton = Connection.type;
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
        var oldColor = $(".progress-background").css("background-color");
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
        var currentTable = this.currentTable();
        if (currentTable != null) {
            timeService.setTimeout(() => {
                currentTable.actionBlock.updateBounds();
            }, 300);
        }

		/* tslint:disable:no-string-literal no-unused-expression */
        window["StatusBar"] && StatusBar.hide();
		/* tslint:enable:no-string-literal no-unused-expression */
        soundManager.enabled(settings.soundEnabled());
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
        var tableView = this.currentTable();
        if (tableView.myPlayer() != null) {
            app.lobbyPageBlock.showLobby();
            this.deactivate();
        } else {
            this.leave();
        }
    }
    leave() {
        var self = this;
        // Unsubscribe from table notifications.
        var tableView = this.currentTable();
        var removeCurrentTable = function () {
            // Navigate back to the lobby.
            if (tableManager.tables().length === 0) {
                app.lobbyPageBlock.showLobby();
                self.deactivate();
            }
        };
        var leaved = <JQueryDeferred<() => void>>commandManager.executeCommand("app.leaveTable", [tableView.tableId]);
        leaved.done(removeCurrentTable);
    }
    showMenu() {
        app.executeCommand("popup.tableMenu");
    }
    /**
    * Removes tournament tables which are finished.
    */
    private removeFinishedTournamentTable() {
        var finishedTournamentTables = tableManager.tables().filter((_) => {
            var tournament = _.tournament();
            if (tournament == null) {
                return false;
            }

            return tournament.finishedPlaying();
        });
        finishedTournamentTables.forEach(_ => tableManager.remove(_));
    }
    private onConnectionSlow() {
        var self = this;
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
