import * as $ from "jquery";
import * as ko from "knockout";
import { PopupBase } from "../ui/popupbase";

type PromiseOrVoid = void | Promise<void>;

export class CustomPopup extends PopupBase {
    public title: ko.Observable<string>;
    public messages: ko.ObservableArray<string>;
    public buttons = ko.observableArray<string>([]);
    public actions = ko.observableArray<() => PromiseOrVoid>([]);
    public deferred: JQueryDeferred<any>;

    constructor() {
        super();
        this.title = ko.observable<string>();
        this.messages = ko.observableArray<string>();
    }

    public shown() {
        super.shown();
        this.deferred = $.Deferred();
    }
    public close() {
        super.close();
        this.deferred.reject();
    }
    public execute(index: number) {
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
