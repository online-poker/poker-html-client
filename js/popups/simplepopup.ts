/// <reference path="../poker.commanding.api.ts" />

import * as ko from "knockout";
import { App } from "../app";
import { PopupBase } from "../ui/popupbase";
import * as timeService from "../timeservice";

declare var app: App;

export class SimplePopup extends PopupBase {
    title: KnockoutObservable<string>;
    messages: KnockoutObservableArray<string>;

    constructor() {
        super();
        this.title = ko.observable<string>();
        this.messages = ko.observableArray<string>();
    }
    confirm() {
        super.close();
    }
    static display(title: string, message: string): Promise<PopupResult>;
    static display(title: string, message: string[]): Promise<PopupResult>;
    static display(title: string, message: any): Promise<PopupResult> {
        app.simplePopup.title(title);
        if (typeof message === "string") {
            app.simplePopup.messages([message]);
        } else {
            // Assume that array is passed.
            app.simplePopup.messages(message);
        }

        return app.showPopup("simple");
    }
    static displayWithTimeout(title: string, message: string, timeout: number): Promise<PopupResult>;
    static displayWithTimeout(title: string, message: string[], timeout: number): Promise<PopupResult>;
    static displayWithTimeout(title: string, message: any, timeout: number): Promise<PopupResult> {
        const result = SimplePopup.display(title, message);
        let handle = timeService.setTimeout(function () {
            if (handle !== null) {
                app.closePopup();
                handle = null;
            }
        }, timeout);
        const promise = new Promise<PopupResult>((resolve, reject) => {
            result.then(function (value) {
                timeService.clearTimeout(handle);
                resolve(value);
            }, function (reason) {
                reject(reason);
            });
        });

        return promise;
    }
}
