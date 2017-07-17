/// <reference path="../poker.commanding.api.ts" />

import * as ko from "knockout";
import * as timeService from "../timeservice";
import { connectionService } from "../services";

export class ChatControl {
    public currentMessage: KnockoutObservable<string>;
    public messages: KnockoutObservableArray<string>;
    public loading: KnockoutObservable<boolean>;
    private timeoutHandler: number;
    private tableId: KnockoutObservable<number>;

    constructor() {
        this.currentMessage = ko.observable<string>();
        this.messages = ko.observableArray<string>([]);
        this.loading = ko.observable(false);
        this.tableId = ko.observable(0);
    }
    public initialize() {
        connectionService.newConnection.add(() => {
            const chatHub = connectionService.currentConnection.connection.createHubProxy("chat");
            const handler = (...msg: any[]) => {
                const messageId = msg[0];
                const tableId: number = msg[1];
                const type = msg[2];
                const sender = msg[3];
                const message = msg[4];
                if (tableId !== this.tableId()) {
                    return;
                }

                this.append(messageId, tableId, type, sender, message);
            };
            chatHub.on("Message", handler);
            connectionService.terminatedConnection.addOnce(function () {
                chatHub.off("Message", handler);
            }, self, 0);
        });
    }
    public append(messageId: number, tableId: number, type: string, sender: string, message: string) {
        this.loading(false);
        const m = this.messages();
        this.messages(["[" + sender + "] " + message].concat(m));
    }
    public attachToHub() {
        this.loading(true);
        const wrapper = connectionService.currentConnection;
        wrapper.buildStartConnection()().then(() => {
            if (wrapper.terminated) {
                return;
            }

            wrapper.connection.Chat.server.join(this.tableId());
        });
        this.timeoutHandler = timeService.setTimeout(() => {
            this.loading(false);
            this.timeoutHandler = 0;
        }, 2000);
    }
    public detachFromHub() {
        const wrapper = connectionService.currentConnection;
        wrapper.buildStartConnection()().then(() => {
            if (wrapper.terminated) {
                return;
            }

            wrapper.connection.Chat.server.leave(this.tableId());
        });
        this.messages([]);
        if (this.timeoutHandler !== 0) {
            timeService.clearTimeout(this.timeoutHandler);
        }
    }
}
