﻿import * as ko from "knockout";
import { authManager } from "poker/authmanager";
import { App } from "../app";
import { appConfig } from "../appconfig";
import { _ } from "../languagemanager";
import { keyboardActivationService } from "../services";
import { settings } from "../settings";
import { PopupBase } from "../ui/popupbase";

declare var app: App;

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

    public errors: KnockoutValidationErrors;
    public loading: ko.Observable<boolean>;
    private validationModel: ko.Observable<AuthPopup>;

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
        const self = this;
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
            self.errorMessage(null);
            try {
                const result = await authManager.authenticate(login, password, rememberMe);
                if (result === "Ok") {
                    self.login(null);
                    self.password(null);
                    keyboardActivationService.forceHideKeyboard();
                    self.close();
                } else {
                    // Report authentication or authorization errors
                    if (result) {
                        self.errorMessage(_("errors." + result));
                    } else {
                        self.errorMessage(_("auth.unspecifiedError"));
                    }
                }
            } finally {
                self.loading(false);
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
