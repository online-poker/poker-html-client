import * as ko from "knockout";
import { App } from "../app";
import { settings } from "../settings";
import { PopupBase } from "../ui/popupbase";

declare var app: App;

export class SettingsPopup {
    public loading: KnockoutObservable<boolean>;
    public checkedRadio: KnockoutObservable<string>;

    constructor() {
        this.loading = ko.observable<boolean>(false);
        this.checkedRadio = ko.observable("down");
    }

    /**
     * Executed on popup shown
     */
    public shown(): void {
        // Do nothing
    }

    public confirm() {
        settings.cardsVariant(this.checkedRadio());
        settings.saveSettings();
        this.loading = ko.observable<boolean>(false);
        app.closePopup();
    }
}
