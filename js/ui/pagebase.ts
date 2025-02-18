/* tslint:disable:no-string-literal */
import * as ko from "knockout";
import { debugSettings } from "../debugsettings";

export class PageBase implements Page {
    /**
     * Indicating whether page is currently visible
     */
    public visible: ko.Observable<boolean>;

    constructor() {
        this.visible = ko.observable(false);
    }

    /**
     * Method called upon page activation.
     * pageName String Name of the page which is activated.
     */
    public activate(pageName?: string) {
        const theConstructor: any = this["constructor"];
        this.trace("Activate " + theConstructor.name);
        this.visible(true);
    }

    /**
     * Method called upon page deactivation.
     * pageName String Name of the page which is deactivated.
     */
    public deactivate(pageName?: string) {
        const theConstructor: any = this["constructor"];
        this.trace("Deactivate " + theConstructor.name);
        this.visible(false);
    }

    /**
     * Performs check that page could be activated
     */
    public canActivate() {
        return true;
    }

    private trace(message: string) {
        if (debugSettings.ui.tracePages) {
            // tslint:disable-next-line:no-console
            console.log(message);
        }
    }
}
