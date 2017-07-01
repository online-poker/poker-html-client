/// <reference path="../poker.commanding.api.ts" />
/* tslint:disable:no-bitwise */

declare var apiHost: string;

import * as ko from "knockout";
import { App } from "../app";
import { TournamentOptions } from "./lobbypage";
import { PageBase } from "../ui/pagebase";
import { debugSettings } from "../debugsettings";
import { reloadManager } from "../services";
import { _ } from "../languagemanager";

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
        this.refreshTournaments(false);

        reloadManager.setReloadCallback(() => this.refreshTournaments(true));
    }
    setOptions(tournamentType: number, options: TournamentOptions): void {
        this.tournamentType = tournamentType;
        this.options = options;
    }
    async refreshTournaments(force: boolean) {
        if (this.loading() && !force) {
            return;
        }

        this.loading(true);
        const self = this;
        const tournamentApi = new OnlinePoker.Commanding.API.Tournament(apiHost);

        const options = this.options;
        const prizeCurrency = options.currency();
        const tournamentTypeMask = 1 << this.tournamentType;
        const speed = options.speed() === 0 ? 0 : 1 << options.speed();
        const buyin = options.buyin() === 0 ? 0 : 1 << options.buyin();
        self.tournaments([]);
        const data = await tournamentApi.GetTournaments(prizeCurrency, tournamentTypeMask, speed, buyin, null);
        self.loading(false);
        if (!self.visible()) {
            return;
        }

        if (data.Status === "Ok") {
            self.log("Informaton about tournaments received: ", data.Data);
            self.tournaments(data.Data);
        }
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
