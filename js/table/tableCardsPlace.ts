import * as ko from "knockout";
import { convertToCards } from "./cardsHelper";
import * as runtimeSettings from "./runtimesettings";

export class TableCardsPlace {
    public tableCards: KnockoutObservableArray<string>;
    public tableCardsData: KnockoutObservableArray<number>;
    public isFlop: KnockoutObservable<boolean>;
    public isFlop5: KnockoutObservable<boolean>;
    public isTurn: KnockoutObservable<boolean>;
    public isTurn5: KnockoutObservable<boolean>;
    public isRiver: KnockoutObservable<boolean>;
    public isAnimating: KnockoutComputed<boolean>;
    public CardsHightlighted: KnockoutObservable<boolean>;
    public Card1Hightlighted: KnockoutObservable<boolean>;
    public Card2Hightlighted: KnockoutObservable<boolean>;
    public Card3Hightlighted: KnockoutObservable<boolean>;
    public Card4Hightlighted: KnockoutObservable<boolean>;
    public Card5Hightlighted: KnockoutObservable<boolean>;

    constructor() {
        this.tableCards = ko.observableArray<string>([]);
        this.tableCardsData = ko.observableArray<number>([]);
        this.isFlop = ko.observable(false);
        this.isFlop5 = ko.observable(false);
        this.isTurn = ko.observable(false);
        this.isTurn5 = ko.observable(false);
        this.isRiver = ko.observable(false);
        this.CardsHightlighted = ko.observable(false);
        this.Card1Hightlighted = ko.observable(false);
        this.Card2Hightlighted = ko.observable(false);
        this.Card3Hightlighted = ko.observable(false);
        this.Card4Hightlighted = ko.observable(false);
        this.Card5Hightlighted = ko.observable(false);

        this.isAnimating = ko.computed(() => {
            return this.isFlop() || this.isFlop5()
                || this.isTurn() || this.isTurn5()
                || this.isRiver();
        }, this);
    }

    /**
     * Clear cards on the table
     */
    public clear() {
        this.CardsHightlighted(false);
        this.Card1Hightlighted(false);
        this.Card2Hightlighted(false);
        this.Card3Hightlighted(false);
        this.Card4Hightlighted(false);
        this.Card5Hightlighted(false);
        this.tableCards([]);
        this.tableCardsData([]);
    }

    /**
     * Clear all currently running animation
     */
    public clearAnimation() {
        this.isFlop(false);
        this.isFlop5(false);
        this.isTurn(false);
        this.isTurn5(false);
        this.isRiver(false);
    }

    /**
     * Set cards on the table.
     * @cardsData Array of table cards to display
     */
    public setCards(cardsData: number[]) {
        const cards: string[] = convertToCards(cardsData);
        this.tableCards(cards);
        this.tableCardsData(cardsData);
    }

    public openCards(cardsData: number[]) {
        const cards: string[] = convertToCards(cardsData);
        let currentCards = this.tableCards();
        if (runtimeSettings.tableCardsAnimating) {
            if (currentCards == null || currentCards.length === 0) {
                if (cards.length === 3) {
                    this.isFlop(true);
                } else {
                    this.isFlop5(true);
                }
            } else if (currentCards.length === 3) {
                if (cards.length === 4) {
                    this.isTurn(true);
                } else {
                    this.isTurn5(true);
                }
            } else {
                if (currentCards.length !== 5) {
                    this.isRiver(true);
                }
            }
        }

        currentCards = cards;
        this.tableCards(currentCards);
        this.tableCardsData(cardsData);
    }
}
