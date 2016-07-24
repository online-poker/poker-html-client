/// <reference path="../../Scripts/typings/knockout/knockout.d.ts" />
/// <reference path="../app.ts" />
/// <reference path="../ui/page.ts" />
/// <reference path="../messages.ts" />
/// <reference path="../languagemanager.ts" />
/// <reference path="../metadatamanager.ts" />
/// <reference path="../poker.commanding.api.ts" />
/// <reference path="../authmanager.ts" />

class InfoPage extends PageBase {
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
