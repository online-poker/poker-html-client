import * as $ from "jquery";
import * as ko from "knockout";
import { connectionService } from "poker/services";
import { App } from "../app";
import { _ } from "../languagemanager";
import { PlayerMessage } from "../table/playerMessage";
import { SystemMessage } from "../table/SystemMessage";
import { TableView } from "../table/tableview";
import * as timeService from "../timeservice";
import { ChatControl } from "../ui/chatcontrol";

declare const app: App;

export class ChatPopup {
    public control: ChatControl;
    public caption: ko.Observable<string>;
    public currentMessage: ko.Observable<string>;
    public loading: ko.Observable<boolean>;
    public messages: ko.ObservableArray<PlayerMessage>;
    public systemMessages: ko.ObservableArray<SystemMessage>;
    private tableView: TableView | null = null;
    private subscription: ko.Subscription | null = null;

    constructor() {
        this.control = new ChatControl();
        this.currentMessage = ko.observable<string>("");
        this.loading = ko.observable(false);
        this.caption = ko.observable(_("chat.tableCaption"));
        this.control.initialize();
        this.messages = ko.observableArray<PlayerMessage>([]);
        this.systemMessages = ko.observableArray<SystemMessage>([]);
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
        if (this.tableView === null) {
            console.error("Could not send messages, since Chat popup does not attached to the TableView. Make sure that you did not miss call to ChatPopup.attach(TableView)");
            return;
        }

        const message: string = this.currentMessage();
        if (message === "") {
            return;
        }

        this.tableView.chatMessage(message as any);
        this.currentMessage("" as any);
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
        if (connectionService.currentConnection === null) {
            console.error("Could not connect to the chat popup, since no active SignalR connection");
            return;
        }

        this.control.attachToHub(connectionService.currentConnection);
    }
}
