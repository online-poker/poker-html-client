import { Support } from "@poker/api-server";
import * as ko from "knockout";
import { App } from "../app";
import { _ } from "../languagemanager";
import { SimplePopup } from "../popups/simplepopup";
import { keyboardActivationService } from "../services";
import { PageBase } from "../ui/pagebase";

declare var host: string;
declare var app: App;

/** Support page */
export class SupportPage extends PageBase implements KnockoutValidationGroup {
    public displayFullName = false;
    public displaySubject = false;

    public loading = ko.observable(false);
    public fullName = ko.observable("").extend({ required: this.displayFullName, maxLength: 30 });
    public email = ko.observable("").extend({ required: true, email: true });
    public subject = ko.observable("").extend({ required: this.displaySubject, maxLength: 30 });
    public body = ko.observable("").extend({ required: true, maxLength: 1000 });
    public errorMessage = ko.observable<string>();

    public errors: KnockoutValidationErrors;
    public isValid: () => boolean;

    constructor() {
        super();
        this.errors = ko.validation.group(this);
    }
    public backToLobby() {
        keyboardActivationService.forceHideKeyboard();
        app.lobbyPageBlock.showLobby();
    }
    public back() {
        keyboardActivationService.forceHideKeyboard();
        app.infoPageBlock.showPrimary();
    }
    /**
     * Method called upon page activation.
     * pageName String Name of the page which is activated.
     */
    public activate(pageName?: string) {
        this.fullName("");
        this.email("");
        this.subject("");
        this.body("");
        super.activate(pageName);
    }

    /**
     * Method called upon page deactivation.
     * pageName String Name of the page which is deactivated.
     */
    public deactivate(pageName?: string) {
        super.deactivate(pageName);
    }
    public async send() {
        const self = this;
        const isValid = this.isValid();
        if (!isValid) {
            this.errors.showAllMessages(true);
            return;
        }

        if (this.loading()) {
            return;
        }

        this.loading(true);
        this.errorMessage(null);
        this.errors.showAllMessages(false);
        const api = new Support(host);
        try {
            const data = await api.contactUs(this.fullName(), this.email(), this.subject(), this.body());
            self.loading(false);
            if (data.Status === "Ok") {
                self.fullName("");
                self.email("");
                self.subject("");
                self.body("");
                SimplePopup.display(_("contactUs.contactUsTitle"), _("contactUs.requestSent"));
            } else {
                self.errorMessage(_("errors." + data.Status));
            }
        } catch (error) {
            self.loading(false);
            self.errorMessage(_("common.unspecifiedError"));
        }
    }
}
