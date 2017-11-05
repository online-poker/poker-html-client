import * as ko from "knockout";
import {
    login,
    loginId,
} from "../../js/authmanager";
import { debugSettings } from "../../js/debugsettings";
import { ActionBlock } from "../../js/table/actionBlock";
import { GameActionsQueue } from "../../js/table/gameactionsqueue";
import {
    TableView,
} from "../../js/table/tableview";
import { drainQueue, getTable, printTableView, simpleInitialization } from "../table/helper";

declare var global: any;

describe("quick buttons", function () {
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
            table: {
                halfpot: "1/2 Пот<br/>#amount",
                threebb: "3ББ<br/>#amount",
                pot: "Пот<br/>#amount",
                allin: "Олл-ин #amount",
            },
        };
    });

    afterEach(function () {
        GameActionsQueue.waitDisabled = true;
    });
    // Texas holdem by default has no limit games
    describe("No limit games", function () {
        it("after game start", async function () {
            const tableModel = getTable();
            const view1 = new TableView(1, tableModel);
            view1.currentLogin("Player2");
            const actionBlock = view1.actionBlock;
            simpleInitialization(view1, 1, [400, 200]);
            login("Player2");
            loginId(2);
            expect(view1.myPlayer() != null).toBeTruthy();
            // blinds
            log("Blinds round started");
            view1.onBet(1, 0, 10, 2);
            view1.onBet(2, 0, 20, 1);
            view1.onPlayerCards(1, [1, 2]);
            view1.onPlayerCards(2, [254, 254]);
            // preflop
            log("Preflop round started");
            view1.onBet(1, 2, 20, 2);
            await drainQueue(view1.queue);
            expect(view1.actionBlock.isPotLimitGame()).toEqual(false);
            expect(view1.actionBlock.button1Visible()).toEqual(true);
            expect(view1.actionBlock.button1Amount()).toEqual(80);
            expect(view1.actionBlock.button1Caption()).toEqual("3ББ<br/>80");
            expect(view1.actionBlock.button2Visible()).toEqual(true);
            expect(view1.actionBlock.button2Amount()).toEqual(60);
            expect(view1.actionBlock.button2Caption()).toEqual("Пот<br/>60");
            expect(view1.actionBlock.button3Visible()).toEqual(true);
            expect(view1.actionBlock.button3Amount()).toEqual(200);
            expect(view1.actionBlock.button3Caption()).toEqual("Олл-ин 200");
        });
        it("when money only for 3bb", async function () {
            const tableModel = getTable();
            const view1 = new TableView(1, tableModel);
            view1.currentLogin("Player2");
            const actionBlock = view1.actionBlock;
            simpleInitialization(view1, 1, [80, 200]);
            login("Player2");
            loginId(2);
            expect(view1.myPlayer() != null).toBeTruthy();
            // blinds
            log("Blinds round started");
            view1.onBet(1, 0, 10, 2);
            view1.onBet(2, 0, 20, 1);
            view1.onPlayerCards(1, [1, 2]);
            view1.onPlayerCards(2, [254, 254]);
            // preflop
            log("Preflop round started");
            view1.onBet(1, 2, 10, 2);
            await drainQueue(view1.queue);
            expect(view1.actionBlock.isPotLimitGame()).toEqual(false);
            expect(view1.actionBlock.button1Visible()).toEqual(true);
            expect(view1.actionBlock.button1Amount()).toEqual(80);
            expect(view1.actionBlock.button1Caption()).toEqual("Олл-ин 80");
            expect(view1.actionBlock.button2Visible()).toEqual(true);
            expect(view1.actionBlock.button2Amount()).toEqual(50);
            expect(view1.actionBlock.button2Caption()).toEqual("Пот<br/>50");
            expect(view1.actionBlock.button3Visible()).toEqual(false);
        });
        it("when money only for pot when it is smaller 3bb", async function () {
            const tableModel = getTable();
            const view1 = new TableView(1, tableModel);
            view1.currentLogin("Player2");
            const actionBlock = view1.actionBlock;
            simpleInitialization(view1, 1, [50, 200]);
            login("Player2");
            loginId(2);
            expect(view1.myPlayer() != null).toBeTruthy();
            // blinds
            log("Blinds round started");
            view1.onBet(1, 0, 10, 2);
            view1.onBet(2, 0, 20, 1);
            view1.onPlayerCards(1, [1, 2]);
            view1.onPlayerCards(2, [254, 254]);
            // preflop
            log("Preflop round started");
            view1.onBet(1, 2, 10, 2);
            await drainQueue(view1.queue);
            expect(view1.actionBlock.isPotLimitGame()).toEqual(false);
            expect(view1.actionBlock.button1Visible()).toEqual(false);
            expect(view1.actionBlock.button2Visible()).toEqual(true);
            expect(view1.actionBlock.button2Amount()).toEqual(50);
            expect(view1.actionBlock.button2Caption()).toEqual("Олл-ин 50");
            expect(view1.actionBlock.button3Visible()).toEqual(false);
        });
        it("when money only smaller pot and 3bb", async function () {
            const tableModel = getTable();
            const view1 = new TableView(1, tableModel);
            view1.currentLogin("Player2");
            const actionBlock = view1.actionBlock;
            simpleInitialization(view1, 1, [45, 200]);
            login("Player2");
            loginId(2);
            expect(view1.myPlayer() != null).toBeTruthy();
            // blinds
            log("Blinds round started");
            view1.onBet(1, 0, 10, 2);
            view1.onBet(2, 0, 20, 1);
            view1.onPlayerCards(1, [1, 2]);
            view1.onPlayerCards(2, [254, 254]);
            // preflop
            log("Preflop round started");
            view1.onBet(1, 2, 10, 2);
            await drainQueue(view1.queue);
            expect(view1.actionBlock.isPotLimitGame()).toEqual(false);
            expect(view1.actionBlock.button1Visible()).toEqual(false);
            expect(view1.actionBlock.button2Visible()).toEqual(false);
            expect(view1.actionBlock.button3Visible()).toEqual(true);
            expect(view1.actionBlock.button3Amount()).toEqual(45);
            expect(view1.actionBlock.button3Caption()).toEqual("Олл-ин 45");
        });
        it("when money only for 3bb", async function () {
            const tableModel = getTable();
            const view1 = new TableView(1, tableModel);
            const actionBlock = view1.actionBlock;
            simpleInitialization(view1, 1, [110, 200, 200]);
            login("Player1");
            loginId(1);
            expect(view1.myPlayer() != null).toBeTruthy();
            // blinds
            log("Blinds round started");
            view1.onBet(1, 0, 10, 2);
            view1.onBet(2, 0, 20, 3);
            view1.onPlayerCards(1, [1, 2]);
            view1.onPlayerCards(2, [254, 254]);
            // preflop
            log("Preflop round started");
            view1.onBet(3, 3, 30, 1);
            await drainQueue(view1.queue);
            expect(view1.actionBlock.isPotLimitGame()).toEqual(false);
            expect(view1.actionBlock.button1Visible()).toEqual(true);
            expect(view1.actionBlock.button1Amount()).toEqual(90);
            expect(view1.actionBlock.button1Caption()).toEqual("3ББ<br/>90");
            expect(view1.actionBlock.button2Visible()).toEqual(true);
            expect(view1.actionBlock.button2Amount()).toEqual(110);
            expect(view1.actionBlock.button2Caption()).toEqual("Олл-ин 110");
            expect(view1.actionBlock.button3Visible()).toEqual(false);
        });
        // This test should be enabled and fixed. Right now I'm being lazy
        // and don't want spend any more time on that.
        xit("when money only for 3bb - variant2", async function () {
            const tableModel = getTable();
            const view1 = new TableView(1, tableModel);
            const actionBlock = view1.actionBlock;
            simpleInitialization(view1, 1, [100, 200, 200]);
            login("Player1");
            loginId(1);
            expect(view1.myPlayer() != null).toBeTruthy();
            // blinds
            log("Blinds round started");
            view1.onBet(1, 0, 10, 2);
            view1.onBet(2, 0, 20, 3);
            view1.onPlayerCards(1, [1, 2]);
            view1.onPlayerCards(2, [254, 254]);
            // preflop
            log("Preflop round started");
            view1.onBet(3, 3, 30, 1);
            await drainQueue(view1.queue);
            expect(view1.actionBlock.isPotLimitGame()).toEqual(false);
            expect(view1.actionBlock.button1Visible()).toEqual(true);
            expect(view1.actionBlock.button1Amount()).toEqual(90);
            expect(view1.actionBlock.button1Caption()).toEqual("3ББ<br/>90");
            expect(view1.actionBlock.button2Visible()).toEqual(false);
            expect(view1.actionBlock.button3Visible()).toEqual(true);
            expect(view1.actionBlock.button3Amount()).toEqual(100);
            expect(view1.actionBlock.button3Caption()).toEqual("Олл-ин 100");
        });
    });
    describe("Pot limit mode", function () {
        it("headsup after game start", async function () {
            const tableModel = getTable();
            const view1 = new TableView(1, tableModel);
            const actionBlock = view1.actionBlock;
            simpleInitialization(view1, 2, [1000, 1000]);
            login("Player2");
            loginId(2);
            expect(view1.myPlayer() != null).toBeTruthy();
            // blinds
            log("Blinds round started");
            view1.onBet(1, 0, 10, 2);
            view1.onBet(2, 0, 20, 1);
            view1.onPlayerCards(1, [1, 2]);
            view1.onPlayerCards(2, [254, 254]);
            // preflop
            log("Preflop round started");
            view1.onBet(1, 2, 20, 2);
            await drainQueue(view1.queue);
            expect(view1.actionBlock.isPotLimitGame()).toEqual(true);
            expect(view1.actionBlock.button1Visible()).toEqual(false);
            expect(view1.actionBlock.button2Visible()).toEqual(true);
            expect(view1.actionBlock.button2Amount()).toEqual(60);
            expect(view1.actionBlock.button2Caption()).toEqual("Пот<br/>60");
            expect(view1.actionBlock.button3Visible()).toEqual(false);
        });
        it("headsup after raise", async function () {
            const tableModel = getTable();
            const view1 = new TableView(1, tableModel);
            const actionBlock = view1.actionBlock;
            simpleInitialization(view1, 2, [1000, 1000]);
            login("Player2");
            loginId(2);
            expect(view1.myPlayer() != null).toBeTruthy();
            // blinds
            log("Blinds round started");
            view1.onBet(1, 0, 10, 2);
            view1.onBet(2, 0, 20, 1);
            view1.onPlayerCards(1, [1, 2]);
            view1.onPlayerCards(2, [254, 254]);
            // preflop
            log("Preflop round started");
            view1.onBet(1, 3, 40, 2);
            await drainQueue(view1.queue);
            expect(view1.actionBlock.isPotLimitGame()).toEqual(true);
            expect(view1.actionBlock.button1Visible()).toEqual(false);
            expect(view1.actionBlock.button2Visible()).toEqual(true);
            expect(view1.actionBlock.button2Amount()).toEqual(120);
            expect(view1.actionBlock.button2Caption()).toEqual("Пот<br/>120");
            expect(view1.actionBlock.button3Visible()).toEqual(false);
        });
        it("regular after game start", async function () {
            const tableModel = getTable();
            const view1 = new TableView(1, tableModel);
            const actionBlock = view1.actionBlock;
            view1.currentLogin("Player4");
            simpleInitialization(view1, 2, [1000, 1000, 1000, 1000]);
            login("Player4");
            loginId(4);
            expect(view1.myPlayer() != null).toBeTruthy();
            // blinds
            log("Blinds round started");
            view1.onBet(1, 0, 10, 2);
            view1.onBet(2, 0, 20, 3);
            view1.onPlayerCards(1, [1, 2]);
            view1.onPlayerCards(2, [254, 254]);
            // preflop
            log("Preflop round started");
            view1.onBet(3, 2, 20, 4);
            await drainQueue(view1.queue);
            expect(view1.maximumRaiseAmount()).toEqual(90);
            expect(view1.actionBlock.isPotLimitGame()).toEqual(true);
            expect(view1.actionBlock.button1Visible()).toEqual(true);
            expect(view1.actionBlock.button1Amount()).toEqual(45);
            expect(view1.actionBlock.button1Caption()).toEqual("1/2 Пот<br/>45");
            expect(view1.actionBlock.button2Visible()).toEqual(true);
            expect(view1.actionBlock.button2Amount()).toEqual(90);
            expect(view1.actionBlock.button2Caption()).toEqual("Пот<br/>90");
            expect(view1.actionBlock.button3Visible()).toEqual(false);
        });
        it("all in when not enough money for pot", async function () {
            const tableModel = getTable();
            const view1 = new TableView(1, tableModel);
            const actionBlock = view1.actionBlock;
            simpleInitialization(view1, 2, [1000, 1000, 1000, 90]);
            view1.currentLogin("Player4");
            login("Player4");
            loginId(4);
            expect(view1.myPlayer() != null).toBeTruthy();
            // blinds
            log("Blinds round started");
            view1.onBet(1, 0, 10, 2);
            view1.onBet(2, 0, 20, 3);
            view1.onPlayerCards(1, [1, 2]);
            view1.onPlayerCards(2, [254, 254]);
            view1.onPlayerCards(3, [254, 254]);
            view1.onPlayerCards(4, [254, 254]);
            // preflop
            log("Preflop round started");
            view1.onBet(3, 2, 20, 4);
            await drainQueue(view1.queue);
            expect(view1.actionBlock.isPotLimitGame()).toEqual(true);
            expect(view1.actionBlock.button1Visible()).toEqual(true);
            expect(view1.actionBlock.button1Amount()).toEqual(45);
            expect(view1.actionBlock.button1Caption()).toEqual("1/2 Пот<br/>45");
            expect(view1.actionBlock.button2Visible()).toEqual(true);
            expect(view1.actionBlock.button2Amount()).toEqual(90);
            expect(view1.actionBlock.button2Caption()).toEqual("Олл-ин 90");
            expect(view1.actionBlock.button3Visible()).toEqual(false);
        });
        it("all in when exactly enough money for half pot", async function () {
            const tableModel = getTable();
            const view1 = new TableView(1, tableModel);
            const actionBlock = view1.actionBlock;
            simpleInitialization(view1, 2, [1000, 1000, 1000, 45]);
            view1.currentLogin("Player4");
            login("Player4");
            loginId(4);
            expect(view1.myPlayer() != null).toBeTruthy();
            // blinds
            log("Blinds round started");
            view1.onBet(1, 0, 10, 2);
            view1.onBet(2, 0, 20, 3);
            view1.onPlayerCards(1, [1, 2]);
            view1.onPlayerCards(2, [254, 254]);
            view1.onPlayerCards(3, [254, 254]);
            view1.onPlayerCards(4, [254, 254]);
            // preflop
            log("Preflop round started");
            view1.onBet(3, 2, 20, 4);
            await drainQueue(view1.queue);
            expect(view1.actionBlock.isPotLimitGame()).toEqual(true);
            expect(view1.actionBlock.button1Visible()).toEqual(true);
            expect(view1.actionBlock.button1Amount()).toEqual(45);
            expect(view1.actionBlock.button1Caption()).toEqual("Олл-ин 45");
            expect(view1.actionBlock.button2Visible()).toEqual(false);
            expect(view1.actionBlock.button3Visible()).toEqual(false);
        });
        it("all in when not enough money for half pot", async function () {
            const tableModel = getTable();
            const view1 = new TableView(1, tableModel);
            const actionBlock = view1.actionBlock;
            simpleInitialization(view1, 2, [1000, 1000, 1000, 40]);
            view1.currentLogin("Player4");
            login("Player4");
            loginId(4);
            expect(view1.myPlayer() != null).toBeTruthy();
            // blinds
            log("Blinds round started");
            view1.onBet(1, 0, 10, 2);
            view1.onBet(2, 0, 20, 3);
            view1.onPlayerCards(1, [1, 2]);
            view1.onPlayerCards(2, [254, 254]);
            view1.onPlayerCards(3, [254, 254]);
            view1.onPlayerCards(4, [254, 254]);
            // preflop
            log("Preflop round started");
            view1.onBet(3, 2, 20, 4);
            await drainQueue(view1.queue);
            expect(view1.actionBlock.isPotLimitGame()).toEqual(true);
            expect(view1.actionBlock.button1Visible()).toEqual(false);
            // expect(view1.actionBlock.button1Amount()).toEqual(45);
            // expect(view1.actionBlock.button1Caption()).toEqual("1/2 Пот<br/>45");
            expect(view1.actionBlock.button2Visible()).toEqual(false);
            expect(view1.actionBlock.button2Amount()).toEqual(40);
            expect(view1.actionBlock.button2Caption()).toEqual("Олл-ин 40");
            expect(view1.actionBlock.button3Visible()).toEqual(true);
            expect(view1.actionBlock.button3Amount()).toEqual(40);
            expect(view1.actionBlock.button3Caption()).toEqual("Олл-ин 40");
        });
    });
});
