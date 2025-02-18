import * as ko from "knockout";
import { App } from "../app";
import { _ } from "../languagemanager";
import { SimplePopup } from "../popups/simplepopup";
import { AccountManager } from "../services/accountManager";
import { PopupBase } from "../ui/popupbase";

declare const app: App;

export class ChangePasswordPopup extends PopupBase {
    public oldPassword = ko.observable<string>().extend({ required: true });
    public password: ko.Observable<string>;
    public confirmPassword: ko.Observable<string>;
    public errorMessage: ko.Observable<string>;
    public errors: ko.ValidationErrors;
    public loading: ko.Observable<boolean>;
    private validationModel: ko.Observable<this>;

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
        const isValid = this.validationModel.isValid();
        if (!isValid) {
            this.errors.showAllMessages(true);
            return;
        }

        if (!this.loading()) {
            this.loading(true);
            this.errorMessage(null);
            const accountApi = new AccountManager();
            const data = await accountApi.changePasword(this.oldPassword(), this.password());
            if (data.Status === "Ok") {
                this.loading(false);
                this.oldPassword(null);
                this.password(null);
                this.confirmPassword(null);
                app.closePopup();
                SimplePopup.display(_("auth.changePassword"), _("auth.passwordChangedSuccess"));
            } else {
                // Report authentication or authorization errors
                this.errorMessage(_("errors." + data.Status));
            }
        }
    }
}
