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
        debugSettings.tableView.trace = false;
        global.messages = {
        };
    });

    afterEach(function () {
        GameActionsQueue.waitDisabled = true;
    });

    describe("force join", function () {
        it("Could raise then other players has more money on hands", async function () {
            const tableModel = getTable();
            const view1 = getTestTableView();
            loginId(1);
            const actionBlock = view1.actionBlock;
            simpleInitialization(view1, 1, [400, 400, 400, 400], 2);
            expect(view1.myPlayer() != null).toBeTruthy();
            // blinds
            log("Blinds round started");
            view1.onBet(3, 0, 10, 4);
            view1.onBet(4, 0, 20, 1);
            view1.onBet(1, 5, 20, 0);
            view1.onBet(2, 5, 20, 0);
            view1.onPlayerCards(1, [1, 2]);
            await drainQueue(view1.queue);
            // preflop
            log("Preflop round started");
            expect(actionBlock.buttonsEnabled()).toEqual(true);
        });
    });
});
