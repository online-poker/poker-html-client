import * as ko from "knockout";
import { PlayerMessage } from "../table/playerMessage";
import * as timeService from "../timeService";
import { connectionService, keyboardActivationService } from "../services";
import { SimplePopup } from "../popups/simplepopup";
import { App } from "../app";

declare var apiHost: string;
declare var app: App;

export class ChatPage implements Page {
    currentMessage: KnockoutObservable<string>;
    messages: KnockoutObservableArray<PlayerMessage>;
    loading: KnockoutObservable<boolean>;
    timeoutHandler: number = 0;

    constructor() {
        App.addTabBarItemMapping("more", "chat");
        this.currentMessage = ko.observable<string>();
        this.messages = ko.observableArray<PlayerMessage>([]);
        this.loading = ko.observable(false);
        const self = this;
        connectionService.newConnection.add(function () {
            const chatHub = connectionService.currentConnection.connection.createHubProxy("chat");
            const handler = (...msg: any[]) => {
                const messageId = msg[0];
                const tableId = msg[1];
                const type = msg[2];
                const sender = msg[3];
                const message = msg[4];
                if (tableId !== 0) {
                    return;
                }

                self.loading(false);
                self.addMessage(messageId, sender, message);
            };
            chatHub.on("Message", handler);
            connectionService.terminatedConnection.addOnce(function () {
                chatHub.off("Message", handler);
            }, self, 0);
        });
    }
    deactivate() {
        if (this.timeoutHandler !== 0) {
            timeService.clearTimeout(this.timeoutHandler);
        }
    }
    activate() {
        const self = this;
        this.loading(true);
        this.timeoutHandler = timeService.setTimeout(function () {
            self.loading(false);
            self.timeoutHandler = 0;
        }, 2000);
    }
    back() {
        keyboardActivationService.forceHideKeyboard();
        app.lobbyPageBlock.showLobby();
    }
    send() {
        const self = this;
        const message = this.currentMessage();
        if (message === "" || message === null) {
            return;
        }

        const api = new OnlinePoker.Commanding.API.Chat(apiHost);
        api.Send(0, message, (data, textStatus, jqXHR) => {
            if (data.Status !== "Ok") {
                SimplePopup.display(_("chat.sendingMessage"), _("errors." + data.Status));
            }
        }).fail(() => {
            SimplePopup.display(_("chat.sendingMessage"), _("chat.sendingMessageGenericError"));
        });
        this.currentMessage("");
    }
    addMessage(messageId: number, sender: string, message: string) {
        const m = new PlayerMessage(messageId, sender, message);
        if (this.messages().some((item) => item.messageId === messageId)) {
            // Skip adding message if it is already in the list.
            return;
        }

        this.messages.unshift(m);
        while (this.messages().length > 100) {
            this.messages.pop();
        }

        const messages = this.messages();
        this.messages([]);
        this.messages(messages);
    }
}
