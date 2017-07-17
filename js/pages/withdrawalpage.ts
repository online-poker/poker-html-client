declare var apiHost: string;

import { App } from "../app";
import * as authManager from "../authmanager";
import { PageBase } from "../ui/pagebase";

declare var app: App;

export class WithdrawalPage extends PageBase {
    public player: KnockoutObservable<any>;
    public withdrawalMethods: KnockoutObservableArray<any>;
    public withdrawalMethod: KnockoutObservable<number>;
    public withdrawalAmount: KnockoutObservable<number>;
    public accountNumber: KnockoutObservable<number>;

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
        authManager.authenticated.subscribe(async (newValue) => {
            if (newValue) {
                const api = new OnlinePoker.Commanding.API.Account(apiHost);
                const data = await api.GetPersonalAccount();
                const personalAccountData = data.Data;
                self.player({
                    login: authManager.login(),
                    amount: personalAccountData.RealMoney,
                });
            } else {
                self.player({
                    login: "",
                    amount: null,
                });
            }
        });
        this.player = ko.observable({
            login: "",
            amount: null,
        });
    }
    public activate() {
        super.activate();
        if (!authManager.authenticated()) {
            app.showPopup("auth");
        }
    }
    public back() {
        if (!PageBlock.useDoubleView) {
            app.cashierPageBlock.showPrimary();
        } else {
            app.lobbyPageBlock.showLobby();
        }
    }
}
