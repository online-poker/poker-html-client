import ko = require("knockout");
import * as metadataManager from "../../../metadatamanager";

interface TournamentPrizeStructureView {
    place: number;
    amount: number;
    percent: number;
};

class TournamentPrizeInformationComponent {
    private data: KnockoutObservable<TournamentDefinition>;
    private totalPrize: KnockoutComputed<number>;
    private structure: KnockoutComputed<TournamentPrizeStructureView[]>;

    constructor(params: { data: KnockoutObservable<TournamentDefinition> }) {
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

            const i = 1;
            const result = <TournamentPrizeStructureView[]>[];
            const totalPrize = self.totalPrize();
            currentPrize.PrizeLevel.forEach(function (item, index) {
                result.push({
                    place: index + 1,
                    amount: totalPrize * item / 100,
                    percent: item
                });
            });
            return result;
        }, this);
    }
}

export = TournamentPrizeInformationComponent;
