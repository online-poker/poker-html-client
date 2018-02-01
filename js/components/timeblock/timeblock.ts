import { TournamentDefinition } from "@poker/api-server";
import ko = require("knockout");
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
