/// <reference types="knockout" />

import ko = require("knockout");
import * as timeService from "../../timeService";

class TimeBlockComponent {
    private currentTime: KnockoutComputed<string>;

    constructor(params: { data: KnockoutObservable<TournamentDefinition> }) {
        var self = this;
        this.currentTime = ko.computed(function () {
            return timeService.currentTime();
        }, this);
    }
}

export = TimeBlockComponent;
