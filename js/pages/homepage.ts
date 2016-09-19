declare var apiHost: string;

import { App } from "../app";
import * as timeService from "../timeService";
import * as metadataManager from "../metadatamanager";
import * as authManager from "../authManager";
import { PageBase } from "../ui/pagebase";
import { keyboardActivationService } from "../services";
import { debugSettings } from "../debugsettings";
import { settings } from "../settings";
import { _ } from "../languagemanager";

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
        authManager.authenticated.subscribe((value) => {
            this.banners(metadataManager.smallBanners);
        });
    }
    deactivate(pageName?: string) {
        super.deactivate(pageName);
        this.stopNews();
        this.stopBanner();
    }
    activate(pageName?: string) {
        super.activate(pageName);
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
        const metadataApi = new OnlinePoker.Commanding.API.Metadata(apiHost);
        metadataManager.updateOnline();
        metadataApi.GetNews((data) => {
            if (data.Status === "Ok") {
                this.news(data.Data);
                let i = 0;
                if (data.Data.length > 0 && i < data.Data.length) {
                    this.currentNews(data.Data[i]);
                }
            }
        });
    }
    showGames() {
        app.showPageBlock("lobby");
        app.showSubPage("lobby");
    }
    login() {
        const username = this.username();
        const password = this.password();
        if (username === null || username.trim() === "") {
            this.errorMessage(_("homePage.userRequired"));
            return;
        }

        if (password == null || password.trim() === "") {
            this.errorMessage(_("homePage.passwordRequired"));
            return;
        }

        if (app.processing()) {
            return;
        }

        keyboardActivationService.forceHideKeyboard();

        app.processing(true);
        authManager.authenticate(username, password, this.rememberMe())
            .pipe((status: string) => {
                app.processing(false);
                if (status === "Ok") {
                    this.errorMessage(null);
                    this.username("");
                    this.password("");
                    app.lobbyPageBlock.showLobby();
                } else {
                    if (status) {
                        this.errorMessage(_("errors." + status));
                    } else {
                        this.errorMessage(_("auth.unspecifiedError"));
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
        this.stopNews();
        let i = 0;
        this.intervalHandle = timeService.setInterval(() => {
            i++;
            if (this.news().length <= i) {
                this.logNews("Reset iteration counter to 0 because " + i.toString() + " bigger then " + this.news().length);
                i = 0;
            }

            this.logNews("Setting news item " + i.toString());
            this.currentNews(this.news()[i]);
        }, 20 * 1000);
    }
    stopNews() {
        if (this.intervalHandle !== null) {
            timeService.clearInterval(this.intervalHandle);
            this.intervalHandle = null;
        }
    }
    startBanner() {
        this.stopBanner();
        let j = 0;
        this.bannerIntervalHandle = timeService.setInterval(() => {
            j++;
            if (this.banners().length <= j) {
                j = 0;
            }

            this.currentBanner(this.banners()[j]);
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
        app.processing(true);
        authManager.loginAsGuest().then((status) => {
            app.processing(false);
            if (!status) {
                this.errorMessage(_("auth.unspecifiedError"));
            } else {
                if (status !== "Ok") {
                    this.errorMessage(_("errors." + status));
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
