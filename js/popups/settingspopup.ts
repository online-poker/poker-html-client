import * as ko from "knockout";
import { PopupBase } from "../ui/popupbase";
import { App } from "../app";
import { settings } from "../settings";

declare var app: App;

export class SettingsPopup implements KnockoutValidationGroup {
    loading: KnockoutObservable<boolean>;
    checkedRadio: KnockoutObservable<string>;

    constructor() {
        this.loading = ko.observable<boolean>(false);
        this.checkedRadio = ko.observable("down");
    }
    shown(): void {
    }

    confirm() {
        settings.setCardsVariant(this.checkedRadio());
        this.loading = ko.observable<boolean>(false);
        app.closePopup();
    }
}
