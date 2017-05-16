declare var baseUrl: string;

import { ConnectionWrapper } from "./connectionwrapper";
import { slowInternetService } from "./index";
import { debugSettings } from "../debugsettings";
import { CancelToken } from "./cancelToken";

export class ConnectionService {
    static stateConversion = {
        0: "connecting",
        1: "connected",
        2: "reconnecting",
        4: "disconnected"
    };
    isStopped: boolean;
    isDisconnected: boolean;
    isConnected: boolean;
    connectionSlow: Signal;
    reconnecting: Signal;
    reconnected: Signal;
    received: Signal;
    disconnected: Signal;
    recoverableError = new signals.Signal();
    newConnection = new signals.Signal();
    terminatedConnection = new signals.Signal();
    attempts = 0;
    lastAttempt = 0;
    lastConnection: JQueryDeferred<any> = null;
    cancelCurrentConnection: (reason: string) => void | null = null;
    currentConnection: ConnectionWrapper = null;

    constructor() {
        this.connectionSlow = new signals.Signal();
        this.reconnecting = new signals.Signal();
        this.reconnected = new signals.Signal();
        this.received = new signals.Signal();
        this.disconnected = new signals.Signal();
    }
    initializeConnection() {
        if (this.currentConnection !== null) {
            return;
        }

        const connection = $.hubConnection(baseUrl);
        connection.logging = $.connection.hub.logging;
        if (authToken == null) {
            connection.qs = null;
        } else {
            connection.qs = { "token": authToken };
        }

        this.isDisconnected = true;
        this.currentConnection = new ConnectionWrapper(connection);
        $.extend(connection, connection.createHubProxies());
        this.newConnection.dispatch(this.currentConnection);
    }
    terminateConnection(forceDisconnect = false) {
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
    establishConnection(maxAttempts = 3) {
        const attempts = this.attempts++;
        this.lastAttempt = attempts;
        this.cancelConnection();
        const result = this.currentConnection.establishConnection(maxAttempts);
        this.lastConnection = result;
        return result;
    }
    async establishConnectionAsync(maxAttempts = 3) {
        const attempts = this.attempts++;
        this.lastAttempt = attempts;
        this.cancelConnection();
        let cancelToken = CancelToken.source();
        this.cancelCurrentConnection = cancelToken.cancel;
        const result = await this.currentConnection.establishConnectionAsync(maxAttempts, cancelToken.token);
        return result;
    }
    cancelConnection() {
        if (this.lastConnection !== null && this.lastConnection.state() === "pending") {
            this.lastConnection.notify("cancel");
            this.lastConnection = null;
        }

        if (this.cancelCurrentConnection !== null) {
            this.cancelCurrentConnection("Requested connection cancel");
        }
    }
    buildStartConnection() {
        if (this.currentConnection === null) {
            this.logEvent("No active connection to terminate");
            return null;
        }

        return this.currentConnection.buildStartConnection();
    }
    async buildStartConnectionAsync() {
        if (this.currentConnection === null) {
            this.logEvent("No active connection to terminate");
            return null;
        }

        return await this.currentConnection.buildStartConnectionAsync();
    }
    private logEvent(message: string, ...params: any[]) {
        if (debugSettings.connection.signalR) {
            console.log(message, params);
        }
    }
}
