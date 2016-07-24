/// <reference path="../_references.ts" />
/// <reference path="tabpleplacemodel.ts" />

class TablePlaces {
    placesRefreshTrigger: KnockoutObservable<{}>;

    place1: KnockoutObservable<TablePlaceModel>;
    place2: KnockoutObservable<TablePlaceModel>;
    place3: KnockoutObservable<TablePlaceModel>;
    place4: KnockoutObservable<TablePlaceModel>;
    place5: KnockoutObservable<TablePlaceModel>;
    place6: KnockoutObservable<TablePlaceModel>;
    place7: KnockoutObservable<TablePlaceModel>;
    place8: KnockoutObservable<TablePlaceModel>;
    place9: KnockoutObservable<TablePlaceModel>;
    place10: KnockoutObservable<TablePlaceModel>;

    offsetPlace1: KnockoutComputed<TablePlaceModel>;
    offsetPlace2: KnockoutComputed<TablePlaceModel>;
    offsetPlace3: KnockoutComputed<TablePlaceModel>;
    offsetPlace4: KnockoutComputed<TablePlaceModel>;
    offsetPlace5: KnockoutComputed<TablePlaceModel>;
    offsetPlace6: KnockoutComputed<TablePlaceModel>;
    offsetPlace7: KnockoutComputed<TablePlaceModel>;
    offsetPlace8: KnockoutComputed<TablePlaceModel>;
    offsetPlace9: KnockoutComputed<TablePlaceModel>;
    offsetPlace10: KnockoutComputed<TablePlaceModel>;

    places: KnockoutComputed<TablePlaceModel[]>;
    virtualOffset: KnockoutObservable<number>;

    constructor(private maxPlayers: number) {
        this.placesRefreshTrigger = ko.observable();
        this.place1 = ko.observable<TablePlaceModel>(null);
        this.place2 = ko.observable<TablePlaceModel>(null);
        this.place3 = ko.observable<TablePlaceModel>(null);
        this.place4 = ko.observable<TablePlaceModel>(null);
        this.place5 = ko.observable<TablePlaceModel>(null);
        this.place6 = ko.observable<TablePlaceModel>(null);
        this.place7 = ko.observable<TablePlaceModel>(null);
        this.place8 = ko.observable<TablePlaceModel>(null);
        this.place9 = ko.observable<TablePlaceModel>(null);
        this.place10 = ko.observable<TablePlaceModel>(null);
        this.virtualOffset = ko.observable(0);

        var self = this;
        this.offsetPlace1 = ko.computed(function () {
            var seat = self.getVirtualOffset(1);
            return self.getPlaceBySeat(seat);
        });
        this.offsetPlace2 = ko.computed(function () {
            var seat = self.getVirtualOffset(2);
            return self.getPlaceBySeat(seat);
        });
        this.offsetPlace3 = ko.computed(function () {
            var seat = self.getVirtualOffset(3);
            return self.getPlaceBySeat(seat);
        });
        this.offsetPlace4 = ko.computed(function () {
            var seat = self.getVirtualOffset(4);
            return self.getPlaceBySeat(seat);
        });
        this.offsetPlace5 = ko.computed(function () {
            var seat = self.getVirtualOffset(5);
            return self.getPlaceBySeat(seat);
        });
        this.offsetPlace6 = ko.computed(function () {
            var seat = self.getVirtualOffset(6);
            return self.getPlaceBySeat(seat);
        });
        this.offsetPlace7 = ko.computed(function () {
            var seat = self.getVirtualOffset(7);
            return self.getPlaceBySeat(seat);
        });
        this.offsetPlace8 = ko.computed(function () {
            var seat = self.getVirtualOffset(8);
            return self.getPlaceBySeat(seat);
        });
        this.offsetPlace9 = ko.computed(function () {
            var seat = self.getVirtualOffset(9);
            return self.getPlaceBySeat(seat);
        });
        this.offsetPlace10 = ko.computed(function () {
            var seat = self.getVirtualOffset(10);
            return self.getPlaceBySeat(seat);
        });

        this.places = ko.computed(function () {
            self.placesRefreshTrigger();
            var result = [];
            if (self.place1() !== null) {
                result[this.getRealOffset(1)] = self.place1();
            }

            if (self.place2() !== null) {
                result[this.getRealOffset(2)] = self.place2();
            }

            if (self.place3() !== null) {
                result[this.getRealOffset(3)] = self.place3();
            }

            if (self.place4() !== null) {
                result[this.getRealOffset(4)] = self.place4();
            }

            if (self.place5() !== null) {
                result[this.getRealOffset(5)] = self.place5();
            }

            if (self.place6() !== null) {
                result[this.getRealOffset(6)] = self.place6();
            }

            if (self.place7() !== null) {
                result[this.getRealOffset(7)] = self.place7();
            }

            if (self.place8() !== null) {
                result[this.getRealOffset(8)] = self.place8();
            }

            if (self.place9() !== null) {
                result[this.getRealOffset(9)] = self.place9();
            }

            if (self.place10() !== null) {
                result[this.getRealOffset(10)] = self.place10();
            }

            return result;
        }, this);
    }
    getRealOffset(seat: number) {
        if (this.maxPlayers === 0) {
            return 1;
        }

        return ((seat - 1 + this.virtualOffset()) % this.maxPlayers) + 1;
    }
    getVirtualOffset(seat: number) {
        if (this.maxPlayers === 0) {
            return 1;
        }

        return ((seat - 1 + this.maxPlayers - this.virtualOffset()) % this.maxPlayers) + 1;
    }
    rotate(offset: number) {
        var newOffset = (this.maxPlayers + offset + this.virtualOffset()) % this.maxPlayers;
        this.virtualOffset(newOffset);
    }
    sit(seat: number, player: TablePlaceModel) {
        if (seat < 1 || seat > this.maxPlayers) {
            throw new Error("Invalid seat number: " + seat);
        }

        var seatVar = <KnockoutObservable<TablePlaceModel>>this["place" + seat];
        seatVar(player);
    }
    standup(seat: number) {
        if (seat < 1 || seat > this.maxPlayers) {
            throw new Error("Invalid seat number: " + seat);
        }

        var seatVar = <KnockoutObservable<TablePlaceModel>>this["place" + seat];
        seatVar(null);
    }
    getPlaceBySeat(seat: number) {
        var seatVar = <KnockoutObservable<TablePlaceModel>>this["place" + seat];
        return seatVar();
    }
    getPlaceByPlayerId(playerId: number) {
        var playerList = this.places().filter(_ => _.PlayerId() === playerId);
        if (playerList.length === 0) {
            return null;
        }

        return playerList[0];
    }
    setPlayers(players: TablePlayer[]) {
        /// <signature>
        ///     <summary>Sets players on the table.</summary>
        ///     <param name="players" type="Array">Array of players</param>
        /// </signature>
        this.clear();
        var places = this.places();
        for (var i = 1; i <= this.maxPlayers; i++) {
            var playersOnSeat = players.filter((player) => player.Seat === i);
            if (playersOnSeat.length !== 0) {
                var model = new TablePlaceModel(playersOnSeat[0]);
                model.IsBetAnimationLocked(true);
                this.sit(i, model);
            }
        }

        this.refreshPlaces();
    }
    clear() {
        this.place1(null);
        this.place2(null);
        this.place3(null);
        this.place4(null);
        this.place5(null);
        this.place6(null);
        this.place7(null);
        this.place8(null);
        this.place9(null);
        this.place10(null);
    }
    refreshPlaces() {
        this.placesRefreshTrigger.notifySubscribers();
        this.placesRefreshTrigger.valueHasMutated();
    }
}
