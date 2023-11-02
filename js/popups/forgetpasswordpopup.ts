import * as ko from "knockout";
import { _ } from "../languagemanager";
import { SimplePopup } from "../popups/simplepopup";
import { AccountManager } from "../services/accountManager";
import { PopupBase } from "../ui/popupbase";

export class ForgetPasswordPopup extends PopupBase {
    public login: ko.Observable<string>;
    public email: ko.Observable<string>;
    public errors: KnockoutValidationErrors;
    public errorMessage: ko.Observable<string>;
    public loading: ko.Observable<boolean>;
    private validationModel: ko.Observable<ForgetPasswordPopup>;

    constructor() {
        super();
        this.login = ko.observable<string>();
        this.email = ko.observable<string>();
        this.errors = ko.validation.group(this);
        this.validationModel = ko.validatedObservable(this);
        this.errorMessage = ko.observable<string>();
        this.loading = ko.observable(false);
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
            const accountApi = new AccountManager();
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
