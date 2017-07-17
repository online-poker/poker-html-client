import * as ko from "knockout";

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
    }
    private getItemBoolean(name: string, defaultValue: boolean = false) {
        const item = <string>localStorage.getItem(name);
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
    private getItemString(name: string, defaultValue: string = null) {
        return <string>localStorage.getItem(name) || defaultValue;
    }
    private setItemString(name: string, value: string, defaultValue: string = null) {
        if (value === defaultValue) {
            localStorage.removeItem(name);
        } else {
            localStorage.setItem(name, value);
        }
    }
    private getItemNumber(name: string, defaultValue: number = null) {
        return Number(localStorage.getItem(name)) || defaultValue;
    }
    private setItemNumber(name: string, value: number, defaultValue: number = null) {
        if (value === defaultValue) {
            localStorage.removeItem(name);
        } else {
            localStorage.setItem(name, value === null ? null : value.toString());
        }
    }
}

export var settings = new Settings();
