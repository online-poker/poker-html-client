import ko = require("knockout");
import { _ } from "../../languagemanager";
import { Slider } from "../../slider";

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

export class GameTypeSelectorComponent {
    private slider = new Slider();

    constructor(params: TimeBlockComponentParameters) {
        this.slider.addOption(_("lobby.cashGames"), "cash", null);
        this.slider.addOption(_("lobby.tournaments"), "tournaments", null);
        this.slider.addOption(_("lobby.sitAndGo"), "sng", null);
        if (params && params.initial) {
            this.slider.currentIndex(ko.unwrap(params.initial));
        }

        if (params && params.selected) {
            const selected = params.selected;
            this.slider.currentIndex.subscribe(function (newValue) {
                selected(newValue);
            });
        }
    }
}
