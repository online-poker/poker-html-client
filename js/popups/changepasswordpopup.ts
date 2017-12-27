/// <reference path="../poker.commanding.api.ts" />

import * as ko from "knockout";
import { App } from "../app";
import { _ } from "../languagemanager";
import { SimplePopup } from "../popups/simplepopup";
import { AccountManager } from "../services/accountManager";
import { PopupBase } from "../ui/popupbase";

declare var app: App;

export class ChangePasswordPopup extends PopupBase {
    public oldPassword = ko.observable<string>().extend({ required: true });
    public password: KnockoutObservable<string>;
    public confirmPassword: KnockoutObservable<string>;
    public errorMessage: KnockoutObservable<string>;
    public errors: KnockoutValidationErrors;
    public loading: KnockoutObservable<boolean>;
    private validationModel: KnockoutObservable<ChangePasswordPopup>;

    constructor() {
        super();
        this.password = ko.observable<string>().extend({ required: true });
        this.confirmPassword = ko.observable<string>().extend({ required: true });
        this.errors = ko.validation.group(this);
        this.validationModel = ko.validatedObservable(this);
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
        const isValid = this.validationModel.isValid();
        if (!isValid) {
            this.errors.showAllMessages(true);
            return;
        }

        if (!this.loading()) {
            self.loading(true);
            self.errorMessage(null);
            const accountApi = new AccountManager();
            const data = await accountApi.changePasword(this.oldPassword(), this.password());
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
