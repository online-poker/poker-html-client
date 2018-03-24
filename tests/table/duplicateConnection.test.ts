import * as ko from "knockout";
import { DefaultApiProvider } from "poker/api";
import { App } from "../../js/app";
import {
    login,
    loginId,
} from "../../js/authmanager";
import { debugSettings } from "../../js/debugsettings";
import { slowInternetService } from "../../js/services";
import { ActionBlock } from "../../js/table/actionBlock";
import { GameActionsQueue } from "../../js/table/gameactionsqueue";
import {
    TableManager,
} from "../../js/table/tablemanager";
import {
    TableView,
} from "../../js/table/tableview";
import { drainQueue, getTable, printTableView, simpleInitialization } from "../table/helper";

const app: App = null;

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
            table: {
                raise: "Рейз #amount",
                call: "Колл #amount",
            },
        };
    });

    afterEach(function () {
        GameActionsQueue.waitDisabled = true;
    });

    describe("Fatal errors", function () {
        it("Fatal error raised when duplicate connection received", async function () {
            const tableModel = getTable();
            const tableManager = new TableManager(DefaultApiProvider);
            tableManager.initialize();
            const view1 = tableManager.addTable(1, tableModel);
            const actionBlock = new ActionBlock();
            actionBlock.attach(view1);
            simpleInitialization(view1, 1, [400, 200]);
            expect(view1.myPlayer() != null).toBeTruthy();
            // blinds
            log("Blinds round started");
            tableManager.registerEvent(1, ["Game", "Bet", 1, 1, 0, 10, 2, 1]);
            tableManager.registerEvent(1, ["Game", "Bet", 1, 1, 0, 10, 2, 1]);

            global.app = null;
            expect(slowInternetService.fatalError).toEqual(true);
        });
    });
});
