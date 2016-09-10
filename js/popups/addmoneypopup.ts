/// <reference path="../_references.ts" />
/// <reference path="../poker.commanding.api.ts" />
/// <reference path="../app.ts" />
/// <reference path="../authmanager.ts" />

declare var apiHost: string;

import * as ko from "knockout";
import { SimplePopup } from "../popups/simplepopup";
import { PopupBase } from "../ui/popupbase";
import { TableView } from "../table/tableview";
import { App } from "../app";

declare var app: App;

export class AddMoneyPopup implements KnockoutValidationGroup {
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
    tableView: KnockoutObservable<TableView>;
    loading: KnockoutObservable<boolean>;
    processing: KnockoutObservable<boolean>;

    constructor() {
        this.buyin = ko.observable<number>().extend({ required: true, validatable: true });
        this.tableView = ko.observable<TableView>();
        this.accountTotal = ko.observable<number>(0);
        this.loading = ko.observable<boolean>(false);
        this.tableName = ko.observable<string>();
        this.minBuyin = ko.observable<number>(0);
        this.maxBuyin = ko.observable<number>(0);
        this.minBet = ko.observable<number>(0);
        this.maxBet = ko.observable<number>(0);
        this.errors = ko.validation.group(this);
        this.errorMessage = ko.observable<string>();
        this.processing = ko.observable(false);
    }
    shown(): void {
        var self = this;
        var accountApi = new OnlinePoker.Commanding.API.Account(apiHost);
        self.loading(true);
        self.processing(false);
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
                var myPlayer = tableView.myPlayer();
                var totalBet = (myPlayer.TotalBet() === null ? 0 : myPlayer.TotalBet()) + myPlayer.Bet();
                var tableTotal = totalBet + myPlayer.Money();
                self.accountTotal(balance);
                self.tableName(tableData.TableName);
                self.minBet(tableData.SmallBlind);
                self.maxBet(tableData.BigBlind);
                var baseMinimalBuyIn = tableView.minimalBuyIn() * tableData.BigBlind;
                var maxBuyIn = (20 * baseMinimalBuyIn) - tableTotal;
                self.minBuyin(1);
                self.maxBuyin(maxBuyIn);
                self.buyin(Math.min(2 * baseMinimalBuyIn, maxBuyIn));
            } else {
                SimplePopup.display(_("addMoney.caption"), _("errors." + data.Status));
            }
        }).fail(() => {
                self.loading(false);
                SimplePopup.display(_("addMoney.caption"), _("addMoney.joinError"));
            });
    }
    confirm() {
        var self = this;
        var isValid = this.isValid();
        if (!isValid) {
            this.errors.showAllMessages(true);
            return;
        }

        if (self.processing()) {
            return;
        }

        if (this.buyin() < this.minBuyin()) {
            this.buyin.setError(_("addMoney.putMoreMoney"));
            return;
        }

        if (this.buyin() > this.maxBuyin()) {
            this.buyin.setError(_("addMoney.putLessMoney"));
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

        if (this.buyin() + this.tableView().myPlayer().Money() + this.tableView().myPlayer().TotalBet() > this.maxBuyin()) {
            this.buyin.setError(_("addMoney.couldnotAddMoreThenMax"));
            return;
        }

        var amount = this.buyin();
        self.processing(true);
        this.tableView().addBalance(amount).then(function () {
            self.processing(false);
            app.closePopup("ok");
            SimplePopup.display(_("addMoney.caption"), _("addMoney.success"));
        }, function (status: string) {
            self.processing(false);
            self.buyin.setError(_("errors." + status));
        });
    }
}
