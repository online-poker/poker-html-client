/// <reference path="../../../Scripts/typings/knockout/knockout.d.ts" />
/// <reference path="../../slider.ts" />

import ko = require("knockout");

/**
* Parameters for the timeblock component
*/
interface TimeBlockComponentParameters {
	selected?: KnockoutObservable<number>;

	/**
	* Optional initial slide to be presented first.
	*/
	initial?: number | KnockoutObservable<number>;
}

class TimeBlockComponent {
    private slider = new Slider();

    constructor(params: TimeBlockComponentParameters) {
        var self = this;
        this.slider.addOption(_("lobby.cashGames"), "cash", null);
        this.slider.addOption(_("lobby.tournaments"), "tournaments", null);
        this.slider.addOption(_("lobby.sitAndGo"), "sng", null);
		if (params && params.initial) {
			this.slider.currentIndex(ko.unwrap(params.initial));
		}

		if (params && params.selected) {
			this.slider.currentIndex.subscribe(function (newValue) {
				params.selected(newValue);
			});
		}
    }
}

export = TimeBlockComponent;
