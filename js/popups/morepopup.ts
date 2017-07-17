/// <reference path="../poker.commanding.api.ts" />

declare var apiHost: string;

import * as ko from "knockout";
import { App } from "../app";
import * as authManager from "../authmanager";
import { settings } from "../settings";
import { websiteService } from "../services";

declare var app: App;

export class MorePopup {
    public authenticated: KnockoutObservable<boolean>;
    public login: KnockoutComputed<string>;
    public amount: KnockoutObservable<number>;
    public points = ko.observable<number>(0);
    public loading: KnockoutObservable<boolean>;
    public hasMessages = ko.observable(false);
    public visible = ko.observable(false);

    constructor() {
        const self = this;
        this.authenticated = ko.computed(function () {
            return authManager.authenticated();
        }, this);
        this.login = ko.computed(function () {
            return authManager.login();
        }, this);
        this.loading = ko.observable(false);
        authManager.login.subscribe(function (newValue) {
            if (newValue === null) {
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
            await Promise.all([this.updateAccountData(), this.updateMessagesStatus()]);
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
        websiteService.messages();
    }
    public showInformation() {
        app.executeCommand("pageblock.info");
        app.infoPageBlock.showPrimary();
    }
    public showProfile() {
        websiteService.profile();
    }
    public showContactUs() {
        app.executeCommand("pageblock.info");
        app.infoPageBlock.showContactUs();
    }
    public showRegistration() {
        app.showPopup("registration");
    }

    /**
     * Starts request for the account data.
     */
    private async updateAccountData() {
        const self = this;
        const api = new OnlinePoker.Commanding.API.Account(apiHost);
        const data = await api.GetPlayerDefinition();
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
        const mapi = new OnlinePoker.Commanding.API.Message(apiHost);
        const data = await mapi.GetInboxMessages(0, 20, 1 /* Unread */, false);
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
