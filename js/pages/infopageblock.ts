import { PageBlock } from "../pageblock";
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
        this.addSecondary("howToPlay", new InfoPage());
        this.addSecondary("chatRules", new InfoPage());
        this.addSecondary("terminology", new InfoPage());
        this.addSecondary("faq", new InfoPage());
    }
    public showLicenseAgreement() {
        this.showSecondary("licenseAgreement");
    }
    public showMobileSystemSupport() {
        this.showSecondary("mobileSystemSupport");
    }
    public showAccountBlock() {
        this.showSecondary("accountBlock");
    }
    public showPrivacyPolicy() {
        this.showSecondary("privacyPolicy");
    }
    public showSupport() {
        this.showSecondary("support");
    }
    public showContactUs() {
        this.showSecondary("contactUs");
    }
    public showHowToPlay() {
        this.showSecondary("howToPlay");
    }
    public showChatRules() {
        this.showSecondary("chatRules");
    }
    public showTerminology() {
        this.showSecondary("terminology");
    }
    public showFaq() {
        this.showSecondary("faq");
    }
}
