import * as ko from "knockout";
import { Account } from "../api/account";
import { App } from "../app";
import * as authManager from "../authmanager";
import { _ } from "../languagemanager";
import * as metadataManager from "../metadatamanager";
import { PopupBase } from "../ui/popupbase";
import { SimplePopup } from "./simplepopup";

declare var apiHost: string;
declare var app: App;

export class RegistrationPopup extends PopupBase implements KnockoutValidationGroup {
    public login: KnockoutObservable<string>;
    public email: KnockoutObservable<string>;
    public firstName: KnockoutObservable<string>;
    public lastName: KnockoutObservable<string>;
    public patronymicName: KnockoutObservable<string>;
    public city: KnockoutObservable<string>;
    public password: KnockoutObservable<string>;
    public confirmPassword: KnockoutObservable<string>;
    public country: KnockoutObservable<number>;
    public ageValid: KnockoutObservable<boolean>;
    public agreeEula: KnockoutObservable<boolean>;
    public imageUrl: KnockoutObservable<string>;
    public imageFile = ko.observable<string>();
    public loading: KnockoutObservable<boolean>;
    public errors: KnockoutValidationErrors;
    private validationModel: KnockoutObservable<RegistrationPopup>;

    constructor() {
        super();
        this.login = ko.observable<string>().extend({ required: true, minLength: 5, maxLength: 12, validatable: true });
        this.email = ko.observable<string>().extend({ required: true, email: true, validatable: true });
        this.firstName = ko.observable<string>().extend({ required: true });
        this.lastName = ko.observable<string>().extend({ required: true });
        this.patronymicName = ko.observable<string>();
        this.password = ko.observable<string>().extend({ required: true, maxLength: 16 });
        this.confirmPassword = ko.observable<string>().extend({ required: true, equal: this.password });
        this.city = ko.observable<string>();
        this.country = ko.observable(1);
        this.ageValid = ko.observable(true).extend({ required: true });
        this.agreeEula = ko.observable(true).extend({ required: true });
        this.imageUrl = ko.observable("");
        this.loading = ko.observable(false);

        this.errors = ko.validation.group(this);
        this.validationModel = ko.validatedObservable(this);
    }
    public shown(args: any[]= []): void {
        if (args.length === 1 && args[0] === true) {
            super.shown(args);
            return;
        }

        this.login(null);
        this.email(null);
        this.firstName(null);
        this.lastName(null);
        this.patronymicName(null);
        this.password(null);
        this.confirmPassword(null);
        this.city(null);
        this.country(1);
        this.ageValid(false);
        this.agreeEula(false);
        this.errors.showAllMessages(false);
        super.shown(args);
    }
    /**
     * Selects avatar from list of predefined avatars
     */
    public selectPicture() {
        app.showPopup("selectAvatar", metadataManager.avatars);
        app.selectAvatarPopup.selected.addOnce((avatarUrl) => {
            if (avatarUrl != null) {
                this.imageUrl(avatarUrl);
            }

            app.showPopup("registration", true);
        }, this, 0);
    }
    /**
     * Selects avatar from the gallery.
     */
    public uploadPicture() {
        const captureSuccess = (imageData: string) => {
            app.suppressResume = true;
            this.imageFile(imageData);
        };

        // capture error callback
        const captureError = function (message) {
            app.suppressResume = true;
            console.log("Error code: " + message, null, "Capture Error");
        };

        navigator.camera.getPicture(captureSuccess, captureError, {
            destinationType: Camera.DestinationType.DATA_URL,
            quality: 75,
            sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
        });
    }
    public async confirm() {
        const self = this;
        const isValid = this.validationModel.isValid();
        if (!isValid) {
            this.errors.showAllMessages(true);
            this.moveToError();
            return;
        }

        this.loading(true);
        const accountApi = new Account(apiHost);
        const additionalProperties = {
            ImageDataBase64: this.imageFile(),
            ImageUrl: this.imageUrl(),
        };
        try {
            const data = await accountApi.register(this.login(), this.email(), this.password(), this.firstName(), this.lastName(),
                this.patronymicName(), this.country(), this.city(), additionalProperties);
            if (data.Status === "Ok") {
                self.close();
                SimplePopup.display(_("auth.registration"), _("auth.registrationsuccess"));
            } else {
                // Report registration errors;
                if (data.Status === "LoginAlreadyUsed") {
                    self.login.setError(_("errors." + data.Status));
                    self.moveToError();
                } else if (data.Status === "EmailAlreadyUsed") {
                    self.email.setError(_("errors." + data.Status));
                    self.moveToError();
                } else {
                    SimplePopup.display(_("auth.registration"), _("errors." + data.Status));
                }

                authManager.authenticated(false);
            }
        } finally {
            self.loading(false);
        }
    }

    public showAgreement() {
        app.executeCommand("pageblock.info");
        app.infoPageBlock.showLicenseAgreement();
    }

    /**
     * Move screen to show error field.
     */
    private moveToError() {
        $(".popup." + app.currentPopup + " .popup-container")[0].scrollTop = 0;
    }
}
