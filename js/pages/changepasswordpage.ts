import * as ko from "knockout";
import { PageBase } from "../ui/pagebase";
import { App } from "../app";

export class ChangePasswordPage extends PageBase implements KnockoutValidationGroup {
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
