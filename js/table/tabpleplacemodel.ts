/// <reference path="../_references.ts" />
/// <reference path="tableplayer.ts" />
/// <reference path="cardsHelper.ts" />
/// <reference path="hand.ts" />
/// <reference path="../timeService.ts" />
/* tslint:disable:no-bitwise */

class TablePlaceModel {
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

    constructor(data: TablePlayer) {
        this.PlayerId = ko.observable(data.PlayerId);
        this.PlayerName = ko.observable(data.PlayerName);

        // Here should be added checks for the safe locations,
        // images from which could be loaded.
        if (data.PlayerUrl !== null) {
            var isSafeLocation = data.PlayerUrl !== "";
            this.PlayerUrl = ko.observable(isSafeLocation ? data.PlayerUrl : TablePlaceModel.DefaultAvatarUrl);
        } else {
            this.PlayerUrl = ko.observable(TablePlaceModel.DefaultAvatarUrl);
        }

        this.IsCurrent = ko.observable(data.IsCurrent);
        this.IsDealer = ko.observable(data.IsDealer);
        this.Money = ko.observable(data.Money);
        this.Seat = ko.observable(data.Seat);
        var cards = decodeCardsArray(data.Cards || null);
        var cardClasses = convertToCards(cards);
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
        var hasCards = cards == null ? null : true;
        this.WasInGame = ko.observable(data.WasInGame == null ? hasCards : data.WasInGame);
        this.IsCardsFolded = ko.observable(false);
        this.Card1Hightlighted = ko.observable(false);
        this.Card2Hightlighted = ko.observable(false);
        this.CardsHightlighted = ko.observable(false);
        this.CurrentAction = ko.observable<string>();

        var self = this;
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
    }
    initializeForNewGame(money: number) {
        this.IsInGameStatus(true);
        this.Money(money);
        this.WasInGame(true);
    }
    startDealCards() {
        this.Cards(allBacksClasses);
        this.IsDealCards(true);
    }
    setCards(cards: number[]) {
        if (cards === undefined) {
            console.warn("Passed undefined cards to the TablePlaceModel.setCards");
        }

        var cardsClasses = convertToCards(cards);
        this.RawCards(cards || null);
        this.Cards(cardsClasses);
        this.HandCards(cardsClasses);
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
        var self = this;
        this.CurrentAction(action);
        this.CurrentActionTimer = timeService.setTimeout(() => self.clearAction(), 2000);
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
        var self = this;
        this.LastChatMessage(message);
        this.LastChatMessageTimer = timeService.setTimeout(() => self.clearChatMessage(), 2000);
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

    getCombination(tableCards: number[]) {
        if (tableCards === null || tableCards === undefined || tableCards.length === 0) {
            return null;
        }

        var myCards = this.RawCards();
        if (myCards === null || myCards === undefined || myCards.length === 0) {
            return null;
        }

        var totalCards = <number[]>[];
        if (tableCards !== null) {
            totalCards = totalCards.concat(tableCards);
        }

        totalCards = totalCards.concat(myCards);
        var handRepresentation = {
            Cards: [],
            Suits: []
        };
        totalCards.forEach(function (card) {
            handRepresentation.Cards.push((card % 13) + 2);
            handRepresentation.Suits.push(1 << (card / 13));
        });
        var rank = HoldemHand.getCardRank(handRepresentation);
        var winnerCards = [];
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
        var type = HoldemHand.getHandTypeEx(handRepresentation);
        var typeIndex = HoldemHand.handTypeRanks[type.Type];
        var base = _("table.combination.c" + typeIndex.toString());

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
