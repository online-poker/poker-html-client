﻿var allBacks = "/v4=";
var allNone = "//8=";
function cardValue(card: number) {
    /// <signature>
    ///   <summary>Get card string</summary>
    ///   <param name="card" type="Number">A byte value of the card.</param>
    /// </signature>
    if (card === 254) {
        return "cards back";
        // return "<span class="cards back"></span>";
    }

    if (card === 255) {
        return "cards none";
    }

    const suitId = Math.floor(card / 13);
    const valueId = card % 13;
    let value: string;

    switch (valueId) {
        case 0:
            value = "2";
            break;
        case 1:
            value = "3";
            break;
        case 2:
            value = "4";
            break;
        case 3:
            value = "5";
            break;
        case 4:
            value = "6";
            break;
        case 5:
            value = "7";
            break;
        case 6:
            value = "8";
            break;
        case 7:
            value = "9";
            break;
        case 8:
            value = "10";
            break;
        case 9:
            value = "J";
            break;
        case 10:
            value = "Q";
            break;
        case 11:
            value = "K";
            break;
        case 12:
            value = "A";
            break;
        default:
            break;
    }

    let suit: string;
    let color: string;
    switch (suitId) {
        case 0:
            color = "blue";
            suit = "\u2663";
            suit = "clubs";
            break;
        case 1:
            color = "green";
            suit = "\u2666";
            suit = "diamonds";
            break;
        case 2:
            color = "red";
            suit = "\u2665";
            suit = "hearts";
            break;
        case 3:
            color = "black";
            suit = "\u2660";
            suit = "spades";
            break;
        default:
            color = "grey";
            suit = "unk suit";
            break;
    }

    return "cards " + suit + " c" + value;
    // return "<span class="cards " + value + suit + ""></span>";
}

/**
* Decode cards array from the base64 representation.
*/
function decodeCardsArray(cardsData: string): number[] {
    /// <signature>
    ///   <summary>Get card string</summary>
    ///   <param name="cards" type="Array">Array of the cards.</param>
    /// </signature>
    if (cardsData === null || cardsData === null) {
        return null;
    }

    if (typeof cardsData === "object") {
        console.log(cardsData[0]);
        console.log(cardsData[1]);
        cardsData = "//8=";
    }

    if (cardsData === allBacks) {
        return [254, 254];
    }

    if (cardsData === "//8=") {
        return [255, 255];
    }

    const cardsString = window.atob(cardsData);
    const cards: number[] = [];
    for (let i = 0; i < cardsString.length; i++) {
        cards.push(cardsString.charCodeAt(i));
    }

    return cards;
}
function convertToCards(data: number[]): string[] {
    if (data == null) {
        return null;
    }

    return data.map(function (n) {
        return cardValue(n);
    });
}
function cardsArray(cardsData: string): string[] {
    /// <signature>
    ///   <summary>Get card string</summary>
    ///   <param name="cards" type="Array">Array of the cards.</param>
    /// </signature>
    if (cardsData === null) {
        return ["cards none", "cards none"];
    }

    if (typeof cardsData === "object") {
        console.log(cardsData[0]);
        console.log(cardsData[1]);
        cardsData = "//8=";
    }

    if (cardsData === allBacks) {
        return ["cards back", "cards back"];
    }

    if (cardsData === allNone) {
        return ["cards none", "cards none"];
    }

    const cardsString = window.atob(cardsData);
    const cards = new Array();
    for (let i = 0; i < cardsString.length; i++) {
        cards.push(cardValue(cardsString.charCodeAt(i)));
    }

    return cards;
}

var allBacksClasses = ["cards back", "cards back"];
var allNoneClasses = ["cards back", "cards back"];