﻿/// <reference path="poker.commanding.api.d.ts" />

declare var host: string;

import { Information, TournamentBetStructure, TournamentPrizeStructure } from "@poker/api-server";
import * as ko from "knockout";
import { debugSettings } from "./debugsettings";
import { PageBlock } from "./pageblock";
import { imagePreloadService } from "./services";

const exectedVersion = 1;

class MetadataManager {
    public online = ko.observable("-");
    public registered = ko.observable("-");
    public prizes: TournamentPrizeStructure[][] = [];
    public bets: TournamentBetStructure[][] = [];
    public banners: BannerData[];
    public smallBanners: BannerData[];
    public avatars: string[];
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
            const bannersRequest = this.preloadFirstBanner(this.getBannerFormat());
            const smallBannersRequest = this.preloadBanners(this.getSmallBannerFormat());
            const values = await Promise.all([
                metadataApi.getOnlinePlayers(),
                metadataApi.getWellKnownPrizeStructure(),
                metadataApi.getWellKnownBetStructure(),
                metadataApi.getDefaultAvatars(),
                bannersRequest,
                smallBannersRequest,
            ]);
            const [ onlinePlayersData, prizeStructureData, betStructureData,
                avatarsData, bannersData, smallBannersData ] = values;
            if (onlinePlayersData.Status !== "Ok"
                || prizeStructureData.Status !== "Ok"
                || betStructureData.Status !== "Ok"
                || betStructureData.Status !== "Ok"
                || bannersData.Status !== "Ok"
                || avatarsData.Status !== "Ok"
                || smallBannersData.Status !== "Ok") {
                failHandler();
                return;
            }

            self.log("Informaton about players online received: " + JSON.stringify(onlinePlayersData.Data));
            self.registered(onlinePlayersData.Data[0].toString());
            self.online(onlinePlayersData.Data[1].toString());

            self.log("Informaton about prize structure received: " + JSON.stringify(prizeStructureData.Data));
            self.prizes = prizeStructureData.Data;

            self.log("Informaton about bet structure received: " + JSON.stringify(betStructureData.Data));
            self.bets = betStructureData.Data;

            self.log("Informaton about avatars received: " + JSON.stringify(avatarsData.Avatars));
            self.avatars = avatarsData.Avatars;

            self.log("Informaton about banners received: " + JSON.stringify(bannersData.Data));
            self.banners = bannersData.Data;

            self.log("Informaton about small banners received: " + JSON.stringify(smallBannersData.Data));
            self.smallBanners = smallBannersData.Data;

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
        if (serverInformation.ServerApiVersion > exectedVersion) {
            if (serverInformation.MinimumClientApiVersion <= exectedVersion) {
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
        self.registered(onlinePlayers.Data[0].toString());
        self.online(onlinePlayers.Data[1].toString());
        return onlinePlayers;
    }

    /**
     * Set well-known bet structures.
     * @param bets Well known bet structures
     */
    public setBets(bets: TournamentBetStructure[][]) {
        this.bets = bets;
    }

    /**
     * Set well known methods for prize distribution
     * @param prizes Well known prize structure
     */
    public setPrizes(prizes: TournamentPrizeStructure[][]) {
        this.prizes = prizes;
    }
    private async preloadFirstBanner(format: number) {
        const metadataApi = new Information(host);
        const data = await metadataApi.getBanners(format);
        if (data.Status !== "Ok") {
            return data;
        }

        if (data.Data.length === 0) {
            return data;
        }

        imagePreloadService.preload(data.Data[0].Url);
        return data;
    }
    private async preloadBanners(format: number) {
        const metadataApi = new Information(host);
        const data = await metadataApi.getBanners(format);
        if (data.Status !== "Ok") {
            return data;
        }

        for (let i = 0; i < data.Data.length; i++) {
            imagePreloadService.preload(data.Data[i].Url);
        }

        return data;
    }
    private getBannerFormat() {
        if (PageBlock.useDoubleView) {
            return 7;
        }

        if (screen.width === 360 || screen.height === 360) {
            return 5;
        }

        if (screen.width === 375 || screen.height === 375) {
            return 7;
        }
        if (screen.width === 414 || screen.height === 414) {
            return 5;
        }

        return 3;
    }
    private getSmallBannerFormat() {
        if (PageBlock.useDoubleView) {
            return 8;
        }

        if (screen.width === 360 || screen.height === 360) {
            return 6;
        }

        if (screen.width === 375 || screen.height === 375) {
            return 8;
        }

        if (screen.width === 414 || screen.height === 414) {
            return 6;
        }

        return 4;
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
