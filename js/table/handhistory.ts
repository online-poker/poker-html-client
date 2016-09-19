﻿/// <reference path="../_references.ts" />
/// <reference path="tablemonitor.ts" />

import { TableView } from "./tableview";
import { TableMonitor } from "./tablemonitor";

export interface PlayerWinInformation {
    id: number;
    login: string;
    cards: string[];
    winAmount?: number;
    combination: string;
    description: string;
}

/**
* Class which performs collection of hand history
*/
export class HandHistory extends TableMonitor {
    detailedOperations: KnockoutObservableArray<string>;
    shortOperations: KnockoutObservableArray<string>;
    players: string[];
    rawCards: number[];
    id: number;
    cards: KnockoutObservableArray<string>;
    playersData: KnockoutObservableArray<PlayerWinInformation>;
    public valid = true;

    constructor(tableView: TableView) {
        super(tableView);
        this.detailedOperations = ko.observableArray<string>([]);
        this.shortOperations = ko.observableArray<string>([]);
        this.cards = ko.observableArray<string>([]);
        this.playersData = ko.observableArray<PlayerWinInformation>([]);
        this.players = [];
    }
    onGameStarted(gameId: number, players: GamePlayerStartInformation[], actions: GameActionStartInformation[], dealerSeat: number) {
        this.detailedOperations([]);
        this.playersData([]);
        this.id = gameId;
        this.detailedOperations.push(_("handhistory.gamesstarted", { gameId: gameId }));
        this.players = [];
        for (let i = 0; i < players.length; i++) {
            const playerId = players[i].PlayerId;
            const tablePlayerInfo = this.tableView.places().filter(_ => _.PlayerId() === playerId);
            let playerName;
            if (tablePlayerInfo.length === 0) {
                playerName = playerId.toString();
            } else {
                playerName = tablePlayerInfo[0].PlayerName();
            }

            this.players[playerId] = playerName;
        }
    }
    onGameFinished(gameId: number, winners: GameWinnerModel[], rake: number) {
        for (let potNumber = 1; potNumber <= winners.length; potNumber++) {
            const potWinners = winners.filter(_ => _.Pot === potNumber);
            if (potWinners.length === 0) {
                break;
            }

            this.detailedOperations.push(_("handhistory.potInfo", { pot: potNumber }));
            for (let i = 0; i < potWinners.length; i++) {
                const pw = potWinners[i];
                this.detailedOperations.push(_("handhistory.playerWin", { player: this.getPlayer(pw.PlayerId), amount: pw.Amount }));
            }
        }

        if (rake > 0) {
            this.detailedOperations.push(_("handhistory.rake", { amount: rake }));
        }

        this.detailedOperations.push(_("handhistory.gameFinished", { gameId: gameId }));

        let winnersList = <PlayerWinInformation[]>[];
        for (let pid in this.players) {
            if (!this.players.hasOwnProperty(pid)) {
                continue;
            }

            const playerId = parseInt(pid, 10)
            const playerName = this.players[pid];
            const winAmount = winners.reduce<number>(function (prev, item) {
                if (item.PlayerId !== playerId) {
                    return prev;
                }

                return prev + item.Amount;
            }, 0);
            let combination = _("handhistory.cardsWasFolded");
            const currentPlayer = this.tableView.places().filter((item) => {
                return item.PlayerId() === playerId;
            });
            let cards: string[];
            if (currentPlayer.length === 0) {
                cards = ["cards back", "cards back"];
            } else {
                cards = currentPlayer[0].Cards();
                if (cards === null) {
                    cards = currentPlayer[0].HandCards();
                    if (cards == null || cards.length === 0) {
                        cards = ["cards back", "cards back"];
                    }
                } else {
                    const rawCards = currentPlayer[0].RawCards();
                    if (rawCards !== null && rawCards !== undefined && rawCards[0] < 100) {
                        const combinationText = currentPlayer[0].getCombination(this.rawCards);
                        if (combinationText != null) {
                            combination = _("handhistory.hasFollowingCombination", { combination: combinationText });
                        } else {
                            combination = _("handhistory.dontShowCards");
                        }
                    } else {
                        combination = _("handhistory.dontShowCards");
                    }
                }
            }

            let description: string;
            if (winAmount > 0) {
                description = "Игрок " + playerName + " выиграл " + winAmount + " " + combination;
            } else {
                description = "Игрок " + playerName + " проиграл " + " " + combination;
            }

            winnersList.push({
                id: playerId,
                login: playerName,
                cards: cards,
                winAmount: winAmount,
                combination: combination,
                description: description
            });
        }

        // Sort players by total winning.
        winnersList = winnersList.sort((a, b) => {
            if (a.winAmount === null) {
                return 1;
            }

            if (b.winAmount === null) {
                return 1;
            }

            return b.winAmount - a.winAmount;
        });
        this.playersData(winnersList);
    }
    onBet(playerId: number, type: number, amount: number, nextPlayerId: number) {
        let operation: string;
        if (type === 0) {
            operation = _("handhistory.blind", { player: this.getPlayer(playerId), amount: amount });
            this.detailedOperations.push(operation);
            this.shortOperations.push(operation);
        }

        if (type === 1) {
            operation = _("handhistory.ante", { player: this.getPlayer(playerId), amount: amount });
            this.detailedOperations.push(operation);
            this.shortOperations.push(operation);
        }

        if (type === 5) {
            operation = _("handhistory.deadblind", { player: this.getPlayer(playerId), amount: amount });
            this.detailedOperations.push(operation);
            this.shortOperations.push(operation);
        }
    }
    onPlayerCards(playerId: number, cards: number[]) {
        const c1 = this.getCard(cards[0]);
        const c2 = this.getCard(cards[1]);
        const operation = _("handhistory.playerCardsOpened", { player: this.getPlayer(playerId), card1: c1, card2: c2 });
        this.detailedOperations.push(operation);
        this.shortOperations.push(operation);
    }
    onPlayerHoleCards(playerId: number, cards: number[]) {
        const c1 = this.getCard(cards[0]);
        const c2 = this.getCard(cards[1]);
        const operation = _("handhistory.playerHoleOpened", { player: this.getPlayer(playerId), card1: c1, card2: c2 });
        this.detailedOperations.push(operation);
        this.shortOperations.push(operation);
    }
    onOpenCards(cards: number[]) {
        this.rawCards = cards || null;
        this.cards(cards.map(item => cardValue(item)));
    }
    onFlop(card1: number, card2: number, card3: number) {
        const c1 = this.getCard(card1);
        const c2 = this.getCard(card2);
        const c3 = this.getCard(card3);
        let operation = _("handhistory.flop");
        this.detailedOperations.push(operation);
        this.shortOperations.push(operation);
        operation = _("handhistory.flopOpenCards", { card1: c1, card2: c2, card3: c3 });
        this.detailedOperations.push(operation);
        this.shortOperations.push(operation);
    }
    onTurn(card4: number) {
        const c4 = this.getCard(card4);
        let operation = _("handhistory.turn");
        this.detailedOperations.push(operation);
        this.shortOperations.push(operation);
        operation = _("handhistory.turnOpenCards", { card4: c4 });
        this.detailedOperations.push(operation);
        this.shortOperations.push(operation);
    }
    onRiver(card5: number) {
        const c5 = this.getCard(card5);
        let operation = _("handhistory.river");
        this.detailedOperations.push(operation);
        this.shortOperations.push(operation);
        operation = _("handhistory.riverOpenCards", { card5: c5 });
        this.detailedOperations.push(operation);
        this.shortOperations.push(operation);
    }
    onMoveMoneyToPot(amount: number[]) {
        this.detailedOperations.push(_("handhistory.potscollection"));
    }
    onPlayerStatus(playerId: number, status: number) {
        // Do nothing.
    }
    onReturnMoney(playerId: number, amount: number) {
        const operation = _("handhistory.returnMoney", { player: this.getPlayer(playerId), amount: amount });
        this.detailedOperations.push(operation);
        this.shortOperations.push(operation);
    }
    onFold(playerId: number) {
        const operation = _("handhistory.fold", { player: this.getPlayer(playerId) });
        this.detailedOperations.push(operation);
        this.shortOperations.push(operation);
    }
    onAllIn(playerId: number, amount: number) {
        const operation = _("handhistory.allin", { player: this.getPlayer(playerId), amount: amount });
        this.detailedOperations.push(operation);
        this.shortOperations.push(operation);
    }
    onCheck(playerId: number, amount: number) {
        const operation = _("handhistory.check", { player: this.getPlayer(playerId), amount: amount });
        this.detailedOperations.push(operation);
        this.shortOperations.push(operation);
    }
    onCall(playerId: number, amount: number) {
        const operation = _("handhistory.call", { player: this.getPlayer(playerId), amount: amount });
        this.detailedOperations.push(operation);
        this.shortOperations.push(operation);
    }
    onBet2(playerId: number, amount: number) {
        const operation = _("handhistory.bet", { player: this.getPlayer(playerId), amount: amount });
        this.detailedOperations.push(operation);
        this.shortOperations.push(operation);
    }
    onRaise(playerId: number, amount: number) {
        const operation = _("handhistory.raise", { player: this.getPlayer(playerId), amount: amount });
        this.detailedOperations.push(operation);
        this.shortOperations.push(operation);
    }
    onPotCreated(potNumber: number, amount: number) {
        this.detailedOperations.push(_("handhistory.potcreated", { pot: potNumber, amount: amount }));
    }
    onPotUpdated(potNumber: number, amount: number) {
        this.detailedOperations.push(_("handhistory.potupdated", { pot: potNumber, amount: amount }));
    }
    private getPlayer(playerId: number) {
        return this.players[playerId];
    }
    private getCard(card: number) {
        const cardValueCode = (card % 13) + 2;
        const cardSuiteCode = Math.floor(card / 13);
        let cardValue = "";
        let cardSuite = "";
        switch (cardSuiteCode) {
            case 0:
                cardSuite = _("handhistory.suitClubs");
                break;
            case 1:
                cardSuite = _("handhistory.suitDiamonds");
                break;
            case 2:
                cardSuite = _("handhistory.suitHearts");
                break;
            case 3:
                cardSuite = _("handhistory.suitSpades");
                break;
        }

        if (cardValueCode === 14) {
            cardValue = "A";
        } else if (cardValueCode === 13) {
            cardValue = "K";
        } else if (cardValueCode === 12) {
            cardValue = "Q";
        } else if (cardValueCode === 11) {
            cardValue = "J";
        } else {
            cardValue = cardValueCode.toString();
        }

        return cardValue + " " + cardSuite;
    }
}
