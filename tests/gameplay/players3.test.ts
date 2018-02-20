import * as ko from "knockout";
import {
    login,
    loginId,
} from "../../js/authmanager";
import { debugSettings } from "../../js/debugsettings";
import { GameActionsQueue } from "../../js/table/gameactionsqueue";
import {
    TableView,
} from "../../js/table/tableview";
import { drainQueue, getTable, getTestTableView, printTableView, simpleInitialization } from "../table/helper";

describe("gameplay", function () {
    const login1 = "Player1";
    const login2 = "Player2";
    const login3 = "Player3";
    GameActionsQueue.waitDisabled = true;
    let logEnabled = false;
    const log = function (message: string, ...params: any[]) {
        if (logEnabled) {
            console.log(message);
        }
    };

    beforeEach(function () {
        GameActionsQueue.waitDisabled = true;
        logEnabled = false;
        global.messages = {
        };
        debugSettings.tableView.trace = false;
    });

    afterEach(function () {
        GameActionsQueue.waitDisabled = true;
    });
    const lit = function (name: string, assertion?: () => void) {
        it(name, function () {
            log("*** START *** " + name);
            assertion();
            log("*** END *** " + name);
        });
    };

    describe("3 players", function () {
        it("Could raise then other players has more money on hands", async function () {
            const tableModel = getTable();
            const view1 = getTestTableView();
            const actionBlock = view1.actionBlock;
            view1.currentLogin(login1);
            login(login1);
            loginId(1);
            view1.onTableStatusInfo([], [], null, 2, 10, 10, 30, 0, 1, 0, null, true, 0, false, false, null, null, 1);
            view1.onSit(1, 1, login1, 400, "url", 0, 1);
            view1.onSit(2, 2, login2, 400, "url", 0, 1);
            view1.onSit(3, 3, login3, 200, "url", 0, 1);
            const defaultBets = [];
            const players = [
                { PlayerId: 1, PlayerName: login1, Money: 400 },
                { PlayerId: 2, PlayerName: login2, Money: 400 },
                { PlayerId: 3, PlayerName: login3, Money: 200 },
            ];
            view1.onGameStarted(1, players, defaultBets, 3);
            await drainQueue(view1.queue);
            expect(view1.myPlayer()).not.toBeNull();
            // blinds
            log("Blinds round started");
            view1.onBet(1, 0, 10, 2);
            view1.onBet(2, 0, 20, 3);
            view1.onPlayerCards(1, [1, 2]);
            // preflop
            log("Preflop round started");
            view1.onBet(3, 0, 20, 1);
            view1.onBet(1, 0, 20, 2);
            view1.onBet(2, 0, 20, 3);
            view1.onOpenCards([3, 4, 5]);
            view1.onMoveMoneyToPot([60]);
            // flop
            log("Flop round started");
            view1.onBet(3, 3, 180, 1);
            await drainQueue(view1.queue);
            expect(actionBlock.couldRaise()).toBe(true);
        });
        it("Could not raise more then other players has on hands", async function () {
            const tableModel = getTable();
            const view1 = getTestTableView();
            const actionBlock = view1.actionBlock;
            view1.currentLogin(login1);
            login(login1);
            loginId(1);
            view1.onTableStatusInfo([], [], null, 2, 10, 10, 30, 0, 1, 0, 1, true, 0, false, true, null, null, 1);
            view1.onSit(1, 1, login1, 400, "url", 0, 1);
            view1.onSit(2, 2, login2, 200, "url", 0, 1);
            view1.onSit(3, 3, login3, 100, "url", 0, 1);
            view1.onGameStarted(1, [{ PlayerId: 1, Money: 400 }, { PlayerId: 2, Money: 200 }, { PlayerId: 3, Money: 200 }], [], 3);
            await drainQueue(view1.queue);
            expect(view1.myPlayer() != null).toBeTruthy();
            // blinds
            log("Blinds round started");
            view1.onBet(1, 0, 10, 2);
            view1.onBet(2, 0, 20, 3);
            view1.onPlayerCards(1, [1, 2]);
            // preflop
            log("Preflop round started");
            view1.onBet(3, 2, 20, 1);
            view1.onBet(1, 2, 20, 2);
            view1.onBet(2, 2, 20, 3);
            view1.executeMoveMoneyToPot([60]);
            view1.onOpenCards([3, 4, 5]);
            // flop
            log("Flop round started");
            view1.onBet(3, 3, 180, 1);
            await drainQueue(view1.queue);
            expect(actionBlock.couldRaise()).toEqual(false);
        });

        it("Max amount same for all players", async function () {
            const tableModel = getTable();
            const view1 = getTestTableView();
            const actionBlock = view1.actionBlock;
            simpleInitialization(view1, 1, [1200, 200, 1200]);
            // blinds
            log("Blinds round started");
            view1.onBet(1, 0, 10, 2);
            view1.onBet(2, 0, 20, 3);
            view1.onPlayerCards(1, [1, 2]);
            // preflop
            log("Preflop round started");
            view1.onBet(3, 2, 20, 1);
            await drainQueue(view1.queue);
            expect(view1.places().every((item) => item.IsInGameStatus())).toEqual(true);
            expect(actionBlock.couldRaise()).toEqual(true);
            expect(actionBlock.maxAmountOfMoneyForOtherActivePlayers()).toEqual(1200);
            expect(actionBlock.tableSlider.maximum()).toEqual(1200);
        });

        it("Sitout players which not in game should not be accounted", async function () {
            const tableModel = getTable();
            const view1 = getTestTableView();
            const actionBlock = view1.actionBlock;
            simpleInitialization(view1, 1, [400, 200, 1200]);
            // blinds
            log("Blinds round started");
            view1.onBet(1, 0, 10, 2);
            view1.onBet(2, 0, 20, 3);
            view1.onPlayerCards(1, [1, 2]);
            // preflop
            log("Preflop round started");
            view1.onBet(3, 4, 0, 1);
            view1.onPlayerStatus(3, 9);
            await drainQueue(view1.queue);
            expect(actionBlock.couldRaise()).toEqual(true);
            expect(actionBlock.tableSlider.maximum()).toEqual(200);
        });

        it("Sitout players which not in game should not be accounted 2", async function () {
            const tableModel = getTable();
            const view1 = getTestTableView();
            const actionBlock = view1.actionBlock;
            simpleInitialization(view1, 1, [400, 200, 100]);
            // blinds
            log("Blinds round started");
            view1.onBet(1, 0, 10, 2);
            view1.onBet(2, 0, 20, 3);
            view1.onPlayerCards(1, [1, 2]);
            // preflop
            log("Preflop round started");
            view1.onBet(3, 4, 0, 1);
            view1.onPlayerStatus(3, 9);
            await drainQueue(view1.queue);
            expect(actionBlock.couldRaise()).toEqual(true);
            expect(actionBlock.tableSlider.maximum()).toEqual(200);
        });

        it("Sitout players which not in game should not be accounted 3", async function () {
            const tableModel = getTable();
            const view1 = getTestTableView();
            const actionBlock = view1.actionBlock;
            simpleInitialization(view1, 1, [400, 1200, 100]);
            // blinds
            log("Blinds round started");
            log("Bet ", actionBlock.tableView.myPlayer().Bet(), view1.myPlayer().Bet());
            view1.onBet(1, 0, 10, 2);
            await drainQueue(view1.queue);
            expect(view1.myPlayer().Bet()).toEqual(10);
            log("Bet ", actionBlock.tableView.myPlayer().Bet(), view1.myPlayer().Bet());
            view1.onBet(2, 0, 20, 3);
            await drainQueue(view1.queue);
            expect(view1.maximumBet()).toEqual(20);
            view1.onPlayerCards(1, [1, 2]);
            await drainQueue(view1.queue);
            expect(view1.maximumBet()).toEqual(20);
            // preflop
            log("Preflop round started");
            view1.onBet(3, 4, 0, 1);
            await drainQueue(view1.queue);
            expect(view1.maximumBet()).toEqual(20);
            view1.onPlayerStatus(3, 9);
            await drainQueue(view1.queue);
            expect(actionBlock.couldRaise()).toEqual(true);
            expect(view1.maximumRaiseAmount()).toEqual(390);
            expect(view1.myPlayer().Bet()).toEqual(10);
            expect(actionBlock.tableSlider.maximum()).toEqual(400);
        });
    });
});
