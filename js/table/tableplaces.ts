import * as ko from "knockout";
import { TablePlaceModel } from "./tabpleplacemodel";

export class TablePlaces {
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

        this.offsetPlace1 = ko.computed(() => {
            const seat = this.getVirtualOffset(1);
            return this.getPlaceBySeat(seat);
        });
        this.offsetPlace2 = ko.computed(() => {
            const seat = this.getVirtualOffset(2);
            return this.getPlaceBySeat(seat);
        });
        this.offsetPlace3 = ko.computed(() => {
            const seat = this.getVirtualOffset(3);
            return this.getPlaceBySeat(seat);
        });
        this.offsetPlace4 = ko.computed(() => {
            const seat = this.getVirtualOffset(4);
            return this.getPlaceBySeat(seat);
        });
        this.offsetPlace5 = ko.computed(() => {
            const seat = this.getVirtualOffset(5);
            return this.getPlaceBySeat(seat);
        });
        this.offsetPlace6 = ko.computed(() => {
            const seat = this.getVirtualOffset(6);
            return this.getPlaceBySeat(seat);
        });
        this.offsetPlace7 = ko.computed(() => {
            const seat = this.getVirtualOffset(7);
            return this.getPlaceBySeat(seat);
        });
        this.offsetPlace8 = ko.computed(() => {
            const seat = this.getVirtualOffset(8);
            return this.getPlaceBySeat(seat);
        });
        this.offsetPlace9 = ko.computed(() => {
            const seat = this.getVirtualOffset(9);
            return this.getPlaceBySeat(seat);
        });
        this.offsetPlace10 = ko.computed(() => {
            const seat = this.getVirtualOffset(10);
            return this.getPlaceBySeat(seat);
        });

        this.places = ko.computed(() => {
            this.placesRefreshTrigger();
            const result = [];
            if (this.place1() !== null) {
                result[this.getRealOffset(1)] = this.place1();
            }

            if (this.place2() !== null) {
                result[this.getRealOffset(2)] = this.place2();
            }

            if (this.place3() !== null) {
                result[this.getRealOffset(3)] = this.place3();
            }

            if (this.place4() !== null) {
                result[this.getRealOffset(4)] = this.place4();
            }

            if (this.place5() !== null) {
                result[this.getRealOffset(5)] = this.place5();
            }

            if (this.place6() !== null) {
                result[this.getRealOffset(6)] = this.place6();
            }

            if (this.place7() !== null) {
                result[this.getRealOffset(7)] = this.place7();
            }

            if (this.place8() !== null) {
                result[this.getRealOffset(8)] = this.place8();
            }

            if (this.place9() !== null) {
                result[this.getRealOffset(9)] = this.place9();
            }

            if (this.place10() !== null) {
                result[this.getRealOffset(10)] = this.place10();
            }

            return result;
        }, this);
    }

    getMaxPlayers() {
        return this.maxPlayers;
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
        const newOffset = (this.maxPlayers + offset + this.virtualOffset()) % this.maxPlayers;
        this.virtualOffset(newOffset);
    }
    sit(seat: number, player: TablePlaceModel) {
        if (seat < 1 || seat > this.maxPlayers) {
            throw new Error("Invalid seat number: " + seat);
        }

        const seatVar = <KnockoutObservable<TablePlaceModel>>this["place" + seat];
        seatVar(player);
    }
    standup(seat: number) {
        if (seat < 1 || seat > this.maxPlayers) {
            throw new Error("Invalid seat number: " + seat);
        }

        const seatVar = <KnockoutObservable<TablePlaceModel>>this["place" + seat];
        seatVar(null);
    }
    getPlaceBySeat(seat: number) {
        const seatVar = <KnockoutObservable<TablePlaceModel>>this["place" + seat];
        return seatVar();
    }
    getPlaceByPlayerId(playerId: number) {
        const playerList = this.places().filter(_ => _.PlayerId() === playerId);
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
        const places = this.places();
        for (let i = 1; i <= this.maxPlayers; i++) {
            const playersOnSeat = players.filter((player) => player.Seat === i);
            if (playersOnSeat.length !== 0) {
                const model = new TablePlaceModel(playersOnSeat[0]);
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
