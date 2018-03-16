import { appConfig, overrideConfiguration } from "poker/appconfig";
import {
    login,
    loginId,
} from "poker/authmanager";
import { ActionBlock } from "poker/table/actionBlock";
import { drainQueue, getTable, getTestTableView, simpleInitialization, noopApiProvider } from "./helper";
import { TableView } from "../../js/table/tableview";

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

function getSeatPlayer(seat: number, initialAmount: number): PlayerStatusInfo {
    return {
        Seat: seat,
        Bet: 0,
        Cards: "",
        Money: initialAmount,
        PlayerId: seat,
        PlayerName: "player" + seat,
        PlayerUrl: "",
        Points: 0,
        Stars: 0,
        Status: 0,
    };
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

    describe("Overlay for current user", function () {
        it("Overlay is needed only by current user", function () {
            const tableView = new TableView(1, {
                TableId: 1,
                TableName: "",
                BigBlind: 200,
                SmallBlind: 100,
                CurrencyId: 1,
                HandsPerHour: 0,
                AveragePotSize: 0,
                JoinedPlayers: 2,
                MaxPlayers: 8,
                PotLimitType: 2,
            }, noopApiProvider);
            const players: GamePlayerStartInformation[] = [{
                PlayerId: 1,
                Money: 10000,
            }, {
                PlayerId: 2,
                Money: 10000,
            }];
            const actions: GameActionStartInformation[] = [];
            login("player1");
            loginId(1);
            const tableSatusPlayers = [
                getSeatPlayer(1, 10000),
                getSeatPlayer(2, 10000),
            ];
            tableView.onTableStatusInfo(tableSatusPlayers, [], null, 4, 100, 10, null, null, null, null, 1, true, 0, false, true, null, 0, 2);
            tableView.onGameStarted(1, players, actions, 4);
            tableView.onBet(2, 0, 100, 1);
            tableView.onBet(1, 0, 200, 2);
            tableView.onPlayerCards(1, [15, 5, 41, 18]);
            tableView.onPlayerCards(2, [1, 2, 3, 4]);
            tableView.onBet(2, 2, 50, 1);
            tableView.onBet(1, 2, 50, 1);

            if (tableView.myPlayer().PlayerName() === login()) {
                expect(tableView.myPlayer().needCardsOverlay()).toEqual(true);
            } else {
                expect(tableView.myPlayer().needCardsOverlay()).toEqual(false);
            }

        });
    });
});
