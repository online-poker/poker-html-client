import * as ko from "knockout";
import { authManager } from "poker/authmanager";
import { debugSettings } from "../../js/debugsettings";
import { ActionBlock } from "../../js/table/actionBlock";
import { GameActionsQueue } from "../../js/table/gameactionsqueue";
import {
    TableView,
} from "../../js/table/tableview";
import { drainQueue, getTable, getTestTableView, printTableView, simpleInitialization } from "../table/helper";

const login = authManager.login;
const loginId = authManager.loginId;

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

    describe("2 players", function () {
        it("Could raise then other players has more money on hands", async function () {
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
            view1.onBet(1, 0, 20, 2);
            view1.onBet(2, 0, 20, 2);
            view1.executeMoveMoneyToPot([40]);
            view1.onOpenCards([3, 4, 5]);
            // flop
            log("Flop round started");
            view1.onBet(2, 3, 80, 1);
            await drainQueue(view1.queue);
            expect(actionBlock.couldRaise()).toEqual(true);
            expect(actionBlock.tableSlider.maximum()).toEqual(180);
        });
        it("Could not raise then other players has less money on hands", async function () {
            const tableModel = getTable();
            const view1 = getTestTableView();
            const actionBlock = new ActionBlock();
            actionBlock.attach(view1);
            await simpleInitialization(view1, 1, [200, 400]);
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
            // flop
            log("Flop round started");
            view1.onBet(2, 3, 180, 1);
            await drainQueue(view1.queue);
            expect(actionBlock.couldRaise()).toEqual(false);
        });
        it("Should go all-in", async function () {
            const tableModel = getTable();
            const view1 = getTestTableView();
            const actionBlock = new ActionBlock();
            actionBlock.attach(view1);
            await simpleInitialization(view1, 1, [2244, 1990]);
            expect(view1.myPlayer() != null).toBeTruthy();
            // blinds
            log("Blinds round started");
            view1.onBet(1, 0, 10, 2);
            view1.onBet(2, 0, 20, 1);
            view1.onPlayerCards(1, [1, 2]);
            // preflop
            log("Preflop round started");
            view1.onBet(1, 3, 40, 2);
            view1.onBet(2, 3, 60, 1);
            await drainQueue(view1.queue);
            actionBlock.updateAdditionalButtons();
            expect(actionBlock.button3Amount()).toEqual(1990);
            expect(actionBlock.tableSlider.maximum()).toEqual(1990);
        });

        it("Should go all-in 2", async function () {
            const tableModel = getTable();
            const view1 = getTestTableView();
            const actionBlock = new ActionBlock();
            actionBlock.attach(view1);
            await simpleInitialization(view1, 1, [1244, 1990]);
            expect(view1.myPlayer() != null).toBeTruthy();
            // blinds
            log("Blinds round started");
            view1.onBet(1, 0, 10, 2);
            view1.onBet(2, 0, 20, 1);
            view1.onPlayerCards(1, [1, 2]);
            // preflop
            log("Preflop round started");
            view1.onBet(1, 3, 40, 2);
            view1.onBet(2, 3, 60, 1);
            await drainQueue(view1.queue);
            actionBlock.updateAdditionalButtons();
            expect(actionBlock.button3Amount()).toEqual(1244);
            expect(actionBlock.tableSlider.maximum()).toEqual(1244);
        });

        it("Should go all-in 3", async function () {
            const tableModel = getTable();
            const view1 = getTestTableView();
            const actionBlock = new ActionBlock();
            actionBlock.attach(view1);
            await simpleInitialization(view1, 1, [1244, 1990]);
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
            // flop
            log("Flop round started");
            view1.onBet(2, 3, 180, 1);
            await drainQueue(view1.queue);
            actionBlock.updateAdditionalButtons();
            expect(actionBlock.button3Amount()).toEqual(1224);
            expect(actionBlock.tableSlider.maximum()).toEqual(1224);
        });

        it("Should go all-in 4", async function () {
            const tableModel = getTable();
            const view1 = getTestTableView();
            const actionBlock = new ActionBlock();
            actionBlock.attach(view1);
            await simpleInitialization(view1, 1, [1244, 1990], 2);
            expect(view1.myPlayer() != null).toBeTruthy();
            // blinds
            log("Blinds round started");
            view1.onBet(2, 0, 10, 1);
            view1.onBet(1, 0, 20, 2);
            view1.onPlayerCards(1, [1, 2]);
            // preflop
            log("Preflop round started");
            view1.onBet(2, 2, 20, 1);
            view1.onBet(1, 2, 20, 1);
            view1.executeMoveMoneyToPot([40]);
            view1.onOpenCards([3, 4, 5]);
            await drainQueue(view1.queue);
            // flop
            log("Flop round started");
            actionBlock.updateAdditionalButtons();
            expect(actionBlock.button3Amount()).toEqual(1224);
            expect(actionBlock.tableSlider.maximum()).toEqual(1224);
        });
        it("All-in only on last", async function () {
            const tableModel = getTable();
            const view1 = getTestTableView();
            const actionBlock = new ActionBlock();
            actionBlock.attach(view1);
            await simpleInitialization(view1, 1, [390, 390]);
            expect(view1.myPlayer() != null).toBeTruthy();
            // blinds
            log("Blinds round started");
            view1.onBet(1, 0, 10, 2);
            view1.onBet(2, 0, 20, 1);
            view1.onPlayerCards(1, [1, 2]);
            // preflop
            log("Preflop round started");
            view1.onBet(1, 3, 40, 2);
            view1.onBet(2, 3, 60, 1);
            await drainQueue(view1.queue);
            actionBlock.tableSlider.current(380);
            expect(actionBlock.raiseBetButtonCaption()).toEqual("Рейз 380");
        });

        it("All-in only on last 2", async function () {
            const tableModel = getTable();
            const view1 = getTestTableView();
            const actionBlock = new ActionBlock();
            actionBlock.attach(view1);
            await simpleInitialization(view1, 1, [390, 390]);
            expect(view1.myPlayer() != null).toBeTruthy();
            // blinds
            log("Blinds round started");
            view1.onBet(1, 0, 10, 2);
            view1.onBet(2, 0, 20, 1);
            view1.onPlayerCards(1, [1, 2]);
            // preflop
            log("Preflop round started");
            view1.onBet(1, 3, 40, 2);
            view1.onBet(2, 3, 80, 1);
            await drainQueue(view1.queue);
            actionBlock.tableSlider.current(380);
            expect(actionBlock.raiseBetButtonCaption()).toEqual("Рейз 380");
        });

        it("Able to raise when after call left only BB", async function () {
            const tableModel = getTable();
            const view1 = getTestTableView();
            const actionBlock = new ActionBlock();
            actionBlock.attach(view1);
            await simpleInitialization(view1, 1, [200, 400]);
            // blinds
            log("Blinds round started");
            view1.onBet(1, 0, 10, 2);
            view1.onBet(2, 0, 20, 1);
            view1.onPlayerCards(1, [1, 2]);
            // preflop
            log("Preflop round started");
            view1.onBet(1, 0, 20, 2);
            view1.onBet(2, 3, 180, 1);
            await drainQueue(view1.queue);
            expect(actionBlock.checkCallButtonCaption()).toEqual("Колл 160");
            expect(actionBlock.couldRaise()).toEqual(true);
        });

        xit("Multiple re-raise during preflop", async function () {
            const tableModel = getTable();
            const view1 = getTestTableView();
            const actionBlock = view1.actionBlock;
            await simpleInitialization(view1, 1, [200, 400]);
            // blinds
            log("Blinds round started");
            view1.onBet(1, 0, 10, 2);
            view1.onBet(2, 0, 20, 1);
            view1.onPlayerCards(1, [1, 2]);
            // preflop
            log("Preflop round started");
            view1.onBet(1, 0, 20, 2);
            view1.onBet(2, 3, 60, 1);
            await drainQueue(view1.queue);
            expect(actionBlock.checkCallButtonCaption()).toEqual("Колл 40");
            expect(actionBlock.couldRaise()).toEqual(true);
            expect(actionBlock.raiseBetButtonCaption()).toEqual("Рейз 100");
            view1.onBet(1, 3, 100, 2);
            view1.onBet(2, 3, 180, 1);
            await drainQueue(view1.queue);
            expect(actionBlock.checkCallButtonCaption()).toEqual("Колл 80");
            expect(actionBlock.couldRaise()).toEqual(true);
            expect(actionBlock.raiseBetButtonCaption()).toEqual("Олл-ин 200");
        });

        it("Initial big re-raise during preflop", async function () {
            const tableModel = getTable();
            const view1 = getTestTableView();
            const actionBlock = view1.actionBlock;
            await simpleInitialization(view1, 1, [600, 200]);
            // blinds
            log("Blinds round started");
            view1.onBet(1, 0, 10, 2);
            view1.onBet(2, 0, 20, 1);
            view1.onPlayerCards(1, [1, 2]);
            // preflop
            log("Preflop round started");
            view1.onBet(1, 0, 20, 2);
            view1.onBet(2, 3, 180, 1);
            await drainQueue(view1.queue);
            expect(actionBlock.checkCallButtonCaption()).toEqual("Колл 160");
            expect(actionBlock.couldRaise()).toEqual(true);
            expect(actionBlock.raiseBetButtonCaption()).toEqual("Рейз 200");
        });

        it("Could not re-reraise 3", async function () {
            const tableModel = getTable();
            const view1 = getTestTableView();
            const actionBlock = new ActionBlock();
            actionBlock.attach(view1);
            await simpleInitialization(view1, 1, [1128, 4855], 2);
            // blinds
            log("Blinds round started");
            view1.onBet(2, 0, 10, 1);
            view1.onBet(1, 0, 20, 2);
            view1.onPlayerCards(1, [1, 2]);
            // preflop
            log("Preflop round started");
            view1.onBet(2, 3, 60, 1);
            view1.onBet(1, 3, 300, 2);
            view1.onBet(2, 3, 540, 1);
            view1.onBet(1, 3, 1108, 2);
            await drainQueue(view1.queue);
            expect(actionBlock.couldRaise()).toEqual(false);
            view1.onBet(2, 3, 1128, 1);
            await drainQueue(view1.queue);
            expect(actionBlock.couldRaise()).toEqual(false);
        });
        it("Min raise to equal total amount of money left for the other player", async function () {
            const tableModel = getTable();
            const view1 = getTestTableView();
            const actionBlock = new ActionBlock();
            actionBlock.attach(view1);
            await simpleInitialization(view1, 1, [400, 29]);
            expect(view1.myPlayer() != null).toBeTruthy();
            // blinds
            log("Blinds round started");
            view1.onBet(1, 0, 10, 2);
            view1.onBet(2, 0, 20, 1);
            view1.onPlayerCards(1, [1, 2]);
            await drainQueue(view1.queue);
            // preflop
            log("Preflop round started");
            expect(actionBlock.couldRaise()).toEqual(true);
            expect(actionBlock.tableSlider.minimum()).toEqual(29);
            expect(actionBlock.tableSlider.maximum()).toEqual(29);
        });
        it("Min raise to equal total amount of money left for the other player 2 (G#2918858)", async function () {
            const tableModel = getTable();
            const view1 = getTestTableView();
            const actionBlock = view1.actionBlock;
            await simpleInitialization(view1, 1, [730, 39], 2);
            expect(view1.myPlayer() != null).toBeTruthy();
            // blinds
            log("Blinds round started");
            view1.onBet(2, 0, 10, 1);
            view1.onBet(1, 0, 20, 2);
            view1.onPlayerCards(1, [1, 2]);
            // preflop
            log("Preflop round started");
            view1.onBet(2, 2, 20, 1);
            await drainQueue(view1.queue);
            expect(actionBlock.couldRaise()).toEqual(true);
            expect(view1.currentRaise()).toEqual(39);
            expect(view1.minimumRaiseAmount()).toEqual(39);
            expect(view1.myPlayer().Bet()).toEqual(20);
            expect(actionBlock.tableSlider.current()).toEqual(39);
            expect(actionBlock.raiseBetButtonCaption()).toEqual("Рейз 39");
            log("Минимальный рейз");
            expect(actionBlock.tableSlider.minimum()).toEqual(39);
            log("Максимальный рейз");
            expect(actionBlock.tableSlider.maximum()).toEqual(39);
        });
        it("Min raise to equal total amount of money left for the other player after flop", async function () {
            const tableModel = getTable();
            const view1 = getTestTableView();
            const actionBlock = new ActionBlock();
            actionBlock.attach(view1);
            await simpleInitialization(view1, 1, [400, 29]);
            expect(view1.myPlayer() != null).toBeTruthy();
            // blinds
            log("Blinds round started");
            view1.onBet(1, 0, 10, 2);
            view1.onBet(2, 0, 20, 1);
            view1.onPlayerCards(1, [1, 2]);
            // preflop
            log("Preflop round started");
            view1.onBet(1, 2, 20, 2);
            view1.onBet(2, 2, 20, 1);
            view1.executeMoveMoneyToPot([40]);
            view1.onOpenCards([3, 4, 5]);
            await drainQueue(view1.queue);

            expect(actionBlock.couldRaise()).toEqual(true);
            expect(view1.maxAmountOfMoneyForOtherActivePlayers()).toEqual(9);
            expect(actionBlock.tableSlider.minimum()).toEqual(9);
            expect(actionBlock.tableSlider.maximum()).toEqual(9);
        });

        it("Sitout player which still in game should be accounted", async function () {
            const tableModel = getTable();
            const view1 = getTestTableView();
            const actionBlock = view1.actionBlock;
            await simpleInitialization(view1, 1, [1128, 4855], 2);
            // blinds
            log("Blinds round started");
            view1.onBet(2, 0, 10, 1);
            view1.onBet(1, 0, 20, 2);
            view1.onPlayerCards(1, [1, 2]);
            // preflop
            log("Preflop round started");
            view1.onPlayerStatus(2, 17);
            view1.onBet(2, 2, 20, 1);
            await drainQueue(view1.queue);
            expect(actionBlock.couldRaise()).toEqual(true);
        });

        it("1 helper button should be correct", async function () {
            const tableModel = getTable();
            const view1 = getTestTableView();
            const actionBlock = view1.actionBlock;
            await simpleInitialization(view1, 1, [400, 200]);
            expect(view1.myPlayer() != null).toBeTruthy();
            loginId(1);
            // blinds
            log("Blinds round started");
            view1.onBet(1, 0, 10, 2);
            view1.onBet(2, 0, 20, 1);
            view1.onPlayerCards(1, [1, 2]);
            await drainQueue(view1.queue);
            // preflop
            log("Preflop round started");
            expect(actionBlock.button1Amount()).toEqual(80);
        });

        it("Game №3253513", async function () {
            const tableModel = getTable();
            const view1 = getTestTableView();
            const actionBlock = view1.actionBlock;
            await simpleInitialization(view1, 1, [4288, 138981]);
            expect(view1.myPlayer() != null).toBeTruthy();
            loginId(1);
            // blinds
            log("Blinds round started");
            view1.onBet(1, 0, 10, 2);
            view1.onBet(2, 0, 20, 1);
            view1.onPlayerCards(1, [1, 2]);
            // preflop
            log("Preflop round started");
            view1.onBet(1, 3, 40, 2);
            view1.onBet(2, 2, 40, 2);
            view1.onMoveMoneyToPot([40]);
            view1.onOpenCards([3, 4, 5]);
            log("Flop round started");
            view1.onBet(2, 2, 0, 1);
            view1.onBet(1, 3, 60, 2);
            view1.onBet(2, 2, 60, 2);
            view1.onMoveMoneyToPot([160]);
            view1.onOpenCards([3, 4, 5, 6]);
            log("Turn round started");
            view1.onBet(2, 2, 0, 1);
            await drainQueue(view1.queue);
            expect(actionBlock.couldRaise()).toEqual(true);
        });

        it("Receiving sitout state does not affect calculations", async function () {
            const tableModel = getTable();
            const view1 = getTestTableView();
            const actionBlock = view1.actionBlock;
            await simpleInitialization(view1, 1, [4288, 138981], 2);
            expect(view1.myPlayer() != null).toBeTruthy();
            loginId(1);
            // blinds
            log("Blinds round started");
            view1.onBet(2, 0, 10, 1);
            view1.onBet(1, 0, 20, 2);
            view1.onPlayerCards(1, [1, 2]);
            await drainQueue(view1.queue);
            // preflop
            log("Preflop round started");
            const place1 = view1.tablePlaces.getPlaceByPlayerId(1);
            expect(place1.IsInGameStatus()).toEqual(true);
            log("Game status ok");
            view1.onPlayerStatus(1, 1);
            await drainQueue(view1.queue);
            expect(place1.IsInGameStatus()).toEqual(true);
        });

        it("Allin after opening cards should display correct additional buttons amount", async function () {
            const tableModel = getTable();
            const view1 = getTestTableView();
            const actionBlock = view1.actionBlock;
            await simpleInitialization(view1, 1, [4288, 138981]);
            expect(view1.myPlayer() != null).toBeTruthy();
            loginId(1);
            // blinds
            log("Blinds round started");
            view1.onBet(1, 0, 10, 2);
            view1.onBet(2, 0, 20, 1);
            view1.onPlayerCards(1, [1, 2]);
            // preflop
            log("Preflop round started");
            view1.onBet(1, 2, 20, 2);
            view1.onBet(2, 2, 20, 1);
            view1.executeMoveMoneyToPot([40]);
            view1.onOpenCards([3, 4, 5]);
            await drainQueue(view1.queue);
            expect(view1.actionBlock.button3Amount())
                .toEqual(view1.actionBlock.tableSlider.maximum());
            expect(view1.actionBlock.button3Amount())
                .toEqual(4268);
        });
    });
});
