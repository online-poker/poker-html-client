/// <reference path="../_references.ts" />
/// <reference path="../poker.commanding.api.ts" />

declare var apiHost: string;

import * as ko from "knockout";
import { SimplePopup } from "../popups/simplepopup";
import { PopupBase } from "../ui/popupbase";
import { _ } from "../languagemanager";

export class ForgetPasswordPopup extends PopupBase implements KnockoutValidationGroup {
    login: KnockoutObservable<string>;
    email: KnockoutObservable<string>;
    errors: KnockoutValidationErrors;
    isValid: () => boolean;
    errorMessage: KnockoutObservable<string>;
    loading: KnockoutObservable<boolean>;
    constructor() {
        super();
        this.login = ko.observable<string>();
        this.email = ko.observable<string>();
        this.errors = ko.validation.group(this);
        this.errorMessage = ko.observable<string>();
        this.loading = ko.observable(false);
    }
    confirm() {
        const self = this;
        const isValid = this.isValid();
        if (!isValid) {
            this.errors.showAllMessages(true);
            return;
        }

        if (!this.loading()) {
            self.loading(true);
            const accountApi = new OnlinePoker.Commanding.API.Account(apiHost);
            accountApi.RequestResetPassword(this.login(), this.email(), function (data) {
                self.loading(false);
                if (data.Status === "Ok") {
                    self.errorMessage(null);
                    self.login(null);
                    self.email(null);
                    self.close();
                    SimplePopup.display(_("auth.forgetPassword"), _("auth.forgetPasswordSuccess"));
                } else {
                    // Report authentication or authorization errors
                    self.errorMessage(_("errors." + data.Status));
                }
            }).fail(function (jqXHR, textStatus, errorThrown) {
                self.loading(false);
            });
        }
    }
}
