import * as ko from "knockout";
import { PageBase } from "./ui/pagebase";

export class TablesFilterPage extends PageBase {
    public oldpassword: KnockoutObservable<string>;
    public password: KnockoutObservable<string>;
    public confirmpassword: KnockoutObservable<string>;
    public errors: KnockoutValidationErrors;
    public isValid: () => boolean;

    constructor() {
        super();
        this.oldpassword = ko.observable<string>().extend({ required: true });
        this.password = ko.observable<string>().extend({ required: true });
        this.confirmpassword = ko.observable<string>().extend({ required: true });

        this.errors = ko.validation.group(this);
    }
}
