import * as ko from "knockout";

export class SystemMessage {
    public messageId: number;
    public message: KnockoutObservable<string>;
    constructor(messageId: number, message: string) {
        this.messageId = messageId;
        this.message = ko.observable(message);
    }
}
