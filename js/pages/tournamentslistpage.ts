/// <reference path="../_references.ts" />
/// <reference path="../app.ts" />
/// <reference path="../ui/pagebase.ts" />
/// <reference path="../poker.commanding.api.ts" />
/* tslint:disable:no-bitwise */

declare var apiHost: string;

import * as ko from "knockout";
import { App } from "../app";
import { TournamentOptions } from "./lobbypage";
import { PageBase } from "../ui/pagebase";
import { debugSettings } from "../debugsettings";
import { reloadManager } from "../services";

declare var app: App;

export class TournamentsListPage extends PageBase {
    tournamentsCaption: KnockoutComputed<string>;
    tournaments: KnockoutObservableArray<LobbyTournamentItem>;
    loading: KnockoutObservable<boolean>;
    options: TournamentOptions;
    tournamentType: number;
    slider: Slider;

    constructor() {
        super();
        this.tournaments = ko.observableArray([]);
        this.tournamentsCaption = ko.computed(function () {
            return _("tournamentsList.headerCaption")
                .replace("#count", this.tournaments().length.toString());
        }, this);
        this.loading = ko.observable(false);
        this.slider = new Slider();
        this.slider.addOption(_("lobby.cashGames"), "cash", null);
        this.slider.addOption(_("lobby.tournaments"), "tournaments", null);
        this.slider.addOption(_("lobby.sitAndGo"), "sng", null);
        this.slider.selectPrev();
    }
    deactivate() {
        super.deactivate();
    }
    activate() {
        super.activate();
        var self = this;
        this.refreshTournaments(false);

        reloadManager.setReloadCallback(() => self.refreshTournaments(true));
    }
    setOptions(tournamentType: number, options: TournamentOptions): void {
        this.tournamentType = tournamentType;
        this.options = options;
    }
    refreshTournaments(force: boolean) {
        if (this.loading() && !force) {
            return;
        }

        this.loading(true);
        var self = this;
        var tournamentApi = new OnlinePoker.Commanding.API.Tournament(apiHost);

        var options = this.options;
        var prizeCurrency = options.currency();
        var tournamentTypeMask = 1 << this.tournamentType;
		var speed = options.speed() === 0 ? 0 : 1 << options.speed();
        var buyin = options.buyin() === 0 ? 0 : 1 << options.buyin();
        self.tournaments([]);
        tournamentApi.GetTournaments(prizeCurrency, tournamentTypeMask, speed, buyin, null, function (data) {
            self.loading(false);
            if (!self.visible()) {
                return;
            }

            if (data.Status === "Ok") {
                self.log("Informaton about tournaments received: ", data.Data);
                self.tournaments(data.Data);
            }
        });
    }
    back() {
        app.lobbyPageBlock.showLobby();
    }
    selectTournament(tournament) {
        app.lobbyPageBlock.selectTournament(tournament);
    }
    private log(message: string, ...params: any[]) {
        if (debugSettings.lobby.trace) {
            console.log(message, params);
        }
    }
}
