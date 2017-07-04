import * as ko from "knockout";
import * as authManager from "../authmanager";
import { PageBase } from "../ui/pagebase";
import { settings } from "../settings";
import { App } from "../app";

declare var apiHost: string;
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
    firstName: string;
    lastName: string;
    monthPoints: number;
    yearPoints: number;
    status: string;
    accounts: AccountPagePlayerAccountModel[];
    stars: number;
}

export class AccountPage extends PageBase {
    cashierCaption: KnockoutObservable<string>;
    loading: KnockoutObservable<boolean>;
    player: KnockoutObservable<any>;

    constructor() {
        super();
        App.addTabBarItemMapping("cashier", "account");
        const self = this;
        this.cashierCaption = ko.observable<string>();
        this.loading = ko.observable(false);
        const emptyElement = {
            login: "",
            email: "",
            firstName: "",
            lastName: "",
            monthPoints: 0,
            yearPoints: 0,
            status: "status1",
            accounts: [],
            stars: 0
        };
        authManager.authenticated.subscribe(function (newValue) {
            if (newValue) {
                self.updateInformation(true);
            } else {
                self.player(emptyElement);
            }
        });
        this.player = ko.observable(emptyElement);
    }
    activate() {
        super.activate();
        if (!authManager.authenticated()) {
            app.showPopup("auth");
        } else {
            this.updateInformation(false);
        }
    }
    updateInformation(force: boolean) {
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
    back() {
        app.lobbyPageBlock.showLobby();
    }
    changePassword() {
        app.showPopup("changePassword");
    }

    private async requestData(realMoneySupported: boolean, gameMoneySupported: boolean, pointsSupported: boolean) {
        const self = this;
        const api = new OnlinePoker.Commanding.API.Account(apiHost);
        const data = await api.GetPlayerDefinition();
        self.loading(false);
        const personalAccountData = data.Data;
        console.log(personalAccountData);
        if (!self.visible()) {
            return;
        }

        const accountsData = <AccountPagePlayerAccountModel[]>[];
        if (realMoneySupported) {
            accountsData.push({
                currencyName: "currency.realmoney",
                available: personalAccountData.RealMoney,
                ingame: 0,
                total: personalAccountData.RealMoney
            });
        }

        if (gameMoneySupported) {
            accountsData.push({
                currencyName: "currency.gamemoney",
                available: personalAccountData.GameMoney,
                ingame: 0,
                total: personalAccountData.GameMoney
            });
        }

        if (pointsSupported) {
            accountsData.push({
                currencyName: "currency.rewardpoints",
                available: personalAccountData.Points,
                ingame: 0,
                total: personalAccountData.Points
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
            monthPoints: parseInt(personalAccountData.Properties.Points, 10),
            yearPoints: parseInt(personalAccountData.Properties.Points, 10),
            status: status,
            accounts: accountsData,
            stars: personalAccountData.Properties.Stars
        });
    }
}
