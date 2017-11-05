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

            // This should be uncommented and fixed. Either we have bug, or
            // Test setup is wrong and should be fixed.
            // expect(view1.actionBlock.button3Caption()).toEqual("Олл-ин 200");
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
        xit("headsup after raise", async function () {
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
            expect(view1.actionBlock.button1Visible()).toEqual(true);
            expect(view1.actionBlock.button1Amount()).toEqual(60);
            expect(view1.actionBlock.button1Caption()).toEqual("1/2 Пот<br/>60");
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
    });
});
