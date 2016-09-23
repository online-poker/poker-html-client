declare var baseUrl: string;

import * as timeService from "../timeService";
import { ConnectionService } from "./connectionservice";
import { slowInternetService, connectionService } from "./index";
import { debugSettings } from "../debugsettings";

export class ConnectionWrapper {
    terminated = false;
    refreshHandle: number = null;
    constructor(public connection: SignalR.Hub.Connection) {
        connection.connectionSlow(() => {
            if (this.terminated) {
                return;
            }

            this.logEvent("Connection slow");
            connectionService.connectionSlow.dispatch();
        });
        connection.reconnecting(() => {
            if (this.terminated) {
                return;
            }

           connectionService.reconnecting.dispatch();
        });
        connection.reconnected(() => {
            if (this.terminated) {
                return;
            }

            connectionService.reconnected.dispatch();
        });
        connection.received(() => {
            if (this.terminated) {
                return;
            }

            connectionService.received.dispatch();
        });
        connection.disconnected(() => {
            if (this.terminated) {
                return;
            }

            connectionService.disconnected.dispatch();
        });
        connection.stateChanged((state) => {
            if (this.terminated) {
                return;
            }

            this.onConnectionStateChanged(state);
        });
        connection.error((error: any) => {
            if (this.terminated) {
                return;
            }

            const source = <CloseEvent>error.source;
            this.logEvent("SignalR Error hapens", error);

            if (source === null) {
                // We don't know that this is means, so just fail
                // so issue will be easiely identifiable.
                this.logEvent("Unrecoverable SignalR error happens, please discover that this is means.");
                return;
            }

            /* tslint:disable:no-string-literal */
            if (source["code"] === null || source["code"] === undefined) {
                this.logEvent("Unrecoverable SignalR error without code happens, please discover that this is means.", source);
                return;
            }

            /* tslint:enable:no-string-literal */
            this.logEvent("Error code is: ", source.code);
            if (source.code === 1006) {
                // Attempt to reestablish connection.
                this.logEvent("Attempt to reestablish connection due to recoverable error.");
                connectionService.recoverableError.dispatch();
                return;
            }

            console.warn(error);
        });
    }
    terminateConnection(forceDisconnect = false) {
        const hubId = this.connection.id;
        const connectionInfo = "HID:" + hubId;
        this.logEvent("Terminating connection " + connectionInfo);
        slowInternetService.manualDisconnect = true;
        this.connection.stop(false, false);
        this.cancelRefereshConnection();
        this.terminated = true;
    }
    establishConnection(maxAttempts = 3) {
        const attempts = connectionService.attempts++;
        connectionService.lastAttempt = attempts;
        const result = this.establishConnectionCore(maxAttempts);
        return result;
    }
    buildStartConnection() {
        let supportedTransports = null;
        const androidVersion = this.getAndroidVersion();
        if (androidVersion === false || (<string>androidVersion).indexOf("4.4") === 0) {
            supportedTransports = ["webSockets"];
        }

        const startConnection = () => {
            const buildMainPromise = () => {
                let promise: JQueryPromise<any>;
                if (supportedTransports === null) {
                    promise = this.connection.start();
                } else {
                    promise = this.connection.start({ transport: supportedTransports });
                }

                return promise;
            };

            const fixup = $.Deferred();
            const x = (attempts) => {
                if (attempts === 0) {
                    fixup.reject();
                }

                const promise = buildMainPromise();
                promise.pipe(() => {
                    if (this.terminated) {
                        fixup.reject();
                        return;
                    }

                    if (this.connection.state === 1) {
                        fixup.resolve();
                        return;
                    }

                    if (this.connection.state === 4) {
                        fixup.reject();
                        return;
                    }

                    timeService.setTimeout(function () {
                        x(attempts - 1);
                    }, 100);
                }, () => {
                    fixup.reject();
                });
            };

            x(30);
            return fixup;
        };

        return startConnection;
    }
    private onConnectionStateChanged(state: SignalR.StateChanged) {
        this.logEvent("SignalR state changed from: " + ConnectionService.stateConversion[state.oldState]
            + " to: " + ConnectionService.stateConversion[state.newState]);

        if (state.newState === 4) {
            connectionService.isDisconnected = true;
        } else {
            connectionService.isDisconnected = false;
        }

        if (state.newState === 1) {
            connectionService.isConnected = true;
        } else {
            connectionService.isConnected = false;
        }
    }
    private establishConnectionCore(maxAttempts) {
        const result = $.Deferred<ConnectionWrapper>();
        if (maxAttempts <= 0) {
            this.logEvent("Stop connection attempts");
            slowInternetService.onDisconnected();
            result.reject("maxAttemptsReached");
            return result;
        }

        const startConnection = this.buildStartConnection();
        this.logEvent("Establishing connection. Attempts left: " + (maxAttempts - 1));
        connectionService.isStopped = false;
        startConnection().done(() => {
            if (this.terminated) {
                result.reject();
            }

            const hubId = this.connection.id;
            const connectionInfo = "HID:" + hubId;
            this.logEvent("Connected to server! Connection " + connectionInfo);
            this.refreshHandle = setTimeout(() => {
                this.terminateConnection();
                connectionService.recoverableError.dispatch();
            }, 1000 * 60 * 60);
            result.resolve(this);
        }).fail((message) => {
            this.logEvent("Could not Connect!" + message);
            timeService.setTimeout(() => {
                this.establishConnection(maxAttempts - 1).then(() => {
                    result.resolve(this);
                }, () => {
                    result.reject();
                });
            }, 100);
        });
        return result;
    }
    private cancelRefereshConnection() {
        if (this.refreshHandle) {
            clearTimeout(this.refreshHandle);
        }

        this.refreshHandle = null;
    }
    private getAndroidVersion(userAgent = null) {
        const ua = userAgent || navigator.userAgent;
        const match = ua.match(/Android\s([0-9\.]*)/);
        return match ? match[1] : false;
    }
    private logEvent(message: string, ...params: any[]) {
        if (debugSettings.connection.signalR) {
            console.log(message, params);
        }
    }
}
