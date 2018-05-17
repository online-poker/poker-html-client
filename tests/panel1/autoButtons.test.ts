import * as ko from "knockout";
import { debugSettings } from "../../js/debugsettings";
import { ActionBlock } from "../../js/table/actionBlock";
import { GameActionsQueue } from "../../js/table/gameactionsqueue";
import {
    TableView,
} from "../../js/table/tableview";
import { drainQueue, getTable, getTestTableView, printTableView, simpleInitialization } from "../table/helper";

describe("auto buttons", function () {
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
        debugSettings.tableView.trace = false;
        global.messages = {
            actiontext: {
                fold: "Фолд",
                checkFold: "Чек/Фолд",
                check: "Чек",
                callAmount: "Колл #amount",
            },
        };
    });

    afterEach(function () {
        GameActionsQueue.waitDisabled = true;
    });
    describe("initial status", function () {
        it("after game start", async function () {
            const tableModel = getTable();
            const view1 = getTestTableView();
            const actionBlock = view1.actionBlock;
            await simpleInitialization(view1, 1, [400, 200]);
            expect(view1.myPlayer() != null).toBeTruthy();
            // blinds
            log("Blinds round started");
            view1.onBet(1, 0, 10, 2);
            view1.onBet(2, 0, 20, 1);
            view1.onPlayerCards(1, [1, 2]);
            // preflop
            log("Preflop round started");
            view1.onBet(1, 2, 20, 2);
            await drainQueue(view1.queue);
            expect(view1.actionBlock.foldOnRaise()).toEqual(false);
            expect(view1.actionBlock.supportAny()).toEqual(false);
            expect(view1.actionBlock.supportDirectAmount()).toEqual(false);
        });

        it("after flop", async function () {
            const tableModel = getTable();
            const view1 = getTestTableView();
            const actionBlock = view1.actionBlock;
            await simpleInitialization(view1, 1, [400, 200]);
            expect(view1.myPlayer() != null).toBeTruthy();
            // blinds
            log("Blinds round started");
            view1.onBet(1, 0, 10, 2);
            view1.onBet(2, 0, 20, 1);
            view1.onPlayerCards(1, [1, 2]);
            // preflop
            log("Preflop round started");
            view1.onBet(1, 2, 20, 2);
            view1.actionBlock.foldOnRaise(true);
            view1.onBet(2, 2, 20, 2);
            view1.executeMoveMoneyToPot([40]);
            view1.onOpenCards([3, 4, 5]);
            await drainQueue(view1.queue);
            view1.onBet(2, 2, 0, 1);
            await drainQueue(view1.queue);
            expect(view1.actionBlock.foldOnRaise()).toEqual(false);
            expect(view1.actionBlock.supportAny()).toEqual(false);
            expect(view1.actionBlock.supportDirectAmount()).toEqual(false);
        });

        it("after turn", async function () {
            const tableModel = getTable();
            const view1 = getTestTableView();
            const actionBlock = view1.actionBlock;
            await simpleInitialization(view1, 1, [400, 200]);
            expect(view1.myPlayer() != null).toBeTruthy();
            // blinds
            log("Blinds round started");
            view1.onBet(1, 0, 10, 2);
            view1.onBet(2, 0, 20, 1);
            view1.onPlayerCards(1, [1, 2]);
            // preflop
            log("Preflop round started");
            view1.onBet(1, 2, 20, 2);
            view1.onBet(2, 2, 20, 2);
            view1.executeMoveMoneyToPot([40]);
            view1.onOpenCards([3, 4, 5]);
            await drainQueue(view1.queue);
            view1.onBet(2, 2, 0, 1);
            view1.onBet(1, 3, 20, 2);
            view1.actionBlock.foldOnRaise(true);
            view1.onBet(2, 2, 20, 1);
            view1.executeMoveMoneyToPot([80]);
            view1.onOpenCards([3, 4, 5, 6]);
            await drainQueue(view1.queue);

            expect(view1.actionBlock.foldOnRaise()).toEqual(false);
            expect(view1.actionBlock.supportAny()).toEqual(false);
            expect(view1.actionBlock.supportDirectAmount()).toEqual(false);
        });

        it("after river", async function () {
            const tableModel = getTable();
            const view1 = getTestTableView();
            const actionBlock = view1.actionBlock;
            await simpleInitialization(view1, 1, [400, 200]);
            expect(view1.myPlayer() != null).toBeTruthy();
            // blinds
            log("Blinds round started");
            view1.onBet(1, 0, 10, 2);
            view1.onBet(2, 0, 20, 1);
            view1.onPlayerCards(1, [1, 2]);
            // preflop
            log("Preflop round started");
            view1.onBet(1, 2, 20, 2);
            view1.onBet(2, 2, 20, 2);
            view1.onOpenCards([3, 4, 5]);
            view1.executeMoveMoneyToPot([40]);
            view1.onBet(2, 2, 0, 1);
            view1.onBet(1, 2, 0, 2);
            view1.onOpenCards([3, 4, 5, 6]);
            view1.executeMoveMoneyToPot([40]);
            view1.onBet(2, 2, 0, 1);
            view1.onBet(1, 3, 20, 2);
            view1.actionBlock.foldOnRaise(true);
            view1.onBet(2, 2, 20, 1);
            view1.onOpenCards([3, 4, 5, 6, 7]);
            view1.executeMoveMoneyToPot([80]);
            await drainQueue(view1.queue);

            expect(view1.actionBlock.foldOnRaise()).toEqual(false);
            expect(view1.actionBlock.supportAny()).toEqual(false);
            expect(view1.actionBlock.supportDirectAmount()).toEqual(false);
        });
    });
    describe("only one active", function () {
        it("2 players", async function () {
            const tableModel = getTable();
            const view1 = getTestTableView();
            const actionBlock = view1.actionBlock;
            await simpleInitialization(view1, 1, [400, 200]);
            expect(view1.myPlayer() != null).toBeTruthy();
            // blinds
            log("Blinds round started");
            view1.onBet(1, 0, 10, 2);
            view1.onBet(2, 0, 20, 1);
            view1.onPlayerCards(1, [1, 2]);
            // preflop
            log("Preflop round started");
            view1.onBet(1, 2, 20, 2);
            await drainQueue(view1.queue);
            view1.actionBlock.foldOnRaise(true);
            view1.actionBlock.supportAny(true);
            expect(view1.actionBlock.foldOnRaise()).toEqual(false);
            expect(view1.actionBlock.supportAny()).toEqual(true);
            expect(view1.actionBlock.supportDirectAmount()).toEqual(false);

            view1.actionBlock.supportDirectAmount(true);
            expect(view1.actionBlock.foldOnRaise()).toEqual(false);
            expect(view1.actionBlock.supportAny()).toEqual(false);
            expect(view1.actionBlock.supportDirectAmount()).toEqual(true);

            view1.actionBlock.foldOnRaise(true);
            expect(view1.actionBlock.foldOnRaise()).toEqual(true);
            expect(view1.actionBlock.supportAny()).toEqual(false);
            expect(view1.actionBlock.supportDirectAmount()).toEqual(false);
        });
        it("if uncheck then no checked", async function () {
            const tableModel = getTable();
            const view1 = getTestTableView();
            const actionBlock = new ActionBlock();
            actionBlock.attach(view1);
            await simpleInitialization(view1, 1, [400, 200]);
            expect(view1.myPlayer() != null).toBeTruthy();
            // blinds
            log("Blinds round started");
            view1.onBet(1, 0, 10, 2);
            view1.onBet(2, 0, 20, 1);
            view1.onPlayerCards(1, [1, 2]);
            // preflop
            log("Preflop round started");
            view1.onBet(1, 2, 20, 2);
            await drainQueue(view1.queue);
            view1.actionBlock.foldOnRaise(true);
            view1.actionBlock.supportAny(true);
            view1.actionBlock.supportAny(false);
            expect(view1.actionBlock.foldOnRaise()).toEqual(false);
            expect(view1.actionBlock.supportAny()).toEqual(false);
            expect(view1.actionBlock.supportDirectAmount()).toEqual(false);
        });
    });
    describe("flop on raise", function () {
        it("2 players", async function () {
            const tableModel = getTable();
            const view1 = getTestTableView();
            const actionBlock = view1.actionBlock;
            await simpleInitialization(view1, 1, [400, 200]);
            expect(view1.myPlayer() != null).toBeTruthy();
            // blinds
            log("Blinds round started");
            view1.onBet(1, 0, 10, 2);
            view1.onBet(2, 0, 20, 1);
            view1.onPlayerCards(1, [1, 2]);
            // preflop
            log("Preflop round started");
            view1.onBet(1, 2, 20, 2);
            await drainQueue(view1.queue);
            view1.actionBlock.foldOnRaise(true);
            expect(view1.actionBlock.foldOnRaiseCaption()).toEqual("Чек/Фолд");
            view1.onBet(2, 3, 40, 1);
            await drainQueue(view1.queue);
            expect(actionBlock.isCheck()).toEqual(false);
            expect(view1.actionBlock.foldOnRaiseCaption()).toEqual("Фолд");
        });

        it("3 players", async function () {
            const tableModel = getTable();
            const view1 = getTestTableView();
            const actionBlock = view1.actionBlock;
            await simpleInitialization(view1, 1, [400, 400, 200]);
            expect(view1.myPlayer() != null).toBeTruthy();
            // blinds
            log("Blinds round started");
            view1.onBet(1, 0, 10, 2);
            view1.onBet(2, 0, 20, 3);
            view1.onPlayerCards(1, [1, 2]);
            await drainQueue(view1.queue);
            // preflop
            log("Preflop round started");
            view1.actionBlock.foldOnRaise(true);
            expect(view1.actionBlock.foldOnRaiseCaption()).toEqual("Фолд");
            view1.onBet(3, 2, 20, 1);
            await drainQueue(view1.queue);
            expect(view1.actionBlock.foldOnRaiseCaption()).toEqual("Фолд");
            view1.onBet(1, 2, 20, 2);
            view1.onBet(2, 2, 20, 3);
            view1.onOpenCards([3, 4, 5]);
            view1.executeMoveMoneyToPot([60]);
            // flop
            log("Flop round started");
            view1.onBet(3, 2, 0, 1);
            await drainQueue(view1.queue);
            expect(actionBlock.couldRaise()).toEqual(true);
        });
    });
    describe("support direct", function () {

        it("check", async function () {
            const tableModel = getTable();
            const view1 = getTestTableView();
            const actionBlock = view1.actionBlock;
            await simpleInitialization(view1, 1, [400, 200]);
            expect(view1.myPlayer() != null).toBeTruthy();
            // blinds
            log("Blinds round started");
            view1.onBet(1, 0, 10, 2);
            view1.onBet(2, 0, 20, 1);
            view1.onPlayerCards(1, [1, 2]);
            // preflop
            log("Preflop round started");
            view1.onBet(1, 2, 20, 2);
            await drainQueue(view1.queue);
            view1.actionBlock.supportDirectAmount(true);
            expect(view1.actionBlock.amountSupported()).toEqual(0);
            expect(view1.actionBlock.supportDirectAmountCaption()).toEqual("Чек");
            view1.onBet(2, 3, 40, 1);
            await drainQueue(view1.queue);
            expect(actionBlock.supportDirectAmount()).toEqual(false);
        });

        it("check on 3 players", async function () {
            const tableModel = getTable();
            const view1 = getTestTableView();
            const actionBlock = view1.actionBlock;
            await simpleInitialization(view1, 1, [400, 200, 200]);
            expect(view1.myPlayer() != null).toBeTruthy();
            // blinds
            log("Blinds round started");
            view1.onBet(1, 0, 10, 2);
            view1.onBet(2, 0, 20, 3);
            view1.onPlayerCards(1, [1, 2]);
            await drainQueue(view1.queue);
            // preflop
            log("Preflop round started");
            view1.actionBlock.supportDirectAmount(true);
            expect(view1.actionBlock.amountSupported()).toEqual(10);
            expect(view1.actionBlock.supportDirectAmountCaption()).toEqual("Колл 10");
            view1.onBet(3, 3, 40, 1);
            await drainQueue(view1.queue);
            expect(actionBlock.supportDirectAmount()).toEqual(false);
        });

        it("check after my turn", async function () {
            const tableModel = getTable();
            const view1 = getTestTableView();
            const actionBlock = view1.actionBlock;
            await simpleInitialization(view1, 1, [400, 200]);
            expect(view1.myPlayer() != null).toBeTruthy();
            // blinds
            log("Blinds round started");
            view1.onBet(1, 0, 10, 2);
            view1.onBet(2, 0, 20, 1);
            view1.onPlayerCards(1, [1, 2]);
            // preflop
            log("Preflop round started");
            view1.onBet(1, 3, 40, 2);
            await drainQueue(view1.queue);
            view1.actionBlock.supportDirectAmount(true);
            expect(view1.actionBlock.amountSupported()).toEqual(0);
            expect(view1.actionBlock.supportDirectAmountCaption()).toEqual("Чек");
            view1.onBet(2, 3, 40, 1);
            view1.onMoveMoneyToPot([80]);
            view1.onOpenCards([1, 2, 3]);
            await drainQueue(view1.queue);
            expect(actionBlock.supportDirectAmount()).toEqual(false);
        });

        it("check after my turn 2", async function () {
            const tableModel = getTable();
            const view1 = getTestTableView();
            const actionBlock = view1.actionBlock;
            await simpleInitialization(view1, 1, [400, 200, 200]);
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
            view1.onBet(2, 3, 40, 3);
            await drainQueue(view1.queue);
            view1.actionBlock.supportDirectAmount(true);
            expect(view1.actionBlock.supportDirectAmountCaption()).toEqual("Колл 20");
            let checkOrCallExecutedCount = 0;
            actionBlock.checkOrCallExecuted.add(function () {
                checkOrCallExecutedCount = checkOrCallExecutedCount + 1;
            });
            actionBlock.performAutomaticActions = function () {
                checkOrCallExecutedCount = checkOrCallExecutedCount + 1;
                return false;
            };

            view1.onBet(2, 3, 80, 3);
            await drainQueue(view1.queue);
            expect(checkOrCallExecutedCount).toEqual(0);
            expect(actionBlock.supportDirectAmount()).toEqual(false);
        });

        it("Automatic action executed", async function () {
            const tableModel = getTable();
            const view1 = getTestTableView();
            const actionBlock = view1.actionBlock;
            actionBlock.suppressActions = true;

            await simpleInitialization(view1, 1, [400, 200, 200]);
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
            await drainQueue(view1.queue);
            view1.actionBlock.supportDirectAmount(true);
            view1.onBet(2, 3, 40, 3);
            await drainQueue(view1.queue);
            expect(actionBlock.supportDirectAmount()).toEqual(false);
            view1.actionBlock.supportDirectAmount(true);
            expect(view1.actionBlock.supportDirectAmountCaption()).toEqual("Колл 20");
            let checkOrCallExecutedCount = 0;
            actionBlock.checkOrCallExecuted.add(function () {
                checkOrCallExecutedCount = checkOrCallExecutedCount + 1;
            });

            expect(actionBlock.amountSupported()).toEqual(20);
            expect(view1.maximumBet() - view1.myBet()).toEqual(20);
            actionBlock.updateSupportDirectAmountStatus(20);
            expect(actionBlock.amountSupported()).toEqual(20);
            expect(actionBlock.supportDirectAmount()).toEqual(true);

            expect(actionBlock.supportDirectAmountBet()).toEqual(true);

            // view1.onBet(3, 2, 40, 1);
            expect(checkOrCallExecutedCount).toEqual(1);
            expect(actionBlock.supportDirectAmount()).toEqual(false);
        });

        it("If check and then uncheck, nothing happens", async function () {
            const tableModel = getTable();
            const view1 = getTestTableView();
            const actionBlock = view1.actionBlock;
            await simpleInitialization(view1, 1, [400, 200]);
            expect(view1.myPlayer() != null).toBeTruthy();
            // blinds
            log("Blinds round started");
            view1.onBet(1, 0, 10, 2);
            view1.onBet(2, 0, 20, 1);
            view1.onPlayerCards(1, [1, 2]);
            // preflop
            log("Preflop round started");
            view1.onBet(1, 3, 40, 2);
            view1.onBet(2, 3, 40, 1);
            view1.onMoveMoneyToPot([80]);
            view1.onOpenCards([1, 2, 3]);
            await drainQueue(view1.queue);
            expect(actionBlock.supportDirectAmount()).toEqual(false);
            expect(view1.actionBlock.amountSupported()).toEqual(-1);
            view1.onBet(1, 3, 0, 2);
            await drainQueue(view1.queue);
            expect(view1.actionBlock.amountSupported()).toEqual(-1);
            view1.actionBlock.supportDirectAmount(true);
            view1.actionBlock.supportDirectAmount(false);
            expect(view1.actionBlock.amountSupported()).toEqual(-1);
            expect(actionBlock.supportDirectAmount()).toEqual(false);
        });
    });
});
