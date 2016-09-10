/// <reference path="../pageblock.ts" />
/// <reference path="infopage.ts" />
/// <reference path="supportpage.ts" />

import { SupportPage } from "./supportpage";
import { InfoPage } from "./infopage";

export class InfoPageBlock extends PageBlock {
    constructor() {
        super("info", "pagesList", new InfoPage());
        this.requireAuthentication = false;
        this.addSecondary("licenseAgreement", new InfoPage());
        this.addSecondary("mobileSystemSupport", new InfoPage());
        this.addSecondary("accountBlock", new InfoPage());
        this.addSecondary("privacyPolicy", new InfoPage());
        this.addSecondary("support", new InfoPage());
        this.addSecondary("contactUs", new SupportPage());
        this.addSecondary("howToPlay", new InfoPage());
        this.addSecondary("chatRules", new InfoPage());
        this.addSecondary("terminology", new InfoPage());
        this.addSecondary("faq", new InfoPage());
    }
    showLicenseAgreement() {
        this.showSecondary("licenseAgreement");
    }
    showMobileSystemSupport() {
        this.showSecondary("mobileSystemSupport");
    }
    showAccountBlock() {
        this.showSecondary("accountBlock");
    }
    showPrivacyPolicy() {
        this.showSecondary("privacyPolicy");
    }
    showSupport() {
        this.showSecondary("support");
    }
    showContactUs() {
        this.showSecondary("contactUs");
    }
    showHowToPlay() {
        this.showSecondary("howToPlay");
    }
    showChatRules() {
        this.showSecondary("chatRules");
    }
    showTerminology() {
        this.showSecondary("terminology");
    }
    showFaq() {
        this.showSecondary("faq");
    }
}
