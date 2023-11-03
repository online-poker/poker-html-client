import * as ko from "knockout";
import { App } from "../app";
import { _ } from "../languagemanager";
import { SimplePopup } from "../popups/simplepopup";
import { AccountManager } from "../services/accountManager";
import { PopupBase } from "../ui/popupbase";

declare var app: App;

export class ContinueForgetPasswordPopup extends PopupBase {
    public token: ko.Observable<string>;
    public password: ko.Observable<string>;
    public confirmPassword: ko.Observable<string>;
    public errorMessage: ko.Observable<string>;
    public errors: ko.ValidationErrors;
    public loading: ko.Observable<boolean>;
    private validationModel: ko.Observable<this>;

    constructor() {
        super();
        this.token = ko.observable<string>().extend({ required: true });
        this.password = ko.observable<string>().extend({ required: true });
        this.confirmPassword = ko.observable<string>().extend({ required: true });
        this.errors = ko.validation.group(this);
        this.validationModel = ko.validatedObservable(this);
        this.errorMessage = ko.observable<string>();
        this.loading = ko.observable(false);
    }
    public shown(args: any[]= []): void {
        this.token(null);
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
            const data = await accountApi.resetPassword(this.token(), this.password());
            if (data.Status === "Ok") {
                self.token(null);
                self.password(null);
                self.confirmPassword(null);
                app.closePopup();
                self.loading(false);
                SimplePopup.display(_("auth.passwordRecovery"), _("auth.passwordRecoveredSuccess"));
            } else {
                // Report authentication or authorization errors
                self.errorMessage(_("errors." + data.Status));
            }
        }
    }
}
