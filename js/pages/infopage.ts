import { App } from "../app";
import { PageBlock } from "../pageblock";
import { keyboardActivationService } from "../services";
import { PageBase } from "../ui/pagebase";

declare const app: App;

export class InfoPage extends PageBase {
    constructor() {
        super();
    }
    public backToLobby() {
        keyboardActivationService.forceHideKeyboard();
        app.lobbyPageBlock.showLobby();
    }
    public back() {
        keyboardActivationService.forceHideKeyboard();
        app.infoPageBlock.showPrimary();
    }
    public showLicenseAgreement() {
        app.infoPageBlock.showLicenseAgreement();
    }
    public showMobileSystemSupport() {
        app.infoPageBlock.showMobileSystemSupport();
    }
    public showAccountBlock() {
        app.infoPageBlock.showAccountBlock();
    }
    public showPrivacyPolicy() {
        app.infoPageBlock.showPrivacyPolicy();
    }
    public showSupport() {
        app.infoPageBlock.showSupport();
    }
    public showContactUs() {
        app.infoPageBlock.showContactUs();
    }
    public showHowToPlay() {
        app.infoPageBlock.showHowToPlay();
    }
    public showChatRules() {
        app.infoPageBlock.showChatRules();
    }
    public showTerminology() {
        app.infoPageBlock.showTerminology();
    }
    public showFaq() {
        app.infoPageBlock.showFaq();
    }
}
