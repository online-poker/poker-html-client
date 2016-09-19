/// <reference path="../_references.ts" />
/// <reference path="../poker.commanding.api.ts" />
/// <reference path="../app.ts" />
/// <reference path="../authmanager.ts" />

declare var apiHost: string;

import * as ko from "knockout";
import { SimplePopup } from "../popups/simplepopup";
import { PopupBase } from "../ui/popupbase";
import { _ } from "../languagemanager";
import { App } from "../app";

declare var app: App;

export class ChangePasswordPopup extends PopupBase implements KnockoutValidationGroup {
    oldPassword = ko.observable<string>().extend({ required: true });
    password: KnockoutObservable<string>;
    confirmPassword: KnockoutObservable<string>;
    errorMessage: KnockoutObservable<string>;
    errors: KnockoutValidationErrors;
    isValid: () => boolean;
    loading: KnockoutObservable<boolean>;

    constructor() {
        super();
        this.password = ko.observable<string>().extend({ required: true });
        this.confirmPassword = ko.observable<string>().extend({ required: true });
        this.errors = ko.validation.group(this);
        this.errorMessage = ko.observable<string>();
        this.loading = ko.observable(false);
    }
    shown(args: any[]= []): void {
        this.oldPassword(null);
        this.password(null);
        this.confirmPassword(null);
        this.errors.showAllMessages(false);
        super.shown(args);
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
            self.errorMessage(null);
            const accountApi = new OnlinePoker.Commanding.API.Account(apiHost);
            accountApi.ChangePassword(this.oldPassword(), this.password(), function (data) {
                if (data.Status === "Ok") {
                    self.loading(false);
                    self.oldPassword(null);
                    self.password(null);
                    self.confirmPassword(null);
                    app.closePopup();
                    SimplePopup.display(_("auth.changePassword"), _("auth.passwordChangedSuccess"));
                } else {
                    // Report authentication or authorization errors
                    self.errorMessage(_("errors." + data.Status));
                }
            });
        }
    }
}
