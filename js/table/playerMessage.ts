import * as ko from "knockout";
import * as authManager from "../authManager";

export class PlayerMessage {
    messageId: number;
    sender: string;
    message: KnockoutObservable<string>;
    fullMessage: KnockoutComputed<string>;
    date: string;
    isMy: KnockoutObservable<boolean>;
    isAdmin: boolean;

    constructor(messageId: number, sender: string, message: string) {
        this.messageId = messageId;
        this.isAdmin = false;
        if (sender.toLowerCase() === "admin") {
            this.isAdmin = true;
        }

        this.isMy = ko.observable(authManager.login() === sender);
        authManager.authenticated.subscribe(() => {
            this.isMy(authManager.login() === sender);
        });

        this.sender = sender;
        this.message = ko.observable(message);
        const d = new Date();
        this.date = d.getHours() + ":" + d.getMinutes();
        this.fullMessage = ko.computed(() => {
            return "[" + this.date + "]" + this.sender + " - " + this.message();
        });
    }
}

