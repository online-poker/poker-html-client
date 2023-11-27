import * as $ from "jquery";
import * as ko from "knockout";
import { App } from "../app";

declare const app: App;

export class OkCancelPopup {
    public title: ko.Observable<string>;
    public messages: ko.ObservableArray<string>;
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
