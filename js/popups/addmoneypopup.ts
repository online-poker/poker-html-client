import * as ko from "knockout";
import { App } from "../app";
import { appConfig } from "../appconfig";
import { _ } from "../languagemanager";
import { SimplePopup } from "../popups/simplepopup";
import { AccountManager } from "../services/accountManager";
import { TableView } from "../table/tableview";

declare const app: App;

export class AddMoneyPopup {
    public buyin: ko.Observable<number>;
    public minBuyin: ko.Observable<number>;
    public maxBuyin: ko.Observable<number>;
    public minBet: ko.Observable<number>;
    public maxBet: ko.Observable<number>;
    public accountTotal: ko.Observable<number>;
    public tableName: ko.Observable<string>;
    public errors: ko.ValidationErrors;
    public errorMessage: ko.Observable<string>;
    public tableView: ko.Observable<TableView>;
    public loading: ko.Observable<boolean>;
    public processing: ko.Observable<boolean>;
    public ticketCode: ko.Observable<string>;
    public allowUsePersonalAccount: ko.Observable<boolean>;
    public allowTickets: ko.Observable<boolean>;
    public hasKeyPad: ko.Observable<boolean>;
    private validationModel: ko.Observable<this>;

    constructor() {
        this.buyin = ko.observable<number>().extend({ required: appConfig.tournament.enabled, validatable: true });
        this.ticketCode = ko.observable<string>("").extend({ required: appConfig.game.seatMode, validatable: true });
        this.tableView = ko.observable<TableView>();
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
        this.processing = ko.observable(false);
        this.allowUsePersonalAccount = ko.observable(appConfig.joinTable.allowUsePersonalAccount);
        this.allowTickets = ko.observable(appConfig.joinTable.allowTickets);
        this.hasKeyPad = ko.observable(appConfig.ui.hasKeyPad);
    }
    public async shown() {
        const accountManager = new AccountManager();
        this.loading(true);
        this.processing(false);
        if (appConfig.joinTable.allowUsePersonalAccount) {
            try {
                const data = await accountManager.getAccount();
                this.loading(false);
                if (data.Status === "Ok") {
                    const personalAccountData = data.Data;
                    const tableData = this.tableView().model;
                    let balance = 0;
                    const currencyId = tableData.CurrencyId;
                    if (currencyId === 1) {
                        balance = personalAccountData.RealMoney;
                    } else {
                        balance = personalAccountData.GameMoney;
                    }

                    const tableView = this.tableView();
                    const myPlayer = tableView.myPlayer()!;
                    const totalBet = (myPlayer.TotalBet() === null ? 0 : myPlayer.TotalBet()) + myPlayer.Bet();
                    const tableTotal = totalBet + myPlayer.Money();
                    this.accountTotal(balance);
                    this.tableName(tableData.TableName);
                    this.minBet(tableData.SmallBlind);
                    this.maxBet(tableData.BigBlind);
                    const baseMinimalBuyIn = tableView.minimalBuyIn() * tableData.BigBlind;
                    const maxBuyIn = (20 * baseMinimalBuyIn) - tableTotal;
                    this.minBuyin(1);
                    this.maxBuyin(maxBuyIn);
                    this.buyin(Math.min(2 * baseMinimalBuyIn, maxBuyIn));
                } else {
                    SimplePopup.display(_("addMoney.caption"), _("errors." + data.Status));
                }
            } catch (e) {
                this.loading(false);
                SimplePopup.display(_("addMoney.caption"), _("addMoney.joinError"));
            }
        } else {
            this.loading(false);
        }
    }
    public async confirm() {
        const isValid = this.validationModel.isValid();
        const ticketCode = this.ticketCode();
        if (!isValid) {
            this.errors.showAllMessages(true);
            return;
        }

        if (this.processing()) {
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

            const myPlayer = this.tableView().myPlayer()!;
            const totalMoneyAmountExpected = this.buyin() + myPlayer.Money() + myPlayer.TotalBet();
            if (totalMoneyAmountExpected > this.maxBuyin()) {
                this.buyin.setError(_("addMoney.couldnotAddMoreThenMax"));
                return;
            }
        }
        const amount = this.buyin();
        this.processing(true);
        this.loading(true);
        try {
            await this.tableView().addBalance(amount, ticketCode);
            this.processing(false);
            this.loading(false);
            app.closePopup("ok");
            SimplePopup.display(_("addMoney.caption"), _("addMoney.success"));
            this.ticketCode(null);
        } catch (e: any) {
            this.processing(false);
            this.loading(false);
            SimplePopup.display(_("addMoney.caption"), _("errors." + e.message));
            this.ticketCode(null);
        }
    }
}
