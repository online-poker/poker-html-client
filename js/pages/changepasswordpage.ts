/// <reference path="../_references.ts" />
/// <reference path="../poker.commanding.api.ts" />
/// <reference path="../app.ts" />

class ChangePasswordPage extends PageBase implements KnockoutValidationGroup {
    oldpassword: KnockoutObservable<string>;
    password: KnockoutObservable<string>;
    confirmpassword: KnockoutObservable<string>;
    errors: KnockoutValidationErrors;
    isValid: () => boolean;

    constructor() {
		super();
        App.addTabBarItemMapping("more", "changePassword");
        this.oldpassword = ko.observable<string>().extend({ required: true });
        this.password = ko.observable<string>().extend({ required: true });
        this.confirmpassword = ko.observable<string>().extend({ required: true });

        this.errors = ko.validation.group(this);
    }
}
