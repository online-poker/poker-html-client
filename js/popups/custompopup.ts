/// <reference path="../poker.commanding.api.ts" />

import * as ko from "knockout";
import { PopupBase } from "../ui/popupbase";

export class CustomPopup extends PopupBase {
    title: KnockoutObservable<string>;
    messages: KnockoutObservableArray<string>;
    buttons = ko.observableArray<string>([]);
    actions = ko.observableArray<Function>([]);
    deferred: JQueryDeferred<any>;

    constructor() {
        super();
        this.title = ko.observable<string>();
        this.messages = ko.observableArray<string>();
    }

    shown() {
        super.shown();
        this.deferred = $.Deferred();
    }
    close() {
        super.close();
        this.deferred.reject();
    }
    execute(index: number) {
        const action = this.actions()[index];
        const result = action();
        super.close();
        if (result === undefined) {
            this.deferred.reject();
        } else {
            this.deferred.resolve(result);
        }
    }
}
