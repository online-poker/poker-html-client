import { TournamentDefinition, TournamentPrizeStructure } from "@poker/api-server";
import * as ko from "knockout";
import * as metadataManager from "../../../metadatamanager";

interface TournamentPrizeStructureView {
    place: number;
    amount: number;
    percent: number;
}

class TournamentPrizeInformationComponent {
    private data: ko.Observable<TournamentDefinition>;
    private totalPrize: ko.Computed<number | null>;
    private structure: ko.Computed<TournamentPrizeStructureView[]>;

    constructor(params: { data: ko.Observable<TournamentDefinition> }) {
        const self = this;
        this.data = params.data;

        this.totalPrize = ko.computed(function () {
            const tdata = self.data();
            if (tdata == null) {
                return null;
            }

            return tdata.PrizeAmount + (tdata.CollectedPrizeAmount || 0);
        }, this);
        this.structure = ko.computed(function () {
            const data = self.data();
            if (data == null) {
                return [];
            }

            const currentPlayers = data.JoinedPlayers;
            const prizeStructure = metadataManager.prizes[data.WellKnownPrizeStructure];
            const sortedPrizes = prizeStructure.sort(function (a, b) {
                return a.MaxPlayer > b.MaxPlayer
                    ? 1
                    : (a.MaxPlayer < b.MaxPlayer ? -1 : 0);
            });
            const filteredPrizes = sortedPrizes.filter(function (a) {
                return a.MaxPlayer >= currentPlayers;
            });
            let currentPrize: TournamentPrizeStructure;
            if (filteredPrizes.length === 0) {
                currentPrize = sortedPrizes[0];
            } else {
                currentPrize = filteredPrizes[0];
            }

            const result = [] as TournamentPrizeStructureView[];
            const totalPrize = self.totalPrize() || 0;
            currentPrize.PrizeLevel.forEach(function (item, index) {
                result.push({
                    place: index + 1,
                    amount: totalPrize * item / 100,
                    percent: item,
                });
            });
            return result;
        }, this);
    }
}

export = TournamentPrizeInformationComponent;
