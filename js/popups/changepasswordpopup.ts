/// <reference path="../poker.commanding.api.ts" />

declare var apiHost: string;

import * as ko from "knockout";
import { SimplePopup } from "../popups/simplepopup";
import { PopupBase } from "../ui/popupbase";
import { _ } from "../languagemanager";
import { App } from "../app";

declare var app: App;

export class ChangePasswordPopup extends PopupBase implements KnockoutValidationGroup {
    public oldPassword = ko.observable<string>().extend({ required: true });
    public password: KnockoutObservable<string>;
    public confirmPassword: KnockoutObservable<string>;
    public errorMessage: KnockoutObservable<string>;
    public errors: KnockoutValidationErrors;
    public isValid: () => boolean;
    public loading: KnockoutObservable<boolean>;

    constructor() {
        super();
        this.password = ko.observable<string>().extend({ required: true });
        this.confirmPassword = ko.observable<string>().extend({ required: true });
        this.errors = ko.validation.group(this);
        this.errorMessage = ko.observable<string>();
        this.loading = ko.observable(false);
    }
    public shown(args: any[]= []): void {
        this.oldPassword(null);
        this.password(null);
        this.confirmPassword(null);
        this.errors.showAllMessages(false);
        super.shown(args);
    }
    public async confirm() {
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
            const data = await accountApi.ChangePassword(this.oldPassword(), this.password());
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
        }
    }
}
