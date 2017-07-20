/// <reference path="poker.commanding.api.d.ts" />

declare var host: string;

import * as ko from "knockout";
import { Information, TournamentBetStructure, TournamentPrizeStructure } from "./api/information";
import { debugSettings } from "./debugsettings";
import { imagePreloadService } from "./services";

class MetadataManager {
    public online = ko.observable("-");
    public registered = ko.observable("-");
    public prizes: TournamentPrizeStructure[][];
    public bets: TournamentBetStructure[][];
    public ready: () => void | null;
    public failed: () => void;

    public setReady(value: () => void | null) {
        this.ready = value;
    }
    public setFailed(value: () => void) {
        this.failed = value;
    }
    public async update() {
        const self = this;
        const metadataApi = new Information(host);
        const failHandler = () => {
            if (this.failed !== null) {
                this.failed();
            }

            throw new Error("Failed to update metadata");
        };

        try {
            const values = await Promise.all([
                metadataApi.getOnlinePlayers(),
                metadataApi.getWellKnownPrizeStructure(),
                metadataApi.getWellKnownBetStructure(),
            ]);
            const [ onlinePlayersData, prizeStructureData, betStructureData  ] = values;
            if (onlinePlayersData.Status !== "Ok"
                || prizeStructureData.Status !== "Ok"
                || betStructureData.Status !== "Ok") {
                failHandler();
                return;
            }

            self.log("Informaton about players online received: " + JSON.stringify(onlinePlayersData.Data));
            self.registered(onlinePlayersData.Data[1].toString());
            self.online(onlinePlayersData.Data[0].toString());

            self.log("Informaton about prize structure received: " + JSON.stringify(prizeStructureData.Data));
            self.prizes = prizeStructureData.Data;

            self.log("Informaton about bet structure received: " + JSON.stringify(betStructureData.Data));
            self.bets = betStructureData.Data;

            if (self.ready !== null) {
                self.ready();
            }
        } catch (e) {
            this.log(e);
            failHandler();
        }
    }
    public async versionCheck() {
        const metadataApi = new Information(host);
        const serverInformation = await metadataApi.getVersion();
        if (serverInformation.ServerApiVersion > OnlinePoker.Commanding.API.version) {
            if (serverInformation.MinimumClientApiVersion <= OnlinePoker.Commanding.API.version) {
                // Could work.
                return;
            } else {
                throw new Error("Upgrade required.");
            }
        }
    }
    public async updateOnline() {
        const self = this;
        const metadataApi = new Information(host);
        const onlinePlayers = await metadataApi.getOnlinePlayers();
        self.registered(onlinePlayers.Data[1].toString());
        self.online(onlinePlayers.Data[0].toString());
        return onlinePlayers;
    }
    private log(message: string | Error) {
        if (debugSettings.initialization.metadata) {
            // tslint:disable-next-line:no-console
            console.log(message);
        }
    }
}

const metadataManager = new MetadataManager();
export = metadataManager;
