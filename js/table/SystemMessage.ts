import * as ko from "knockout";

export class SystemMessage {
    messageId: number;
    message: KnockoutObservable<string>;
    constructor(messageId: number, message: string) {
        this.messageId = messageId;
        this.message = ko.observable(message);
    }
}
