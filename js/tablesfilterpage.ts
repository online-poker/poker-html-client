import * as ko from "knockout";
import { PageBase } from "./ui/pagebase";

export class TablesFilterPage extends PageBase {
    public oldpassword: ko.Observable<string>;
    public password: ko.Observable<string>;
    public confirmpassword: ko.Observable<string>;
    public errors: ko.ValidationErrors;
    private validationModel: ko.Observable<this>;

    constructor() {
        super();
        this.oldpassword = ko.observable<string>().extend({ required: true });
        this.password = ko.observable<string>().extend({ required: true });
        this.confirmpassword = ko.observable<string>().extend({ required: true });

        this.errors = ko.validation.group(this);
        this.validationModel = ko.validatedObservable(this);
    }
}
