/// <reference path="../poker.commanding.api.ts" />

import * as ko from "knockout";
import { App } from "../app";
import { appConfig } from "../appconfig";
import { _ } from "../languagemanager";
import { AccountManager } from "../services/accountManager";
import { TableView } from "../table/tableview";
import { SimplePopup } from "./simplepopup";

declare var app: App;

export class JoinTablePopup {
    public buyin: ko.Observable<number>;
    public ticketCode: ko.Observable<string>;
    public minBuyin: ko.Observable<number>;
    public maxBuyin: ko.Observable<number>;
    public minBet: ko.Observable<number>;
    public maxBet: ko.Observable<number>;
    public accountTotal: ko.Observable<number>;
    public tableName: ko.Observable<string>;
    public errors: KnockoutValidationErrors;
    public errorMessage: ko.Observable<string>;
    public seatNumber: ko.Observable<number>;
    public tableView: ko.Observable<TableView>;
    public loading: ko.Observable<boolean>;
    public allowUsePersonalAccount: ko.Observable<boolean>;
    public allowTickets: ko.Observable<boolean>;
    private validationModel: ko.Observable<JoinTablePopup>;

    public constructor() {
        this.buyin = ko.observable<number>()
            .extend({ required: appConfig.joinTable.allowUsePersonalAccount, validatable: true });
        this.ticketCode = ko.observable<string>()
            .extend({ required: appConfig.joinTable.allowTickets, validatable: true });
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
        this.validationModel = ko.validatedObservable(this);
        this.errorMessage = ko.observable<string>();
        this.allowUsePersonalAccount = ko.observable<boolean>(appConfig.joinTable.allowUsePersonalAccount);
        this.allowTickets = ko.observable<boolean>(appConfig.joinTable.allowTickets);
    }
    public async shown() {
        const self = this;
        const manager = new AccountManager();
        self.loading(true);
        if (appConfig.joinTable.allowUsePersonalAccount) {
            try {
                const data = await manager.getAccount();
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

                    self.accountTotal(balance);
                    self.tableName(tableData.TableName);
                    self.minBet(tableData.SmallBlind);
                    self.maxBet(tableData.BigBlind);
                    self.updateEntries();
                    if (appConfig.game.seatMode) {
                        app.executeCommand("page.seats");
                    }
                } else {
                    SimplePopup.display(_("joinTable.caption"), _("errors." + data.Status));
                }
            } catch (e) {
                self.loading(false);
                SimplePopup.display(_("joinTable.caption"), _("joinTable.joinError"));
            }
        } else {
            self.loading(false);
        }
    }
    public async confirm() {
        const self = this;
        const isValid = this.validationModel.isValid();
        if (!isValid) {
            this.errors.showAllMessages(true);
            return;
        }

        if (appConfig.joinTable.allowUsePersonalAccount) {
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
        }

        const seat = this.seatNumber();
        const amount = this.buyin();
        const ticketCode = this.ticketCode();
        this.loading(true);
        const result = await this.tableView().sit(seat, amount, ticketCode);
        if (result.success) {
            self.loading(false);
            app.closePopup();
            self.ticketCode(null);
            return;
        }

        const { status, minimalAmount } = result;
        self.loading(false);
        if (status === "AmountTooLow") {
            self.tableView().minimalPlayerBuyIn(minimalAmount);
            self.updateEntries();
            self.buyin.setError(_("errors." + status));
        } else {
            SimplePopup.display(_("joinTable.caption"), _("errors." + status));
        }

        self.ticketCode(null);
    }
    private updateEntries() {
        const self = this;
        const tableView = self.tableView();
        const tableData = self.tableView().model;
        const baseMinimalBuyIn = tableView.minimalBuyIn() * tableData.BigBlind;
        self.minBuyin(Math.max(baseMinimalBuyIn, tableView.minimalPlayerBuyIn()));
        self.maxBuyin(20 * baseMinimalBuyIn);
        self.buyin(Math.max(2 * baseMinimalBuyIn, tableView.minimalPlayerBuyIn()));
        if (self.maxBuyin() < tableView.minimalPlayerBuyIn()) {
            self.maxBuyin(tableView.minimalPlayerBuyIn());
            self.buyin(tableView.minimalPlayerBuyIn());
        }
    }
}
