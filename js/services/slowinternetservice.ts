import { App } from "../app";
import { debugSettings } from "../debugsettings";
import { connectionService } from "./index";

declare const app: App;

type RetryHandler = () => void;

export class SlowInternetService {
    public static popupName = "slowConnection";
    public manualDisconnect: boolean;
    public retyHandler: RetryHandler | null = null;
    public fatalError = false;
    private offline: boolean;
    private suppressReconnected: boolean;

    constructor() {
        this.offline = false;
        this.manualDisconnect = false;
        this.suppressReconnected = false;
    }
    public initialize() {
        connectionService.reconnecting.add(() => this.onConnectionSlow());
        connectionService.reconnected.add(() => this.onReconnected());
        connectionService.received.add(() => this.onReceived());
        connectionService.disconnected.add(() => this.onDisconnected());
        document.addEventListener("online", () => this.onOnline(), false);
        document.addEventListener("offline", () => this.onOffline(), false);
        app.slowConnectionPopup.onretry = () => {
            this.log("Retry connection");
            if (debugSettings.connection.windowReloadForRetry) {
                window.location.reload();
                return;
            }

            this.suppressReconnected = false;
            this.executeRetryHandler();

            const connectionBuilder = connectionService.buildStartConnection();
            if (connectionBuilder === null) {
                setTimeout(() => {
                    this.onDisconnected();
                }, 3000);
            } else {
                connectionBuilder().then(() => {
                    this.onReconnected();
                }, () => {
                    this.onDisconnected();
                });
            }
        };

        this.offline = !this.hasInternet();
        if (this.offline) {
            this.onOffline();
        }
    }
    public hasInternet() {
        if (navigator.connection === null || navigator.connection === undefined) {
            return true;
        }

        let expectedConnection = "none";
        // tslint:disable-next-line:no-string-literal
        if (window["Connection"]) {
            expectedConnection = Connection.NONE;
        }

        this.log("Connection type is " + navigator.connection.type + " testing against " + expectedConnection);
        return navigator.connection.type !== expectedConnection;
    }
    public setRetryHandler(handler: RetryHandler) {
        this.retyHandler = handler;
    }
    public onConnectionSlow() {
        if (this.fatalError) {
            return;
        }

        this.log("Detected slow connection.");
        // Show popup only first time.
        // If we receive subsequent events then keep popup open and do nothing.
        if (app.currentPopup !== SlowInternetService.popupName) {
            app.showPopup(SlowInternetService.popupName);
        }
    }
    public onReceived() {
        if (this.fatalError) {
            return;
        }

        if (app.currentPopup === SlowInternetService.popupName) {
            app.slowConnectionPopup.close();
        }
    }
    public onReconnected() {
        if (this.fatalError) {
            return;
        }

        if (this.suppressReconnected) {
            return;
        }

        this.log("Close information popup, because connection is reestablished");
        this.log("Please add code which reconnects to the all opened tables here.");
        this.closePopup();
        this.executeRetryHandler();
    }
    public closePopup() {
        if (app.currentPopup === SlowInternetService.popupName) {
            app.slowConnectionPopup.close();
        }
    }
    public onDisconnected() {
        if (this.fatalError) {
            return;
        }

        this.log("disconnected");
        if (!this.offline && !this.manualDisconnect) {
            this.showReconnectFailedPopup();
        }
    }
    public showReconnectFailedPopup() {
        if (app.currentPopup !== SlowInternetService.popupName) {
            app.showPopup(SlowInternetService.popupName);
        }

        app.slowConnectionPopup.reconnectFailed();
    }
    public showDuplicatedConnectionPopup() {
        this.log("Duplicate connection detected");
        this.fatalError = true;
        if (typeof app === "undefined") {
            // We are in test mode, so return. This branch should be removed.
            return;
        }

        if (app.currentPopup !== SlowInternetService.popupName) {
            app.showPopup(SlowInternetService.popupName);
        }

        this.setRetryHandler(() => {
            app.reloadApplication();
        });
        app.slowConnectionPopup.duplicatedConnection();
    }
    public onOnline() {
        if (this.fatalError) {
            return;
        }

        this.offline = false;
        this.log("online");
        if (app.currentPopup === SlowInternetService.popupName) {
            app.slowConnectionPopup.connectionPresent();
        }
    }
    public onOffline() {
        if (this.fatalError) {
            return;
        }

        this.offline = true;
        this.suppressReconnected = true;
        this.log("offline");
        if (app.currentPopup !== SlowInternetService.popupName) {
            app.showPopup(SlowInternetService.popupName);
        }

        app.slowConnectionPopup.noConnection();
    }
    private executeRetryHandler() {
        if (this.retyHandler !== null) {
            this.log("Executing retry handler");
            this.retyHandler();
            this.retyHandler = null;
        }
    }
    private log(message: string) {
        if (debugSettings.connection.slowInternet) {
            // tslint:disable-next-line:no-console
            console.log(message);
        }
    }
}
