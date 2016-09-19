declare var apiHost: string;

import { App } from "../app";
import * as metadataManager from "../metadatamanager";
import * as authManager from "../authManager";
import { PageBase } from "../ui/pagebase";

declare var app: App;

export class WithdrawalPage extends PageBase {
    player: KnockoutObservable<any>;
    withdrawalMethods: KnockoutObservableArray<any>;
    withdrawalMethod: KnockoutObservable<number>;
    withdrawalAmount: KnockoutObservable<number>;
    accountNumber: KnockoutObservable<number>;

    constructor() {
        super();
        App.addTabBarItemMapping("cashier", "withdrawal");
        const self = this;
        this.withdrawalAmount = ko.observable(null);
        this.withdrawalMethod = ko.observable(null);
        this.withdrawalMethods = ko.observableArray([
            { id: 1, text: "Unitbag" },
            { id: 2, text: "Visa" },
            { id: 3, text: "MasterCard" },
        ]);
        this.accountNumber = ko.observable(null);
        authManager.authenticated.subscribe(function (newValue) {
            if (newValue) {
                const api = new OnlinePoker.Commanding.API.Account(apiHost);
                api.GetPersonalAccount(function (data) {
                    const personalAccountData = data.Data;
                    self.player({
                        login: authManager.login(),
                        amount: personalAccountData.RealMoney
                    });
                });
            } else {
                self.player({
                    login: "",
                    amount: null
                });
            }
        });
        this.player = ko.observable({
            login: "",
            amount: null
        });
    }
    activate() {
        super.activate();
        if (!authManager.authenticated()) {
            app.showPopup("auth");
        }
    }
    back() {
        if (!PageBlock.useDoubleView) {
            app.cashierPageBlock.showPrimary();
        } else {
            app.lobbyPageBlock.showLobby();
        }
    }
}
