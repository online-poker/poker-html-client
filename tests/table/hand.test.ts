import {
    cardValue,
    getCardRank,
    HandParseResultStatus,
    handTypeNames,
    parseHand,
    getHandTypeEx,
} from "../../js/table/hand";

describe("Parse Hand", () => {
    it("Parsing successul hand", () => {
        const hand = parseHand("A♠ 10♠ 8♠ 7♠ 2♠");
        expect(hand.Status).toBe(HandParseResultStatus.Ok);
        expect(hand.Hand.Cards.length).toBe(5);
        expect(hand.Hand.Suits.length).toBe(5);
    });

    it("Invalid hand test", () => {
        const hand = parseHand("A ♠ AIO ♠I");
        expect(hand.Status).toBe(HandParseResultStatus.InvalidHand);
    });

    it("Empty string", () => {
        const hand = parseHand("");
        expect(hand.Status).toBe(HandParseResultStatus.InvalidHand);
    });

    it("Cards missing", () => {
        const hand = parseHand("♠ ♠ ♠ ♠ ♠");
        expect(hand.Status).toBe(HandParseResultStatus.CardsMissing);
    });

    it("Suite missing", () => {
        const hand = parseHand("A A A A A A");
        expect(hand.Status).toBe(HandParseResultStatus.SuitsMissing);
    });

    it("Insufficient and duplicate cards", () => {
        const hand = parseHand("A♠A♠");
        expect(hand.Status).toBe(HandParseResultStatus.InsufficientCardsAndDuplicates);
    });

    it("Insufficient cards", () => {
        const hand = parseHand("A♠");
        expect(hand.Status).toBe(HandParseResultStatus.InsufficientCards);
    });

    it("Duplicate cards", () => {
        const hand = parseHand("A♠ 10♠ 8♠ 7♠ 2♠ A♠");
        expect(hand.Status).toBe(HandParseResultStatus.DuplicatesDetected);
    });

    it("Duplicate AllCardsShouldHaveOneSuit", () => {
        const hand = parseHand("A♠ 10♠ 8♠ 7♠ 2♠ A♠♠");
        expect(hand.Status).toBe(HandParseResultStatus.AllCardsShouldHaveOneSuit);
    });
});

describe("Get card rank", () => {
    describe("Texas holdem", () => {
        it("Flush", () => {
            const poket = "A♣ 3♣";
            const tableCards = "A♠ 10♠ 8♠ 7♠ 2♠";
            const hand = parseHand(tableCards + " " + poket);
            expect(hand.Status).toBe(HandParseResultStatus.Ok);
            const cardRank = getCardRank(hand.Hand);
            expect(handTypeNames[cardRank.HandType]).toBe("Flush");
            expect(cardRank.WinnerCardsSet).toEqual([ 0, 1, 2, 3, 4 ]);
        });

        it("1 Pair", () => {
            const poket = "A♣ 3♣";
            const tableCards = "A♠ 10♣ 8♠ 7♠ 2♠";
            const hand = parseHand(tableCards + " " + poket);
            expect(hand.Status).toBe(HandParseResultStatus.Ok);
            const cardRank = getCardRank(hand.Hand);
            expect(handTypeNames[cardRank.HandType]).toBe("1 Pair");
            expect(cardRank.WinnerCardsSet).toEqual([ 0, 1, 2, 3, 5 ]);
        });

        it("3 of a kind", () => {
            const poket = "A♣ A♦";
            const tableCards = "A♠ 10♣ 8♠ 7♠ 2♠";
            const hand = parseHand(tableCards + " " + poket);
            expect(hand.Status).toBe(HandParseResultStatus.Ok);
            const cardRank = getCardRank(hand.Hand);
            expect(handTypeNames[cardRank.HandType]).toBe("3 of a Kind");
            expect(cardRank.WinnerCardsSet).toEqual([ 0, 1, 2, 5, 6 ]);
        });

        it("2 Pair", () => {
            const poket = "10♣ 3♣";
            const tableCards = "A♠ A♣ 3♠ 7♠ 2♠";
            const hand = parseHand(tableCards + " " + poket);
            expect(hand.Status).toBe(HandParseResultStatus.Ok);
            const cardRank = getCardRank(hand.Hand);
            expect(handTypeNames[cardRank.HandType]).toBe("2 Pair");
            expect(cardRank.WinnerCardsSet).toEqual([ 0, 1, 2, 5, 6 ]);
        });

        it("4 of a Kind", () => {
            const poket = "A♥ A♦";
            const tableCards = "A♠ A♣ 3♠ 7♠ 2♠";
            const hand = parseHand(tableCards + " " + poket);
            expect(hand.Status).toBe(HandParseResultStatus.Ok);
            const cardRank = getCardRank(hand.Hand);
            expect(handTypeNames[cardRank.HandType]).toBe("4 of a Kind");
            expect(cardRank.WinnerCardsSet).toEqual([ 0, 1, 3, 5, 6 ]);
        });

        it("High cards", () => {
            const poket = "4♥ 6♦";
            const tableCards = "K♠ A♣ 3♠ 7♠ 2♠";
            const hand = parseHand(tableCards + " " + poket);
            expect(hand.Status).toBe(HandParseResultStatus.Ok);
            const cardRank = getCardRank(hand.Hand);
            expect(handTypeNames[cardRank.HandType]).toBe("High Card");
            expect(cardRank.WinnerCardsSet).toEqual([ 0, 1, 3, 5, 6 ]);
        });
    });

    describe("Omaha", () => {
        it("Flush", () => {
            const poket = "A♣ 10♠ 3♣ 4♣";
            const tableCards = "A♠ 10♣ 8♠ 7♠ 2♠";
            const hand = parseHand(tableCards + " " + poket);
            expect(hand.Status).toBe(HandParseResultStatus.Ok);
            const cardRank = getCardRank(hand.Hand);
            expect(handTypeNames[cardRank.HandType]).toBe("Flush");
            expect(cardRank.WinnerCardsSet).toEqual([ 0, 2, 3, 4, 6 ]);
        });
    });
});

describe("Card value", () => {
    it("Ace code", () => {
        expect(cardValue(14)).toBe("A");
    });
    it("King code", () => {
        expect(cardValue(13)).toBe("K");
    });
    it("Queen code", () => {
        expect(cardValue(12)).toBe("Q");
    });
    it("Jaket code", () => {
        expect(cardValue(11)).toBe("J");
    });
    it("10 code", () => {
        expect(cardValue(10)).toBe("10");
    });
});

describe("Get extended card information", () => {
    it("2 Pair", () => {
        const poket = "A♣ 10♠";
        const tableCards = "A♠ 10♣ 8♠ 7♠ 2♠";
        const hand = parseHand(tableCards + " " + poket);
        expect(hand.Status).toBe(HandParseResultStatus.Ok);
        const cardRank = getHandTypeEx(hand.Hand);
        expect(handTypeNames[cardRank.Type]).toBe("2 Pair");
        expect(cardRank.Cards).toEqual([ 14, 10, 8 ]);
    });
    it("2 Pair - variant 2", () => {
        const poket = "A♣ 8♣";
        const tableCards = "A♠ 10♣ 8♠ 7♠ 2♠";
        const hand = parseHand(tableCards + " " + poket);
        expect(hand.Status).toBe(HandParseResultStatus.Ok);
        const cardRank = getHandTypeEx(hand.Hand);
        expect(handTypeNames[cardRank.Type]).toBe("2 Pair");
        expect(cardRank.Cards).toEqual([ 14, 8, 10 ]);
    });
    it("2 Pair - variant 3", () => {
        const poket = "10♠ 8♣";
        const tableCards = "A♠ 10♣ 8♠ 7♠ 2♠";
        const hand = parseHand(tableCards + " " + poket);
        expect(hand.Status).toBe(HandParseResultStatus.Ok);
        const cardRank = getHandTypeEx(hand.Hand);
        expect(handTypeNames[cardRank.Type]).toBe("2 Pair");
        expect(cardRank.Cards).toEqual([ 10, 8, 14 ]);
    });
    it("1 Pair", () => {
        const poket = "A♣ 5♠";
        const tableCards = "A♠ 10♣ 8♠ 7♠ 2♠";
        const hand = parseHand(tableCards + " " + poket);
        expect(hand.Status).toBe(HandParseResultStatus.Ok);
        const cardRank = getHandTypeEx(hand.Hand);
        expect(handTypeNames[cardRank.Type]).toBe("1 Pair");
        expect(cardRank.Cards).toEqual([ 14, 10, 8, 7 ]);
    });
    it("1 Pair - variant 2", () => {
        const poket = "5♠ 10♠";
        const tableCards = "A♠ 10♣ 8♣ 7♠ 2♠";
        const hand = parseHand(tableCards + " " + poket);
        expect(hand.Status).toBe(HandParseResultStatus.Ok);
        const cardRank = getHandTypeEx(hand.Hand);
        expect(handTypeNames[cardRank.Type]).toBe("1 Pair");
        expect(cardRank.Cards).toEqual([ 10, 14, 8, 7 ]);
    });
    it("1 Pair - variant 3", () => {
        const poket = "5♠ 7♣";
        const tableCards = "A♠ 10♣ 8♣ 7♠ 2♠";
        const hand = parseHand(tableCards + " " + poket);
        expect(hand.Status).toBe(HandParseResultStatus.Ok);
        const cardRank = getHandTypeEx(hand.Hand);
        expect(handTypeNames[cardRank.Type]).toBe("1 Pair");
        expect(cardRank.Cards).toEqual([ 7, 14, 10, 8 ]);
    });
    it("1 Pair - variant 4", () => {
        const poket = "8♠ 4♣";
        const tableCards = "A♠ 10♣ 8♣ 7♠ 2♠";
        const hand = parseHand(tableCards + " " + poket);
        expect(hand.Status).toBe(HandParseResultStatus.Ok);
        const cardRank = getHandTypeEx(hand.Hand);
        expect(handTypeNames[cardRank.Type]).toBe("1 Pair");
        expect(cardRank.Cards).toEqual([ 8, 14, 10, 7 ]);
    });
    it("High Card", () => {
        const poket = "K♣ 5♠";
        const tableCards = "A♠ 10♣ 8♠ 7♠ 2♠";
        const hand = parseHand(tableCards + " " + poket);
        expect(hand.Status).toBe(HandParseResultStatus.Ok);
        const cardRank = getHandTypeEx(hand.Hand);
        expect(handTypeNames[cardRank.Type]).toBe("High Card");
        expect(cardRank.Cards).toEqual([ 14, 13, 10, 8, 7, 5, 2 ]);
    });
    it("Triple", () => {
        const poket = "A♣ A♥";
        const tableCards = "A♠ 10♣ 8♠ 7♠ 2♠";
        const hand = parseHand(tableCards + " " + poket);
        expect(hand.Status).toBe(HandParseResultStatus.Ok);
        const cardRank = getHandTypeEx(hand.Hand);
        expect(handTypeNames[cardRank.Type]).toBe("3 of a Kind");
        expect(cardRank.Cards).toEqual([ 14, 10, 8 ]);
    });
    it("Triple - variant 2", () => {
        const poket = "A♣ 10♥";
        const tableCards = "10♠ 10♣ 8♠ 7♠ 2♠";
        const hand = parseHand(tableCards + " " + poket);
        expect(hand.Status).toBe(HandParseResultStatus.Ok);
        const cardRank = getHandTypeEx(hand.Hand);
        expect(handTypeNames[cardRank.Type]).toBe("3 of a Kind");
        expect(cardRank.Cards).toEqual([ 10, 14, 8 ]);
    });
});
