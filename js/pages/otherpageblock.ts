import { appConfig } from "poker/appconfig";
import { App } from "../app";
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
        App.addTabBarItemMapping("cashier", "account");
        super("other", "account", accountPage);
        this.accountPage = accountPage;
        this.morePage = new SettingsPage();
        App.addTabBarItemMapping("more", "settings");
        App.addTabBarItemMapping("more", "other");

        this.ratingPage = new RatingPage();
        App.addTabBarItemMapping("more", "rating");
        this.changePasswordPage = new ChangePasswordPage();
        App.addTabBarItemMapping("more", "changePassword");
        this.chatPage = new ChatPage();
        App.addTabBarItemMapping("more", "chat");
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
