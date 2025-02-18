﻿import * as ko from "knockout";

/**
 * Parameters for the timeblock component
 */
interface FilterOptionsComponentParameters {
    options: any;

    /**
     * Optional initial slide to be presented first.
     */
    displayCurrency?: boolean | ko.Observable<boolean>;
}

export class FilterOptionsComponent {
    private options: any;
    private displayCurrency = true;

    constructor(params: FilterOptionsComponentParameters) {
        this.options = params.options;
        if (params && params.displayCurrency !== undefined && params.displayCurrency !== null) {
            this.displayCurrency = ko.unwrap(params.displayCurrency);
        }
    }
}
