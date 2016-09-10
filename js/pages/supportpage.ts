/// <reference types="knockout" />
/// <reference path="../app.ts" />
/// <reference path="../ui/page.ts" />
/// <reference path="../messages.ts" />
/// <reference path="../languagemanager.ts" />
/// <reference path="../metadatamanager.ts" />
/// <reference path="../poker.commanding.api.ts" />
/// <reference path="../authmanager.ts" />

import * as ko from "knockout";
import { App } from "../app";
import { SimplePopup } from "../popups/simplepopup";
import { PageBase } from "../ui/pagebase";
import { keyboardActivationService } from "../services"; 

declare var apiHost: string;
declare var app: App;

export class SupportPage extends PageBase implements KnockoutValidationGroup {
    displayFullName = false;
    displaySubject = false;

    loading = ko.observable(false);
    fullName = ko.observable("").extend({ required: this.displayFullName, maxLength: 30 });
    email = ko.observable("").extend({ required: true, email: true });
    subject = ko.observable("").extend({ required: this.displaySubject, maxLength: 30 });
    body = ko.observable("").extend({ required: true, maxLength: 1000 });
    errorMessage = ko.observable<string>();

    errors: KnockoutValidationErrors;
    isValid: () => boolean;

    constructor() {
        super();
        this.errors = ko.validation.group(this);
    }
    backToLobby() {
        keyboardActivationService.forceHideKeyboard();
        app.lobbyPageBlock.showLobby();
    }
    back() {
        keyboardActivationService.forceHideKeyboard();
        app.infoPageBlock.showPrimary();
    }
    /**
    * Method called upon page activation.
    * pageName String Name of the page which is activated.
    */
    activate(pageName?: string) {
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
    deactivate(pageName?: string) {
        super.deactivate(pageName);
    }
    send() {
        var self = this;
        var isValid = this.isValid();
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
        var api = new OnlinePoker.Commanding.API.Support(apiHost);
        api.ContactUs(this.fullName(), this.email(), this.subject(), this.body()).then((data) => {
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
        }, function (error) {
            self.loading(false);
            self.errorMessage(_("common.unspecifiedError"));
        });
    }
}
