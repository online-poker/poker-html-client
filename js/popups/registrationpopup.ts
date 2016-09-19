/// <reference path="../_references.ts" />
/// <reference path="../poker.commanding.api.ts" />
/// <reference path="../app.ts" />
/// <reference path="../services/websiteService.ts" />

import * as ko from "knockout";
import { PopupBase } from "../ui/popupbase";
import * as metadataManager from "../metadatamanager";
import * as authManager from "../authmanager";
import { SimplePopup } from "./simplepopup";
import { App } from "../app";

declare var apiHost: string;
declare var app: App;

export class RegistrationPopup extends PopupBase implements KnockoutValidationGroup {
    login: KnockoutObservable<string>;
    email: KnockoutObservable<string>;
    firstName: KnockoutObservable<string>;
    lastName: KnockoutObservable<string>;
    patronymicName: KnockoutObservable<string>;
    city: KnockoutObservable<string>;
    password: KnockoutObservable<string>;
    confirmPassword: KnockoutObservable<string>;
    country: KnockoutObservable<number>;
    ageValid: KnockoutObservable<boolean>;
    agreeEula: KnockoutObservable<boolean>;
    imageUrl: KnockoutObservable<string>;
    imageFile = ko.observable<string>();
    errors: KnockoutValidationErrors;
    isValid: () => boolean;
    loading: KnockoutObservable<boolean>;

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
    }
    shown(args: any[]= []): void {
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
    selectPicture() {
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
    uploadPicture() {
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
            quality: 75,
            sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
            destinationType: Camera.DestinationType.DATA_URL
        });
    }
    confirm() {
        const self = this;
        const isValid = this.isValid();
        if (!isValid) {
            this.errors.showAllMessages(true);
            this.moveToError();
            return;
        }

        this.loading(true);
        const accountApi = new OnlinePoker.Commanding.API.Account(apiHost);
        const additionalProperties = {
            ImageUrl: this.imageUrl(),
            ImageDataBase64: this.imageFile()
        };
        accountApi.Register(this.login(), this.email(), this.password(), this.firstName(), this.lastName(),
            this.patronymicName(), this.country(), this.city(), additionalProperties, [], function (data) {
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
        }).always(function () {
            self.loading(false);
        });
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
