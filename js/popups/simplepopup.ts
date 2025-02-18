import * as ko from "knockout";
import { App } from "../app";
import * as timeService from "../timeservice";
import { PopupBase } from "../ui/popupbase";

declare const app: App;

export class SimplePopup extends PopupBase {
    public static display(title: string, message: string | string[]): Promise<PopupResult> {
        app.simplePopup.title(title);
        if (typeof message === "string") {
            app.simplePopup.messages([message]);
        } else {
            // Assume that array is passed.
            app.simplePopup.messages(message);
        }

        return app.showPopup("simple");
    }
    public static displayWithTimeout(title: string, message: string | string[], timeout: number): Promise<PopupResult> {
        const result = SimplePopup.display(title, message);
        let handle = timeService.setTimeout(function() {
            if (handle !== null) {
                app.closePopup();
                handle = null;
            }
        }, timeout);
        const promise = new Promise<PopupResult>((resolve, reject) => {
            result.then(function(value) {
                timeService.clearTimeout(handle);
                resolve(value);
            }, function(reason) {
                reject(reason);
            });
        });

        return promise;
    }
    public title: ko.Observable<string>;
    public messages: ko.ObservableArray<string>;

    constructor() {
        super();
        this.title = ko.observable<string>();
        this.messages = ko.observableArray<string>();
    }
    public confirm() {
        super.close();
    }
}
