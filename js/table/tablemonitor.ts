﻿/* tslint:disable:no-empty */

import { TableView } from "./tableview";

/**
* Base class for the table monitoring.
*/
export class TableMonitor {
    /**
    * Initializes a new instance of the table monitor
    */
    constructor(public tableView: TableView) {
    }
    onGameStarted(gameId: number, players: GamePlayerStartInformation[], actions: GameActionStartInformation[], dealerSeat: number) {
    }
    onGameFinished(gameId: number, winners: GameWinnerModel[], rake: number) {
    }
    onBet(playerId: number, type: number, amount: number, nextPlayerId: number) {
    }
    onPlayerCards(playerId: number, cards: number[]) {
    }
    onOpenCards(cards: number[]) {
    }
    onMoveMoneyToPot(amount: number[]) {
    }
    onPlayerStatus(playerId: number, status: number) {
    }
}