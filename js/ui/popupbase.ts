import * as ko from "knockout";
import { App } from "../app";
import { debugSettings } from "../debugsettings";

declare var app: App;

/** Interface for the popups base */
export class PopupBase {
    public visible: KnockoutObservable<boolean>;

    constructor() {
        this.visible = ko.observable(false);
    }
    public shown(args: any[]= []) {
        // tslint:disable-next-line:no-string-literal
        const theConstructor: any = this["constructor"];
        this.trace("Popup shown " + theConstructor.name);
        this.visible(true);
    }
    public close() {
        // tslint:disable-next-line:no-string-literal
        const theConstructor: any = this["constructor"];
        this.trace("Closing popup " + theConstructor.name);
        app.closePopup();
        this.visible(false);
    }

    private trace(message: string) {
        if (debugSettings.ui.tracePopups) {
            // tslint:disable-next-line:no-console
            console.log(message);
        }
    }
}
