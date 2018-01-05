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

describe("main buttons", function () {
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
        };
    });

    afterEach(function () {
        GameActionsQueue.waitDisabled = true;
    });
    describe("initial status", function () {
        it("after game start", async function () {
            const tableModel = getTable();
            const view1 = new TableView(1, tableModel);
            const actionBlock = view1.actionBlock;
            simpleInitialization(view1, 1, [400, 200]);
            expect(view1.myPlayer() != null).toBeTruthy();
            // blinds
            log("Blinds round started");
            view1.onBet(1, 0, 10, 2);
            view1.onBet(2, 0, 20, 1);
            view1.onPlayerCards(1, [1, 2]);
            await drainQueue(view1.queue);
            // preflop
            log("Preflop round started");

            // expect(actionBlock.buttonsEnabled()).toEqual(true);
            expect(actionBlock.myPlayerInGame()).toEqual(true);
            // expect(actionBlock.turnEnabled()).toEqual(true);
            // expect(actionBlock.mainButtonsBlockVisible()).toEqual(true);
            // view1.onBet(1, 2, 20, 2);
            // expect(actionBlock.mainButtonsBlockVisible()).toEqual(false);
        });
    });
});
