import * as ko from "knockout";
import { authManager } from "poker/authmanager";
import { debugSettings } from "../../js/debugsettings";
import { ActionBlock } from "../../js/table/actionBlock";
import { GameActionsQueue } from "../../js/table/gameactionsqueue";
import {
    TableView,
} from "../../js/table/tableview";
import { drainQueue, getTable, getTestTableView, printTableView, simpleInitialization } from "../table/helper";
import { appConfig } from "poker/appconfig";
import { AddMoneyPopup } from "poker/popups";

const authenticated = authManager.authenticated;
const login = authManager.login;
const loginId = authManager.loginId;

beforeEach(() => {
    authenticated(false);
    loginId(null);
    login(null);
});

describe("advanced bet buttons", function () {
    GameActionsQueue.waitDisabled = true;
    let logEnabled = false;
    const log = function (message: string, ...params: any[]) {
        if (logEnabled) {
            console.log(message);
        }
    };

    beforeEach(function () {
        GameActionsQueue.waitDisabled = true;
        appConfig.ui.advancedBets = true;
        logEnabled = false;
        debugSettings.tableView.trace = false;
        global.messages = {
            table: {
                increaseStep1: "#amount",
                increaseStep2: "#amount",
                increaseStep3: "#amount",
                increaseStep4: "#amount",
                clearAdvancedBetUI: "Clear",
                closeAdvancedBetUI: "Close",
            },
        };
    });

    afterEach(function () {
        GameActionsQueue.waitDisabled = true;
        appConfig.ui.advancedBets = false;
    });
    // Texas holdem by default has no limit games
    describe("No limit games", function () {
        it("after game start", async function () {
            const view1 = getTestTableView();
            view1.currentLogin("Player2");
            const actionBlock = view1.actionBlock;
            await simpleInitialization(view1, 1, [400, 200]);
            login("Player2");
            loginId(2);
            authenticated(true);
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
            expect(view1.actionBlock.advancedModeAllowed()).toEqual(true);
            expect(view1.actionBlock.advancedBetUIOpened()).toEqual(false);
        });
        it("open advanced ui", async function () {
            const view1 = getTestTableView();
            view1.currentLogin("Player2");
            const actionBlock = view1.actionBlock;
            await simpleInitialization(view1, 1, [400, 200]);
            login("Player2");
            loginId(2);
            authenticated(true);
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
            view1.actionBlock.openAdvancedBetUI();
            expect(view1.actionBlock.advancedBetUIOpened()).toEqual(true);
            expect(view1.currentRaise()).toEqual(40);
            expect(view1.actionBlock.tableSlider.currentValue()).toEqual("40");
        });
        it("advanced bet ui closes after bet", async function () {
            const view1 = getTestTableView();
            view1.currentLogin("Player2");
            const actionBlock = view1.actionBlock;
            await simpleInitialization(view1, 1, [400, 200]);
            login("Player2");
            loginId(2);
            authenticated(true);
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
            view1.actionBlock.openAdvancedBetUI();
            expect(view1.actionBlock.advancedBetUIOpened()).toEqual(true);
            view1.onBet(2, 2, 20, 1);
            await drainQueue(view1.queue);
            view1.onBet(1, 2, 20, 2);
            await drainQueue(view1.queue);
            expect(view1.actionBlock.advancedBetUIOpened()).toEqual(false);
        });
        it("close advanced ui", async function () {
            const view1 = getTestTableView();
            view1.currentLogin("Player2");
            const actionBlock = view1.actionBlock;
            await simpleInitialization(view1, 1, [400, 200]);
            login("Player2");
            loginId(2);
            authenticated(true);
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
            view1.actionBlock.openAdvancedBetUI();
            view1.actionBlock.closeAdvancedBetUI();
            expect(view1.actionBlock.advancedBetUIOpened()).toEqual(false);
        });
        it("clear/close advanced ui", async function () {
            const view1 = getTestTableView();
            view1.currentLogin("Player2");
            const actionBlock = view1.actionBlock;
            await simpleInitialization(view1, 1, [400, 200]);
            login("Player2");
            loginId(2);
            authenticated(true);
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
            view1.actionBlock.openAdvancedBetUI();
            expect(view1.actionBlock.advancedBetUIOpened()).toEqual(true);
            view1.actionBlock.closeOrResetBetOrRaise();
            expect(view1.actionBlock.advancedBetUIOpened()).toEqual(false);
        });
        it("clear/close advanced ui after increase", async function () {
            const view1 = getTestTableView();
            view1.currentLogin("Player2");
            const actionBlock = view1.actionBlock;
            await simpleInitialization(view1, 1, [400, 200]);
            login("Player2");
            loginId(2);
            authenticated(true);
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
            view1.actionBlock.openAdvancedBetUI();
            view1.actionBlock.increaseBetOrRaiseScale1();
            view1.actionBlock.closeOrResetBetOrRaise();
            expect(view1.actionBlock.advancedBetUIOpened()).toEqual(true);
            expect(view1.currentRaise()).toEqual(40);
            view1.actionBlock.closeOrResetBetOrRaise();
            expect(view1.actionBlock.advancedBetUIOpened()).toEqual(false);
        });
        it("opening advanced ui closes secondary panel", async function () {
            const view1 = getTestTableView();
            view1.currentLogin("Player2");
            const actionBlock = view1.actionBlock;
            await simpleInitialization(view1, 1, [400, 200]);
            login("Player2");
            loginId(2);
            authenticated(true);
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
            view1.actionBlock.expand();
            view1.actionBlock.openAdvancedBetUI();
            expect(view1.actionBlock.advancedBetUIOpened()).toEqual(true);
            expect(view1.actionBlock.expanded()).toEqual(false);
        });
        it("increase step1", async function () {
            const view1 = getTestTableView();
            view1.currentLogin("Player2");
            const actionBlock = view1.actionBlock;
            await simpleInitialization(view1, 1, [400, 200]);
            login("Player2");
            loginId(2);
            authenticated(true);
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
            view1.actionBlock.openAdvancedBetUI();
            view1.actionBlock.increaseBetOrRaiseScale1();
            expect(view1.minimalBuyIn()).toEqual(10);
            expect(view1.currentRaise()).toEqual(50);
            expect(view1.actionBlock.increaseStep1Caption()).toEqual("10");
        });
        it("increase step2", async function () {
            const view1 = getTestTableView();
            view1.currentLogin("Player2");
            const actionBlock = view1.actionBlock;
            await simpleInitialization(view1, 1, [400, 200]);
            login("Player2");
            loginId(2);
            authenticated(true);
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
            view1.actionBlock.openAdvancedBetUI();
            view1.actionBlock.increaseBetOrRaiseScale2();
            expect(view1.minimalBuyIn()).toEqual(10);
            expect(view1.currentRaise()).toEqual(90);
            expect(view1.actionBlock.increaseStep2Caption()).toEqual("50");
        });
        it("increase step3", async function () {
            const view1 = getTestTableView();
            view1.currentLogin("Player2");
            const actionBlock = view1.actionBlock;
            await simpleInitialization(view1, 1, [400, 200]);
            login("Player2");
            loginId(2);
            authenticated(true);
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
            view1.actionBlock.openAdvancedBetUI();
            view1.actionBlock.increaseBetOrRaiseScale3();
            expect(view1.minimalBuyIn()).toEqual(10);
            expect(view1.currentRaise()).toEqual(140);
            expect(view1.actionBlock.increaseStep3Caption()).toEqual("100");
        });
        it("increase step4", async function () {
            const view1 = getTestTableView();
            view1.currentLogin("Player2");
            const actionBlock = view1.actionBlock;
            await simpleInitialization(view1, 1, [400, 200]);
            login("Player2");
            loginId(2);
            authenticated(true);
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
            view1.actionBlock.openAdvancedBetUI();
            view1.actionBlock.increaseBetOrRaiseScale4();
            expect(view1.minimalBuyIn()).toEqual(10);
            expect(view1.currentRaise()).toEqual(200);
            expect(view1.actionBlock.increaseStep4Caption()).toEqual("500");
        });
        it("allin", async function () {
            const view1 = getTestTableView();
            view1.currentLogin("Player2");
            const actionBlock = view1.actionBlock;
            await simpleInitialization(view1, 1, [400, 200]);
            login("Player2");
            loginId(2);
            authenticated(true);
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
            view1.actionBlock.openAdvancedBetUI();
            view1.actionBlock.setAllIn();
            expect(view1.currentRaise()).toEqual(200);
        });

        
        it("increase multiple bets", async function () {
            const view1 = getTestTableView();
            view1.currentLogin("Player2");
            const actionBlock = view1.actionBlock;
            await simpleInitialization(view1, 1, [400, 200]);
            login("Player2");
            loginId(2);
            authenticated(true);
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
            view1.actionBlock.openAdvancedBetUI();
            view1.actionBlock.increaseBetOrRaiseScale4();
            view1.actionBlock.increaseBetOrRaiseScale4();
            view1.actionBlock.increaseBetOrRaiseScale3();
            view1.actionBlock.increaseBetOrRaiseScale2();
            view1.actionBlock.increaseBetOrRaiseScale4();
            expect(view1.minimalBuyIn()).toEqual(10);
            expect(view1.actionBlock.currrentBetChips())
                .toEqual([{type: 1, amount: 1}, {type: 4, amount: 2}, {type: 3, amount: 1}, {type: 2, amount: 1}, {type: 4, amount: 1}]);
        });
    });
});
