import * as ko from "knockout";
import { appConfig } from "poker/appconfig";
import { authManager } from "poker/authmanager";
import { App } from "../app";
import { AccountManager } from "../services/accountManager";
import { settings } from "../settings";
import { PageBase } from "../ui/pagebase";

declare var app: App;

interface AccountPagePlayerAccountModel {
    currencyName: string;
    ingame: number;
    total: number;
    available: number;
}

interface AccountPagePlayerModel {
    login: string;
    email: string;
    phoneNumber: string;
    firstName: string;
    lastName: string;
    monthPoints: number;
    yearPoints: number;
    status: string;
    accounts: AccountPagePlayerAccountModel[];
    stars: number;
}

/** Account Page */
export class AccountPage extends PageBase {
    public cashierCaption: KnockoutObservable<string>;
    public loading: KnockoutObservable<boolean>;
    public player: KnockoutObservable<AccountPagePlayerModel>;
    public ratingSupported = ko.observable(appConfig.game.hasRating);

    constructor() {
        super();
        const self = this;
        this.cashierCaption = ko.observable<string>();
        this.loading = ko.observable(false);
        const emptyElement: AccountPagePlayerModel = {
            login: "",
            email: "",
            phoneNumber: "",
            firstName: "",
            lastName: "",
            monthPoints: 0,
            yearPoints: 0,
            status: "status1",
            accounts: [],
            stars: 0,
        };
        authManager.registerAuthenticationChangedHandler(function(newValue) {
            if (newValue) {
                self.updateInformation(true);
            } else {
                self.player(emptyElement);
            }
        });
        this.player = ko.observable(emptyElement);
    }
    public activate() {
        super.activate();
        if (!authManager.authenticated()) {
            app.showPopup("auth");
        } else {
            this.updateInformation(false);
        }
    }
    public back() {
        app.lobbyPageBlock.showLobby();
    }
    public changePassword() {
        app.showPopup("changePassword");
    }
    private updateInformation(force: boolean) {
        if (this.loading() && !force) {
            return;
        }

        const self = this;
        const realMoneySupported = !settings.isGuest();
        const gameMoneySupported = settings.isGuest();
        const pointsSupported = true;
        this.loading(true);
        this.requestData(realMoneySupported, gameMoneySupported, pointsSupported).then(
            () => self.loading(false),
            () => this.requestData(realMoneySupported, gameMoneySupported, pointsSupported));
    }

    private async requestData(realMoneySupported: boolean, gameMoneySupported: boolean, pointsSupported: boolean) {
        const self = this;
        const api = new AccountManager();
        const data = await api.getPlayer();
        self.loading(false);
        const personalAccountData = data.Data;
        if (!self.visible()) {
            return;
        }

        const accountsData = [] as AccountPagePlayerAccountModel[];
        if (realMoneySupported) {
            accountsData.push({
                currencyName: "currency.realmoney",
                available: personalAccountData.RealMoney,
                ingame: 0,
                total: personalAccountData.RealMoney,
            });
        }

        if (gameMoneySupported) {
            accountsData.push({
                currencyName: "currency.gamemoney",
                available: personalAccountData.GameMoney,
                ingame: 0,
                total: personalAccountData.GameMoney,
            });
        }

        if (pointsSupported) {
            accountsData.push({
                currencyName: "currency.rewardpoints",
                available: personalAccountData.Points,
                ingame: 0,
                total: personalAccountData.Points,
            });
        }

        let status = "status0";
        if (parseInt(personalAccountData.Properties.Points, 10) >= 100000) {
            status = "status1";
        }

        if (parseInt(personalAccountData.Properties.Points, 10) >= 200000) {
            status = "status2";
        }

        if (parseInt(personalAccountData.Properties.Points, 10) >= 500000) {
            status = "status3";
        }

        self.player({
            login: authManager.login(),
            email: personalAccountData.Email,
            firstName: personalAccountData.FirstName,
            lastName: personalAccountData.LastName,
            phoneNumber: personalAccountData.PhoneNumber,
            monthPoints: parseInt(personalAccountData.Properties.Points, 10),
            yearPoints: parseInt(personalAccountData.Properties.Points, 10),
            status,
            accounts: accountsData,
            stars: parseInt(personalAccountData.Properties.Stars, 10),
        });
    }
}
