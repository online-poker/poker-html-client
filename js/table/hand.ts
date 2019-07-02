﻿// Poker Hand Evaluator by Andrey Kurdyumov ©2013
// v1.0.0
/* tslint:disable:no-bitwise */

// tslint:disable-next-line:no-namespace
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
    export let handTypeNames = ["4 of a Kind", "Straight Flush", "Straight", "Flush", "High Card",
        "1 Pair", "2 Pair", "Royal Flush", "3 of a Kind", "Full House", "-Invalid-"];

    /// <summary>Strength of each hand type.</summary>
    /// <remarks>
    /// Due to nature of the algorithm, the hand types not
    /// have order corresponding to the strength or cards combinations.
    /// </remarks>
    export let handTypeRanks = [8, 9, 5, 6, 1, 2, 3, 10, 4, 7, 0];

    /**
     * Gets type of hand for given hand representation.
     * @param hand 5 cards hand for which current combination should be calculated.
     * @return Hand type.
     * @description To obtain real strength of hand type, use hand
     * type returned from this function as index to the handTypeRanks array.
     */
    export function getHandType(hand: HandRepresentation) {
        let rankCountBitMask = 0;  // index of the card.
        let o = 0;
        let rankBitMask;
        for (let i = -1; i < 5; i++, o = Math.pow(2, hand.Cards[i] * 4)) {
            rankCountBitMask += o * ((rankCountBitMask / o & 15) + 1);
        }

        // tslint:disable-next-line:no-conditional-assignment
        if ((rankCountBitMask %= 15) !== 5) {
            return rankCountBitMask - 1;
        }

        rankBitMask = 1 << hand.Cards[0]
            | 1 << hand.Cards[1]
            | 1 << hand.Cards[2]
            | 1 << hand.Cards[3]
            | 1 << hand.Cards[4];
        rankCountBitMask -= ((rankBitMask / (rankBitMask & -rankBitMask) === 31) || (rankBitMask === 0x403c) ? 3 : 1);
        // tslint:disable-next-line:max-line-length
        const isSameSuit = (hand.Suits[0] === (hand.Suits[0] | hand.Suits[1] | hand.Suits[2] | hand.Suits[3] | hand.Suits[4])) as any;
        return rankCountBitMask - isSameSuit * ((rankBitMask === 0x7c00) ? -5 : 1);
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
        if (hand.Suits.length !== 5 || hand.Cards.length !== 5) {
            throw new Error("Should be passed 5 cards for extended interpretation.");
        }

        // tslint:disable-next-line:max-line-length
        const isSameSuit = hand.Suits[0] === (hand.Suits[0] | hand.Suits[1] | hand.Suits[2] | hand.Suits[3] | hand.Suits[4]);
        let sortedCards = hand.Cards.slice(0);
        sortedCards = sortedCards.sort(function (left, right) {
            if (left < right) {
                return 1;
            }

            if (left > right) {
                return -1;
            }

            return 0;
        });
        let isStraight = sortedCards[0] === sortedCards[1] + 1
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
                Cards: [sortedCards[0]],
            };
        }

        const isCare = (sortedCards[0] === sortedCards[1]
            && sortedCards[1] === sortedCards[2]
            && sortedCards[2] === sortedCards[3])
            || (sortedCards[1] === sortedCards[2]
            && sortedCards[2] === sortedCards[3]
            && sortedCards[3] === sortedCards[4]);
        if (isCare) {
            if (sortedCards[0] === sortedCards[1]) {
                return {
                    Type: 0,
                    Cards: [sortedCards[0], sortedCards[4]],
                };
            }

            return {
                Type: 0,
                Cards: [sortedCards[1], sortedCards[0]],
            };
        }

        const isFullHouse = (sortedCards[0] === sortedCards[1]
            && sortedCards[1] === sortedCards[2]
            && sortedCards[3] === sortedCards[4])
            || (sortedCards[0] === sortedCards[1]
            && sortedCards[2] === sortedCards[3]
            && sortedCards[3] === sortedCards[4]);

        if (isFullHouse) {
            return {
                Type: 9,
                Cards: [sortedCards[1], sortedCards[3]],
            };
        }

        if (isSameSuit) {
            return {
                Type: 3,
                Cards: sortedCards,
            };
        }

        if (isStraight) {
            return {
                Type: 2,
                Cards: [Math.max(sortedCards[0], sortedCards[4])],
            };
        }

        // is triple
        if (sortedCards[0] === sortedCards[1]
            && sortedCards[1] === sortedCards[2]) {
            return {
                Type: 8,
                Cards: [sortedCards[0], sortedCards[3], sortedCards[4]],
            };
        }
        if (sortedCards[1] === sortedCards[2]
            && sortedCards[2] === sortedCards[3]) {
            return {
                Type: 8,
                Cards: [sortedCards[1], sortedCards[0], sortedCards[4]],
            };
        }
        if (sortedCards[2] === sortedCards[3]
            && sortedCards[3] === sortedCards[4]) {
            return {
                Type: 8,
                Cards: [sortedCards[2], sortedCards[0], sortedCards[1]],
            };
        }
        // is 2 pair
        if (sortedCards[0] === sortedCards[1]
            && sortedCards[2] === sortedCards[3]) {
            return {
                Type: 6,
                Cards: [sortedCards[0], sortedCards[2], sortedCards[4]],
            };
        }
        if (sortedCards[0] === sortedCards[1]
            && sortedCards[3] === sortedCards[4]) {
            return {
                Type: 6,
                Cards: [sortedCards[0], sortedCards[3], sortedCards[2]],
            };
        }
        if (sortedCards[1] === sortedCards[2]
            && sortedCards[3] === sortedCards[4]) {
            return {
                Type: 6,
                Cards: [sortedCards[1], sortedCards[3], sortedCards[0]],
            };
        }
        // is pair
        if (sortedCards[0] === sortedCards[1]) {
            return {
                Type: 5,
                Cards: [sortedCards[0], sortedCards[2], sortedCards[3], sortedCards[4]],
            };
        }
        if (sortedCards[1] === sortedCards[2]) {
            return {
                Type: 5,
                Cards: [sortedCards[1], sortedCards[0], sortedCards[3], sortedCards[4]],
            };
        }
        if (sortedCards[2] === sortedCards[3]) {
            return {
                Type: 5,
                Cards: [sortedCards[2], sortedCards[0], sortedCards[1], sortedCards[4]],
            };
        }
        if (sortedCards[3] === sortedCards[4]) {
            return {
                Type: 5,
                Cards: [sortedCards[3], sortedCards[0], sortedCards[1], sortedCards[2]],
            };
        }

        return {
            Type: 4,
            Cards: sortedCards,
        };
    }

    function getCombinations(k: number, n: number) {
        /// <signature>
        ///    <summary>
        ///    Generates all possible unordered permutations
        ///    of k element in the set with n elements.
        ///    </summary>
        /// </signature>
        const result: number[][] = [];
        const combination: number[] = [];

        function nextCombination(comb: number[], k1: number, n1: number) {
            let i: number;
            if (comb.length === 0) {
                for (i = 0; i < k1; ++i) {
                    comb[i] = i;
                }

                return true;
            }

            i = k1 - 1; ++comb[i];
            while ((i > 0) && (comb[i] >= n1 - k1 + 1 + i)) {
                --i; ++comb[i];
            }

            // No more combinations can be generated
            if (comb[0] > n1 - k1) {
                return false;
            }

            for (i = i + 1; i < k1; ++i) {
                comb[i] = comb[i - 1] + 1;
            }

            return true;
        }

        while (nextCombination(combination, k, n)) {
            const nextPermutation = combination.slice(null);
            result.push(nextPermutation);
        }

        return result;
    }

    function getPokerScore(cards: number[], isStraight: boolean) {
        const tempCards = cards.slice(0);
        const cardsCount = {};
        for (let i = 0; i < 5; i++) {
            const tempCardValue = tempCards[i];
            cardsCount[tempCardValue] = (cardsCount[tempCardValue] >= 1) ? cardsCount[tempCardValue] + 1 : 1;
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

        // If this is lower straight with aces.
        if (isStraight && tempCards[0] === 14 && tempCards[1] !== 13) {
            return tempCards [1] << 16
                | tempCards[2] << 12
                | tempCards[3] << 8
                | tempCards[4] << 4
                | tempCards[0];
        }

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

        if (str === null || str === undefined || str.trim() === "") {
            return { Status: HandParseResultStatus.InvalidHand };
        }

        if (str.match(/^((?:\s*)(10|[2-9]|[J|Q|K|A])?[♠|♣|♥|♦]?(?:\s*)){1,9}$/g) === null) {
            return { Status: HandParseResultStatus.InvalidHand };
        }

        const cardStr = str.replace(/A/g, "14").replace(/K/g, "13").replace(/Q/g, "12")
            .replace(/J/g, "11").replace(/♠|♣|♥|♦/g, ",");
        const cards = cardStr.replace(/\s/g, "").slice(0, -1).split(",") as any[];
        const suits = str.match(/♠|♣|♥|♦/g) as any[];
        if (cards === null || cards.filter((_) => _).length === 0) {
            return { Status: HandParseResultStatus.CardsMissing };
        }

        if (suits === null || suits.length === 0) {
            return { Status: HandParseResultStatus.SuitsMissing };
        }

        if (cards.filter((_) => _).length !== suits.filter((_) => _).length) {
            return { Status: HandParseResultStatus.AllCardsShouldHaveOneSuit };
        }

        const o = {};
        let keyCount = 0;
        for (let i = 0; i < cards.length; i++) {
            const e = cards[i] + suits[i];
            o[e] = 1;
        }
        for (const j in o) {
            if (o.hasOwnProperty(j)) {
                keyCount++;
            }
        }

        const insufficientCards = cards.length < 5;
        const duplicateCards = cards.length !== keyCount;
        let status: HandParseResultStatus;
        if (insufficientCards && duplicateCards) {
            status = HandParseResultStatus.InsufficientCardsAndDuplicates;
        } else if (insufficientCards) {
            status = HandParseResultStatus.InsufficientCards;
        } else if (duplicateCards) {
            status = HandParseResultStatus.DuplicatesDetected;
        } else {
            status = HandParseResultStatus.Ok;
        }

        for (let i = 0; i < cards.length; i++) {
            cards[i] -= 0; // Conversion to the numbers.
        }

        for (let i = 0; i < suits.length; i++) {
            // Convert the suit characters to the numbers.
            // Since unicode symbols starts with 0x2660 (9824) Unicode symbols
            suits[i] = Math.pow(2, (suits[i].charCodeAt(0) - 9824));
        }

        return {
            Status: status,
            Hand: { Cards: cards, Suits: suits },
        };
    }

    /**
     * Get hand strength for poker games
     * @param cardsFromTable Cards take from table into combination
     * @param hand Hand representation for which strength should be converted.
     * @return Rank of the card across all possible hands.
     * @description This function could accept hands from 5 to 7 cards.
     */
    function getPokerCardRank(cardsFromTable: number, hand: HandRepresentation): CardRank {
        const totalCardsCount = hand.Cards.length;
        const permutations = cardsFromTable === 5
            ? getCombinations(5, Math.min(7, totalCardsCount))
            : getCombinations(3, 5);
        let maxRank = 0;
        let winIndex = 10;
        let winningScore = -1;
        let wci: number[] = [];

        // Generate permutations for each combination of two hands in the hole.
        const holeCardPermutations = getCombinations(2, Math.max(2, totalCardsCount - 5));
        for (const holeCardPermutationSet of holeCardPermutations) {
            const applyHoleCardPermutations = (value: number) => {
                // Leave table cards unchanged.
                if (value < 5) {
                    return value;
                }

                const holeCardIndex = value - 5;
                return holeCardPermutationSet[holeCardIndex] + 5;
            };

            // Generate permuted version of the original array.
            const applyPermutation5 = function (source: number[], permutation: number[]) {
                return [
                    source[permutation[0]],
                    source[permutation[1]],
                    source[permutation[2]],
                    source[permutation[3]],
                    source[permutation[4]],
                ];
            };

            for (let i = 0; i < permutations.length; i++) {
                let currentPermutation = permutations[i].map(applyHoleCardPermutations);
                if (cardsFromTable !== 5) {
                    currentPermutation = currentPermutation.concat([
                        holeCardPermutationSet[0] + 5,
                        holeCardPermutationSet[1] + 5,
                    ]);
                }

                const cs = applyPermutation5(hand.Cards, currentPermutation);
                const ss = applyPermutation5(hand.Suits, currentPermutation);

                const index = getHandType({ Cards: cs, Suits: ss });
                const isStraight = index === 1 || index === 2;
                if (handTypeRanks[index] > maxRank) {
                    maxRank = handTypeRanks[index];
                    winIndex = index;
                    wci = currentPermutation.slice(0);
                    winningScore = getPokerScore(cs, isStraight);
                } else if (handTypeRanks[index] === maxRank) {
                    // If by chance we have a tie, find the best one
                    const score1 = getPokerScore(cs, isStraight);
                    if (score1 > winningScore) {
                        wci = currentPermutation.slice(0);
                        winningScore = score1;
                    }
                }
            }
        }

        return {
            HandType: winIndex,
            Score: winningScore,
            WinnerCardsSet: wci,
        };
    }

    /**
     * Get hand strength for Texas Holdem
     * @param hand Hand representation for which strength should be converted.
     * @return Rank of the card across all possible hands.
     * @description This function could accept hands from 5 to 7 cards.
     */
    export function getHoldemCardRank(hand: HandRepresentation): CardRank {
        return getPokerCardRank(5, hand);
    }

    /**
     * Get hand strength for Omaha
     * @param hand Hand representation for which strength should be converted.
     * @return Rank of the card across all possible hands.
     * @description This function could accept hands from 5 to 7 cards.
     */
    export function getOmahaCardRank(hand: HandRepresentation): CardRank {
        return getPokerCardRank(3, hand);
    }

    /**
     * Get universal hand strength
     * @param hand Hand representation for which strength should be converted.
     * @return Rank of the card across all possible hands.
     * @description This function could accept hands from 5 to 7 cards.
     */
    export function getCardRank(hand: HandRepresentation): CardRank {
        if (hand.Cards.length <= 7) {
            return getHoldemCardRank(hand);
        }

        return getOmahaCardRank(hand);
    }
