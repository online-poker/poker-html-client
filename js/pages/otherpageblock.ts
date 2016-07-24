/// <reference path="../pageblock.ts" />
/// <reference path="settingspage.ts" />
/// <reference path="changepasswordpage.ts" />
/// <reference path="ratingpage.ts" />
/// <reference path="chatpage.ts" />
/// <reference path="accountpage.ts" />

class OtherPageBlock extends PageBlock {
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
