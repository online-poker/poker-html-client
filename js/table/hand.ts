// Poker Hand Evaluator by Andrey Kurdyumov ©2013
// v1.0.0
/* tslint:disable:no-bitwise */

module HoldemHand {
    export interface HandRepresentation {
        Cards: number[];
        Suits: number[];
    }

    export enum HandParseResultStatus {
        Ok,
        InvalidHand,
        CardsMissing,
        SuitsMissing,
        AllCardsShouldHaveOneSuit,
        InsufficientCardsAndDuplicates,
        InsufficientCards,
        DuplicatesDetected,
    }

    export interface HandParseResult {
        Status: HandParseResultStatus;
        Hand?: HandRepresentation;
    }

    export interface CardRank {
        HandType: number;   // Hand type. First part of universal card strength.
        Score: number;      // Score of the hand within same hand type. Second part of universal card strength.
        WinnerCardsSet: number[];   // Indexes of the cards within original hand which form the best card combination.
    }

    /// <summary>Human readable names of the hand types.</summary>
    export var handTypeNames = ["4 of a Kind", "Straight Flush", "Straight", "Flush", "High Card",
        "1 Pair", "2 Pair", "Royal Flush", "3 of a Kind", "Full House", "-Invalid-"];

    /// <summary>Strength of each hand type.</summary>
    /// <remarks>
    /// Due to nature of the algorithm, the hand types not 
    /// have order corresponding to the strength or cards combinations.
    /// </remarks>
    export var handTypeRanks = [8, 9, 5, 6, 1, 2, 3, 10, 4, 7, 0];

    export function getHandType(hand: HandRepresentation) {
        /// <summary>Gets type of hand for given hand representation.</summary>
        /// <param name="hand" type="HandRepresentation">5 cards hand for which current combination should be calculated.</param>
        /// <returns>Hand type.</returns>
        /// <remarks>To obtain real strength of hand type, use hand 
        /// type returned from this function as index to the 
        /// handTypeRanks array.
        /// < / remarks>

        var rankCountBitMask = 0,  // index of the card.
            o = 0,
            rankBitMask;
        for (var i = -1; i < 5; i++, o = Math.pow(2, hand.Cards[i] * 4)) {
            rankCountBitMask += o * ((rankCountBitMask / o & 15) + 1);
        }

        if ((rankCountBitMask %= 15) !== 5) {
            return rankCountBitMask - 1;
        }

        rankBitMask = 1 << hand.Cards[0]
            | 1 << hand.Cards[1]
            | 1 << hand.Cards[2]
            | 1 << hand.Cards[3]
            | 1 << hand.Cards[4];
        rankCountBitMask -= ((rankBitMask / (rankBitMask & -rankBitMask) === 31) || (rankBitMask === 0x403c) ? 3 : 1);
        var temp = <any>(hand.Suits[0] === (hand.Suits[0] | hand.Suits[1] | hand.Suits[2] | hand.Suits[3] | hand.Suits[4]));
        return rankCountBitMask - temp * ((rankBitMask === 0x7c00) ? -5 : 1);
    }

    export function cardValue(v: number) {
        if (v === 14) {
            return "A";
        }

        if (v === 13) {
            return "K";
        }

        if (v === 12) {
            return "Q";
        }

        if (v === 11) {
            return "J";
        }

        return v.toString();
    }

    export function getHandTypeEx(hand: HandRepresentation) {
        var isSameSuit = hand.Suits[0] === (hand.Suits[0] | hand.Suits[1] | hand.Suits[2] | hand.Suits[3] | hand.Suits[4]);
        var sortedCards = hand.Cards.slice(0);
        sortedCards = sortedCards.sort(function (left, right) {
            if (left < right) {
                return 1;
            }

            if (left > right) {
                return -1;
            }

            return 0;
        });
        var isStraight = sortedCards[0] === sortedCards[1] + 1
            && sortedCards[1] === sortedCards[2] + 1
            && sortedCards[2] === sortedCards[3] + 1
            && sortedCards[3] === sortedCards[4] + 1;
        if (!isStraight) {
            isStraight = sortedCards[3] === sortedCards[4] + 1
            && sortedCards[1] === sortedCards[2] + 1
            && sortedCards[2] === sortedCards[3] + 1
            && sortedCards[4] === 2
            && sortedCards[0] === 14;
        }

        if (isSameSuit && isStraight) {
            return {
                Type: 1,
                Cards: [sortedCards[0]]
            };
        }

        var isCare = (sortedCards[0] === sortedCards[1]
            && sortedCards[1] === sortedCards[2]
            && sortedCards[2] === sortedCards[3])
            || (sortedCards[1] === sortedCards[2]
            && sortedCards[2] === sortedCards[3]
            && sortedCards[3] === sortedCards[4]);
        if (isCare) {
            if (sortedCards[0] === sortedCards[1]) {
                return {
                    Type: 0,
                    Cards: [sortedCards[0], sortedCards[4]]
                };
            }

            return {
                Type: 0,
                Cards: [sortedCards[1], sortedCards[0]]
            };
        }

        var isFullHouse = (sortedCards[0] === sortedCards[1]
            && sortedCards[1] === sortedCards[2]
            && sortedCards[3] === sortedCards[4])
            || (sortedCards[0] === sortedCards[1]
            && sortedCards[2] === sortedCards[3]
            && sortedCards[3] === sortedCards[4]);

        if (isFullHouse) {
            return {
                Type: 9,
                Cards: [sortedCards[1], sortedCards[3]]
            };
        }

        if (isSameSuit) {
            return {
                Type: 3,
                Cards: sortedCards
            };
        }

        if (isStraight) {
            return {
                Type: 2,
                Cards: [Math.max(sortedCards[0], sortedCards[4])]
            };
        }

        // is triple
        if (sortedCards[0] === sortedCards[1]
            && sortedCards[1] === sortedCards[2]) {
            return {
                Type: 8,
                Cards: [sortedCards[0], sortedCards[3], sortedCards[4]]
            };
        }
        if (sortedCards[1] === sortedCards[2]
            && sortedCards[2] === sortedCards[3]) {
            return {
                Type: 8,
                Cards: [sortedCards[1], sortedCards[0], sortedCards[4]]
            };
        }
        if (sortedCards[2] === sortedCards[3]
            && sortedCards[3] === sortedCards[4]) {
            return {
                Type: 8,
                Cards: [sortedCards[2], sortedCards[0], sortedCards[1]]
            };
        }
        // is 2 pair
        if (sortedCards[0] === sortedCards[1]
            && sortedCards[2] === sortedCards[3]) {
            return {
                Type: 6,
                Cards: [sortedCards[0], sortedCards[2], sortedCards[4]]
            };
        }
        if (sortedCards[0] === sortedCards[1]
            && sortedCards[3] === sortedCards[4]) {
            return {
                Type: 6,
                Cards: [sortedCards[0], sortedCards[3], sortedCards[2]]
            };
        }
        if (sortedCards[1] === sortedCards[2]
            && sortedCards[3] === sortedCards[4]) {
            return {
                Type: 6,
                Cards: [sortedCards[1], sortedCards[3], sortedCards[0]]
            };
        }
        // is pair
        if (sortedCards[0] === sortedCards[1]) {
            return {
                Type: 5,
                Cards: [sortedCards[0], sortedCards[2], sortedCards[3], sortedCards[4]]
            };
        }
        if (sortedCards[1] === sortedCards[2]) {
            return {
                Type: 5,
                Cards: [sortedCards[1], sortedCards[0], sortedCards[3], sortedCards[4]]
            };
        }
        if (sortedCards[2] === sortedCards[3]) {
            return {
                Type: 5,
                Cards: [sortedCards[2], sortedCards[0], sortedCards[1], sortedCards[4]]
            };
        }
        if (sortedCards[3] === sortedCards[4]) {
            return {
                Type: 5,
                Cards: [sortedCards[3], sortedCards[0], sortedCards[1], sortedCards[2]]
            };
        }

        return {
            Type: 4,
            Cards: sortedCards
        };
    }

    export function getCombinations(k: number, n: number) {
        /// <signature>
        ///    <summary>
        ///    Generates all possible unordered permutations 
        ///    of k element in the set with n elements.
        ///    </summary>
        /// </signature>
        var result: number[][] = [],
            comb: number[] = [];

        function next_comb(comb: number[], k: number, n: number) {
            var i: number;
            if (comb.length === 0) {
                for (i = 0; i < k; ++i) {
                    comb[i] = i;
                }

                return true;
            }

            i = k - 1; ++comb[i];
            while ((i > 0) && (comb[i] >= n - k + 1 + i)) {
                --i; ++comb[i];
            }

            // No more combinations can be generated
            if (comb[0] > n - k) {
                return false;
            }

            for (i = i + 1; i < k; ++i) {
                comb[i] = comb[i - 1] + 1;
            }

            return true;
        }

        while (next_comb(comb, k, n)) {
            var nextPermutation = comb.slice(null);
            result.push(nextPermutation);
        }

        return result;
    }

    export function decodeScore(score: number) {
        var result = [];
        result.push((score & 15));
        score = score >> 4;
        result.push((score & 15));
        score = score >> 4;
        result.push((score & 15));
        score = score >> 4;
        result.push((score & 15));
        return result;
    }

    export function getPokerScore(cards: number[]) {
        var tempCards = cards.slice(0),
            cardsCount = {};
        for (var i = 0; i < 5; i++) {
            var cardValue = tempCards[i];
            cardsCount[cardValue] = (cardsCount[cardValue] >= 1) ? cardsCount[cardValue] + 1 : 1;
        }

        tempCards.sort(function (left, right) {
            if (cardsCount[left] < cardsCount[right]) {
                return 1;
            }

            if (cardsCount[left] > cardsCount[right]) {
                return -1;
            }

            return right - left;
        });

        return tempCards[0] << 16
            | tempCards[1] << 12
            | tempCards[2] << 8
            | tempCards[3] << 4
            | tempCards[4];
    }

    export function parseHand(str: string): HandParseResult {
        /// <summary>Convert string to internal representation.</summary>
        /// <param name="str" type="String">String representation of the hand which should be converted.</param>
        /// <returns>Parsing result of internal conversion.</returns>

        if (str.match(/((?:\s*)(10|[2-9]|[J|Q|K|A])[♠|♣|♥|♦](?:\s*)){1,7}/g) === null) {
            return { Status: HandParseResultStatus.InvalidHand };
        }

        var cardStr = str.replace(/A/g, "14").replace(/K/g, "13").replace(/Q/g, "12")
            .replace(/J/g, "11").replace(/♠|♣|♥|♦/g, ",");
        var cards = <any[]>cardStr.replace(/\s/g, "").slice(0, -1).split(",");
        var suits = <any[]>str.match(/♠|♣|♥|♦/g);
        if (cards === null) {
            return { Status: HandParseResultStatus.CardsMissing };
        }

        if (suits === null) {
            return { Status: HandParseResultStatus.SuitsMissing };
        }

        if (cards.length !== suits.length) {
            return { Status: HandParseResultStatus.AllCardsShouldHaveOneSuit };
        }

        var o = {}, keyCount = 0, j, i;
        for (i = 0; i < cards.length; i++) {
            var e = cards[i] + suits[i];
            o[e] = 1;
        }
        for (j in o) {
            if (o.hasOwnProperty(j)) {
                keyCount++;
            }
        }

        var insufficientCards = cards.length < 5;
        var duplicateCards = cards.length !== keyCount;
        var status: HandParseResultStatus;
        if (insufficientCards && duplicateCards) {
            status = HandParseResultStatus.InsufficientCardsAndDuplicates;
        } else if (insufficientCards) {
            status = HandParseResultStatus.InsufficientCards;
        } else if (duplicateCards) {
            status = HandParseResultStatus.DuplicatesDetected;
        } else {
            status = HandParseResultStatus.Ok;
        }

		for (i = 0; i < cards.length; i++) {
            cards[i] -= 0; // Conversion to the numbers.
        }

        for (i = 0; i < suits.length; i++) {
            // Convert the suit characters to the numbers.
            // Since unicode symbols starts with 0x2660 (9824) Unicode symbols 
            suits[i] = Math.pow(2, (suits[i].charCodeAt(0) - 9824));
        }

        return {
            Status: status, Hand: { Cards: cards, Suits: suits }
        };
    }

    export function getCardRank(hand: HandRepresentation): CardRank {
        /// <summary>Get universal hand strength.</summary>
        /// <param name="hand" type="HandRepresentation">Hand representation for which strength should be converted.</param>
        /// <returns>Rank of the card across all possible hands.</returns>
        /// <remarks>This function could accept hands from 5 to 7 cards.</remarks>

        var totalCardsCount = hand.Cards.length;
        var permutations = getCombinations(5, totalCardsCount);
        var maxRank = 0,
            winIndex = 10,
            winningScore = -1,
            wci: number[];

        // Generate permuted version of the original array.
        var applyPermutation5 = function (source: number[], permutation: number[]) {
            return [
                source[permutation[0]],
                source[permutation[1]],
                source[permutation[2]],
                source[permutation[3]],
                source[permutation[4]]
            ];
        };

        for (var i = 0; i < permutations.length; i++) {
            var currentPermutation = permutations[i];
            var cs = applyPermutation5(hand.Cards, currentPermutation);
            var ss = applyPermutation5(hand.Suits, currentPermutation);

            var index = getHandType({ Cards: cs, Suits: ss });

            if (handTypeRanks[index] > maxRank) {
                maxRank = handTypeRanks[index];
                winIndex = index;
                wci = currentPermutation.slice(0);
                winningScore = getPokerScore(cs);
            } else if (handTypeRanks[index] === maxRank) {
                // If by chance we have a tie, find the best one
                var score1 = getPokerScore(cs);
                if (score1 > winningScore) {
                    wci = currentPermutation.slice(0);
                }
            }
        }

        return {
            HandType: winIndex,
            Score: winningScore,
            WinnerCardsSet: wci
        };
    }
}
