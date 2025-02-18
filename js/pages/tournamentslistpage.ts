/* tslint:disable:no-bitwise */

declare const host: string;

import { LobbyTournamentItem, Tournament, TournamentDefinition } from "@poker/api-server";
import * as ko from "knockout";
import { App } from "../app";
import { debugSettings } from "../debugsettings";
import { _ } from "../languagemanager";
import { PageBlock } from "../pageblock";
import { reloadManager } from "../services";
import { Slider } from "../slider";
import { PageBase } from "../ui/pagebase";
import { TournamentOptions } from "./lobbypage";

declare const app: App;

export class TournamentsListPage extends PageBase {
    public tournamentsCaption: ko.Computed<string>;
    public tournaments: ko.ObservableArray<LobbyTournamentItem>;
    public loading: ko.Observable<boolean>;
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
        const tournamentApi = new Tournament(host);

        const options = this.options;
        const prizeCurrency = options.currency();
        const tournamentTypeMask = 1 << this.tournamentType;
        const speed = options.speed() === 0 ? 0 : 1 << options.speed();
        const buyin = options.buyin() === 0 ? 0 : 1 << options.buyin();
        this.tournaments([]);
        const data = await tournamentApi.getTournaments(prizeCurrency, tournamentTypeMask, speed, buyin, null);
        this.loading(false);
        if (!this.visible()) {
            return;
        }

        if (data.Status === "Ok") {
            this.log("Informaton about tournaments received: ", data.Data);
            this.tournaments(data.Data);
        }
    }
    public back() {
        app.lobbyPageBlock.showLobby();
    }
    public selectTournament(tournament: TournamentDefinition) {
        app.lobbyPageBlock.selectTournament(tournament);
    }
    private log(message: string, ...params: any[]) {
        if (debugSettings.lobby.trace) {
            console.log(message, params);
        }
    }
}
