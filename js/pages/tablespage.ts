import * as $ from "jquery";
import * as ko from "knockout";
import { ICommandExecutor } from "poker/commandmanager";
import { App } from "../app";
import { appConfig } from "../appconfig";
import { debugSettings } from "../debugsettings";
import { PageBlock } from "../pageblock";
import {
    connectionService,
    deviceEvents,
    getSoundManager,
    ICurrentTableProvider,
    orientationService,
    reloadManager,
} from "../services";
import { uiManager } from "../services/uimanager";
import { settings } from "../settings";
import { tableManager } from "../table/tablemanager";
import { TableView } from "../table/tableview";
import * as timeService from "../timeservice";
import { PageBase } from "../ui/pagebase";

declare var app: App;

export class TablesPage extends PageBase implements ICurrentTableProvider {
    public currentTable: KnockoutComputed<TableView>;
    public selectedTables: KnockoutComputed<TableView[]>;
    public currentIndex: KnockoutComputed<number>;
    public currentIndex1: KnockoutComputed<number>;
    public slideWidth: KnockoutObservable<number>;
    public loading: KnockoutComputed<boolean>;
    public activeHandler: SignalBinding;
    public resignHandler: SignalBinding;
    public slowConnectionHandler: SignalBinding;
    public reconnectedHandler: SignalBinding;
    public disconnectedHandler: SignalBinding;
    public isConnectionSlow: KnockoutObservable<boolean>;
    public lastConnecton: string;
    public frozen: KnockoutComputed<boolean>;
    public opened: KnockoutComputed<boolean>;
    public changeBetParametersNextGame: KnockoutComputed<boolean>;
    public changeGameTypeNextGame: KnockoutComputed<boolean>;
    public nextGameInformation: KnockoutComputed<string>;
    public nextGameTypeInformation: KnockoutComputed<string>;
    public splashShown = ko.observable(false);
    public tablesShown = ko.observable(true);

    constructor(private commandExecutor: ICommandExecutor) {
        super();
        const self = this;
        this.slideWidth = ko.observable(0);
        this.isConnectionSlow = ko.observable(false);
        this.calculateLandscapeWidth();
        this.currentIndex = ko.computed<number>({
            read() {
                return tableManager.currentIndex();
            },
            write(value) {
                tableManager.currentIndex(value);
                self.log("Switched to table with index " + value);
            },
        });
        this.currentIndex1 = ko.computed<number>({
            read() {
                return self.currentIndex() + 1;
            },
            write(value) {
                self.currentIndex(value - 1);
            },
            owner: this,
        });
        this.currentTable = ko.computed(() => {
            const tables = tableManager.tables();
            if (tables.length === 0) {
                return tableManager.getNonExistingTable();
            }

            const index = this.currentIndex();
            if (!tables.hasOwnProperty(index.toString())) {
                return tableManager.getNonExistingTable();
            }

            return tables[index];
        }, this);
        this.selectedTables = ko.computed(() => {
            const tables = tableManager.tables();
            return tables;
        }, this);
        this.loading = ko.computed(() => {
            const ct = this.currentTable();
            if (ct == null) {
                return false;
            }

            return ct.connecting();
        }, this);
        this.frozen = ko.computed(() => {
            const ct = this.currentTable();
            if (ct === null) {
                return false;
            }

            return ct.frozen();
        }, this);
        this.opened = ko.computed(() => {
            const ct = this.currentTable();
            if (ct === null) {
                return false;
            }

            return ct.opened();
        }, this);
        this.nextGameInformation = ko.computed(() => {
            const ct = this.currentTable();
            if (ct === null) {
                return null;
            }

            return ct.nextGameInformation();
        }, this);
        this.nextGameTypeInformation = ko.computed(() => {
            const ct = this.currentTable();
            if (ct === null) {
                return null;
            }

            return ct.nextGameTypeInformation();
        }, this);
        this.changeBetParametersNextGame = ko.computed(() => {
            const ct = this.currentTable();
            if (ct === null) {
                return null;
            }

            return ct.changeBetParametersNextGame();
        }, this);
        this.changeGameTypeNextGame = ko.computed(() => {
            const ct = this.currentTable();
            if (ct === null) {
                return null;
            }

            return ct.changeGameTypeNextGame();
        }, this);
        this.currentTable.subscribe((value: TableView) => {
            tableManager.tables().forEach((table: TableView) => {
                if (table !== value) {
                    table.soundEnabled = false;
                    table.animationSuppressed(true);
                }
            });
            if (value != null) {
                value.soundEnabled = true;
                value.animationSuppressed(false);
            }
        });
    }
    public calculateLandscapeWidth() {
        // When running not within browser, skip calculations.
        if (typeof window === "undefined") {
            return;
        }

        let viewportLandscapeWidth = 640;
        const currentWidth = $("body").width();
        if (currentWidth >= 667 || currentWidth === 375) {
            viewportLandscapeWidth = 667;
        }

        if (currentWidth >= 736 || currentWidth === 414) {
            viewportLandscapeWidth = 736;
        }

        if (currentWidth >= 1024 || (currentWidth === 768 && $("body").height() === 0)) {
            viewportLandscapeWidth = 1024;
            if (currentWidth >= 1280) {
                viewportLandscapeWidth = 1280;
            }

            if (currentWidth >= 1680) {
                viewportLandscapeWidth = 1680;
            }

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
    public recordConnection() {
        this.lastConnecton = navigator.connection.type;
    }
    public setConnecting() {
        if (this.lastConnecton !== navigator.connection.type) {
            this.lastConnecton = navigator.connection.type;
            tableManager.tables().forEach((table: TableView) => table.connecting(true));
        }
    }
    public deactivate() {
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
        const soundManager = getSoundManager();
        soundManager.tableSoundsEnabled(false);
        if (!PageBlock.useDoubleView) {
            orientationService.setOrientation("portrait");
        }
    }
    public activate() {
        super.activate();
        this.activeHandler = deviceEvents.active.add(this.setConnecting, this);
        this.resignHandler = deviceEvents.resignActive.add(this.recordConnection, this);
        this.slowConnectionHandler = connectionService.connectionSlow.add(this.onConnectionSlow, this);
        this.reconnectedHandler = connectionService.reconnected.add(this.onResetConnectionSlow, this);
        this.disconnectedHandler = connectionService.disconnected.add(this.onResetConnectionSlow, this);
        uiManager.showPage("table");
        app.tabBar.visible(false);
        orientationService.setOrientation("landscape");
        timeService.setTimeout(() => {
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
        const soundManager = getSoundManager();
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
    public canActivate(): boolean {
        return tableManager.tables().length !== 0;
    }
    public switchTable(index: KnockoutObservable<number>) {
        this.currentIndex(index());
    }
    public prevTable() {
        tableManager.prevTable();
    }
    public nextTable() {
        tableManager.nextTable();
    }
    public addTable() {
        app.lobbyPageBlock.showLobby();
        this.deactivate();
    }
    public toLobby() {
        const tableView = this.currentTable();
        if (tableView.myPlayer() != null) {
            app.lobbyPageBlock.showLobby();
            this.deactivate();
        } else {
            this.leave();
        }
    }
    public leave() {
        const self = this;
        // Unsubscribe from table notifications.
        const tableView = this.currentTable();
        const removeCurrentTable = () => {
            // Navigate back to the lobby.
            if (tableManager.tables().length === 0) {
                app.lobbyPageBlock.showLobby();
                self.deactivate();
            }
        };
        const leaved = this.commandExecutor.executeCommand("app.leaveTable", [tableView.tableId]) as JQueryDeferred<() => void>;
        leaved.then(removeCurrentTable);
    }
    public showMenu() {
        app.executeCommand("popup.tableMenu");
    }

    /**
     * Open chat popup on the current table.
     */
    public showChat() {
        const currentTable = this.currentTable();
        if (currentTable) {
            currentTable.actionBlock.showChatPopup();
        }
    }
    /**
     * Removes tournament tables which are finished.
     */
    public removeFinishedTournamentTable() {
        const finishedTournamentTables = tableManager.tables().filter((table: TableView) => {
            const tournament = table.tournament();
            if (tournament == null) {
                return false;
            }

            return tournament.finishedPlaying();
        });
        finishedTournamentTables.forEach((tournamentTable: TableView) => tableManager.remove(tournamentTable));
    }
    private onConnectionSlow() {
        const self = this;
        this.isConnectionSlow(true);

        // Clear message after some time passed by.
        timeService.setTimeout(() => {
            self.isConnectionSlow(false);
        }, 3000);
    }
    private onResetConnectionSlow() {
        this.isConnectionSlow(false);
    }
    private log(message: string, ...params: any[]) {
        if (debugSettings.tableView.trace) {
            // tslint:disable-next-line:no-console
            console.log(message, params);
        }
    }
}
