import * as ko from "knockout";
import { authManager } from "poker/authmanager";

export class PlayerMessage {
    public messageId: number;
    public sender: string;
    public message: KnockoutObservable<string>;
    public fullMessage: KnockoutComputed<string>;
    public date: string;
    public isMy: KnockoutObservable<boolean>;
    public isAdmin: boolean;

    constructor(messageId: number, date: Date, sender: string, message: string) {
        this.messageId = messageId;
        this.isAdmin = false;
        if (sender.toLowerCase() === "admin") {
            this.isAdmin = true;
        }

        this.isMy = ko.observable(authManager.login() === sender);
        authManager.registerAuthenticationChangedHandler(() => {
            this.isMy(authManager.login() === sender);
        });

        this.sender = sender;
        this.message = ko.observable(message);
        this.date = date.getHours() + ":" + date.getMinutes();
        this.fullMessage = ko.computed(() => {
            return "[" + this.date + "]" + this.sender + " - " + this.message();
        });
    }
}
