import { Message } from "@poker/api-server";
import * as ko from "knockout";
import { appConfig } from "poker/appconfig";
import { authManager } from "poker/authmanager";
import { _ } from "poker/languagemanager";
import { App } from "../app";
import { WebsiteService } from "../services";
import { AccountManager } from "../services/accountManager";
import { settings } from "../settings";

declare var host: string;
declare var app: App;

export class MorePopup {
    public authenticated: KnockoutObservable<boolean>;
    public login: KnockoutComputed<string>;
    public amount: KnockoutObservable<number>;
    public points = ko.observable<number>(0);
    public loading: KnockoutObservable<boolean>;
    public hasMessages = ko.observable(false);
    public visible = ko.observable(false);
    public ratingSupported = ko.observable(appConfig.game.hasRating);
    public isDesktopApp = ko.observable(appConfig.ui.isDesktopApp);
    public infoPagesSupported = ko.observable(appConfig.info.hasInfoPages);
    public supportPagesSupported = ko.observable(appConfig.info.hasSupportPages);
    public registrationSupported = ko.observable(appConfig.auth.allowSelfRegistration);

    constructor() {
        const self = this;
        this.authenticated = ko.computed(function () {
            return authManager.authenticated();
        }, this);
        this.login = ko.computed(function () {
            return authManager.login();
        }, this);
        this.loading = ko.observable(false);
        authManager.registerAuthenticationChangedHandler(function (newValue) {
            if (authManager.login() === null) {
                self.amount(0);
            } else {
                self.update();
            }
        });
        this.amount = ko.observable(0);
    }
    public async update() {
        if (!authManager.authenticated()) {
            return;
        }

        const self = this;
        this.loading(true);
        try {
            await this.updateAccountData();
            await this.updateMessagesStatus();
            self.loading(false);
        } catch (e) {
            self.update();
        }
    }
    public showAccount() {
        app.executeCommand("pageblock.cashier");
    }
    public showRating() {
        app.executeCommand("pageblock.other");
        app.otherPageBlock.showSecondary("rating");
    }
    public showChat() {
        app.executeCommand("pageblock.other");
        app.otherPageBlock.showSecondary("chat");
    }
    public showMessages() {
        const websiteService = new WebsiteService(host);
        websiteService.messages();
    }
    public showInformation() {
        app.executeCommand("pageblock.info");
        app.infoPageBlock.showPrimary();
    }
    public showProfile() {
        const websiteService = new WebsiteService(host);
        websiteService.profile();
    }
    public showContactUs() {
        app.executeCommand("pageblock.info");
        app.infoPageBlock.showContactUs();
    }
    public showRegistration() {
        app.showPopup("registration");
    }
    public showQuitPrompt() {
        const self = this;
        app.prompt(_("common.quit"), [_("common.quitApp")]).then(function () {
            self.quitApp();
        });
    }

    /**
     * Quit current browser window.
     */
    private quitApp() {
        authManager.logout();
        window.close();
    }
    /**
     * Starts request for the account data.
     */
    private async updateAccountData() {
        const self = this;
        const manager = new AccountManager();
        const data = await manager.getAccount();
        if (data.Status === "Ok") {
            const personalAccountData = data.Data;
            const total = settings.isGuest() ? personalAccountData.GameMoney : personalAccountData.RealMoney;
            self.amount(total);
            self.points(personalAccountData.Points);
        } else {
            console.error("Error during making call to Account.GetPlayerDefinition in MorePopup");
        }

        return data;
    }

    /**
     * Starts requesting message status
     */
    private async updateMessagesStatus() {
        const self = this;
        const mapi = new Message(host);
        const data = await mapi.getInboxMessages(0, 20, 1 /* Unread */, false);
        if (data.Status === "Ok") {
            if (data.Data.Messages.length > 0) {
                self.hasMessages(true);
            } else {
                self.hasMessages(false);
            }
        } else {
            console.error("Error during making call to Message.GetInboxMessages in MorePopup");
        }

        return data;
    }
}
