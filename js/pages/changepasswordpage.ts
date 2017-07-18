import * as ko from "knockout";
import { App } from "../app";
import { PageBase } from "../ui/pagebase";

export class ChangePasswordPage extends PageBase implements KnockoutValidationGroup {
    public oldpassword: KnockoutObservable<string>;
    public password: KnockoutObservable<string>;
    public confirmpassword: KnockoutObservable<string>;
    public errors: KnockoutValidationErrors;
    public isValid: () => boolean;

    constructor() {
        super();
        App.addTabBarItemMapping("more", "changePassword");
        this.oldpassword = ko.observable<string>().extend({ required: true });
        this.password = ko.observable<string>().extend({ required: true });
        this.confirmpassword = ko.observable<string>().extend({ required: true });

        this.errors = ko.validation.group(this);
    }
}
