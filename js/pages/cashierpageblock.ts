import { appConfig } from "poker/appconfig";
import { ChatPage } from "poker/pages/chatpage";
import { PageBlock } from "../pageblock";
import { AccountPage } from "./accountpage";
import { OperationsHistoryPage } from "./operationshistorypage";
import { RatingPage } from "./ratingpage";
import { WithdrawalPage } from "./withdrawalpage";

export class CashierPageBlock extends PageBlock {
    public accountPage: AccountPage;
    public ratingPage: RatingPage;
    public operationsHistoryPage: OperationsHistoryPage;
    constructor() {
        const accountPage = new AccountPage();
        super("cashier", "account", accountPage);
        this.accountPage = accountPage;
        this.ratingPage = new RatingPage();
        this.operationsHistoryPage = new OperationsHistoryPage();
        this.requireAuthentication = true;
        // this.addSecondary("account", this.accountPage);
        if (appConfig.game.hasRating) {
            this.addSecondary("rating", this.ratingPage, true);
            this.currentPage = "rating";
            this.addSecondary("operationsHistory", this.operationsHistoryPage);
        } else {
            this.addSecondary("operationsHistory", this.operationsHistoryPage, true);
            this.currentPage = "operationsHistory";
        }

        this.addSecondary("withdrawal", new WithdrawalPage());
    }
}
