/* tslint:disable:no-string-literal */

import * as ko from "knockout";
import { App } from "../app";
import { debugSettings } from "../debugsettings";

declare var app: App;

export class PopupBase {
    visible: KnockoutObservable<boolean>;

    constructor() {
        this.visible = ko.observable(false);
    }
    shown(args: any[]= []) {
        var theConstructor: any = this["constructor"];
        this.trace("Popup shown " + theConstructor.name);
        this.visible(true);
    }
    close() {
        var theConstructor: any = this["constructor"];
        this.trace("Closing popup " + theConstructor.name);
        app.closePopup();
        this.visible(false);
    }

    trace(message: string) {
        if (debugSettings.ui.tracePopups) {
            console.log(message);
        }
    }
}
