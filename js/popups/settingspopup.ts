import * as ko from "knockout";
import { PopupBase } from "../ui/popupbase";
import { App } from "../app";
import { settings } from "../settings";

declare var app: App;

export class SettingsPopup {
    loading: KnockoutObservable<boolean>;
    checkedRadio: KnockoutObservable<string>;

    constructor() {
        this.loading = ko.observable<boolean>(false);
        this.checkedRadio = ko.observable("down");
    }

    /**
     * Executed on popup shown
     */
    shown(): void {
        // Do nothing
    }

    confirm() {
        settings.cardsVariant(this.checkedRadio());
        settings.saveSettings();
        this.loading = ko.observable<boolean>(false);
        app.closePopup();
    }
}
