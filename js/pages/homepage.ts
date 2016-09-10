/// <reference types="knockout" />
/// <reference path="../app.ts" />
/// <reference path="../ui/pagebase.ts" />
/// <reference path="../messages.ts" />
/// <reference path="../languagemanager.ts" />
/// <reference path="../metadatamanager.ts" />
/// <reference path="../poker.commanding.api.ts" />

declare var apiHost: string;

import { App } from "../app";
import * as timeService from "../timeService";
import * as metadataManager from "../metadatamanager";
import * as authManager from "../authManager";
import { PageBase } from "../ui/pagebase";
import { keyboardActivationService } from "../services";
import { debugSettings } from "../debugsettings";
import { settings } from "../settings";

declare var app: App;

export class HomePage extends PageBase {
    online: KnockoutObservable<string>;
    registered: KnockoutObservable<string>;
    news = ko.observableArray<string>([]);
    currentNews = ko.observable("");
    username: KnockoutObservable<string>;
    password: KnockoutObservable<string>;
    errorMessage: KnockoutObservable<string>;
    rememberMe: KnockoutObservable<boolean>;

    captionLabel: KnockoutComputed<string>;
    authenticatedUser: KnockoutComputed<string>;
    authenticated: KnockoutComputed<boolean>;
    intervalHandle: number = null;
    banners = ko.observableArray<BannerData>([]);
    currentBanner = ko.observable<BannerData>({
        Id: 0,
        Title: "",
        Url: "",
        Link: ""
    });
    bannerIntervalHandle: number = null;

    constructor() {
        super();
        var self = this;
        this.online = metadataManager.online;
        this.registered = metadataManager.registered;
        this.captionLabel = ko.computed(function () {
            return _("header.onlinePlayers")
                .replace("#registered", this.registered())
                .replace("#online", this.online());
        }, this);
        this.rememberMe = ko.observable(false);
        this.username = ko.observable("");
        this.password = ko.observable("");
        this.errorMessage = ko.observable<string>();
        this.authenticated = ko.computed(function () {
            return authManager.authenticated();
        }, this);
        this.authenticatedUser = ko.computed(function () {
            return authManager.login();
        }, this);
        authManager.authenticated.subscribe(function (value) {
            self.banners(metadataManager.smallBanners);
        });
    }
    deactivate(pageName?: string) {
        super.deactivate(pageName);
        this.stopNews();
        this.stopBanner();
    }
    activate(pageName?: string) {
        super.activate(pageName);
        var self = this;
        this.update();
        this.username(settings.login());
        this.password(settings.password());
        if (this.username() != null) {
            this.rememberMe(true);
        }

        this.startNews();
        this.startBanner();
        app.processing(false);
    }
    update() {
        this.logNews("Updating home page");
        var self = this;
        var metadataApi = new OnlinePoker.Commanding.API.Metadata(apiHost);
        metadataManager.updateOnline();
        metadataApi.GetNews(function (data) {
            if (data.Status === "Ok") {
                self.news(data.Data);
                var i = 0;
                if (data.Data.length > 0 && i < data.Data.length) {
                    self.currentNews(data.Data[i]);
                }
            }
        });
    }
    showGames() {
        app.showPageBlock("lobby");
        app.showSubPage("lobby");
    }
    login() {
        var self = this;
        var username = this.username();
        var password = this.password();
        if (username === null || username.trim() === "") {
            self.errorMessage(_("homePage.userRequired"));
            return;
        }

        if (password == null || password.trim() === "") {
            self.errorMessage(_("homePage.passwordRequired"));
            return;
        }

        if (app.processing()) {
            return;
        }

        keyboardActivationService.forceHideKeyboard();

        app.processing(true);
        authManager.authenticate(username, password, this.rememberMe())
            .pipe(function (status: string) {
                app.processing(false);
                if (status === "Ok") {
                    self.errorMessage(null);
                    self.username("");
                    self.password("");
                    app.lobbyPageBlock.showLobby();
                } else {
                    if (status) {
                        self.errorMessage(_("errors." + status));
                    } else {
                        self.errorMessage(_("auth.unspecifiedError"));
                    }
                }
            }, function () {
                app.processing(false);
            });
    }
    logout() {
		// do nothing.
    }
    forgetPassword() {
        app.showPopup("forgetPassword");
    }
    startNews() {
        var self = this;
        this.stopNews();
        var i = 0;
        this.intervalHandle = timeService.setInterval(function () {
            i++;
            if (self.news().length <= i) {
                self.logNews("Reset iteration counter to 0 because " + i.toString() + " bigger then " + self.news().length);
                i = 0;
            }

            self.logNews("Setting news item " + i.toString());
            self.currentNews(self.news()[i]);
        }, 20 * 1000);
    }
    stopNews() {
        if (this.intervalHandle !== null) {
            timeService.clearInterval(this.intervalHandle);
            this.intervalHandle = null;
        }
    }
    startBanner() {
        var self = this;
        this.stopBanner();
        var j = 0;
        this.bannerIntervalHandle = timeService.setInterval(function () {
            j++;
            if (self.banners().length <= j) {
                j = 0;
            }

            self.currentBanner(self.banners()[j]);
        }, 4 * 1000);
    }
    stopBanner() {
        if (this.bannerIntervalHandle !== null) {
            timeService.clearInterval(this.bannerIntervalHandle);
            this.bannerIntervalHandle = null;
        }
    }
    showAuthPopup() {
        app.showPopup("auth");
    }
    /**
    * Performs one click authorization as a guest.
    */
    loginAsGuest() {
        var self = this;
        app.processing(true);
        authManager.loginAsGuest().then(function (status) {
            app.processing(false);
            if (!status) {
                self.errorMessage(_("auth.unspecifiedError"));
            } else {
                if (status !== "Ok") {
                    self.errorMessage(_("errors." + status));
                } else {
                    app.lobbyPageBlock.showLobby();
                }
            }
        });
    }
    openBanner() {
        window.open(this.currentBanner().Link, "_system", "location=yes");
    }
    private logNews(message: string, ...params: any[]) {
        if (debugSettings.home.traceNews) {
            console.log(message, params);
        }
    }
}
