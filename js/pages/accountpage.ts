import * as ko from "knockout";
import { appConfig } from "poker/appconfig";
import { authManager } from "poker/authmanager";
import { App } from "../app";
import { AccountManager } from "../services/accountManager";
import { settings } from "../settings";
import { PageBase } from "../ui/pagebase";

declare const app: App;

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

export class AccountPage extends PageBase {
    public cashierCaption: ko.Observable<string>;
    public loading: ko.Observable<boolean>;
    public player: ko.Observable<AccountPagePlayerModel>;
    public ratingSupported = ko.observable(appConfig.game.hasRating);

    constructor() {
        super();
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
        authManager.registerAuthenticationChangedHandler((newValue) => {
            if (newValue) {
                this.updateInformation(true);
            } else {
                this.player(emptyElement);
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

        const realMoneySupported = true;
        const gameMoneySupported = false;
        const pointsSupported = true;
        this.loading(true);
        this.requestData(realMoneySupported, gameMoneySupported, pointsSupported).then(
            () => this.loading(false),
            () => this.requestData(realMoneySupported, gameMoneySupported, pointsSupported));
    }

    private async requestData(realMoneySupported: boolean, gameMoneySupported: boolean, pointsSupported: boolean) {
        const api = new AccountManager();
        const data = await api.getPlayer();
        this.loading(false);
        const personalAccountData = data.Data;
        if (!this.visible()) {
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

        this.player({
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
