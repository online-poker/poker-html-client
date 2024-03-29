﻿import * as ko from "knockout";

/**
 * Parameters for the timeblock component
 */
interface CheckboxParameters {
    checked: boolean | ko.Observable<boolean>;
    label: string | ko.Observable<string>;
    right: boolean | ko.Observable<boolean>;
    color: string | ko.Observable<string>;
}

export class Checkbox {
    public checked: ko.Observable<boolean>;
    public label: ko.Observable<string>;
    public right: ko.Observable<boolean>;
    public color: ko.Observable<string>;

    constructor(params: CheckboxParameters, componentInfo?: ko.components.ComponentInfo) {
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
    public doClick(e: Event) {
        this.checked(!this.checked());
        e.preventDefault();
        e.stopPropagation();
        return false;
    }
}
