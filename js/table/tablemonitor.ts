/* tslint:disable:no-empty */

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
    public onGameStarted(
        gameId: number,
        players: GamePlayerStartInformation[],
        actions: GameActionStartInformation[],
        dealerSeat: number,
        gameType: number) {
    }
    public onGameFinished(gameId: number, winners: GameWinnerModel[], rake: number) {
    }
    public onBet(playerId: number, type: number, amount: number, nextPlayerId: number) {
    }
    public onPlayerCards(playerId: number, cards: number[]) {
    }
    public onOpenCards(cards: number[]) {
    }
    public onMoveMoneyToPot(amount: number[]) {
    }
    public onPlayerStatus(playerId: number, status: number) {
    }
}
