/// <reference path="../../Scripts/typings/knockout/knockout.d.ts" />
/// <reference path="../app.ts" />
/// <reference path="../ui/page.ts" />
/// <reference path="../messages.ts" />
/// <reference path="../languagemanager.ts" />
/// <reference path="../metadatamanager.ts" />
/// <reference path="../poker.commanding.api.ts" />
/// <reference path="../authmanager.ts" />

class ChatPage implements Page {
    currentMessage: KnockoutObservable<string>;
    messages: KnockoutObservableArray<PlayerMessage>;
    loading: KnockoutObservable<boolean>;
    timeoutHandler: number = 0;

    constructor() {
        App.addTabBarItemMapping("more", "chat");
        this.currentMessage = ko.observable<string>();
        this.messages = ko.observableArray<PlayerMessage>([]);
        this.loading = ko.observable(false);
        var self = this;
        connectionService.newConnection.add(function () {
            var chatHub = connectionService.currentConnection.connection.createHubProxy("chat");
            var handler = (...msg: any[]) => {
                var messageId = msg[0];
                var tableId = msg[1];
                var type = msg[2];
                var sender = msg[3];
                var message = msg[4];
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
        //$.connection.Chat.server.leave(0);
        if (this.timeoutHandler !== 0) {
            timeService.clearTimeout(this.timeoutHandler);
        }
    }
    activate() {
        var self = this;
        this.loading(true);
        //$.connection.hub.start().done(function () {
            //$.connection.Chat.server.join(0);
        //});
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
        var self = this;
        var message = this.currentMessage();
        if (message === "" || message === null) {
            return;
        }

        var api = new OnlinePoker.Commanding.API.Chat(apiHost);
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
        var m = new PlayerMessage(messageId, sender, message);
        if (this.messages().some((item) => item.messageId === messageId)) {
            // Skip adding message if it is already in the list.
            return;
        }

        this.messages.unshift(m);
        while (this.messages().length > 100) {
            this.messages.pop();
        }

        var messages = this.messages();
        this.messages([]);
        this.messages(messages);
    }
}
