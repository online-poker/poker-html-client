/// <reference types="applicationinsights-js" />
import * as $ from "jquery";
import { debugSettings } from "../debugsettings";
import * as timeService from "../timeservice";
import { CancelToken } from "./cancelToken";
import { ConnectionService } from "./connectionservice";
import { connectionService, slowInternetService } from "./index";
import * as signalR from "@microsoft/signalr";

export interface ConnectionWrapper {
    terminated: boolean;
    connection: SignalR.Hub.Connection;
    getConnectionId(): string;
    getConnectionState(): number;
    establishConnection(maxAttempts?: number): JQueryDeferred<ConnectionWrapper>;
    establishConnectionAsync(maxAttempts?: number, cancellationToken?: CancelToken): Promise<ConnectionWrapper>;
    terminateConnection(forceDisconnect?: boolean): void;
    buildStartConnection() : () => Promise<void>;
    buildStartConnectionAsync() : Promise<void>;
    // Chat hub wrapper
    onChatConnected(handler: (tableId: number, lastMessageId: number) => void): void;
    onMessage(handler: (messageId: number, tableId: number, type: string, sender: string, message: string) => void): void;
    onMessageChanged(handler: (messageId: number, tableId: number, type: string, sender: string, message: string) => void): void;
    joinChat(tableId: number): Promise<void>;
    leaveChat(tableId: number): Promise<void>;

    // Game hub wrapper
    subscribeTournament(tournamentId: number): Promise<void>;
    joinTable(tableId: number): Promise<void>;
    fold(tableId: number): Promise<void>;
    checkOrCall(tableId: number): Promise<void>;
    betOrRaise(tableId: number, amount: number): Promise<void>;
}

export class SignalRConnectionWrapper implements ConnectionWrapper {
    public terminated = false;
    private refreshHandle: number | null = null;
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

            this.logEvent("SignalR Error hapens", error);
            if (error.source === "TimeoutException") {
                this.logEvent("Timeout for connection.");
                connectionService.recoverableError.dispatch();
                return;
            }

            const source = error.source as CloseEvent;

            if (source === null || source === undefined) {
                // We don't know that this is means, so just fail
                // so issue will be easiely identifiable.
                this.logEvent("Unrecoverable SignalR error happens, please discover that this is means.");
                return;
            }

            /* tslint:disable:no-string-literal */
            if (error["message"] !== null
                && error["message"] !== undefined
                && error.message === "Error during negotiation request.") {
                this.logEvent("Error during negotiation. Schedule reconnecting.");
                connectionService.recoverableError.dispatch();
                return;
            }

            if (source["code"] === null || source["code"] === undefined) {
                this.logEvent(
                    "Unrecoverable SignalR error without code happens, please discover that this is means.",
                    source);
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

    public getConnectionId() {
        if (this.connection !== null) {
            return this.connection.id;
        } else {
            return "NULL";
        }
    }

    public getConnectionState() {
        return this.connection.state;
    }
    public terminateConnection(forceDisconnect = false) {
        const hubId = this.connection.id;
        const connectionInfo = "HID:" + hubId;
        this.logEvent("Terminating connection " + connectionInfo);
        slowInternetService.manualDisconnect = true;
        try {
            this.connection.stop(false, false);
        } catch (e) {
            // Skip exception here. They occurs during bad internet connection
            // when connection not even fully starts, so no disconnection correctly happens.
        }

        this.cancelRefereshConnection();
        this.terminated = true;
    }
    public establishConnection(maxAttempts = 3) {
        const attempts = connectionService.attempts++;
        connectionService.lastAttempt = attempts;
        const result = this.establishConnectionCore(maxAttempts);
        return result;
    }
    public async establishConnectionAsync(maxAttempts = 3, cancellationToken?: CancelToken): Promise<ConnectionWrapper> {
        const attempts = connectionService.attempts++;
        connectionService.lastAttempt = attempts;
        return await this.establishConnectionCoreAsync(maxAttempts, cancellationToken);
    }
    public buildStartConnection() {
        let supportedTransports: string[] | null = null;
        const androidVersion = this.getAndroidVersion();
        if (androidVersion === false || (androidVersion as string).indexOf("4.4") === 0) {
            supportedTransports = ["webSockets"];
            this.logEvent("Select WebSockets as single protocol");
        } else {
            this.logEvent("Select default connection protocols.");
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
            const x = (attempts: number) => {
                if (attempts === 0) {
                    fixup.reject();
                }

                const promise = buildMainPromise();
                promise.then(() => {
                    if (this.terminated) {
                        fixup.reject();
                        return;
                    }

                    if (this.connection.state === 1) {
                        if (this.terminated) {
                            const hubId = this.connection.id;
                            const connectionInfo = "HID:" + hubId;
                            console.warn(`Attempt connect to terminated connection ${connectionInfo}`);
                        }

                        fixup.resolve();
                        return;
                    }

                    if (this.connection.state === 4) {
                        fixup.reject();
                        return;
                    }

                    timeService.setTimeout(function() {
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
    public async buildStartConnectionAsync() {
        let supportedTransports: string[] | null = null;
        const androidVersion = this.getAndroidVersion();
        if (androidVersion === false || (androidVersion as string).indexOf("4.4") === 0) {
            supportedTransports = ["webSockets"];
            this.logEvent("Select WebSockets as single protocol");
        } else {
            this.logEvent("Select default connection protocols.");
        }

        const tryConnection = async (attemptsLeft: number) => {
            this.logEvent(`Attempt to establish connection. Attempts left ${attemptsLeft}.`);
            if (supportedTransports === null) {
                await this.connection.start();
            } else {
                await this.connection.start({ transport: supportedTransports });
            }

            if (this.terminated) {
                throw new Error("SignalR connection was terminated.");
            }

            this.logEvent(`Connection started with state ${this.connection.state}.`);
            if (this.connection.state === 1) {
                return;
            }

            if (this.connection.state === 4) {
                throw new Error("SignalR connection has invalid state.");
            }

            return new Promise<void>(function(resolve, reject) {
                timeService.setTimeout(async function() {
                    if (attemptsLeft <= 0) {
                        reject(new Error("Last retry did not work. Stop attempts."));
                    } else {
                        await tryConnection(attemptsLeft - 1);
                        resolve();
                    }
                }, 100);
            });
        };

        return await tryConnection(30);
    }
    public onChatConnected(handler: (tableId: number, lastMessageId: number) => void): void {
        this.connection.Chat.client.ChatConnected = handler;
    }
    public onMessage(handler: (messageId: number, tableId: number, type: string, sender: string, message: string) => void): void {
        this.connection.Chat.client.Message = handler;
    }
    public onMessageChanged(handler: (messageId: number, tableId: number, type: string, sender: string, message: string) => void): void {
        this.connection.Chat.client.MessageChanged = handler;
    }
    public joinChat(tableId: number): Promise<void> {
        return this.connection.Chat.server.join(tableId);
    }
    public leaveChat(tableId: number): Promise<void> {
        return this.connection.Chat.server.leave(tableId);
    }
    public joinTable(tableId: number): Promise<void> {
        return this.connection.Game.server.join(tableId);
    }
    public subscribeTournament(tournamentId: number): Promise<void> {
        return this.connection.Game.server.subscribeTournament(tournamentId);
    }
    public fold(tableId: number): Promise<void> {
        return this.connection.Game.server.fold(tableId);
    }
    public checkOrCall(tableId: number): Promise<void> {
        return this.connection.Game.server.checkOrCall(tableId);
    }
    public betOrRaise(tableId: number, amount: number): Promise<void> {
        return this.connection.Game.server.betOrRaise(tableId, amount);
    }
    private onConnectionStateChanged(state: SignalR.StateChanged) {
        this.logEvent("SignalR state changed from: " + ConnectionService.stateConversion[state.oldState as 0|1|2|4]
            + " to: " + ConnectionService.stateConversion[state.newState as 0|1|2|4]);

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
    private establishConnectionCore(maxAttempts: number) {
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
        startConnection().then(() => {
            if (this.terminated) {
                result.reject();
            }

            const hubId = this.connection.id;
            const connectionInfo = "HID:" + hubId;
            this.logEvent("Connected to server! Connection " + connectionInfo);
            this.refreshHandle = setTimeout(() => {
                // this.terminateConnection();
                // connectionService.recoverableError.dispatch();
            }, 1000 * 60 * 60);
            result.resolve(this);
        }).then(null, (message: string = "") => {
            this.logEvent("Could not Connect!" + message);
            timeService.setTimeout(() => {
                if (this.terminated) {
                    this.logEvent("Reset terminate status for connection before attemt to try new connection");
                    this.terminated = false;
                }

                this.establishConnection(maxAttempts - 1).then(() => {
                    result.resolve(this);
                }, () => {
                    result.reject();
                });
            }, 100);
        });
        return result;
    }
    private async establishConnectionCoreAsync(maxAttempts: number, cancellationToken?: CancelToken): Promise<ConnectionWrapper> {
        if (maxAttempts <= 0) {
            this.logEvent("Stop connection attempts");
            slowInternetService.onDisconnected();
            throw new Error("maxAttemptsReached");
        }

        if (cancellationToken) {
            cancellationToken.throwIfRequested();
        }

        this.logEvent("Establishing connection. Attempts left: " + (maxAttempts - 1));
        connectionService.isStopped = false;
        try {
            await this.buildStartConnectionAsync();
            if (this.terminated) {
                throw new Error("SignalR connection was terminated");
            }

            const hubId = this.connection.id;
            const connectionInfo = "HID:" + hubId;
            this.logEvent("Connected to server! Connection " + connectionInfo);
            return this as ConnectionWrapper;
        } catch (e: any) {
            this.logEvent("Could not Connect!" + e.message);
            return new Promise<ConnectionWrapper>((resolve, reject) => {
                timeService.setTimeout(async () => {
                    try {
                        await this.establishConnectionAsync(maxAttempts - 1);
                        resolve(this);
                    } catch (err) {
                        reject();
                    }
                }, 100);
            });
        }
    }
    private cancelRefereshConnection() {
        if (this.refreshHandle) {
            clearTimeout(this.refreshHandle);
        }

        this.refreshHandle = null;
    }
    private getAndroidVersion(userAgent: string = null) {
        const ua = userAgent || navigator.userAgent;
        const match = ua.match(/Android\s([0-9\.]*)/);
        return match ? match[1] : false;
    }
    private logEvent(message: string, ...params: any[]) {
        if (debugSettings.connection.signalR) {
            // tslint:disable-next-line:no-console
            console.log(message, params);
        }

        // tslint:disable-next-line:no-string-literal
        if (window["appInsights"]) {
            appInsights.trackTrace(message);
        }
    }
}
