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
        var self = this;
        connectionService.newConnection.add(function () {
            var chatHub = connectionService.currentConnection.connection.createHubProxy("chat");
            var handler = (...msg: any[]) => {
                var messageId = msg[0];
                var tableId: number = msg[1];
                var type = msg[2];
                var sender = msg[3];
                var message = msg[4];
                if (tableId !== self.tableId()) {
                    return;
                }

                self.append(messageId, tableId, type, sender, message);
            };
            chatHub.on("Message", handler);
            connectionService.terminatedConnection.addOnce(function () {
                chatHub.off("Message", handler);
            }, self, 0);
        });
    }
    append(messageId: number, tableId: number, type: string, sender: string, message: string) {
        var self = this;
        this.loading(false);
        var m = this.messages();
        this.messages(["[" + sender + "] " + message].concat(m));
    }
    attachToHub() {
        var self = this;
        this.loading(true);
        var wrapper = connectionService.currentConnection;
        wrapper.buildStartConnection()().done(function () {
            if (wrapper.terminated) {
                return;
            }

            wrapper.connection.Chat.server.join(self.tableId());
        });
        this.timeoutHandler = timeService.setTimeout(function () {
            self.loading(false);
            self.timeoutHandler = 0;
        }, 2000);
    }
    detachFromHub() {
        var self = this;
        var wrapper = connectionService.currentConnection;
        wrapper.buildStartConnection()().done(function () {
            if (wrapper.terminated) {
                return;
            }

            wrapper.connection.Chat.server.leave(self.tableId());
        });
        this.messages([]);
        if (this.timeoutHandler !== 0) {
            timeService.clearTimeout(this.timeoutHandler);
        }
    }
}
