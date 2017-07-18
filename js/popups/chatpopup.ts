/// <reference path="../poker.commanding.api.ts" />

import { App } from "../app";
import { _ } from "../languagemanager";
import { PlayerMessage } from "../table/playerMessage";
import { SystemMessage } from "../table/SystemMessage";
import { TableView } from "../table/tableview";
import * as timeService from "../timeservice";
import { ChatControl } from "../ui/chatcontrol";

declare var apiHost: string;
declare var app: App;

export class ChatPopup {
    public control: ChatControl;
    public caption: KnockoutObservable<string>;
    public currentMessage: KnockoutObservable<string>;
    public loading: KnockoutObservable<boolean>;
    public messages: KnockoutObservableArray<PlayerMessage>;
    public systemMessages: KnockoutObservableArray<SystemMessage>;
    private tableView: TableView;
    private subscription: KnockoutSubscription = null;

    constructor() {
        this.control = new ChatControl();
        this.currentMessage = ko.observable("");
        this.loading = ko.observable(false);
        this.caption = ko.observable(_("chat.tableCaption"));
        this.control.initialize();
        this.messages = ko.observableArray<PlayerMessage>([]);
        this.systemMessages = ko.observableArray<PlayerMessage>([]);
    }
    public attach(view: TableView) {
        if (this.subscription !== null) {
            this.subscription.dispose();
            this.subscription = null;
        }

        this.tableView = view;
        this.messages(this.tableView.messages());
        this.subscription = this.tableView.messages.subscribe((value) => {
            this.messages(value);
        });
        this.systemMessages(this.tableView.systemMessages());
        this.subscription = this.tableView.systemMessages.subscribe((value) => {
            this.systemMessages(value);
        });
    }
    /**
     * Handles pressing Send button on the chat popup.
     */
    public async send() {
        if (this.currentMessage() === "") {
            return;
        }

        this.tableView.chatMessage(this.currentMessage());
        this.currentMessage("");
        await this.tableView.sendMessage();
    }
    public close() {
        if (this.subscription !== null) {
            this.subscription.dispose();
            this.subscription = null;
        }

        app.closePopup();
        /* Workaround for iOS 7.1 issue which break layout. */
        timeService.setTimeout(function () {
            $(window).scrollLeft(0);
        }, 10);
    }
    public shown(): void {
        this.control.attachToHub();
    }
}
