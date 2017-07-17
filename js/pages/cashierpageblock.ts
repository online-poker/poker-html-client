/// <reference path="../pageblock.ts" />
/// <reference path="cashierpage.ts" />
/// <reference path="withdrawalpage.ts" />
/// <reference path="operationshistorypage.ts" />

import { AccountPage } from "./accountpage";
import { RatingPage } from "./ratingpage";
import { OperationsHistoryPage } from "./operationshistorypage";
import { WithdrawalPage } from "./withdrawalpage";

export class CashierPageBlock extends PageBlock {
    public accountPage: AccountPage;
    public ratingPage: RatingPage;
    constructor() {
        const accountPage = new AccountPage();
        super("cashier", "account", accountPage);
        this.accountPage = accountPage;
        this.ratingPage = new RatingPage();
        this.requireAuthentication = true;
        // this.addSecondary("account", this.accountPage);
        this.addSecondary("rating", this.ratingPage, true);
        this.currentPage = "rating";
        this.addSecondary("operationsHistory", new OperationsHistoryPage());
        this.addSecondary("withdrawal", new WithdrawalPage());
    }
}
