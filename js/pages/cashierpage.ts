import * as ko from "knockout";
import { authManager } from "poker/authmanager";
import { App } from "../app";
import { accountService, reloadManager, WebsiteService } from "../services";
import { PageBase } from "../ui/pagebase";

declare const host: string;
declare const app: App;

class CashierPage extends PageBase {
    public cashierCaption: ko.Observable<string>;
    public player: ko.Observable<AccountServiceInformation>;
    public requireAuthentication: boolean = true;
    public loading: ko.Observable<boolean>;

    constructor() {
        super();
        this.loading = ko.observable(false);
        this.cashierCaption = ko.observable<string>();
        authManager.registerAuthenticationChangedHandler((newValue) => {
            if (newValue) {
                this.updateInformation();
            } else {
                this.player({
                    login: "",
                    accounts: [] as AccountInformation[],
                    lastTransaction: null,
                });
            }
        });
        this.player = ko.observable({
            login: "",
            accounts: [] as AccountInformation[],
            lastTransaction: null,
        });
    }
    public activate() {
        super.activate();
        if (!authManager.authenticated()) {
            app.showPopup("auth");
        } else {
            this.updateInformation();
        }

        reloadManager.setReloadCallback(() => this.updateInformation());
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
        const websiteService = new WebsiteService(host);
        websiteService.withdrawal();
    }
    public profile() {
        const websiteService = new WebsiteService(host);
        websiteService.profile();
    }
    public showHistory() {
        app.cashierPageBlock.showSecondary("operationsHistory");
    }
    public deposit() {
        const websiteService = new WebsiteService(host);
        websiteService.madeDeposit();
    }
}
