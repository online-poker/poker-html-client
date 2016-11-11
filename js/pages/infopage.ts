import { App } from "../app";
import * as authManager from "../authmanager";
import { keyboardActivationService } from "../services";
import { PageBase } from "../ui/pagebase";

declare var app: App;

export class InfoPage extends PageBase {
    constructor() {
        super();
    }
    backToLobby() {
        keyboardActivationService.forceHideKeyboard();
        app.lobbyPageBlock.showLobby();
    }
    back() {
        keyboardActivationService.forceHideKeyboard();
        app.infoPageBlock.showPrimary();
    }
    showLicenseAgreement() {
        app.infoPageBlock.showLicenseAgreement();
    }
    showMobileSystemSupport() {
        app.infoPageBlock.showMobileSystemSupport();
    }
    showAccountBlock() {
        app.infoPageBlock.showAccountBlock();
    }
    showPrivacyPolicy() {
        app.infoPageBlock.showPrivacyPolicy();
    }
    showSupport() {
        app.infoPageBlock.showSupport();
    }
    showContactUs() {
        app.infoPageBlock.showContactUs();
    }
    showHowToPlay() {
        app.infoPageBlock.showHowToPlay();
    }
    showChatRules() {
        app.infoPageBlock.showChatRules();
    }
    showTerminology() {
        app.infoPageBlock.showTerminology();
    }
    showFaq() {
        app.infoPageBlock.showFaq();
    }
}
