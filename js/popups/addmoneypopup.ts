/// <reference path="../poker.commanding.api.ts" />

declare var apiHost: string;

import * as ko from "knockout";
import { SimplePopup } from "../popups/simplepopup";
import { PopupBase } from "../ui/popupbase";
import { TableView } from "../table/tableview";
import { _ } from "../languagemanager";
import { App } from "../app";
import { appConfig } from "../appconfig";

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
    ticketCode: KnockoutObservable<string>;
    public allowUsePersonalAccount: KnockoutObservable<boolean>;
    public allowTickets: KnockoutObservable<boolean>;

    constructor() {
        this.buyin = ko.observable<number>().extend({ required: appConfig.tournament.enabled, validatable: true });
        this.ticketCode = ko.observable<string>().extend({ required: appConfig.game.seatMode, validatable: true });
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
        this.allowUsePersonalAccount = ko.observable(appConfig.joinTable.allowUsePersonalAccount);
        this.allowTickets = ko.observable(appConfig.joinTable.allowTickets);
    }
    async shown() {
        const self = this;
        const accountApi = new OnlinePoker.Commanding.API.Account(apiHost);
        self.loading(true);
        self.processing(false);
        if (appConfig.joinTable.allowUsePersonalAccount) {
            try {
                const data = await accountApi.GetPersonalAccount();
                self.loading(false);
                if (data.Status === "Ok") {
                    const personalAccountData = data.Data;
                    const tableData = self.tableView().model;
                    let balance = 0;
                    const currencyId = tableData.CurrencyId;
                    if (currencyId === 1) {
                        balance = personalAccountData.RealMoney;
                    } else {
                        balance = personalAccountData.GameMoney;
                    }

                    const tableView = self.tableView();
                    const myPlayer = tableView.myPlayer();
                    const totalBet = (myPlayer.TotalBet() === null ? 0 : myPlayer.TotalBet()) + myPlayer.Bet();
                    const tableTotal = totalBet + myPlayer.Money();
                    self.accountTotal(balance);
                    self.tableName(tableData.TableName);
                    self.minBet(tableData.SmallBlind);
                    self.maxBet(tableData.BigBlind);
                    const baseMinimalBuyIn = tableView.minimalBuyIn() * tableData.BigBlind;
                    const maxBuyIn = (20 * baseMinimalBuyIn) - tableTotal;
                    self.minBuyin(1);
                    self.maxBuyin(maxBuyIn);
                    self.buyin(Math.min(2 * baseMinimalBuyIn, maxBuyIn));
                } else {
                    SimplePopup.display(_("addMoney.caption"), _("errors." + data.Status));
                }
            } catch (e) {
                self.loading(false);
                SimplePopup.display(_("addMoney.caption"), _("addMoney.joinError"));
            }
        } else {
            self.loading(false);
        };
    }
    async confirm() {
        const self = this;
        const isValid = this.isValid();
        const ticketCode = this.ticketCode();
        if (!isValid) {
            this.errors.showAllMessages(true);
            return;
        }

        if (self.processing()) {
            return;
        }
        if (appConfig.joinTable.allowUsePersonalAccount) {
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
        }
        const amount = this.buyin();
        self.processing(true);
        this.loading(true);
        try {
            await this.tableView().addBalance(amount, ticketCode);
            self.processing(false);
            self.loading(false);
            app.closePopup("ok");
            SimplePopup.display(_("addMoney.caption"), _("addMoney.success"));
            self.ticketCode(null);
        } catch (e) {
            self.processing(false);
            self.loading(false);
            SimplePopup.display(_("addMoney.caption"), _("errors." + e.message));
            self.ticketCode(null);
        }
    }
}
