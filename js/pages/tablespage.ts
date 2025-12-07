import { attachRelayToPage, detachRelayToPage } from "iframe-touch-relay";
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

declare const app: App;
let zones: any;

export class TablesPage extends PageBase implements ICurrentTableProvider {
    public currentTable: ko.Computed<TableView>;
    public selectedTables: ko.Computed<TableView[]>;
    public currentIndex: ko.Computed<number>;
    public currentIndex1: ko.Computed<number>;
    public slideWidth: ko.Observable<number>;
    public loading: ko.Computed<boolean>;
    public activeHandler: SignalBinding;
    public resignHandler: SignalBinding;
    public slowConnectionHandler: SignalBinding;
    public reconnectedHandler: SignalBinding;
    public disconnectedHandler: SignalBinding;
    public isConnectionSlow: ko.Observable<boolean>;
    public lastConnecton: string;
    public frozen: ko.Computed<boolean>;
    public opened: ko.Computed<boolean>;
    public changeBetParametersNextGame: ko.Computed<boolean>;
    public changeGameTypeNextGame: ko.Computed<boolean>;
    public nextGameInformation: ko.Computed<string>;
    public nextGameTypeInformation: ko.Computed<string>;
    public splashShown = ko.observable(false);
    public tablesShown = ko.observable(true);
    public orientationWillBeChanged = ko.observable(false);

    constructor(private commandExecutor: ICommandExecutor) {
        super();
        this.slideWidth = ko.observable(0);
        this.isConnectionSlow = ko.observable(false);
        this.currentIndex = ko.computed<number>({
            read() {
                return tableManager.currentIndex();
            },
            write: (value) => {
                tableManager.currentIndex(value);
                this.log("Switched to table with index " + value);
            },
        });
        this.currentIndex1 = ko.computed<number>({
            read: () => {
                return this.currentIndex() + 1;
            },
            write: (value) => {
                this.currentIndex(value - 1);
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
        settings.orientation.subscribe((value) => {
            if (orientationService.isScreenOrientationSupported()) {
                this.orientationWillBeChanged(true);
                this.setOrientation();
                timeService.setTimeout(() => {
                    this.currentTable().actionBlock.updateBounds();
                    this.calculateWidth();
                }, 300);
            }
        });
    }
    public calculateWidth() {
        if (orientationService.isTargetOrientation("portrait")) {
            this.calculatePortraitWidth();
            return;
        }

        this.calculateLandscapeWidth();
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

        if (appConfig.game.tablePreviewMode && appConfig.ui.relayTouches) {
            detachRelayToPage();
            zones = null;
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
        // As swiperjs module can not handle slideWidth updates
        // we should rerender hole swipe module.
        // Delete swipe node from DOM
        this.orientationWillBeChanged(true);
        this.setOrientation();
        timeService.setTimeout(() => {
            this.calculateWidth();
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

        if (appConfig.game.tablePreviewMode && appConfig.ui.relayTouches) {
            setTimeout(function() {
                zones = document.getElementsByTagName("iframe");
                attachRelayToPage(zones, { 
                  decodeCoordinates, 
                  debug: appConfig.ui.debugTouches,
                  attachMouseEvents: true,
                  attachPointerEvents: appConfig.ui.usePointerEvents,
                  attachTouchEvents: appConfig.ui.useTap,
                });
            }, 1000);
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
    public switchTable(index: ko.Observable<number>) {
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
        // Unsubscribe from table notifications.
        const tableView = this.currentTable();
        const removeCurrentTable = () => {
            // Navigate back to the lobby.
            if (tableManager.tables().length === 0) {
                app.lobbyPageBlock.showLobby();
                this.deactivate();
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
    private calculatePortraitWidth() {
        // When running not within browser, skip calculations.
        if (typeof window === "undefined") {
            return;
        }

        let viewportPortraitWidth = 320;
        const currentWidth = $("body").width()!;

        if (currentWidth >= 375) {
            viewportPortraitWidth = 375;
        }

        if (currentWidth >= 414) {
            viewportPortraitWidth = 414;
        }

        if (currentWidth >= 768) {
            viewportPortraitWidth = 768;
        }

        this.slideWidth(viewportPortraitWidth);
        // Render swipe node with new slideWidth
        this.orientationWillBeChanged(false);
    }
    private calculateLandscapeWidth() {
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
        // Render swipe node with new slideWidth
        this.orientationWillBeChanged(false);
    }
    private setOrientation() {
        if (orientationService.isTargetOrientation("portrait") && !PageBlock.useDoubleView) {
            orientationService.setOrientation("portrait");
            return;
        }

        orientationService.setOrientation("landscape");
    }
    private onConnectionSlow() {
        this.isConnectionSlow(true);

        // Clear message after some time passed by.
        timeService.setTimeout(() => {
            this.isConnectionSlow(false);
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

export function getZonesAngle(element: HTMLElement) {
    if (!zones) {
      console.warn("No zones for iframe-relay-touch provided. This indicates error in HTML files authoring");
      return 0;
    }

    if (zones.length === 2) {
        const angle = element === zones[0] ? -90 : 90;
        return angle;
    } else if (zones.length === 6) {
        const angle = element === zones[0] ? 180 :
            element === zones[1] ? 90 :
            element === zones[2] ? 0 :
            element === zones[3] ? 0 :
            element === zones[4] ? -90 :
            element === zones[5] ? 180 : 0;
        return angle;
    } else if (zones.length === 8) {
        const angle = element === zones[0] ? 180 :
            element === zones[1] ? 45 + 180 :
            element === zones[2] ? -45 + 180 :
            element === zones[3] ? 0 :
            element === zones[4] ? 0 :
            element === zones[5] ? -135 + 180 :
            element === zones[6] ? 135 + 180 :
            element === zones[7] ? 180 : 0;
        return angle;
    } 
    return 0;
}

export function debugSetZones(zoneElements: HTMLElement[]) {
    zones = zoneElements;
}

export function decodeCoordinates(element: HTMLElement, x: number, y: number) {
    const boundary = element.getBoundingClientRect();
    const clientX = x - boundary.left;
    const clientY = y - boundary.top;
    const style = window.getComputedStyle(element.offsetParent, null);
    const transform = style.getPropertyValue("transform");
    if (transform !== "none") {
        const elementStyle = window.getComputedStyle(element, null);
        const totalWidth = parseFloat(elementStyle.getPropertyValue("width").replace("px", ""));
        const totalHeight = parseFloat(elementStyle.getPropertyValue("height").replace("px", ""));
        let values = transform.split("(")[1];
        values = values.split(")")[0];
        const parts = values.split(",");
        const a = parseFloat(parts[0]);
        const b = parseFloat(parts[1]);
        const c = parseFloat(parts[2]);
        const d = parseFloat(parts[3]);

        const scale = Math.sqrt(a * a + b * b);

        // const angle = Math.round(Math.atan2(b, a) * (180/Math.PI));
        const angle = getZonesAngle(element);
        let result : {clientX : number; clientY: number};        
        if (angle === 180) {
            result = { clientX: totalWidth - clientX, clientY: totalHeight - clientY };
        } else if (angle === -90) {
            result = { clientX: clientY, clientY: totalHeight - clientX };
        } else if (angle === 90) {
            result = { clientX: totalWidth - clientY, clientY: clientX };
        // handle 225 degree rotation
        } else if (angle === 225) {
            const clientX = x - boundary.right;
            const clientY = y - boundary.bottom;
            const transX = clientX + totalHeight * (Math.sqrt(2) / 2);
            const transY = clientY;
            result = { 
                clientX: - (transX + transY) / Math.sqrt(2),
                //clientX: transX,
                clientY: - (-transX + transY) / Math.sqrt(2),
                //clientY: transY,
            };
        // handle 45 degree rotation
        } else if (angle === 45) {
            const clientX = x - boundary.left;
            const clientY = y - boundary.top;
            const transX = clientX - totalHeight / Math.sqrt(2);
            const transY = clientY;
            result = { 
                clientX: (transX + transY) / Math.sqrt(2),
                clientY: (-transX + transY) / Math.sqrt(2),
                // clientX: transX,
                // clientY: transY,
            };
        // handle 135 degree rotation
        } else if (angle === 135) {
            const clientX = x - boundary.left;
            const clientY = y - boundary.top;
            const transX = clientX;
            const transY = clientY - totalWidth/ Math.sqrt(2);
            result = { 
                clientX: (transX - transY) / Math.sqrt(2),
                clientY: (transX + transY) / Math.sqrt(2),
                //clientX: transX,
                //clientY: transY,
            };
        // handle 315 degree rotation
        } else if (angle === 315) {
            const clientX = x - boundary.right;
            const clientY = y - boundary.top;
            const transX = clientX;
            const transY = clientY - totalHeight/ Math.sqrt(2);
            result = { 
                clientX: -(transX - transY) / Math.sqrt(2),
                clientY: -(transX + transY) / Math.sqrt(2),
                //clientX: transX,
                //clientY: transY,
            };
        } else {
            result = { clientX, clientY };
        }
        
        if (appConfig.ui.debugTouches) {
            console.log("Element ", element, " has angle ", angle, `. (${x},${y}) => (${result.clientX},${result.clientY})`);
        }

        return result;
    }

    return { clientX, clientY };
}
