/// <reference types="knockout" />

import ko = require("knockout");

/**
* Parameters for the timeblock component
*/
interface CheckboxParameters {
    checked: boolean | KnockoutObservable<boolean>;
    label: string | KnockoutObservable<string>;
    right: boolean | KnockoutObservable<boolean>;
    color: string | KnockoutObservable<string>;
}

class Checkbox {
    checked: KnockoutObservable<boolean>;
    label: KnockoutObservable<string>;
    right: KnockoutObservable<boolean>;
    color: KnockoutObservable<string>;

    constructor(params: CheckboxParameters, componentInfo?: KnockoutComponentTypes.ComponentInfo) {
        const checked = params.checked;
        if (typeof checked === "boolean") {
            this.checked = ko.observable(checked);
        } else {
            this.checked = checked;
        }

        const label = params.label;
        if (typeof label === "string") {
            this.label = ko.observable(label);
        } else {
            this.label = label;
        }

        const right = params.right;
        if (typeof right === "boolean") {
            this.right = ko.observable(right);
        } else {
            if (right) {
                this.right = right;
            } else {
                this.right = ko.observable(false);
            }
        }

        const color = params.color;
        if (typeof color === "string") {
            this.color = ko.observable(color);
        } else {
            if (color) {
                this.color = color;
            } else {
                this.color = ko.observable("unknown");
            }
        }
    }
    doClick(e: Event) {
        this.checked(!this.checked());
        e.preventDefault();
        e.stopPropagation();
        return false;
    }
}

export = Checkbox;
