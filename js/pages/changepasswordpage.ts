import * as ko from "knockout";
import "../typings/knockout";
import { PageBase } from "../ui/pagebase";

export class ChangePasswordPage extends PageBase implements ko.ValidationGroup {
    public oldpassword: ko.Observable<string>;
    public password: ko.Observable<string>;
    public confirmpassword: ko.Observable<string>;
    public errors: ko.ValidationErrors;
    public isValid: () => boolean;

    constructor() {
        super();
        this.oldpassword = ko.observable<string>().extend({ required: true });
        this.password = ko.observable<string>().extend({ required: true });
        this.confirmpassword = ko.observable<string>().extend({ required: true });

        this.errors = ko.validation.group(this);
    }
}
