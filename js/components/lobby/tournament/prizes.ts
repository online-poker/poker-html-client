/// <reference path="../../../_references.ts" />

import ko = require("knockout");

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
        var self = this;
        this.data = params.data;

        this.totalPrize = ko.computed(function () {
            var tdata = self.data();
            if (tdata == null) {
                return null;
            }

            return tdata.PrizeAmount + (tdata.CollectedPrizeAmount || 0);
        }, this);
        this.structure = ko.computed(function () {
            var data = self.data();
            if (data == null) {
                return [];
            }

            var currentPlayers = data.JoinedPlayers;
            var prizeStructure = metadataManager.prizes[data.WellKnownPrizeStructure];
            var sortedPrizes = prizeStructure.sort(function (a, b) {
                return a.MaxPlayer > b.MaxPlayer
                    ? 1
                    : (a.MaxPlayer < b.MaxPlayer ? -1 : 0);
            });
            var filteredPrizes = sortedPrizes.filter(function (a) {
                return a.MaxPlayer >= currentPlayers;
            });
			var currentPrize: TournamentPrizeStructure;
            if (filteredPrizes.length === 0) {
                currentPrize = sortedPrizes[0];
            } else {
                currentPrize = filteredPrizes[0];
            }

            var i = 1;
            var result = <TournamentPrizeStructureView[]>[];
            var totalPrize = self.totalPrize();
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
