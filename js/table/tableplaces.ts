import * as ko from "knockout";
import { TablePlaceModel } from "./tabpleplacemodel";

export class TablePlaces {
    public placesRefreshTrigger: KnockoutObservable<{}>;

    public place1: KnockoutObservable<TablePlaceModel>;
    public place2: KnockoutObservable<TablePlaceModel>;
    public place3: KnockoutObservable<TablePlaceModel>;
    public place4: KnockoutObservable<TablePlaceModel>;
    public place5: KnockoutObservable<TablePlaceModel>;
    public place6: KnockoutObservable<TablePlaceModel>;
    public place7: KnockoutObservable<TablePlaceModel>;
    public place8: KnockoutObservable<TablePlaceModel>;
    public place9: KnockoutObservable<TablePlaceModel>;
    public place10: KnockoutObservable<TablePlaceModel>;

    public offsetPlace1: KnockoutComputed<TablePlaceModel>;
    public offsetPlace2: KnockoutComputed<TablePlaceModel>;
    public offsetPlace3: KnockoutComputed<TablePlaceModel>;
    public offsetPlace4: KnockoutComputed<TablePlaceModel>;
    public offsetPlace5: KnockoutComputed<TablePlaceModel>;
    public offsetPlace6: KnockoutComputed<TablePlaceModel>;
    public offsetPlace7: KnockoutComputed<TablePlaceModel>;
    public offsetPlace8: KnockoutComputed<TablePlaceModel>;
    public offsetPlace9: KnockoutComputed<TablePlaceModel>;
    public offsetPlace10: KnockoutComputed<TablePlaceModel>;

    public places: KnockoutComputed<TablePlaceModel[]>;
    public virtualOffset: KnockoutObservable<number>;

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
            const result: TablePlaceModel[] = [];
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

    public getMaxPlayers() {
        return this.maxPlayers;
    }
    public getRealOffset(seat: number) {
        if (this.maxPlayers === 0) {
            return 1;
        }

        return ((seat - 1 + this.virtualOffset()) % this.maxPlayers) + 1;
    }
    public getVirtualOffset(seat: number) {
        if (this.maxPlayers === 0) {
            return 1;
        }

        return ((seat - 1 + this.maxPlayers - this.virtualOffset()) % this.maxPlayers) + 1;
    }
    public rotate(offset: number) {
        const newOffset = (this.maxPlayers + offset + this.virtualOffset()) % this.maxPlayers;
        this.virtualOffset(newOffset);
    }
    public sit(seat: number, player: TablePlaceModel) {
        if (seat < 1 || seat > this.maxPlayers) {
            throw new Error("Invalid seat number: " + seat);
        }

        const seatVar = this["place" + seat] as KnockoutObservable<TablePlaceModel>;
        seatVar(player);
    }
    public standup(seat: number) {
        if (seat < 1 || seat > this.maxPlayers) {
            throw new Error("Invalid seat number: " + seat);
        }

        const seatVar = this["place" + seat] as KnockoutObservable<TablePlaceModel>;
        seatVar(null);
    }
    public getPlaceBySeat(seat: number) {
        const seatVar = this["place" + seat] as KnockoutObservable<TablePlaceModel>;
        return seatVar();
    }
    public getPlaceByPlayerId(playerId: number) {
        const playerList = this.places().filter((_) => _.PlayerId() === playerId);
        if (playerList.length === 0) {
            return null;
        }

        return playerList[0];
    }
    public setPlayers(players: TablePlayer[]) {
        /// <signature>
        ///     <summary>Sets players on the table.</summary>
        ///     <param name="players" type="Array">Array of players</param>
        /// </signature>
        this.clear();
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
    public clear() {
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
    public refreshPlaces() {
        this.placesRefreshTrigger.notifySubscribers();
        if (this.placesRefreshTrigger.valueHasMutated) {
            this.placesRefreshTrigger.valueHasMutated();
        }
    }
}
