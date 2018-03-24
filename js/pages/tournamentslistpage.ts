/// <reference path="../poker.commanding.api.ts" />
/* tslint:disable:no-bitwise */

declare var host: string;

import { LobbyTournamentItem, Tournament } from "@poker/api-server";
import * as ko from "knockout";
import { App } from "../app";
import { debugSettings } from "../debugsettings";
import { _ } from "../languagemanager";
import { PageBlock } from "../pageblock";
import { reloadManager } from "../services";
import { Slider } from "../slider";
import { PageBase } from "../ui/pagebase";
import { TournamentOptions } from "./lobbypage";

declare var app: App;

export class TournamentsListPage extends PageBase {
    public tournamentsCaption: KnockoutComputed<string>;
    public tournaments: KnockoutObservableArray<LobbyTournamentItem>;
    public loading: KnockoutObservable<boolean>;
    public options: TournamentOptions;
    public tournamentType: number;
    public slider: Slider;

    constructor() {
        super();
        this.tournaments = ko.observableArray([]);
        this.tournamentsCaption = ko.computed(() => {
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
    public deactivate() {
        super.deactivate();
    }
    public activate() {
        super.activate();
        this.refreshTournaments(false);

        reloadManager.setReloadCallback(() => this.refreshTournaments(true));
    }
    public setOptions(tournamentType: number, options: TournamentOptions): void {
        this.tournamentType = tournamentType;
        this.options = options;
    }
    public async refreshTournaments(force: boolean) {
        if (this.loading() && !force) {
            return;
        }

        this.loading(true);
        const self = this;
        const tournamentApi = new Tournament(host);

        const options = this.options;
        const prizeCurrency = options.currency();
        const tournamentTypeMask = 1 << this.tournamentType;
        const speed = options.speed() === 0 ? 0 : 1 << options.speed();
        const buyin = options.buyin() === 0 ? 0 : 1 << options.buyin();
        self.tournaments([]);
        const data = await tournamentApi.getTournaments(prizeCurrency, tournamentTypeMask, speed, buyin, null);
        self.loading(false);
        if (!self.visible()) {
            return;
        }

        if (data.Status === "Ok") {
            self.log("Informaton about tournaments received: ", data.Data);
            self.tournaments(data.Data);
        }
    }
    public back() {
        app.lobbyPageBlock.showLobby();
    }
    public selectTournament(tournament) {
        app.lobbyPageBlock.selectTournament(tournament);
    }
    private log(message: string, ...params: any[]) {
        if (debugSettings.lobby.trace) {
            console.log(message, params);
        }
    }
}
