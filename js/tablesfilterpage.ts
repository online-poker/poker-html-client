import * as ko from "knockout";
import { PageBase } from "./ui/pagebase";

export class TablesFilterPage extends PageBase {
    oldpassword: KnockoutObservable<string>;
    password: KnockoutObservable<string>;
    confirmpassword: KnockoutObservable<string>;
    errors: KnockoutValidationErrors;
    isValid: () => boolean;

    constructor() {
        super();
        this.oldpassword = ko.observable<string>().extend({ required: true });
        this.password = ko.observable<string>().extend({ required: true });
        this.confirmpassword = ko.observable<string>().extend({ required: true });

        this.errors = ko.validation.group(this);
    }
}
