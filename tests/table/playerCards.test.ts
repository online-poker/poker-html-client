import { appConfig, overrideConfiguration } from "poker/appconfig";
import {
    login,
    loginId,
} from "poker/authmanager";
import { ActionBlock } from "poker/table/actionBlock";
import { drainQueue, getTable, getTestTableView, simpleInitialization } from "./helper";

const logEnabled = false;
const log = function (message: string, ...params: any[]) {
    if (logEnabled) {
        console.log(message);
    }
};

async function playUntilFlop(playerId: number) {
    const tableModel = getTable();
    const view1 = getTestTableView();
    const actionBlock = view1.actionBlock;
    await simpleInitialization(view1, 1, [4288, 138981]);
    expect(view1.myPlayer() != null).toBeTruthy();
    loginId(playerId);
    view1.currentLogin(`Player${playerId}`);
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
    return view1;
}

describe("Player cards", function () {
    beforeAll(() => {
        global.messages = {
        };
    });
    describe("Overlay cards supported", function () {
        beforeAll(() => {
            overrideConfiguration({
                game: {
                    cardsOverlaySupported: true,
                },
            });
        });

        it("If player not in game current combination does not displayed", async function () {
            const view = await playUntilFlop(3);
            expect(view.myPlayer()).toBeNull();
            expect(view.currentCombinationVisible()).toEqual(false);
        });

        it("If player has overlay opened, combination not visible", async function () {
            const view = await playUntilFlop(1);
            expect(view.myPlayer()).not.toBeNull();
            expect(view.currentCombinationVisible()).toEqual(false);
        });

        it("If player hide overlay, combination is visible", async function () {
            const view = await playUntilFlop(1);
            expect(view.myPlayer()).not.toBeNull();
            view.myPlayer().cardsOverlayVisible(false);
            expect(view.currentCombinationVisible()).toEqual(true);
        });
    });
    describe("Overlay cards not supported", function () {
        beforeAll(() => {
            overrideConfiguration({
                game: {
                    cardsOverlaySupported: false,
                },
            });
        });

        it("If player not in game current combination does not displayed", async function () {
            const view = await playUntilFlop(3);
            expect(view.myPlayer()).toBeNull();
            expect(view.currentCombinationVisible()).toEqual(false);
        });

        it("If player has overlay opened, combination not visible", async function () {
            const view = await playUntilFlop(1);
            expect(view.myPlayer()).not.toBeNull();
            expect(view.currentCombinationVisible()).toEqual(true);
        });

        it("If player hide overlay, combination is visible", async function () {
            const view = await playUntilFlop(1);
            expect(view.myPlayer()).not.toBeNull();
            view.myPlayer().cardsOverlayVisible(false);
            expect(view.currentCombinationVisible()).toEqual(true);
        });
    });
});
