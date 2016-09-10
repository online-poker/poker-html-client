/// <reference path="../_references.ts" />
/// <reference path="../poker.commanding.api.ts" />
/// <reference path="../app.ts" />
/// <reference path="../authmanager.ts" />

declare var apiHost: string;
import * as ko from "knockout";
import { TableView } from "../table/tableview";
import { SimplePopup } from "./simplepopup";
import { App } from "../app";

declare var app: App;

export class JoinTablePopup implements KnockoutValidationGroup {
    buyin: KnockoutObservable<number>;
    minBuyin: KnockoutObservable<number>;
    maxBuyin: KnockoutObservable<number>;
    minBet: KnockoutObservable<number>;
    maxBet: KnockoutObservable<number>;
    accountTotal: KnockoutObservable<number>;
    tableName: KnockoutObservable<string>;
    errors: KnockoutValidationErrors;
    isValid: () => boolean;
    errorMessage: KnockoutObservable<string>;
    seatNumber: KnockoutObservable<number>;
    tableView: KnockoutObservable<TableView>;
    loading: KnockoutObservable<boolean>;

    constructor() {
        this.buyin = ko.observable<number>().extend({ required: true, validatable: true });
        this.tableView = ko.observable<TableView>();
        this.seatNumber = ko.observable<number>(0);
        this.accountTotal = ko.observable<number>(0);
        this.loading = ko.observable<boolean>(false);
        this.tableName = ko.observable<string>();
        this.minBuyin = ko.observable<number>(0);
        this.maxBuyin = ko.observable<number>(0);
        this.minBet = ko.observable<number>(0);
        this.maxBet = ko.observable<number>(0);
        this.errors = ko.validation.group(this);
        this.errorMessage = ko.observable<string>();
    }
    shown(): void {
        var self = this;
        var accountApi = new OnlinePoker.Commanding.API.Account(apiHost);
        self.loading(true);
        accountApi.GetPersonalAccount(function (data) {
            self.loading(false);
            if (data.Status === "Ok") {
                var personalAccountData = data.Data;
                var tableData = self.tableView().model;
                var balance = 0;
                var currencyId = tableData.CurrencyId;
                if (currencyId === 1) {
                    balance = personalAccountData.RealMoney;
                } else {
                    balance = personalAccountData.GameMoney;
                }

                var tableView = self.tableView();
                self.accountTotal(balance);
                self.tableName(tableData.TableName);
                self.minBet(tableData.SmallBlind);
                self.maxBet(tableData.BigBlind);
                self.updateEntries();
            } else {
                SimplePopup.display(_("joinTable.caption"), _("errors." + data.Status));
            }
        }).fail(() => {
            self.loading(false);
            SimplePopup.display(_("joinTable.caption"), _("joinTable.joinError"));
        });
    }
    confirm() {
        var self = this;
        var isValid = this.isValid();
        if (!isValid) {
            this.errors.showAllMessages(true);
            return;
        }

        if (this.buyin() < this.minBuyin()) {
            this.buyin.setError(_("joinTable.putMoreMoney"));
            return;
        }

        if (this.buyin() > this.maxBuyin()) {
            this.buyin.setError(_("joinTable.putLessMoney"));
            return;
        }

        if (this.accountTotal() < this.minBuyin()) {
            this.buyin.setError(_("errors.NotSufficiendFunds"));
            return;
        }

        if (this.accountTotal() < this.buyin()) {
            this.buyin.setError(_("errors.NotSufficiendFunds"));
            return;
        }

        var seat = this.seatNumber();
        var amount = this.buyin();
        this.loading(true);
        this.tableView().sit(seat, amount).then(function () {
            self.loading(false);
            app.closePopup();
        }, function (status: string, minimalAmount: number) {
            self.loading(false);
            if (status === "AmountTooLow") {
                self.tableView().minimalPlayerBuyIn(minimalAmount);
                self.updateEntries();
                self.buyin.setError(_("errors." + status));
            } else {
                SimplePopup.display(_("joinTable.caption"), _("errors." + status));
            }
        });
    }
    private updateEntries() {
        var self = this;
        var tableView = self.tableView();
        var tableData = self.tableView().model;
        var baseMinimalBuyIn = tableView.minimalBuyIn() * tableData.BigBlind;
        self.minBuyin(Math.max(baseMinimalBuyIn, tableView.minimalPlayerBuyIn()));
        self.maxBuyin(20 * baseMinimalBuyIn);
        self.buyin(Math.max(2 * baseMinimalBuyIn, tableView.minimalPlayerBuyIn()));
        if (self.maxBuyin() < tableView.minimalPlayerBuyIn()) {
            self.maxBuyin(tableView.minimalPlayerBuyIn());
            self.buyin(tableView.minimalPlayerBuyIn());
        }
    }
}
