/* tslint:disable:no-bitwise */

import * as ko from "knockout";
import * as timeService from "../timeservice";
import { TableView } from "./tableview";
import { _ } from "../languagemanager";
import { withCommas } from "../helpers";

export class TablePlaceModel {
    /**
    * Default avatar for unspecified images, and 
    * images from unknown locations.
    */
    static DefaultAvatarUrl = "img/1px.png";

    /**
    * Id of the player
    */
    PlayerId: KnockoutObservable<number>;

    /**
    * Player's login
    */
    PlayerName: KnockoutObservable<string>;
    PlayerUrl: KnockoutObservable<string>;
    IsCurrent: KnockoutObservable<boolean>;
    IsDealer: KnockoutObservable<boolean>;
    IsBigBlind: KnockoutObservable<boolean>;
    IsSmallBlind: KnockoutObservable<boolean>;
    Money: KnockoutObservable<number>;
    Seat: KnockoutObservable<number>;

    /**
    * Cards which player has as displayed in the UI
    */
    Cards: KnockoutObservableArray<string>;

    /*
    * Actual hand cards which player has in this game.
    */
    HandCards: KnockoutObservableArray<string>;

    /*
    * Folded hand cards which player has in this game.
    */
    FoldedCards: KnockoutObservableArray<string>;

    /**
    * Cards which player has as displayed in the UI
    */
    RawCards: KnockoutObservableArray<number>;
    Bet: KnockoutObservable<number>;

    /**
    * Count of points for the player.
    */
    Points: KnockoutObservable<number>;

    /**
    * Count of stars for the player.
    */
    Stars: KnockoutObservable<number>;

    IsBronse: KnockoutComputed<boolean>;
    IsSilver: KnockoutComputed<boolean>;
    IsGold: KnockoutComputed<boolean>;
    IsBetPlaced: KnockoutComputed<boolean>;
    IsBetAnimationLocked: KnockoutObservable<boolean>;
    IsMovingBetToPot: KnockoutObservable<boolean>;
    IsDealCards: KnockoutObservable<boolean>;

    /**
     * Indicates that animation show for cards fold.
     */
    IsFoldCards: KnockoutObservable<boolean>;
    IsCardsAnimating: KnockoutComputed<boolean>;
    Status: KnockoutObservable<number>;
    WinAmount: KnockoutObservable<number>;
    TotalBet: KnockoutObservable<number>;
    WasInGame: KnockoutObservable<boolean>;
    IsCardsFolded: KnockoutObservable<boolean>;
    Card1Hightlighted: KnockoutObservable<boolean>;
    Card2Hightlighted: KnockoutObservable<boolean>;
    CardsHightlighted: KnockoutObservable<boolean>;
    IsCardsOpened = ko.observable(false);

    /**
     * Indicates that first hole card is opened.
     */
    IsHoleCard1Opened = ko.observable(false);

    /**
     * Indicates that second hole card is opened.
     */
    IsHoleCard2Opened = ko.observable(false);

    /**
    * Indicates current action which player performs now
    */
    CurrentAction: KnockoutObservable<string>;

    /**
    * Timer which control clearing of current action text
    */
    private CurrentActionTimer: number;

    IsSitoutStatus: KnockoutComputed<boolean>;

    /**
    * Indicates that player has in game status.
    */
    IsParticipatingStatus: KnockoutComputed<boolean>;

    /**
    * Indicates that player has in game status.
    */
    IsInGameStatus: KnockoutComputed<boolean>;

    /**
    * Last message in the chat which this player shows
    */
    LastChatMessage = ko.observable<string>(null);

    /**
    * Timer which control clearing of current action text
    */
    private LastChatMessageTimer: number;

    /**
    * Last message in the chat which this player shows
    */
    LastChatMessageTrimed: KnockoutComputed<string>;

    /**
     * Combination of cards for the winner.
     */
    WinnerCombination = ko.observable<string>();

    public cardsOverlayVisible = ko.observable(true);

    constructor(data: TablePlayer) {
        this.PlayerId = ko.observable(data.PlayerId);
        this.PlayerName = ko.observable(data.PlayerName);

        // Here should be added checks for the safe locations,
        // images from which could be loaded.
        if (data.PlayerUrl !== null) {
            const isSafeLocation = data.PlayerUrl !== "";
            this.PlayerUrl = ko.observable(isSafeLocation ? data.PlayerUrl : TablePlaceModel.DefaultAvatarUrl);
        } else {
            this.PlayerUrl = ko.observable(TablePlaceModel.DefaultAvatarUrl);
        }

        this.IsCurrent = ko.observable(data.IsCurrent);
        this.IsDealer = ko.observable(data.IsDealer);
        this.IsBigBlind = ko.observable(data.IsBigBlind);
        this.IsSmallBlind = ko.observable(data.IsSmallBlind);
        this.Money = ko.observable(data.Money);
        this.Seat = ko.observable(data.Seat);
        const cards = decodeCardsArray(data.Cards || null);
        const cardClasses = convertToCards(cards);
        this.RawCards = ko.observableArray(cards);
        this.Cards = ko.observableArray(cardClasses);
        this.HandCards = ko.observableArray(cardClasses);
        this.FoldedCards = ko.observableArray<string>(null);
        this.Stars = ko.observable(data.Stars);
        this.Points = ko.observable(data.Points);
        this.Bet = ko.observable(data.Bet);
        this.IsBetAnimationLocked = ko.observable(false);
        this.IsMovingBetToPot = ko.observable(false);
        this.IsDealCards = ko.observable(false);
        this.IsFoldCards = ko.observable(false);
        this.Status = ko.observable(data.Status);
        this.WinAmount = ko.observable(data.WinAmount || null);
        this.TotalBet = ko.observable(data.TotalBet || null);
        const hasCards = cards == null ? null : true;
        this.WasInGame = ko.observable(data.WasInGame == null ? hasCards : data.WasInGame);
        this.IsCardsFolded = ko.observable(false);
        this.Card1Hightlighted = ko.observable(false);
        this.Card2Hightlighted = ko.observable(false);
        this.CardsHightlighted = ko.observable(false);
        this.CurrentAction = ko.observable<string>();

        const self = this;
        this.IsCardsAnimating = ko.computed(function () {
            return self.IsDealCards() || self.IsFoldCards();
        }, this);
        this.IsBetPlaced = ko.computed(function () {
            return self.Bet() > 0 && !self.IsMovingBetToPot();
        }, this);
        this.IsSitoutStatus = ko.computed(function () {
            return (self.Status() & 1) !== 0;
        }, this);
        this.IsParticipatingStatus = ko.computed({
            read: function () {
                return (self.Status() & 8) !== 0;
            },
            write: function (value: boolean) {
                if (value) {
                    self.Status(self.Status() | 8);
                } else {
                    self.Status(self.Status() & ~8);
                }
            },
            owner: this
        });
        this.IsInGameStatus = ko.computed({
            read: function () {
                return (self.Status() & 16) !== 0;
            },
            write: function (value: boolean) {
                if (value) {
                    self.Status(self.Status() | 16);
                } else {
                    self.Status(self.Status() & ~16);
                }
            },
            owner: this
        });
        this.IsInGameStatus(this.IsParticipatingStatus() && this.Cards() !== null);

        this.IsBronse = ko.computed(function () {
            return self.Points() >= 100 * 1000
                && self.Points() < 200 * 1000;
        });
        this.IsSilver = ko.computed(function () {
            return self.Points() >= 200 * 1000
                && self.Points() < 500 * 1000;
        });
        this.IsGold = ko.computed(function () {
            return self.Points() >= 500 * 1000;
        });

        this.LastChatMessageTrimed = ko.computed(function () {
            if (self.LastChatMessage() === null) {
                return null;
            }

            return self.LastChatMessage().substr(0, 17) + "\u2026";
        });
    }
    prepareForNewGame() {
        this.TotalBet(null);
        this.Bet(null);
        this.IsCardsFolded(false);
        this.IsBetAnimationLocked(false);
        this.RawCards(null);
        this.Cards(null);
        this.HandCards(null);
        this.FoldedCards(null);
        this.WinAmount(null);
        if (this.Money() === 0) {
            this.IsInGameStatus(false);
        }

        this.Card1Hightlighted(false);
        this.Card2Hightlighted(false);
        this.CardsHightlighted(false);
        this.markCardsHidden();
        this.WinnerCombination(null);
    }
    initializeForNewGame(money: number) {
        this.IsInGameStatus(true);
        this.Money(money);
        this.WasInGame(true);
        this.cardsOverlayVisible(true);
    }
    startDealCards() {
        this.Cards(allBacksClasses);
        this.IsDealCards(true);
    }
    setCards(cards: number[]) {
        if (cards === undefined) {
            console.warn("Passed undefined cards to the TablePlaceModel.setCards");
        }

        const cardsClasses = convertToCards(cards);
        if (this.IsCardsFolded()) {
            this.FoldedCards(cardsClasses);
        } else {
            this.RawCards(cards || null);
            this.Cards(cardsClasses);
            this.HandCards(cardsClasses);
        }
    }
    openCard(cardPosition: number, cardValue: number) {
        let cards = (this.RawCards() === null || this.RawCards() === undefined)
            ? [254, 254]
            : this.RawCards();
        cards = [].concat(cards);
        cards[cardPosition] = cardValue;
        const cardsClasses = convertToCards(cards);
        if (cardPosition === 0) {
            this.IsHoleCard1Opened(true);
        } else {
            this.IsHoleCard2Opened(true);
        }

        this.RawCards(cards);
        if (this.IsCardsFolded()) {
            this.FoldedCards(cardsClasses);
        } else {
            this.Cards(cardsClasses);
            this.HandCards(cardsClasses);
        }
    }
    markCardsOpened() {
        this.IsCardsOpened(true);
    }
    markCardsHidden() {
        this.IsCardsOpened(false);
        this.IsHoleCard1Opened(false);
        this.IsHoleCard2Opened(false);
    }
    collectBet() {
        this.TotalBet((this.TotalBet() === null ? 0 : this.TotalBet()) + this.Bet());
        this.Bet(0);
        this.IsBetAnimationLocked(false);
        this.IsMovingBetToPot(false);
    }

    /**
    * Starts displaying action which player was perform during last turn.
    */
    startAction(action: string) {
        this.CurrentAction(action);
        this.CurrentActionTimer = timeService.setTimeout(() => this.clearAction(), 2000);
    }

    /**
    * Clears current action.
    */
    clearAction() {
        timeService.clearTimeout(this.CurrentActionTimer);
        this.CurrentAction(null);
    }

    /**
    * Starts displaying chat message from player.
    */
    displayChatMessage(message: string) {
        this.LastChatMessage(message);
        this.LastChatMessageTimer = timeService.setTimeout(() => this.clearChatMessage(), 2000);
    }

    /**
    * Clears current chat message.
    */
    clearChatMessage() {
        timeService.clearTimeout(this.LastChatMessageTimer);
        this.LastChatMessage(null);
    }
    public startFoldAnimation() {
        this.IsFoldCards(true);
        this.Cards(allBacksClasses);
    }
    public finishFoldAnimation() {
        this.Cards(null);
        this.IsFoldCards(false);
    }

    /**
     * Help message which indicate which action player should take.
     * @param tableView Table for which get help message.
     */
    public getHelpMessage(tableView: TableView): string {
        if (tableView.actionBlock.sitoutBlockVisible()) {
            if (this.Money() === 0) {
                return "Пожалуйста, пополните ваш счёт";
            }

            return "Нажмите кнопку Вернуться чтобы продолжить игру";
        }

        if (tableView.actionBlock.needBB()) {
            if (this.Money() === 0) {
                return "Пожалуйста, пополните ваш счёт";
            }

            if (tableView.actionBlock.waitbb()) {
                return "Подождите пожалуйста, вы начнете игру когда будете сидеть на большом блаинде";
            } else {
                return "Помните, на позиции \"дилера\" или \"маленького блайнда\", вы не сможете войти в игру.";
            }
        }

        if (tableView.actionBlock.mainButtonsBlockVisible()) {
            return "Пожалуйста сделайте Вашу ставку";
        }

        if (tableView.actionBlock.autoButtonsBlockVisible()) {
            return "Желаем удачи";
        }

        if (this.WinAmount() > 0) {
            return "Поздравляем, Ваш выигрыш: " + withCommas(this.WinAmount(), ",");
        }

        if (this.Money() === 0) {
            return "Пожалуйста, пополните ваш счёт";
        }

        // When player fold cards.
        if (this.IsCardsFolded()) {
            return "Желаем удачи";
        }

        // This is fallback case for situations in the 
        // beginning of the game start, pause between move confirmation.
        return "Желаем удачи";
    }

    getCombination(tableCards: number[]) {
        if (tableCards === null || tableCards === undefined || tableCards.length === 0) {
            return null;
        }

        const myCards = this.RawCards();
        if (myCards === null || myCards === undefined || myCards.length === 0) {
            return null;
        }

        let totalCards = <number[]>[];
        if (tableCards !== null) {
            totalCards = totalCards.concat(tableCards);
        }

        totalCards = totalCards.concat(myCards);
        let handRepresentation = {
            Cards: [],
            Suits: []
        };
        totalCards.forEach(function (card) {
            handRepresentation.Cards.push((card % 13) + 2);
            handRepresentation.Suits.push(1 << (card / 13));
        });
        const rank = HoldemHand.getCardRank(handRepresentation);
        let winnerCards = [];
        rank.WinnerCardsSet.forEach(function (item) {
            winnerCards.push(totalCards[item]);
        });
        handRepresentation = {
            Cards: [],
            Suits: []
        };
        winnerCards.forEach(function (card) {
            handRepresentation.Cards.push((card % 13) + 2);
            handRepresentation.Suits.push(1 << (card / 13));
        });
        const type = HoldemHand.getHandTypeEx(handRepresentation);
        const typeIndex = HoldemHand.handTypeRanks[type.Type];
        const base = _("table.combination.c" + typeIndex.toString());

        if (typeIndex === 1) {
            return base.replace("##c1", HoldemHand.cardValue(type.Cards[0]))
                .replace("##c2", HoldemHand.cardValue(type.Cards[1]))
                .replace("##c3", HoldemHand.cardValue(type.Cards[2]))
                .replace("##c4", HoldemHand.cardValue(type.Cards[3]))
                .replace("##c5", HoldemHand.cardValue(type.Cards[4]));
            }

        if (typeIndex === 2) {
            return base.replace("##c1", HoldemHand.cardValue(type.Cards[0]))
                .replace("##c2", HoldemHand.cardValue(type.Cards[1]))
                .replace("##c3", HoldemHand.cardValue(type.Cards[2]))
                .replace("##c4", HoldemHand.cardValue(type.Cards[3]));
        }

        if (typeIndex === 3) {
            return base.replace("##c1", HoldemHand.cardValue(type.Cards[0]))
                .replace("##c2", HoldemHand.cardValue(type.Cards[1]))
                .replace("##c3", HoldemHand.cardValue(type.Cards[2]));
        }

        if (typeIndex === 4) {
            return base.replace("##c1", HoldemHand.cardValue(type.Cards[0]))
                .replace("##c2", HoldemHand.cardValue(type.Cards[1]))
                .replace("##c3", HoldemHand.cardValue(type.Cards[2]));
        }

        if (typeIndex === 5) {
            return base.replace("##c1", HoldemHand.cardValue(type.Cards[0]));
        }

        if (typeIndex === 6) {
            return base.replace("##c1", HoldemHand.cardValue(type.Cards[0]))
                .replace("##c2", HoldemHand.cardValue(type.Cards[1]))
                .replace("##c3", HoldemHand.cardValue(type.Cards[2]))
                .replace("##c4", HoldemHand.cardValue(type.Cards[3]))
                .replace("##c5", HoldemHand.cardValue(type.Cards[4]));
        }

        if (typeIndex === 7) {
            return base.replace("##c1", HoldemHand.cardValue(type.Cards[0]))
                .replace("##c2", HoldemHand.cardValue(type.Cards[1]));
        }

        if (typeIndex === 8) {
            return base.replace("##c1", HoldemHand.cardValue(type.Cards[0]))
                .replace("##c2", HoldemHand.cardValue(type.Cards[1]));
        }

        if (typeIndex === 9) {
            return base.replace("##c1", HoldemHand.cardValue(type.Cards[0]));
        }

        return base;
    }
}
