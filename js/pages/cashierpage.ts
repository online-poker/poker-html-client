declare var apiHost: string;

import * as ko from "knockout";
import { App } from "../app";
import * as metadataManager from "../metadatamanager";
import * as authManager from "../authManager";
import { PageBase } from "../ui/pagebase";
import { accountService, reloadManager, websiteService } from "../services";

declare var app: App;

class CashierPage extends PageBase {
    cashierCaption: KnockoutObservable<string>;
    player: KnockoutObservable<AccountServiceInformation>;
    requireAuthentication: boolean = true;
    loading: KnockoutObservable<boolean>;

    constructor() {
        super();
        const self = this;
        this.loading = ko.observable(false);
        this.cashierCaption = ko.observable<string>();
        authManager.authenticated.subscribe(function (newValue) {
            if (newValue) {
                self.updateInformation();
            } else {
                self.player({
                    login: "",
                    accounts: <AccountInformation[]>[],
                    lastTransaction: null
                });
            }
        });
        this.player = ko.observable({
            login: "",
            accounts: <AccountInformation[]>[],
            lastTransaction: null
        });
    }
    activate() {
        super.activate();
        const self = this;
        if (!authManager.authenticated()) {
            app.showPopup("auth");
        } else {
            this.updateInformation();
        }

        reloadManager.setReloadCallback(() => self.updateInformation());
    }
    updateInformation() {
        const self = this;
        const realMoneySupported = true;
        const gameMoneySupported = false;
        const api = new OnlinePoker.Commanding.API.Account(apiHost);
        self.loading(true);
        accountService.getAccount().done(function(result: AccountServiceInformation) {
            self.loading(false);
            self.player(result);
        }).fail(function() {
            app.closePopup();
        });
    }
    back() {
        app.lobbyPageBlock.showLobby();
    }
    withdrawal() {
        websiteService.withdrawal();
    }
    profile() {
        websiteService.profile();
    }
    showHistory() {
        app.cashierPageBlock.showSecondary("operationsHistory");
    }
    deposit() {
        websiteService.madeDeposit();
    }
}
