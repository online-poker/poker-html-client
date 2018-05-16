import { appConfig } from "poker/appconfig";
import { CommandManager } from "poker/commandmanager";
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
    private commandManager: CommandManager;

    constructor(commandManager: CommandManager) {
        const chatPage = new ChatPage();
        UIManager.addTabBarItemMapping("more", "chat");
        super("other", "chat", chatPage);
        this.chatPage = chatPage;
        this.accountPage = new AccountPage();
        UIManager.addTabBarItemMapping("cashier", "account");
        this.commandManager = commandManager;
        this.morePage = new SettingsPage();
        UIManager.addTabBarItemMapping("more", "settings");
        UIManager.addTabBarItemMapping("more", "other");

        this.ratingPage = new RatingPage();
        UIManager.addTabBarItemMapping("more", "rating");
        this.changePasswordPage = new ChangePasswordPage();
        UIManager.addTabBarItemMapping("more", "changePassword");

        this.requireAuthentication = true;
        this.currentPage = "chat";
        this.addSecondary("more", this.morePage);
        if (appConfig.game.hasRating) {
            this.addSecondary("rating", this.ratingPage);
        }

        this.addSecondary("changePassword", this.changePasswordPage);
    }
    public showChat() {
        this.commandManager.executeCommand("pageblock.other");
        this.showSecondary("chat");
    }
    public showRating() {
        this.commandManager.executeCommand("pageblock.other");
        this.showSecondary("rating");
    }
}
