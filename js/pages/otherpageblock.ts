import { appConfig } from "poker/appconfig";
import { UIManager } from "poker/services/uimanager";
import { PageBlock } from "../pageblock";
import { AccountPage } from "./accountpage";
import { ChangePasswordPage } from "./changepasswordpage";
import { ChatPage } from "./chatpage";
import { RatingPage } from "./ratingpage";
import { SettingsPage } from "./settingspage";

export class OtherPageBlock extends PageBlock {
    public changePasswordPage: ChangePasswordPage;
    public morePage: SettingsPage;
    public ratingPage: RatingPage;
    public chatPage: ChatPage;
    public accountPage: AccountPage;

    constructor() {
        const accountPage = new AccountPage();
        UIManager.addTabBarItemMapping("cashier", "account");
        super("other", "account", accountPage);
        this.accountPage = accountPage;
        this.morePage = new SettingsPage();
        UIManager.addTabBarItemMapping("more", "settings");
        UIManager.addTabBarItemMapping("more", "other");

        this.ratingPage = new RatingPage();
        UIManager.addTabBarItemMapping("more", "rating");
        this.changePasswordPage = new ChangePasswordPage();
        UIManager.addTabBarItemMapping("more", "changePassword");
        this.chatPage = new ChatPage();
        UIManager.addTabBarItemMapping("more", "chat");
        this.requireAuthentication = true;
        this.currentPage = "account";
        this.addSecondary("more", this.morePage);
        if (appConfig.game.hasRating) {
            this.addSecondary("rating", this.ratingPage);
        }

        this.addSecondary("chat", this.chatPage, true);
        this.addSecondary("changePassword", this.changePasswordPage);
    }
}
