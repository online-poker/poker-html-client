import * as ko from "knockout";
import * as kov from "knockout.validation";

export function updateDefaultMessages() {
    // tslint:disable-next-line:no-unused-expression
    kov;
    ko.validation.rules.required.message = "Это поле обязательно";
    ko.validation.rules.email.message = "Укажите правильный email";
    ko.validation.rules.equal.message = "Значения должны совпадать";
    ko.validation.rules.minLength.message = "Логин должен быть не менее {0} символов";
    ko.validation.rules.maxLength.message = "Логин должен быть не более {0} символов";
}
