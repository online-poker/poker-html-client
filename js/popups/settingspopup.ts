import * as ko from "knockout";
import { ScreenOrientation } from "poker/services/orientationservice";
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
    public orientationModeRadio: KnockoutObservable<ScreenOrientation>;

    constructor() {
        this.loading = ko.observable<boolean>(false);
        this.cardsVariantRadio = ko.observable("down");
        this.orientationModeRadio = ko.observable<ScreenOrientation>("landscape");
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
        this.orientationModeRadio(settings.orientation());
        this.cardsVariantRadio(settings.cardsVariant());
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
