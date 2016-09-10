/// <reference types="knockout" />
/// <reference path="../app.ts" />
/// <reference path="../ui/pagebase.ts" />
/// <reference path="../messages.ts" />
/// <reference path="../languagemanager.ts" />
/// <reference path="../metadatamanager.ts" />
/// <reference path="../poker.commanding.api.ts" />
/// <reference path="../authmanager.ts" />

import * as ko from "knockout";
import * as authManager from "../authManager";
import { PageBase } from "../ui/pagebase";
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
        var self = this;
        this.cashierCaption = ko.observable<string>();
        this.loading = ko.observable(false);
        var emptyElement = {
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

        var self = this;
        var realMoneySupported = !settings.isGuest();
        var gameMoneySupported = settings.isGuest();
        var pointsSupported = true;
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

    private requestData(realMoneySupported: boolean, gameMoneySupported: boolean, pointsSupported: boolean) {
        var self = this;
        var api = new OnlinePoker.Commanding.API.Account(apiHost);
        return api.GetPlayerDefinition(function (data) {
            self.loading(false);
            var personalAccountData = <PlayerDefinition>data.Data;
            console.log(personalAccountData);
            if (!self.visible()) {
                return;
            }

            var accountsData = <AccountPagePlayerAccountModel[]>[];
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

            var status = "status0";
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
        });
    }
}
