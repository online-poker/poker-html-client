import * as ko from "knockout";
import { Account } from "../api/account";
import { _ } from "../languagemanager";
import { SimplePopup } from "../popups/simplepopup";
import { PopupBase } from "../ui/popupbase";

declare var apiHost: string;

export class ForgetPasswordPopup extends PopupBase implements KnockoutValidationGroup {
    public login: KnockoutObservable<string>;
    public email: KnockoutObservable<string>;
    public errors: KnockoutValidationErrors;
    public isValid: () => boolean;
    public errorMessage: KnockoutObservable<string>;
    public loading: KnockoutObservable<boolean>;
    constructor() {
        super();
        this.login = ko.observable<string>();
        this.email = ko.observable<string>();
        this.errors = ko.validation.group(this);
        this.errorMessage = ko.observable<string>();
        this.loading = ko.observable(false);
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
            const accountApi = new Account(apiHost);
            try {
                const data = await accountApi.requestResetPassword(this.login(), this.email());
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
            } catch (e) {
                self.loading(false);
            }
        }
    }
}
