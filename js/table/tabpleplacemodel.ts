﻿/* tslint:disable:no-bitwise */

import * as ko from "knockout";
import { appConfig } from "poker/appconfig";
import { withCommas } from "../helpers";
import { _ } from "../languagemanager";
import * as timeService from "../timeservice";
import { convertToCards, decodeCardsArray } from "./cardsHelper";
import * as HoldemHand from "./hand";
import { TableView } from "./tableview";

interface CardsRepresentation {
    Cards: number[];
    Suits: number[];
}

export class TablePlaceModel {
    /**
     * Default avatar for unspecified images, and
     * images from unknown locations.
     */
    public static DefaultAvatarUrl = "img/1px.png";

    /**
     * Id of the player
     */
    public PlayerId: ko.Observable<number>;

    /**
     * Player's login
     */
    public PlayerName: ko.Observable<string>;
    public PlayerUrl: ko.Observable<string>;
    public IsCurrent: ko.Observable<boolean>;
    public IsDealer: ko.Observable<boolean>;
    public IsBigBlind: ko.Observable<boolean>;
    public IsSmallBlind: ko.Observable<boolean>;
    public Money: ko.Observable<number>;

    /**
     * User friendly amount of money which player has.
     */
    public SeatName: ko.Computed<string>;

    /**
     * Seat number for accounting purposes.
     */
    public Seat: ko.Observable<number>;

    /**
     * User friendly name of the seat.
     */
    public MoneyInformation: ko.Computed<string>;

    /**
     * Cards which player has as displayed in the UI
     */
    public Cards: ko.ObservableArray<string>;

    /**
     * Cards which would be displayed as currenly back cards
     */
    public BackCards: ko.ObservableArray<string>;

    /*
     * Actual  hand cards which player has in this game.
     */
    public HandCards: ko.ObservableArray<string>;

    /*
     * Actual hand cards which player has in this game.
     */
    public DisplayedHandCards: ko.ObservableArray<string>;

    /*
     * Folded hand cards which player has in this game.
     */
    public FoldedCards: ko.ObservableArray<string>;

    /**
     * Cards which player has as displayed in the UI
     */
    public RawCards: ko.ObservableArray<number>;
    public Bet: ko.Observable<number>;

    /**
     * Count of points for the player.
     */
    public Points: ko.Observable<number>;

    /**
     * Count of stars for the player.
     */
    public Stars: ko.Observable<number>;

    public IsBronse: ko.Computed<boolean>;
    public IsSilver: ko.Computed<boolean>;
    public IsGold: ko.Computed<boolean>;
    public IsBetPlaced: ko.Computed<boolean>;
    public IsBetAnimationLocked: ko.Observable<boolean>;
    public IsMovingBetToPot: ko.Observable<boolean>;
    public IsDealCards: ko.Observable<boolean>;

    /**
     * Indicates that animation show for cards fold.
     */
    public IsFoldCards: ko.Observable<boolean>;
    public IsCardsAnimating: ko.Computed<boolean>;
    public Status: ko.Observable<number>;
    public WinAmount: ko.Observable<number>;
    public TotalBet: ko.Observable<number>;
    public WasInGame: ko.Observable<boolean>;
    public IsCardsFolded: ko.Observable<boolean>;
    public Card1Hightlighted: ko.Observable<boolean>;
    public Card2Hightlighted: ko.Observable<boolean>;
    public Card3Hightlighted: ko.Observable<boolean>;
    public Card4Hightlighted: ko.Observable<boolean>;
    public CardsHightlighted: ko.Observable<boolean>;
    public IsCardsOpened = ko.observable(false);

    /**
     * Indicates that first hole card is opened.
     */
    public IsHoleCard1Opened = ko.observable(false);

    /**
     * Indicates that second hole card is opened.
     */
    public IsHoleCard2Opened = ko.observable(false);

    /**
     * Indicates current action which player performs now
     */
    public CurrentAction: ko.Observable<string>;

    public IsSitoutStatus: ko.Computed<boolean>;

    /**
     * Indicates that player has in game status.
     */
    public IsParticipatingStatus: ko.Computed<boolean>;

    /**
     * Indicates that player has in game status.
     */
    public IsInGameStatus: ko.Computed<boolean>;

    /**
     * Last message in the chat which this player shows
     */
    public LastChatMessage = ko.observable<string>(null);

    /**
     * Last message in the chat which this player shows
     */
    public LastChatMessageTrimed: ko.Computed<string | null>;

    /**
     * Combination of cards for the winner.
     */
    public WinnerCombination = ko.observable<string>();

    /**
     * Notification about winning to the player
     */
    public WinNotification = ko.observable<string>();

    public cardsOverlayVisible = ko.observable(true);
    public needCardsOverlay = ko.observable(false);

    /**
     * Timer which control clearing of current action text
     */
    private CurrentActionTimer: number = 0;

    /**
     * Timer which control clearing of current action text
     */
    private LastChatMessageTimer: number = 0;

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
        this.MoneyInformation = ko.computed(() => {
            return this.Money() === null ? "" : _("table.playerBalance", { amount: this.Money() });
        }, this);
        this.Seat = ko.observable(data.Seat);
        this.SeatName = ko.computed(() => {
            return this.Seat() === null ? "" : _("table.seatName", { seat: this.Seat() });
        }, this);

        const cards = decodeCardsArray(data.Cards || null);
        const cardClasses = convertToCards(cards);
        this.RawCards = ko.observableArray(cards);
        this.Cards = ko.observableArray(cardClasses);
        this.BackCards = ko.observableArray(null);
        this.HandCards = ko.observableArray(cardClasses);
        this.DisplayedHandCards = ko.observableArray(cardClasses);
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
        this.Card3Hightlighted = ko.observable(false);
        this.Card4Hightlighted = ko.observable(false);
        this.CardsHightlighted = ko.observable(false);
        this.CurrentAction = ko.observable<string>();

        this.IsCardsAnimating = ko.computed(() => {
            return this.IsDealCards() || this.IsFoldCards();
        }, this);
        this.IsBetPlaced = ko.computed(() => {
            return this.Bet() > 0 && !this.IsMovingBetToPot();
        }, this);
        this.IsSitoutStatus = ko.computed(() => {
            return (this.Status() & 1) !== 0;
        }, this);
        this.IsParticipatingStatus = ko.computed({
            read: () => {
                return (this.Status() & 8) !== 0;
            },
            write: (value: boolean) => {
                if (value) {
                    this.Status(this.Status() | 8);
                } else {
                    this.Status(this.Status() & ~8);
                }
            },
            owner: this,
        });
        this.IsInGameStatus = ko.computed({
            read: () => {
                return (this.Status() & 16) !== 0;
            },
            write: (value: boolean) => {
                if (value) {
                    this.Status(this.Status() | 16);
                } else {
                    this.Status(this.Status() & ~16);
                }
            },
            owner: this,
        });
        this.IsInGameStatus(this.IsParticipatingStatus() && this.Cards() !== null);

        this.IsBronse = ko.computed(() => {
            return this.Points() >= 100 * 1000
                && this.Points() < 200 * 1000;
        });
        this.IsSilver = ko.computed(() => {
            return this.Points() >= 200 * 1000
                && this.Points() < 500 * 1000;
        });
        this.IsGold = ko.computed(() => {
            return this.Points() >= 500 * 1000;
        });

        this.LastChatMessageTrimed = ko.computed(() => {
            if (this.LastChatMessage() === null) {
                return null;
            }

            return this.LastChatMessage().substr(0, appConfig.game.messageDisplaySize || 17) + "\u2026";
        });
    }
    public prepareForNewGame() {
        this.TotalBet(null);
        this.Bet(null);
        this.IsCardsFolded(false);
        this.IsBetAnimationLocked(false);
        this.RawCards(null);
        this.Cards(null);
        this.HandCards(null);
        this.DisplayedHandCards(null);
        this.FoldedCards(null);
        this.WinAmount(null);
        if (this.Money() === 0) {
            this.IsInGameStatus(false);
        }

        this.Card1Hightlighted(false);
        this.Card2Hightlighted(false);
        this.Card3Hightlighted(false);
        this.Card4Hightlighted(false);
        this.CardsHightlighted(false);
        this.markCardsHidden();
        this.WinnerCombination(null);
        this.WinNotification(null);
    }
    public initializeForNewGame(money: number) {
        this.IsInGameStatus(true);
        this.Money(money);
        this.WasInGame(true);
        this.cardsOverlayVisible(true);
    }
    public startDealCards() {
        this.Cards(this.BackCards());
        this.IsDealCards(true);
    }
    public setCards(cards: number[]) {
        if (cards === undefined) {
            // tslint:disable-next-line:no-console
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
    public openCard(cardPosition: number, cardValue: number) {
        let cards = (this.RawCards() === null || this.RawCards() === undefined)
            ? [254, 254]
            : this.RawCards();
        const emptyArray: number[] = [];
        cards = emptyArray.concat(cards);
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
    public markCardsOpened() {
        this.IsCardsOpened(true);
    }
    public markCardsHidden() {
        this.IsCardsOpened(false);
        this.IsHoleCard1Opened(false);
        this.IsHoleCard2Opened(false);
    }
    public collectBet() {
        this.TotalBet((this.TotalBet() === null ? 0 : this.TotalBet()) + this.Bet());
        this.Bet(0);
        this.IsBetAnimationLocked(false);
        this.IsMovingBetToPot(false);
    }

    /**
     * Starts displaying action which player was perform during last turn.
     */
    public startAction(action: string) {
        this.CurrentAction(action);
        this.CurrentActionTimer = timeService.setTimeout(() => this.clearAction(), appConfig.game.clearActionDuration || 2000);
    }

    /**
     * Clears current action.
     */
    public clearAction() {
        timeService.clearTimeout(this.CurrentActionTimer);
        this.CurrentAction(null);
    }

    /**
     * Starts displaying chat message from player.
     */
    public displayChatMessage(message: string) {
        this.LastChatMessage(message);
        this.LastChatMessageTimer = timeService.setTimeout(() => this.clearChatMessage(), appConfig.game.messageDisplayDuration || 2000);
    }

    /**
     * Clears current chat message.
     */
    public clearChatMessage() {
        timeService.clearTimeout(this.LastChatMessageTimer);
        this.LastChatMessage(null);
    }
    public startFoldAnimation() {
        this.IsFoldCards(true);
        this.Cards(this.BackCards());
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
                return _("table.helpMessage.notEnoughMoney");
            }

            return _("table.helpMessage.returnToGame");
        }

        if (tableView.actionBlock.needBB()) {
            if (this.Money() === 0) {
                return _("table.helpMessage.notEnoughMoney");
            }

            if (tableView.actionBlock.waitbb()) {
                return _("table.helpMessage.waitingBB");
            } else {
                return _("table.helpMessage.needBB");
            }
        }

        if (tableView.actionBlock.mainButtonsBlockVisible()) {
            return _("table.helpMessage.makeBet");
        }

        if (tableView.actionBlock.autoButtonsBlockVisible()) {
            return _("table.helpMessage.goodLuck");
        }

        if (this.WinAmount() > 0) {
            return _("table.helpMessage.youWin")
                .replace("##amount", withCommas(this.WinAmount(), ","));
        }

        if (this.Money() === 0) {
            return _("table.helpMessage.notEnoughMoney");
        }

        // When player fold cards.
        if (this.IsCardsFolded()) {
            return _("table.helpMessage.cardsFolded");
        }

        // This is fallback case for situations in the
        // beginning of the game start, pause between move confirmation.
        return _("table.helpMessage.unknownSituation");
    }

    public getCombination(tableCards: number[]) {
        if (tableCards === null || tableCards === undefined || tableCards.length === 0) {
            return null;
        }

        const myCards = this.RawCards();
        if (myCards === null || myCards === undefined || myCards.length === 0) {
            return null;
        }

        let totalCards: number[] = [];
        if (tableCards !== null) {
            totalCards = totalCards.concat(tableCards);
        }

        totalCards = totalCards.concat(myCards);
        let handRepresentation: CardsRepresentation = {
            Cards: [],
            Suits: [],
        };
        totalCards.forEach(function(card: number) {
            handRepresentation.Cards.push((card % 13) + 2);
            handRepresentation.Suits.push(1 << (card / 13));
        });
        const rank = HoldemHand.getCardRank(handRepresentation);
        const winnerCards: number[] = [];
        rank.WinnerCardsSet.forEach(function(item) {
            winnerCards.push(totalCards[item]);
        });
        handRepresentation = {
            Cards: [],
            Suits: [],
        };
        winnerCards.forEach(function(card) {
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
