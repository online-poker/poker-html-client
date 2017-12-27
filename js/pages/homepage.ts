declare var host: string;

import { Information } from "../api/information";
import { App } from "../app";
import { appConfig } from "../appconfig";
import * as authManager from "../authmanager";
import { debugSettings } from "../debugsettings";
import { _ } from "../languagemanager";
import * as metadataManager from "../metadatamanager";
import { PageBlock } from "../pageblock";
import { keyboardActivationService } from "../services";
import { settings } from "../settings";
import * as timeService from "../timeservice";
import { PageBase } from "../ui/pagebase";

declare var app: App;

export class HomePage extends PageBase {
    public online: KnockoutObservable<string>;
    public registered: KnockoutObservable<string>;
    public news = ko.observableArray<string>([]);
    public currentNews = ko.observable("");
    public username: KnockoutObservable<string>;
    public password: KnockoutObservable<string>;
    public errorMessage: KnockoutObservable<string>;
    public rememberMe: KnockoutObservable<boolean>;

    public captionLabel: KnockoutComputed<string>;
    public authenticatedUser: KnockoutComputed<string>;
    public authenticated: KnockoutComputed<boolean>;
    public banners = ko.observableArray<BannerData>([]);
    public currentBanner = ko.observable<BannerData>({
        Id: 0,
        Title: "",
        Url: "",
        Link: "",
    });
    public bannerIntervalHandle: number = null;
    private intervalHandle: number = null;

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
    public deactivate(pageName?: string) {
        super.deactivate(pageName);
        this.stopNews();
        this.stopBanner();
    }
    public activate(pageName?: string) {
        super.activate(pageName);
        this.update();
        this.username(settings.login());
        this.password(settings.password());
        if (this.username() != null) {
            this.rememberMe(true);
            if (appConfig.auth.automaticLogin) {
                this.login();
            }
        }

        this.startNews();
        this.startBanner();
        app.processing(false);
    }
    public async update() {
        this.logNews("Updating home page");
        const metadataApi = new Information(host);
        await metadataManager.updateOnline();
        const data = await metadataApi.getNews();
        if (data.Status === "Ok") {
            this.news(data.Data);
            const i = 0;
            if (data.Data.length > 0 && i < data.Data.length) {
                this.currentNews(data.Data[i]);
            }
        }
    }
    public showGames() {
        app.showPageBlock("lobby");
        app.showSubPage("lobby");
    }
    public login() {
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
            .then((status: string) => {
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
    public logout() {
        // do nothing.
    }
    public forgetPassword() {
        app.showPopup("forgetPassword");
    }
    public showAuthPopup() {
        app.showPopup("auth");
    }
    /**
     * Performs one click authorization as a guest.
     */
    public loginAsGuest() {
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
    public openBanner() {
        window.open(this.currentBanner().Link, "_system", "location=yes");
    }
    private startNews() {
        this.stopNews();
        let i = 0;
        this.intervalHandle = timeService.setInterval(() => {
            i++;
            if (this.news().length <= i) {
                this.logNews(`Reset iteration counter to 0 because ${i} bigger then ${this.news().length}`);
                i = 0;
            }

            this.logNews("Setting news item " + i.toString());
            this.currentNews(this.news()[i]);
        }, 20 * 1000);
    }
    private stopNews() {
        if (this.intervalHandle !== null) {
            timeService.clearInterval(this.intervalHandle);
            this.intervalHandle = null;
        }
    }
    private startBanner() {
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
    private stopBanner() {
        if (this.bannerIntervalHandle !== null) {
            timeService.clearInterval(this.bannerIntervalHandle);
            this.bannerIntervalHandle = null;
        }
    }
    private logNews(message: string, ...params: any[]) {
        if (debugSettings.home.traceNews) {
            console.log(message, params);
        }
    }
}
