/// <reference path="../_references.ts" />
/// <reference path="../poker.commanding.api.ts" />
/// <reference path="../authmanager.ts" />
/// <reference path="../settings.ts" />

declare var apiHost: string;

import * as ko from "knockout";
import { App } from "../app";
import * as authManager from "../authManager";

declare var app: App;

export class MorePopup {
    authenticated: KnockoutObservable<boolean>;
    login: KnockoutComputed<string>;
    amount: KnockoutObservable<number>;
    points = ko.observable<number>(0);
    loading: KnockoutObservable<boolean>;
    hasMessages = ko.observable(false);
    visible = ko.observable(false);

    constructor() {
        var self = this;
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
    update() {
        if (!authManager.authenticated()) {
            return;
        }

        var self = this;
        this.loading(true);
        var api = new OnlinePoker.Commanding.API.Account(apiHost);
        $.when(this.updateAccountData(), this.updateMessagesStatus()).then(function () {
            self.loading(false);
        }, function () {
            self.update();
        });
    }
    showAccount() {
        app.executeCommand("pageblock.cashier");
    }
    showRating() {
        app.executeCommand("pageblock.other");
        app.otherPageBlock.showSecondary("rating");
    }
    showChat() {
        app.executeCommand("pageblock.other");
        app.otherPageBlock.showSecondary("chat");
    }
    showMessages() {
        websiteService.messages();
    }
    showInformation() {
        app.executeCommand("pageblock.info");
        app.infoPageBlock.showPrimary();
    }
    showProfile() {
        websiteService.profile();
    }
    showContactUs() {
        app.executeCommand("pageblock.info");
        app.infoPageBlock.showContactUs();
    }
    showRegistration() {
        app.showPopup("registration");
    }

    /**
    * Starts request for the account data.
    */
    private updateAccountData() {
        var self = this;
        var api = new OnlinePoker.Commanding.API.Account(apiHost);
        return api.GetPlayerDefinition(null).then(function (data) {
            if (data.Status === "Ok") {
                var personalAccountData = data.Data;
                var total = settings.isGuest() ? personalAccountData.GameMoney : personalAccountData.RealMoney;
                self.amount(total);
                self.points(personalAccountData.Points);
            } else {
                console.error("Error during making call to Account.GetPlayerDefinition in MorePopup");
            }

            return data;
        });
    }

    /**
    * Starts requesting message status
    */
    private updateMessagesStatus() {
        var self = this;
        var mapi = new OnlinePoker.Commanding.API.Message(apiHost);
        return mapi.GetInboxMessages(0, 20, 1 /* Unread */, false, null).then(function (data) {
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
        });
    }
}
