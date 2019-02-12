import * as ko from "knockout";
import { ScreenOrientation } from "poker/services/orientationservice";
import { appConfig } from "./appconfig";
import { PageBlock } from "./pageblock";

class Settings {
    public login: KnockoutObservable<string>;
    public password: KnockoutObservable<string>;
    public autoSwitchTables: KnockoutObservable<boolean>;
    public autoHideCards: KnockoutObservable<boolean>;
    public soundEnabled: KnockoutObservable<boolean>;
    public lastBannerId: KnockoutObservable<number>;

    public authToken = ko.observable<string>();
    public lastPage = ko.observable<string>();
    public lastTime = ko.observable<number>(0);
    public isGuest = ko.observable<boolean>(false);
    public cardsVariant = ko.observable<string>();
    public orientation = ko.observable<ScreenOrientation>();

    constructor() {
        this.login = ko.observable<string>();
        this.password = ko.observable<string>();

        this.autoSwitchTables = ko.observable(false);
        this.autoHideCards = ko.observable(true);
        this.soundEnabled = ko.observable(true);
        this.lastBannerId = ko.observable<number>();
    }
    public loadSettings() {
        this.login(this.getItemString("auth.login"));
        this.password(this.getItemString("auth.password"));
        this.isGuest(this.getItemBoolean("auth.isGuest", false));

        this.autoSwitchTables(this.getItemBoolean("table.autoSwitchTables"));
        this.autoHideCards(this.getItemBoolean("table.autoHideCards", true));
        this.soundEnabled(this.getItemBoolean("table.soundEnabled", true));
        this.lastBannerId(this.getItemNumber("banner.lastBannerId", 0));
        this.lastTime(this.getItemNumber("reload.lastTime", 0));
        this.lastPage(this.getItemString("reload.lastPage", "main"));
        this.authToken(this.getItemString("reload.authToken", null));
        this.cardsVariant(this.getItemString("cardsVariant", "down"));

        const defaultOrientation = PageBlock.useDoubleView ? "landscape" : appConfig.ui.defaultOrientation;
        this.orientation(this.getItemString("orientation", defaultOrientation) as ScreenOrientation);
    }
    public saveSettings() {
        this.setItemString("auth.login", this.login());
        this.setItemString("auth.password", this.password());
        this.setItemBoolean("auth.isGuest", this.isGuest(), false);

        this.setItemBoolean("table.autoSwitchTables", this.autoSwitchTables());
        this.setItemBoolean("table.autoHideCards", this.autoHideCards(), true);
        this.setItemBoolean("table.soundEnabled", this.soundEnabled(), true);
        this.setItemNumber("banner.lastBannerId", this.lastBannerId(), 0);
        this.setItemString("reload.lastPage", this.lastPage(), "main");
        this.setItemString("reload.authToken", this.authToken(), null);
        this.setItemNumber("reload.lastTime", this.lastTime(), 0);
        this.setItemString("cardsVariant", this.cardsVariant());
        this.setItemString("orientation", this.orientation());
    }
    private getItemBoolean(name: string, defaultValue: boolean = false) {
        const item = localStorage.getItem(name) as string;
        if (item === null) {
            return defaultValue;
        }

        return item.toLowerCase() === "true";
    }
    private setItemBoolean(name: string, value: boolean, defaultValue: boolean = false) {
        if (value === defaultValue) {
            localStorage.removeItem(name);
        } else {
            localStorage.setItem(name, value ? "true" : "false");
        }
    }
    private getItemString(name: string, defaultValue: string | null = null) {
        return localStorage.getItem(name) as string || defaultValue;
    }
    private setItemString(name: string, value: string, defaultValue: string | null = null) {
        if (value === defaultValue) {
            localStorage.removeItem(name);
        } else {
            localStorage.setItem(name, value);
        }
    }
    private getItemNumber(name: string, defaultValue: number = 0) {
        return Number(localStorage.getItem(name)) || defaultValue;
    }
    private setItemNumber(name: string, value: number, defaultValue: number) {
        if (value === defaultValue) {
            localStorage.removeItem(name);
        } else {
            localStorage.setItem(name, value.toString());
        }
    }
}

export const settings = new Settings();
