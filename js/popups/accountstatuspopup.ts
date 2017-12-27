/// <reference path="../poker.commanding.api.ts" />

import * as ko from "knockout";
import { App } from "../app";
import * as authManager from "../authmanager";
import { _ } from "../languagemanager";
import { accountService } from "../services";
import { PopupBase } from "../ui/popupbase";

declare var app: App;

export class AccountStatusPopup extends PopupBase {
    public loading: KnockoutObservable<boolean>;
    public information: KnockoutObservable<AccountServiceInformation>;
    public loginName: KnockoutObservable<string>;
    public tableName: KnockoutObservable<string>;
    public smallBlind: KnockoutObservable<number>;
    public bigBlind: KnockoutObservable<number>;
    public tableInformation: KnockoutComputed<string>;
    public betInformation: KnockoutComputed<string>;
    public displayCurrencyName: boolean;
    public addMoneyAvailable = ko.observable(false);
    public addMoneyAllowed = ko.observable(false);

    constructor() {
        super();
        this.displayCurrencyName = false;
        this.loading = ko.observable(true);
        this.information = ko.observable<AccountServiceInformation>();
        this.loginName = ko.observable<string>();
        this.tableName = ko.observable<string>();
        this.smallBlind = ko.observable<number>();
        this.bigBlind = ko.observable<number>();

        this.tableInformation = ko.computed(() => {
            return _("accountStatus.tableInfo", { name: this.tableName() });
        }, this);
        this.betInformation = ko.computed(() => {
            return _("accountStatus.betInfo", { sb: this.smallBlind(), bb: this.bigBlind() });
        }, this);
    }

    public shown() {
        super.shown();
        this.requestData();
        this.loginName(authManager.login());
        const tableView = app.tablesPage.currentTable();

        this.tableName(tableView.model.TableName);
        this.smallBlind(tableView.model.SmallBlind);
        this.bigBlind(tableView.model.BigBlind);
        this.addMoneyAvailable(tableView.tournament() == null && tableView.opened());
        this.addMoneyAllowed(tableView.couldAddChips());
    }
    public addMoney() {
        if (!this.addMoneyAllowed()) {
            return;
        }

        const currentTable = app.tablesPage.currentTable();
        app.addMoneyPopup.tableView(currentTable);
        super.close();
        app.showPopup("addMoney").then(function (results: { name: string; result: any }) {
            if (results.result === "cancel") {
                app.showPopup("accountStatus");
            }
        });
    }

    private async requestData() {
        this.loading(true);

        try {
            const result = await accountService.getAccount();
            this.loading(false);
            this.information(result);
        } catch (e) {
            app.closePopup();
        }
    }
}
