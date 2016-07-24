/// <reference path="../_references.ts" />
/// <reference path="connectionservice.ts" />

declare var baseUrl: string;

class ConnectionWrapper {
    terminated = false;
    constructor(public connection: HubConnection) {
        var self = this;
        connection.connectionSlow(() => {
            if (self.terminated) {
                return;
            }

            self.logEvent("Connection slow");
            connectionService.connectionSlow.dispatch();
        });
        connection.reconnecting(() => {
            if (self.terminated) {
                return;
            }

           connectionService.reconnecting.dispatch();
        });
        connection.reconnected(() => {
            if (self.terminated) {
                return;
            }

            connectionService.reconnected.dispatch();
        });
        connection.received(() => {
            if (self.terminated) {
                return;
            }

            connectionService.received.dispatch();
        });
        connection.disconnected(() => {
            if (self.terminated) {
                return;
            }

            connectionService.disconnected.dispatch();
        });
        connection.stateChanged((state) => {
            if (self.terminated) {
                return;
            }

            self.onConnectionStateChanged(state);
        });
        connection.error(function (error: any) {
            if (self.terminated) {
                return;
            }

            var source = <CloseEvent>error.source;
            self.logEvent("SignalR Error hapens", error);

            if (source === null) {
                // We don't know that this is means, so just fail
                // so issue will be easiely identifiable.
                self.logEvent("Unrecoverable SignalR error happens, please discover that this is means.");
                return;
            }

			/* tslint:disable:no-string-literal */
            if (source["code"] === null || source["code"] === undefined) {
                self.logEvent("Unrecoverable SignalR error without code happens, please discover that this is means.", source);
                return;
            }
			/* tslint:enable:no-string-literal */

            self.logEvent("Error code is: ", source.code);
            if (source.code === 1006) {
                // Attempt to reestablish connection.
                self.logEvent("Attempt to reestablish connection due to recoverable error.");
                connectionService.recoverableError.dispatch();
                return;
            }

            console.warn(error);
        });
    }
    terminateConnection(forceDisconnect = false) {
        var hubId = this.connection.id;
        var connectionInfo = "HID:" + hubId;
        this.logEvent("Terminating connection " + connectionInfo);
        slowInternetService.manualDisconnect = true;
        this.connection.stop(false, false);
        this.terminated = true;
    }
    establishConnection(maxAttempts = 3) {
        var self = this;
        var attempts = connectionService.attempts++;
        connectionService.lastAttempt = attempts;
        var result = self.establishConnectionCore(maxAttempts);
        return result;
    }
    buildStartConnection() {
        var self = this;
        var supportedTransports = null;
        var androidVersion = this.getAndroidVersion();
        if (androidVersion === false || (<string>androidVersion).indexOf("4.4") === 0) {
            supportedTransports = ["webSockets"];
        }

        var startConnection = function () {
            var buildMainPromise = () => {
                var promise: JQueryPromise<any>;
                if (supportedTransports === null) {
                    promise = self.connection.start();
                } else {
                    promise = self.connection.start({ transport: supportedTransports });
                }

                return promise;
            };

            var fixup = $.Deferred();
            var x = (attempts) => {
                if (attempts === 0) {
                    fixup.reject();
                }

                var promise = buildMainPromise();
                promise.pipe(() => {
                    if (self.terminated) {
                        fixup.reject();
                        return;
                    }

                    if (self.connection.state === 1) {
                        fixup.resolve();
                        return;
                    }

                    if (self.connection.state === 4) {
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
    private onConnectionStateChanged(state: SignalRStateChange) {
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
        var result = $.Deferred<ConnectionWrapper>();
        if (maxAttempts <= 0) {
            this.logEvent("Stop connection attempts");
            slowInternetService.onDisconnected();
            result.reject("maxAttemptsReached");
            return result;
        }

        var self = this;
        var startConnection = this.buildStartConnection();
        self.logEvent("Establishing connection. Attempts left: " + (maxAttempts - 1));
        connectionService.isStopped = false;
        startConnection().done(function () {
            if (self.terminated) {
                result.reject();
            }

            var hubId = self.connection.id;
            var connectionInfo = "HID:" + hubId;
            self.logEvent("Connected to server! Connection " + connectionInfo);
            result.resolve(self);
        }).fail(function (message) {
            self.logEvent("Could not Connect!" + message);
            timeService.setTimeout(function () {
                self.establishConnection(maxAttempts - 1).then(() => {
                    result.resolve(self);
                }, () => {
                        result.reject();
                    });
            }, 100);
        });
        return result;
    }
    private getAndroidVersion(userAgent = null) {
        var ua = userAgent || navigator.userAgent;
        var match = ua.match(/Android\s([0-9\.]*)/);
        return match ? match[1] : false;
    }
    private logEvent(message: string, ...params: any[]) {
        if (debugSettings.connection.signalR) {
            console.log(message, params);
        }
    }
}
