/// <reference path="../poker.commanding.api.ts" />

import * as ko from "knockout";
import { App } from "../app";

declare var app: App;

export class OkCancelPopup {
    title: KnockoutObservable<string>;
    messages: KnockoutObservableArray<string>;
    buttons = ko.observableArray<string>([]);
    deferred: JQueryDeferred<() => void>;
    customStyle = ko.observable("");

    constructor() {
        this.title = ko.observable<string>();
        this.messages = ko.observableArray<string>();
    }

    shown() {
        this.deferred = $.Deferred();
    }
    confirm() {
        this.deferred.resolve();
        app.closePopup();
    }
    cancel() {
        this.deferred.reject();
        app.closePopup();
    }
}
