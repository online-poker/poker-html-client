/// <reference path="../_references.ts" />
/// <reference path="../poker.commanding.api.ts" />
/// <reference path="../app.ts" />
/// <reference path="../authmanager.ts" />
/// <reference path="../services/_allservices.ts" />

declare var apiHost: string;

import * as ko from "knockout";
import { PopupBase } from "../ui/popupbase";
import * as authManager from "../authmanager";
import { accountService } from "../services";
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

        var self = this;
        this.tableInformation = ko.computed(function() {
            return _("accountStatus.tableInfo", { name: self.tableName() });
        }, this);
        this.betInformation = ko.computed(function() {
            return _("accountStatus.betInfo", { sb: self.smallBlind(), bb: self.bigBlind() });
        }, this);
    }

    shown() {
        super.shown();
        this.requestData();
        this.loginName(authManager.login());
        var tableView = app.tablesPage.currentTable();

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

        var currentTable = app.tablesPage.currentTable();
        app.addMoneyPopup.tableView(currentTable);
        super.close();
        app.showPopup("addMoney").done(function (results: { name: string; result: any }) {
            if (results.result === "cancel") {
                app.showPopup("accountStatus");
            }
        });
    }

    private requestData() {
        var self = this;
        this.loading(true);

        accountService.getAccount().done(function(result: AccountServiceInformation) {
            self.loading(false);
            self.information(result);
        }).fail(function() {
            app.closePopup();
        });
    }
}
