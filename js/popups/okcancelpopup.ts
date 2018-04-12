/// <reference path="../poker.commanding.api.ts" />

import * as ko from "knockout";
import { App } from "../app";

declare var app: App;

/** Simple popup for confirm or cancel of current operation */
export class OkCancelPopup {
    public title: KnockoutObservable<string>;
    public messages: KnockoutObservableArray<string>;
    public buttons = ko.observableArray<string>([]);
    public deferred: JQueryDeferred<() => void>;
    public customStyle = ko.observable("");

    constructor() {
        this.title = ko.observable<string>();
        this.messages = ko.observableArray<string>();
    }

    public shown() {
        this.deferred = $.Deferred();
    }
    public confirm() {
        this.deferred.resolve();
        app.closePopup();
    }
    public cancel() {
        this.deferred.reject();
        app.closePopup();
    }
}
