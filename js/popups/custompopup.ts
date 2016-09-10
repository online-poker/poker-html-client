/// <reference path="../_references.ts" />
/// <reference path="../poker.commanding.api.ts" />
/// <reference path="../app.ts" />

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
        var action = this.actions()[index];
        var result = action();
        super.close();
        if (result === undefined) {
            this.deferred.reject();
        } else {
            this.deferred.resolve(result);
        }
    }
}
