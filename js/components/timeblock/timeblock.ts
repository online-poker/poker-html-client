import ko = require("knockout");
import { TournamentDefinition } from "../../api/tournament";
import * as timeService from "../../timeservice";

class TimeBlockComponent {
    private currentTime: KnockoutComputed<string>;

    constructor(params: { data: KnockoutObservable<TournamentDefinition> }) {
        this.currentTime = ko.computed(function () {
            return timeService.currentTime();
        }, this);
    }
}

export = TimeBlockComponent;
