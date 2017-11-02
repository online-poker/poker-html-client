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
    }
}

describe("Table view", () => {
    describe("Pot limit", () => {
        beforeAll(() => {
            GameActionsQueue.waitDisabled = true;
        });
        afterAll(() => {
            GameActionsQueue.waitDisabled = false;
        });
        it("Pot limit on preflop", () => {
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
            ]
            tableView.onTableStatusInfo(tableSatusPlayers, [], null, 4, 100, 10, null, null, null, null, null, true, 0, false, true, null, 0, 2);
            tableView.onGameStarted(1, players, actions, 4);
            tableView.onBet(1, 2, 100, 2);
            tableView.onBet(2, 2, 200, 3);
            tableView.queue.execute();
            console.log(tableView.queue);
            expect(tableView.queue.size()).toBe(0);
            console.log(ko.toJSON(tableView.tablePlaces));
            expect(tableView.currentPlayer()).not.toBeNull();
            expect(tableView.maximumRaiseAmount()).toBe(400);
        });
    });
});
