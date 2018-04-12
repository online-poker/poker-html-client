import { Chat } from "@poker/api-server";
import * as ko from "knockout";
import { App } from "../app";
import { _ } from "../languagemanager";
import { SimplePopup } from "../popups/simplepopup";
import { connectionService, keyboardActivationService } from "../services";
import { PlayerMessage } from "../table/playerMessage";
import * as timeService from "../timeservice";

declare var host: string;
declare var app: App;

/** Chat Page */
export class ChatPage implements Page {
    public currentMessage: KnockoutObservable<string>;
    public messages: KnockoutObservableArray<PlayerMessage>;
    public loading: KnockoutObservable<boolean>;
    public timeoutHandler: number = 0;

    constructor() {
        this.currentMessage = ko.observable<string>();
        this.messages = ko.observableArray<PlayerMessage>([]);
        this.loading = ko.observable(false);
        const self = this;
        connectionService.newConnection.add(function() {
            const chatHub = connectionService.currentConnection.connection.createHubProxy("chat");
            const handler = (...msg: any[]) => {
                const messageId = msg[0];
                const tableId = msg[1];
                // tslint:disable-next-line:no-unused-variable
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
            connectionService.terminatedConnection.addOnce(function() {
                chatHub.off("Message", handler);
            }, self, 0);
        });
    }
    public deactivate() {
        if (this.timeoutHandler !== 0) {
            timeService.clearTimeout(this.timeoutHandler);
        }
    }
    public activate() {
        const self = this;
        this.loading(true);
        this.timeoutHandler = timeService.setTimeout(function() {
            self.loading(false);
            self.timeoutHandler = 0;
        }, 2000);
    }
    public back() {
        keyboardActivationService.forceHideKeyboard();
        app.lobbyPageBlock.showLobby();
    }
    public async send() {
        const message = this.currentMessage();
        if (message === "" || message === null) {
            return;
        }

        const api = new Chat(host);
        try {
            this.currentMessage("");
            const data = await api.send(0, message);
            if (data.Status !== "Ok") {
                SimplePopup.display(_("chat.sendingMessage"), _("errors." + data.Status));
            }
        } catch (e) {
            SimplePopup.display(_("chat.sendingMessage"), _("chat.sendingMessageGenericError"));
        }
    }
    public addMessage(messageId: number, sender: string, message: string) {
        const m = new PlayerMessage(messageId, new Date(), sender, message);
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
