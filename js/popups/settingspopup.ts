import * as ko from "knockout";
import { App } from "../app";
import { appConfig } from "../appconfig";
import { settings } from "../settings";
import { PopupBase } from "../ui/popupbase";

declare var app: App;

export class SettingsPopup {
    public loading: KnockoutObservable<boolean>;
    public selectCardsVariantAllowed: KnockoutComputed<boolean>;
    public selectOrientationModeAllowed: KnockoutComputed<boolean>;
    public cardsVariantRadio: KnockoutObservable<string>;
    public orientationModeRadio: KnockoutObservable<string>;

    constructor() {
        this.loading = ko.observable<boolean>(false);
        this.cardsVariantRadio = ko.observable("down");
        this.orientationModeRadio = ko.observable("landscape");
        this.selectOrientationModeAllowed = ko.computed(() =>
            appConfig.ui.usePortraitAndLandscapeOrientationModes,
        );
        this.selectCardsVariantAllowed = ko.computed(() =>
            appConfig.joinTable.allowTickets,
        );

    }

    /**
     * Executed on popup shown
     */
    public shown(): void {
        // Do nothing
    }

    public confirm() {
        if (this.selectCardsVariantAllowed()) {
            this.changeCardsVariant();
        }

        if (this.selectOrientationModeAllowed()) {
            this.changeOrientationMode();
        }

        settings.saveSettings();
        this.loading = ko.observable<boolean>(false);
        app.closePopup();
    }

    private changeCardsVariant() {
        settings.cardsVariant(this.cardsVariantRadio());
    }

    private changeOrientationMode() {
        settings.orientation(this.orientationModeRadio());
    }
}
