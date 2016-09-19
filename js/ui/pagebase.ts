/// <reference path="../_references.ts" />
/// <reference path="page.ts" />
/* tslint:disable:no-string-literal */

import { debugSettings } from "../debugsettings";

export class PageBase implements Page {
    /**
    * Indicating whether page is currently visible
    */
    visible: KnockoutObservable<boolean>;

    constructor() {
        this.visible = ko.observable(false);
    }

    /**
    * Method called upon page activation.
    * pageName String Name of the page which is activated.
    */
    activate(pageName?: string) {
        const theConstructor: any = this["constructor"];
        this.trace("Activate " + theConstructor.name);
        this.visible(true);
    }

    /**
    * Method called upon page deactivation.
    * pageName String Name of the page which is deactivated.
    */
    deactivate(pageName?: string) {
        const theConstructor: any = this["constructor"];
        this.trace("Deactivate " + theConstructor.name);
        this.visible(false);
    }

    /**
    * Performs check that page could be activated
    */
    canActivate() {
        return true;
    }

    trace(message: string) {
        if (debugSettings.ui.tracePages) {
            console.log(message);
        }
    }
}
