import * as ko from "knockout";
import { authManager } from "poker/authmanager";
import { App } from "../app";
import { appConfig } from "../appconfig";
import { _ } from "../languagemanager";
import { keyboardActivationService } from "../services";
import { settings } from "../settings";
import { PopupBase } from "../ui/popupbase";

declare const app: App;

export class AuthPopup extends PopupBase {
    public login: ko.Observable<string>;
    public password: ko.Observable<string>;
    public validationLogin = ko.observable<string>().extend({ required: true, maxLength: 12 });
    public validationPassword = ko.observable<string>().extend({ required: true, maxLength: 16 });
    public errorMessage: ko.Observable<string>;
    public rememberMe: ko.Observable<boolean>;
    public allowSelfRegistration: ko.Observable<boolean>;
    public allowRememberMe: ko.Observable<boolean>;
    public allowPasswordRecovery: ko.Observable<boolean>;

    public errors: ko.ValidationErrors;
    public loading: ko.Observable<boolean>;
    private validationModel: ko.Observable<this>;

    constructor() {
        super();
        this.login = ko.observable<string>();
        this.password = ko.observable<string>();
        this.rememberMe = ko.observable(false);
        this.errors = ko.validation.group(this);
        this.validationModel = ko.validatedObservable(this);
        this.errorMessage = ko.observable<string>();
        this.loading = ko.observable(false);
        this.allowSelfRegistration = ko.observable(appConfig.auth.allowSelfRegistration);
        this.allowRememberMe = ko.observable(appConfig.auth.allowRememberMe);
        this.allowPasswordRecovery = ko.observable(appConfig.auth.allowPasswordRecovery);
    }
    public shown(args: any[]= []): void {
        this.login(settings.login());
        this.password(settings.password());
        this.rememberMe(settings.login() != null);
        this.errors.showAllMessages(false);
        super.shown(args);
    }
    public async logon() {
        if (authManager.authenticated()) {
            return;
        }

        this.validationLogin(this.login());
        this.validationPassword(this.password());
        const isValid = this.validationModel.isValid();
        if (!isValid) {
            this.errors.showAllMessages(true);
            return;
        }

        if (!this.loading()) {
            this.loading(true);
            const login = this.login().trim();
            const password = this.password();
            const rememberMe = this.rememberMe();
            this.errorMessage(null);
            try {
                const result = await authManager.authenticate(login, password, rememberMe);
                if (result === "Ok") {
                    this.login(null);
                    this.password(null);
                    keyboardActivationService.forceHideKeyboard();
                    this.close();
                } else {
                    // Report authentication or authorization errors
                    if (result) {
                        this.errorMessage(_("errors." + result));
                    } else {
                        this.errorMessage(_("auth.unspecifiedError"));
                    }
                }
            } finally {
                this.loading(false);
            }
        }
    }
    public registration() {
        // Do nothing.
    }
    public forgetPassword() {
        app.showPopup("forgetPassword");
    }
}
