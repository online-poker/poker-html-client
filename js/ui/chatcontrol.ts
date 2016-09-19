/// <reference path="../_references.ts" />
/// <reference path="../poker.commanding.api.ts" />

import * as ko from "knockout";
import * as moment from "moment";
import * as timeService from "../timeService";
import { connectionService } from "../services";

export class ChatControl {
    currentMessage: KnockoutObservable<string>;
    messages: KnockoutObservableArray<string>;
    loading: KnockoutObservable<boolean>;
    timeoutHandler: number;
    tableId: KnockoutObservable<number>;

    constructor() {
        this.currentMessage = ko.observable<string>();
        this.messages = ko.observableArray<string>([]);
        this.loading = ko.observable(false);
        this.tableId = ko.observable(0);
    }
    initialize() {
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
    append(messageId: number, tableId: number, type: string, sender: string, message: string) {
        this.loading(false);
        const m = this.messages();
        this.messages(["[" + sender + "] " + message].concat(m));
    }
    attachToHub() {
        this.loading(true);
        const wrapper = connectionService.currentConnection;
        wrapper.buildStartConnection()().done(() => {
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
    detachFromHub() {
        const wrapper = connectionService.currentConnection;
        wrapper.buildStartConnection()().done(() => {
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
