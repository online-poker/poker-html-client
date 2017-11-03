declare var baseUrl: string;

import * as signals from "signals";
import { debugSettings } from "../debugsettings";
import { CancelToken } from "./cancelToken";
import { ConnectionWrapper } from "./connectionwrapper";
import { slowInternetService } from "./index";

export class ConnectionService {
    public static stateConversion = {
        0: "connecting",
        1: "connected",
        2: "reconnecting",
        4: "disconnected",
    };
    public isStopped: boolean;
    public isDisconnected: boolean;
    public isConnected: boolean;
    public connectionSlow: Signal;
    public reconnecting: Signal;
    public reconnected: Signal;
    public received: Signal;
    public disconnected: Signal;
    public recoverableError = new signals.Signal();
    public newConnection = new signals.Signal();
    public terminatedConnection = new signals.Signal();
    public attempts = 0;
    public lastAttempt = 0;
    public currentConnection: ConnectionWrapper = null;
    private lastConnection: JQueryDeferred<any> = null;
    private cancelCurrentConnection: (reason: string) => void | null = null;

    constructor() {
        this.connectionSlow = new signals.Signal();
        this.reconnecting = new signals.Signal();
        this.reconnected = new signals.Signal();
        this.received = new signals.Signal();
        this.disconnected = new signals.Signal();
    }
    public initializeConnection() {
        if (this.currentConnection !== null) {
            return;
        }

        const connection = $.hubConnection(baseUrl);
        connection.logging = $.connection.hub.logging;
        if (authToken == null) {
            connection.qs = null;
        } else {
            connection.qs = { token: authToken };
        }

        this.isDisconnected = true;
        this.currentConnection = new ConnectionWrapper(connection);
        $.extend(connection, connection.createHubProxies());
        this.newConnection.dispatch(this.currentConnection);
    }
    public terminateConnection(forceDisconnect = false) {
        this.isStopped = true;
        this.isDisconnected = true;
        slowInternetService.manualDisconnect = true;

        if (this.currentConnection == null) {
            this.logEvent("No active connection to terminate");
            return;
        }

        let hubId: string;
        if (this.currentConnection.connection == null) {
            hubId = this.currentConnection.connection.id;
        } else {
            hubId = "NULL";
        }

        const connectionInfo = "HID:" + hubId;
        this.logEvent("Terminating connection " + connectionInfo);
        const oldConnection = this.currentConnection;
        this.currentConnection.terminateConnection();
        this.currentConnection = null;
        this.terminatedConnection.dispatch(oldConnection);
    }
    public establishConnection(maxAttempts = 3) {
        const attempts = this.attempts++;
        this.lastAttempt = attempts;
        this.cancelConnection();
        const result = this.currentConnection.establishConnection(maxAttempts);
        this.lastConnection = result;
        return result;
    }
    public async establishConnectionAsync(maxAttempts = 3) {
        const attempts = this.attempts++;
        this.lastAttempt = attempts;
        this.cancelConnection();
        const cancelToken = CancelToken.source();
        this.cancelCurrentConnection = cancelToken.cancel;
        const result = await this.currentConnection.establishConnectionAsync(maxAttempts, cancelToken.token);
        return result;
    }
    public cancelConnection() {
        if (this.lastConnection !== null && this.lastConnection.state() === "pending") {
            this.lastConnection.notify("cancel");
            this.lastConnection = null;
        }

        if (this.cancelCurrentConnection !== null) {
            this.cancelCurrentConnection("Requested connection cancel");
        }
    }
    public buildStartConnection() {
        if (this.currentConnection === null) {
            this.logEvent("No active connection to terminate");
            return null;
        }

        return this.currentConnection.buildStartConnection();
    }
    public async buildStartConnectionAsync() {
        if (this.currentConnection === null) {
            this.logEvent("No active connection to terminate");
            return null;
        }

        return await this.currentConnection.buildStartConnectionAsync();
    }
    private logEvent(message: string, ...params: any[]) {
        if (debugSettings.connection.signalR) {
            // tslint:disable-next-line:no-console
            console.log(message, params);
        }
    }
}
