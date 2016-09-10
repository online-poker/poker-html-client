/// <reference path="../_references.ts" />
/// <reference path="../app.ts" />
/// <reference path="connectionservice.ts" />

import { connectionService } from "./index";
import { App } from "../app";

declare var app: App;

export class SlowInternetService {
    static popupName = "slowConnection";
    offline: boolean;
    manualDisconnect: boolean;
    retyHandler: () => void;
    suppressReconnected: boolean;
    fatalError = false;

    constructor() {
        this.offline = false;
        this.manualDisconnect = false;
        this.suppressReconnected = false;
    }
    initialize() {
        var self = this;
        connectionService.reconnecting.add(() => self.onConnectionSlow());
        connectionService.reconnected.add(() => self.onReconnected());
        connectionService.received.add(() => self.onReceived());
        connectionService.disconnected.add(() => self.onDisconnected());
        document.addEventListener("online", () => self.onOnline(), false);
        document.addEventListener("offline", () => self.onOffline(), false);
        app.slowConnectionPopup.onretry = () => {
            self.log("Retry connection");
            self.suppressReconnected = false;
            self.executeRetryHandler();

            var connectionBuilder = connectionService.buildStartConnection();
            if (connectionBuilder === null) {
                setTimeout(() => {
                    self.onDisconnected();
                }, 3000);
            } else {
                connectionBuilder().pipe(function () {
                    self.onReconnected();
                }, function () {
                        self.onDisconnected();
                    });
            }
        };

        this.offline = !this.hasInternet();
        if (this.offline) {
            this.onOffline();
        }
    }
    hasInternet() {
        if (navigator.connection === null || navigator.connection === undefined) {
            return true;
        }

        let expectedConnection = "none";
        if (window["Connection"]) {
            expectedConnection = Connection.NONE;
        }

        this.log("Connection type is " + navigator.connection.type + " testing against " + expectedConnection);
        return navigator.connection.type !== expectedConnection;
    }
    setRetryHandler(handler: () => void) {
        this.retyHandler = handler;
    }
    executeRetryHandler() {
        if (this.retyHandler !== null) {
            this.log("Executing retry handler");
            this.retyHandler();
            this.retyHandler = null;
        }
    }
    onConnectionSlow() {
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
    onReceived() {
        if (this.fatalError) {
            return;
        }

        if (app.currentPopup === SlowInternetService.popupName) {
            app.slowConnectionPopup.close();
        }
    }
    onReconnected() {
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
    closePopup() {
        if (app.currentPopup === SlowInternetService.popupName) {
            app.slowConnectionPopup.close();
        }
    }
    onDisconnected() {
        if (this.fatalError) {
            return;
        }

        this.log("disconnected");
        if (!this.offline && !this.manualDisconnect) {
            this.showReconnectFailedPopup();
        }
    }
    showReconnectFailedPopup() {
        if (app.currentPopup !== SlowInternetService.popupName) {
            app.showPopup(SlowInternetService.popupName);
        }

        app.slowConnectionPopup.reconnectFailed();
    }
    showDuplicatedConnectionPopup() {
        this.log("Duplicate connection detected");
        this.fatalError = true;
        if (app.currentPopup !== SlowInternetService.popupName) {
            app.showPopup(SlowInternetService.popupName);
        }

        this.setRetryHandler(() => {
            app.reloadApplication();
        });
        app.slowConnectionPopup.duplicatedConnection();
    }
    onOnline() {
        if (this.fatalError) {
            return;
        }

        this.offline = false;
        this.log("online");
        if (app.currentPopup === SlowInternetService.popupName) {
            app.slowConnectionPopup.connectionPresent();
        }
    }
    onOffline() {
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
    private log(message: string) {
        if (debugSettings.connection.slowInternet) {
            console.log(message);
        }
    }
}
