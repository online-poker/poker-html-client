import { TournamentDefinition } from "@poker/api-server";
import * as ko from "knockout";
import * as timeService from "../../timeservice";

export class TimeBlockComponent {
    private currentTime: ko.Computed<string>;

    constructor(params: { data: ko.Observable<TournamentDefinition> }) {
        this.currentTime = ko.computed(function () {
            return timeService.currentTime();
        }, this);
    }
}
