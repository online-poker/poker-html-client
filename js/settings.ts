/// <reference path="./_references.ts" />

class Settings {
    login: KnockoutObservable<string>;
    password: KnockoutObservable<string>;
    autoSwitchTables: KnockoutObservable<boolean>;
    autoHideCards: KnockoutObservable<boolean>;
    soundEnabled: KnockoutObservable<boolean>;
    lastBannerId: KnockoutObservable<number>;

    authToken = ko.observable<string>();
    lastPage = ko.observable<string>();
    lastTime = ko.observable<number>(0);
    isGuest = ko.observable<boolean>(false);

    constructor() {
        this.login = ko.observable<string>();
        this.password = ko.observable<string>();

        this.autoSwitchTables = ko.observable(false);
        this.autoHideCards = ko.observable(true);
        this.soundEnabled = ko.observable(true);
        this.lastBannerId = ko.observable<number>();
    }
    loadSettings() {
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
    }
    saveSettings() {
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
    }
    getItemBoolean(name: string, defaultValue: boolean = false) {
        var item = <string>localStorage.getItem(name);
        if (item === null) {
            return defaultValue;
        }

        return item.toLowerCase() === "true";
    }
    setItemBoolean(name: string, value: boolean, defaultValue: boolean = false) {
        if (value === defaultValue) {
            localStorage.removeItem(name);
        } else {
            localStorage.setItem(name, value ? "true" : "false");
        }
    }
    getItemString(name: string, defaultValue: string = null) {
        return <string>localStorage.getItem(name) || defaultValue;
    }
    setItemString(name: string, value: string, defaultValue: string = null) {
        if (value === defaultValue) {
            localStorage.removeItem(name);
        } else {
            localStorage.setItem(name, value);
        }
    }
    getItemNumber(name: string, defaultValue: number = null) {
        return Number(localStorage.getItem(name)) || defaultValue;
    }
    setItemNumber(name: string, value: number, defaultValue: number = null) {
        if (value === defaultValue) {
            localStorage.removeItem(name);
        } else {
            localStorage.setItem(name, value === null ? null : value.toString());
        }
    }
}

var settings = new Settings();
