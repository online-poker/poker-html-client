/// <reference path="poker.commanding.api.ts" />
/// <reference path="poker.commanding.api.d.ts" />

declare var apiHost: string;

import * as ko from "knockout";
import { imagePreloadService } from "./services";
import { debugSettings } from "./debugsettings";

class MetadataManager {
    online = ko.observable("-");
    registered = ko.observable("-");
    prizes: TournamentPrizeStructure[][];
    bets: TournamentBetStructure[][];
    banners: BannerData[];
    smallBanners: BannerData[];
    avatars: string[];
    ready: Function;
    failed: Function;

    public setReady(value: Function) {
        this.ready = value;
    }
    public setFailed(value: Function) {
        this.failed = value;
    }
    update() {
        const self = this;
        const metadataApi = new OnlinePoker.Commanding.API.Metadata(apiHost);
        const result = $.Deferred();
        const failHandler = function () {
            if (self.failed !== null) {
                self.failed();
            }

            result.reject();
        };
        const successHander = function () {
            if (self.ready !== null) {
                self.ready();
            }

            result.resolve();
        };

        const bannersRequest = this.preloadFirstBanner(this.getBannerFormat());
        const smallBannersRequest = this.preloadBanners(this.getSmallBannerFormat());
        Promise.all([metadataApi.GetOnlinePlayers(),
            metadataApi.GetWellKnownPrizeStructure(),
            metadataApi.GetWellKnownBetStructure(),
            metadataApi.GetDefaultAvatars(),
            bannersRequest,
            smallBannersRequest])
            .then(function (values) {
                const [ onlinePlayersData, prizeStructureData, betStructureData,
                    avatarsData, bannersData, smallBannersData ] = values;
                if (onlinePlayersData.Status !== "Ok"
                    || prizeStructureData.Status !== "Ok"
                    || betStructureData.Status !== "Ok"
                    || bannersData.Status !== "Ok"
                    || avatarsData.Status !== "Ok"
                    || smallBannersData.Status !== "Ok") {
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

                self.log("Informaton about avatars received: " + JSON.stringify(avatarsData.Avatars));
                self.avatars = avatarsData.Avatars;

                self.log("Informaton about banners received: " + JSON.stringify(bannersData.Data));
                self.banners = bannersData.Data;

                self.log("Informaton about small banners received: " + JSON.stringify(smallBannersData.Data));
                self.smallBanners = smallBannersData.Data;

                successHander();
        }).then(null, failHandler);
        return result;
    }
    async versionCheck() {
        const metadataApi = new OnlinePoker.Commanding.API.Metadata(apiHost);
        const serverInformation = await metadataApi.VersionCheck();
        if (serverInformation.ServerApiVersion > OnlinePoker.Commanding.API.version) {
            if (serverInformation.MinimumClientApiVersion <= OnlinePoker.Commanding.API.version) {
                // Could work.
                return;
            } else {
                throw new Error("Upgrade required.");
            }
        }
    }
    updateOnline() {
        const self = this;
        const metadataApi = new OnlinePoker.Commanding.API.Metadata(apiHost);
        return metadataApi.GetOnlinePlayers().then(function (onlinePlayers) {
            self.registered(onlinePlayers.Data[1].toString());
            self.online(onlinePlayers.Data[0].toString());
            return onlinePlayers;
        });
    }
    private async preloadFirstBanner(format: number) {
        const metadataApi = new OnlinePoker.Commanding.API.Metadata(apiHost);
        const data = await metadataApi.GetBanners(format);
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
        const metadataApi = new OnlinePoker.Commanding.API.Metadata(apiHost);
        const data = await metadataApi.GetBanners(format);
        if (data.Status !== "Ok") {
            return data;
        }

        for (let i = 0; i < data.Data.length; i++) {
            imagePreloadService.preload(data.Data[i].Url);
        }

        return data;
    }
    getBannerFormat() {
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
    getSmallBannerFormat() {
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
    log(message: string) {
        if (debugSettings.initialization.metadata) {
            console.log(message);
        }
    }
}

let metadataManager = new MetadataManager();
export = metadataManager;
