import * as ko from "knockout";
import {
    login,
    loginId,
} from "../../js/authmanager";
import { GameActionsQueue } from "../../js/table/gameactionsqueue";
import {
    TableView,
} from "../../js/table/tableview";

declare var global: any;

function getSeatPlayer(seat: number, initialAmount: number): PlayerStatusInfo {
    return {
        Seat: seat,
        Bet: 0,
        Cards: "",
        Money: initialAmount,
        PlayerId: seat,
        PlayerName: "player" + seat,
        PlayerUrl: "",
        Points: 0,
        Stars: 0,
        Status: 0,
    };
}

describe("Table view", () => {
    describe("No limit", () => {
        beforeAll(() => {
            GameActionsQueue.waitDisabled = true;
            GameActionsQueue.drainQueuePause = 0;
        });
        afterAll(() => {
            GameActionsQueue.waitDisabled = false;
            GameActionsQueue.drainQueuePause = 100;
        });
        it("Pot limit on preflop", async () => {
            global.messages = {
            };
            const tableView = new TableView(1, {
                TableId: 1,
                TableName: "",
                BigBlind: 200,
                SmallBlind: 100,
                CurrencyId: 1,
                HandsPerHour: 0,
                AveragePotSize: 0,
                JoinedPlayers: 2,
                MaxPlayers: 8,
                PotLimitType: 2,
            });
            const players: GamePlayerStartInformation[] = [{
                PlayerId: 1,
                Money: 10000,
            }, {
                PlayerId: 2,
                Money: 10000,
            }, {
                PlayerId: 3,
                Money: 10000,
            }, {
                PlayerId: 4,
                Money: 10000,
            }];
            const actions: GameActionStartInformation[] = [];
            login("player1");
            loginId(1);
            const tableSatusPlayers = [
                getSeatPlayer(1, 10000),
                getSeatPlayer(2, 10000),
                getSeatPlayer(3, 10000),
                getSeatPlayer(4, 10000),
            ];
            tableView.onTableStatusInfo(tableSatusPlayers, [], null, 4, 100, 10, null, null, null, null, null, true, 0, false, true, null, 0, 1);
            tableView.onGameStarted(1, players, actions, 4);
            tableView.onBet(1, 0, 100, 2);
            tableView.onBet(2, 0, 200, 3);
            tableView.onPlayerCards(1, [1, 2]);
            tableView.onPlayerCards(2, [1, 2]);
            tableView.onPlayerCards(3, [1, 2]);
            tableView.onPlayerCards(4, [1, 2]);
            await tableView.queue.waitCurrentTask();
            while (tableView.queue.size() > 0) {
                await tableView.queue.execute();
                await tableView.queue.waitCurrentTask();
            }

            const currentPlayer = tableView.currentPlayer();
            expect(currentPlayer).not.toBeNull();
            expect(currentPlayer.PlayerId()).toBe(3);
            expect(tableView.minimumRaiseAmount()).toBe(400);
            expect(tableView.maximumRaiseAmount()).toBe(10000);
        });
    });
    describe("Pot limit", () => {
        beforeAll(() => {
            GameActionsQueue.waitDisabled = true;
            GameActionsQueue.drainQueuePause = 0;
        });
        afterAll(() => {
            GameActionsQueue.waitDisabled = false;
            GameActionsQueue.drainQueuePause = 100;
        });
        it("Pot limit on preflop", async () => {
            global.messages = {
            };
            const tableView = new TableView(1, {
                TableId: 1,
                TableName: "",
                BigBlind: 200,
                SmallBlind: 100,
                CurrencyId: 1,
                HandsPerHour: 0,
                AveragePotSize: 0,
                JoinedPlayers: 2,
                MaxPlayers: 8,
                PotLimitType: 2,
            });
            const players: GamePlayerStartInformation[] = [{
                PlayerId: 1,
                Money: 10000,
            }, {
                PlayerId: 2,
                Money: 10000,
            }, {
                PlayerId: 3,
                Money: 10000,
            }, {
                PlayerId: 4,
                Money: 10000,
            }];
            const actions: GameActionStartInformation[] = [];
            login("player1");
            loginId(1);
            const tableSatusPlayers = [
                getSeatPlayer(1, 10000),
                getSeatPlayer(2, 10000),
                getSeatPlayer(3, 10000),
                getSeatPlayer(4, 10000),
            ];
            tableView.onTableStatusInfo(tableSatusPlayers, [], null, 4, 100, 10, null, null, null, null, null, true, 0, false, true, null, 0, 2);
            tableView.onGameStarted(1, players, actions, 4);
            tableView.onBet(1, 0, 100, 2);
            tableView.onBet(2, 0, 200, 3);
            tableView.onPlayerCards(1, [1, 2]);
            tableView.onPlayerCards(2, [1, 2]);
            tableView.onPlayerCards(3, [1, 2]);
            tableView.onPlayerCards(4, [1, 2]);
            await tableView.queue.waitCurrentTask();
            while (tableView.queue.size() > 0) {
                await tableView.queue.execute();
                await tableView.queue.waitCurrentTask();
            }

            const currentPlayer = tableView.currentPlayer();
            expect(currentPlayer).not.toBeNull();
            expect(currentPlayer.PlayerId()).toBe(3);
            expect(tableView.maximumRaiseAmount()).toBe(400);
        });
    });
});
