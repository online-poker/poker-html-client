/// <reference path="../pageblock.ts" />

import { App } from "../app";
import { AccountPage } from "./accountpage";
import { RatingPage } from "./ratingpage";
import { SettingsPage } from "./settingspage";
import { ChatPage } from "./chatpage";
import { ChangePasswordPage } from "./changepasswordpage";

export class OtherPageBlock extends PageBlock {
    changePasswordPage: ChangePasswordPage;
    morePage: SettingsPage;
    ratingPage: RatingPage;
    chatPage: ChatPage;
    accountPage: AccountPage;

    constructor() {
        let accountPage = new AccountPage();
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
