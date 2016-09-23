/// <reference path="../poker.commanding.api.ts" />

import * as ko from "knockout";
import { PopupBase } from "../ui/popupbase";
import * as authManager from "../authmanager";
import { accountService } from "../services";
import { _ } from "../languagemanager";
import { App } from "../app";

declare var apiHost: string;
declare var app: App;

export class AccountStatusPopup extends PopupBase {
    loading: KnockoutObservable<boolean>;
    information: KnockoutObservable<AccountServiceInformation>;
    loginName: KnockoutObservable<string>;
    tableName: KnockoutObservable<string>;
    smallBlind: KnockoutObservable<number>;
    bigBlind: KnockoutObservable<number>;
    tableInformation: KnockoutComputed<string>;
    betInformation: KnockoutComputed<string>;
    displayCurrencyName: boolean;
    addMoneyAvailable = ko.observable(false);
    addMoneyAllowed = ko.observable(false);

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

    shown() {
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
    addMoney() {
        if (!this.addMoneyAllowed()) {
            return;
        }

        const currentTable = app.tablesPage.currentTable();
        app.addMoneyPopup.tableView(currentTable);
        super.close();
        app.showPopup("addMoney").done(function (results: { name: string; result: any }) {
            if (results.result === "cancel") {
                app.showPopup("accountStatus");
            }
        });
    }

    private requestData() {
        this.loading(true);

        accountService.getAccount().done((result: AccountServiceInformation) => {
            this.loading(false);
            this.information(result);
        }).fail(function() {
            app.closePopup();
        });
    }
}
