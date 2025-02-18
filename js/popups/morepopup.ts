import { Message } from "@poker/api-server";
import * as ko from "knockout";
import { appConfig } from "poker/appconfig";
import { authManager } from "poker/authmanager";
import { _ } from "poker/languagemanager";
import { App } from "../app";
import { WebsiteService } from "../services";
import { AccountManager } from "../services/accountManager";
import { settings } from "../settings";

declare const host: string;
declare const app: App;

export class MorePopup {
    public authenticated: ko.Computed<boolean>;
    public login: ko.Computed<string>;
    public amount: ko.Observable<number>;
    public points = ko.observable<number>(0);
    public loading: ko.Observable<boolean>;
    public hasMessages = ko.observable(false);
    public visible = ko.observable(false);
    public ratingSupported = ko.observable(appConfig.game.hasRating);
    public isDesktopApp = ko.observable(appConfig.ui.isDesktopApp);
    public infoPagesSupported = ko.observable(appConfig.info.hasInfoPages);
    public supportPagesSupported = ko.observable(appConfig.info.hasSupportPages);
    public registrationSupported = ko.observable(appConfig.auth.allowSelfRegistration);

    constructor() {
        this.authenticated = ko.computed(function () {
            return authManager.authenticated();
        }, this);
        this.login = ko.computed(function () {
            return authManager.login();
        }, this);
        this.loading = ko.observable(false);
        authManager.registerAuthenticationChangedHandler((newValue) => {
            if (authManager.login() === null) {
                this.amount(0);
            } else {
                this.update();
            }
        });
        this.amount = ko.observable(0);
    }
    public async update() {
        if (!authManager.authenticated()) {
            return;
        }

        this.loading(true);
        try {
            await this.updateAccountData();
            await this.updateMessagesStatus();
            this.loading(false);
        } catch (e) {
            this.update();
        }
    }
    public showAccount() {
        app.executeCommand("pageblock.cashier");
    }
    public showRating() {
        app.otherPageBlock.showRating();
    }
    public showChat() {
        app.otherPageBlock.showChat();
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
    public async showQuitPrompt() {
        await app.prompt(_("common.quit"), [_("common.quitApp")]);
        this.quitApp();
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
        const manager = new AccountManager();
        const data = await manager.getAccount();
        if (data.Status === "Ok") {
            const personalAccountData = data.Data;
            const total = personalAccountData.RealMoney;
            this.amount(total);
            this.points(personalAccountData.Points);
        } else {
            console.error("Error during making call to Account.GetPlayerDefinition in MorePopup");
        }

        return data;
    }

    /**
     * Starts requesting message status
     */
    private async updateMessagesStatus() {
        const mapi = new Message(host);
        const data = await mapi.getInboxMessages(0, 20, 1 /* Unread */, false);
        if (data.Status === "Ok") {
            if (data.Data.Messages.length > 0) {
                this.hasMessages(true);
            } else {
                this.hasMessages(false);
            }
        } else {
            console.error("Error during making call to Message.GetInboxMessages in MorePopup");
        }

        return data;
    }
}
