/// <reference path="../_references.ts" />
/// <reference path="../poker.commanding.api.ts" />
/// <reference path="../app.ts" />

class SimplePopup extends PopupBase {
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
    static display(title: string, message: string): JQueryPromise<PopupResult>;
    static display(title: string, message: string[]): JQueryPromise<PopupResult>;
    static display(title: string, message: any): JQueryPromise<PopupResult> {
        app.simplePopup.title(title);
        if (typeof message === "string") {
            app.simplePopup.messages([message]);
        } else {
            // Assume that array is passed.
            app.simplePopup.messages(message);
        }

        return app.showPopup("simple").promise();
    }
    static displayWithTimeout(title: string, message: string, timeout: number): JQueryPromise<PopupResult>;
    static displayWithTimeout(title: string, message: string[], timeout: number): JQueryPromise<PopupResult>;
    static displayWithTimeout(title: string, message: any, timeout: number): JQueryPromise<PopupResult> {
        var result = SimplePopup.display(title, message);
        var handle = timeService.setTimeout(function () {
            if (handle !== null) {
                app.closePopup();
                handle = null;
            }
        }, timeout);
        var deferred = $.Deferred<PopupResult>();
        result.then(function (value) {
            timeService.clearTimeout(handle);
            deferred.resolve(value);
        }, function (reason) {
            deferred.reject(reason);
        });

        return deferred.promise();
    }
}
