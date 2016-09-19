﻿/// <reference path="poker.commanding.api.ts" />
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

        const bannersRequest = metadataApi.GetBanners(self.getBannerFormat());
        $.when(bannersRequest).done(function (data: ApiResult<BannerData[]>, status) {
            if (data.Status !== "Ok") {
                return;
            }

            if (data.Data.length === 0) {
                return;
            }

            imagePreloadService.preload(data.Data[0].Url);
        });
        const smallBannersRequest = metadataApi.GetBanners(self.getSmallBannerFormat());
        $.when(smallBannersRequest).done(function (data: ApiResult<BannerData[]>, status) {
            if (data.Status !== "Ok") {
                return;
            }

            for (let i = 0; i < data.Data.length; i++) {
                imagePreloadService.preload(data.Data[i].Url);
            }
        });
        $.when(metadataApi.GetOnlinePlayers(),
            metadataApi.GetWellKnownPrizeStructure(),
            metadataApi.GetWellKnownBetStructure(),
            metadataApi.GetDefaultAvatars(),
            bannersRequest,
            smallBannersRequest)
            .done(function (onlinePlayersDataResult, prizeStructureDataResult, betStructureDataResult,
                    avatarsDataResult, bannersDataResult, smallBannersDataResult) {
                const onlinePlayersData = onlinePlayersDataResult[0];
                const prizeStructureData = prizeStructureDataResult[0];
                const betStructureData = betStructureDataResult[0];
                const avatarsData = avatarsDataResult[0];
                const bannersData = <ApiResult<BannerData[]>>bannersDataResult[0];
                const smallBannersData = <ApiResult<BannerData[]>>smallBannersDataResult[0];
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
                self.registered(onlinePlayersData.Data[1]);
                self.online(onlinePlayersData.Data[0]);

                self.log("Informaton about prize structure received: " + JSON.stringify(prizeStructureData.Data));
                self.prizes = prizeStructureData.Data;

                self.log("Informaton about bet structure received: " + JSON.stringify(betStructureData.Data));
                self.bets = betStructureData.Data;

                self.log("Informaton about avatars received: " + JSON.stringify(avatarsData.Data));
                self.avatars = avatarsData.Avatars;

                self.log("Informaton about banners received: " + JSON.stringify(bannersData.Data));
                self.banners = bannersData.Data;

                self.log("Informaton about small banners received: " + JSON.stringify(smallBannersData.Data));
                self.smallBanners = smallBannersData.Data;

                successHander();
        }).fail(failHandler);
        return result;
    }
    versionCheck() {
        const self = this;
        const result = $.Deferred();
        const metadataApi = new OnlinePoker.Commanding.API.Metadata(apiHost);
        metadataApi.VersionCheck().then(function (serverInformation) {
            if (serverInformation.ServerApiVersion > OnlinePoker.Commanding.API.version) {
                if (serverInformation.MinimumClientApiVersion <= OnlinePoker.Commanding.API.version) {
                    result.reject(true);
                } else {
                    result.reject(false);
                }
            }

            result.resolve();
        });
        return result;
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