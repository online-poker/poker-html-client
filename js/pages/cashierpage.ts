declare var apiHost: string;

import * as ko from "knockout";
import { App } from "../app";
import * as authManager from "../authmanager";
import { PageBase } from "../ui/pagebase";
import { accountService, reloadManager, websiteService } from "../services";

declare var app: App;

class CashierPage extends PageBase {
    public cashierCaption: KnockoutObservable<string>;
    public player: KnockoutObservable<AccountServiceInformation>;
    public requireAuthentication: boolean = true;
    public loading: KnockoutObservable<boolean>;

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
                    lastTransaction: null,
                });
            }
        });
        this.player = ko.observable({
            login: "",
            accounts: <AccountInformation[]>[],
            lastTransaction: null,
        });
    }
    public activate() {
        super.activate();
        const self = this;
        if (!authManager.authenticated()) {
            app.showPopup("auth");
        } else {
            this.updateInformation();
        }

        reloadManager.setReloadCallback(() => self.updateInformation());
    }
    public async updateInformation() {
        this.loading(true);
        try {
            const result = await accountService.getAccount();
            this.loading(false);
            this.player(result);
        } catch (e) {
            app.closePopup();
        }
    }
    public back() {
        app.lobbyPageBlock.showLobby();
    }
    public withdrawal() {
        websiteService.withdrawal();
    }
    public profile() {
        websiteService.profile();
    }
    public showHistory() {
        app.cashierPageBlock.showSecondary("operationsHistory");
    }
    public deposit() {
        websiteService.madeDeposit();
    }
}
