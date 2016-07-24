/// <reference path="../../../Scripts/typings/knockout/knockout.d.ts" />

import ko = require("knockout");

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
