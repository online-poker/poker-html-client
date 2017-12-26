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
        super("other", "account", accountPage);
        this.accountPage = accountPage;
        this.morePage = new SettingsPage();
        App.addTabBarItemMapping("more", "other");

        this.ratingPage = new RatingPage();
        this.changePasswordPage = new ChangePasswordPage();
        this.chatPage = new ChatPage();
        this.requireAuthentication = true;
        this.currentPage = "account";
        this.addSecondary("more", this.morePage);
        this.addSecondary("rating", this.ratingPage);
        this.addSecondary("chat", this.chatPage, true);
        this.addSecondary("changePassword", this.changePasswordPage);
    }
}
