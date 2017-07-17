/// <reference path="../poker.commanding.api.ts" />

import * as ko from "knockout";
import { PopupBase } from "../ui/popupbase";
import * as authManager from "../authmanager";
import { keyboardActivationService } from "../services";
import { settings } from "../settings";
import { _ } from "../languagemanager";
import { App } from "../app";

declare var apiHost: string;
declare var app: App;

export class AuthPopup extends PopupBase implements KnockoutValidationGroup {
    public login: KnockoutObservable<string>;
    public password: KnockoutObservable<string>;
    public validationLogin = ko.observable<string>().extend({ required: true, maxLength: 12 });
    public validationPassword = ko.observable<string>().extend({ required: true, maxLength: 16 });
    public errorMessage: KnockoutObservable<string>;
    public rememberMe: KnockoutObservable<boolean>;
    public errors: KnockoutValidationErrors;
    public isValid: () => boolean;
    public loading: KnockoutObservable<boolean>;

    constructor() {
        super();
        this.login = ko.observable<string>();
        this.password = ko.observable<string>();
        this.rememberMe = ko.observable(false);
        this.errors = ko.validation.group(this);
        this.errorMessage = ko.observable<string>();
        this.loading = ko.observable(false);
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
        const isValid = this.isValid();
        if (!isValid) {
            this.errors.showAllMessages(true);
            return;
        }

        if (!this.loading()) {
            this.loading(true);
            const login = this.login();
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
