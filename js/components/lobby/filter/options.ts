/// <reference types="knockout" />

import ko = require("knockout");

/**
* Parameters for the timeblock component
*/
interface FilterOptionsComponentParameters {
	options: any;

	/**
	* Optional initial slide to be presented first.
	*/
	displayCurrency?: boolean | KnockoutObservable<boolean>;
}

class FilterOptionsComponent {
	private options: any;
	private displayCurrency = true;

    constructor(params: FilterOptionsComponentParameters) {
        var self = this;
        this.options = params.options;
		if (params && params.displayCurrency !== undefined && params.displayCurrency !== null) {
			this.displayCurrency = ko.unwrap(params.displayCurrency);
		}
    }
}

export = FilterOptionsComponent;
