/** global process */
import * as ko from "knockout";
import {
    login,
    loginId,
} from "../../js/authmanager";
import { debugSettings } from "../../js/debugsettings";
import { allBacksClassesFourCards } from "../../js/table/cardsHelper";
import { GameActionsQueue } from "../../js/table/gameactionsqueue";
import {
    TableView,
} from "../../js/table/tableview";
import { drainQueue } from "./helper";

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

describe("Table view", () => {
    describe("No limit", () => {
        beforeAll(() => {
            GameActionsQueue.waitDisabled = true;
            GameActionsQueue.drainQueuePause = 0;
            debugSettings.tableView.trace = false;
        });
        afterAll(() => {
            GameActionsQueue.waitDisabled = false;
            GameActionsQueue.drainQueuePause = 100;
            debugSettings.tableView.trace = false;
        });
        it("Pot limit on preflop", async () => {
            global.messages = {
            };
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
            });
            const players: GamePlayerStartInformation[] = [{
                PlayerId: 1,
                Money: 10000,
            }, {
                PlayerId: 2,
                Money: 10000,
            }, {
                PlayerId: 3,
                Money: 10000,
            }, {
                PlayerId: 4,
                Money: 10000,
            }];
            const actions: GameActionStartInformation[] = [];

            // This use should be same for which test final assertion
            // othervise max raise amount would be calculated incorectly.
            login("player3");
            loginId(3);
            const tableSatusPlayers = [
                getSeatPlayer(1, 10000),
                getSeatPlayer(2, 10000),
                getSeatPlayer(3, 10000),
                getSeatPlayer(4, 10000),
            ];
            tableView.onTableStatusInfo(tableSatusPlayers, [], null, 4, 100, 10, null, null, null, null, null, true, 0, false, true, null, 0, 1);
            tableView.onGameStarted(1, players, actions, 4);
            tableView.onBet(1, 0, 100, 2);
            tableView.onBet(2, 0, 200, 3);
            tableView.onPlayerCards(1, [1, 2]);
            tableView.onPlayerCards(2, [1, 2]);
            tableView.onPlayerCards(3, [1, 2]);
            tableView.onPlayerCards(4, [1, 2]);
            await drainQueue(tableView.queue);

            const currentPlayer = tableView.currentPlayer();
            expect(currentPlayer).not.toBeNull();
            expect(currentPlayer.PlayerId()).toBe(3);
            expect(tableView.minimumRaiseAmount()).toBe(400);
            expect(tableView.maximumRaiseAmount()).toBe(10000);
        });
    });
    describe("Pot limit", () => {
        beforeAll(() => {
            GameActionsQueue.waitDisabled = true;
            GameActionsQueue.drainQueuePause = 0;
            debugSettings.tableView.trace = false;
        });
        afterAll(() => {
            GameActionsQueue.waitDisabled = false;
            GameActionsQueue.drainQueuePause = 100;
        });
        it("Pot limit on preflop", async () => {
            global.messages = {
            };
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
            });
            const players: GamePlayerStartInformation[] = [{
                PlayerId: 1,
                Money: 10000,
            }, {
                PlayerId: 2,
                Money: 10000,
            }, {
                PlayerId: 3,
                Money: 10000,
            }, {
                PlayerId: 4,
                Money: 10000,
            }];
            const actions: GameActionStartInformation[] = [];
            login("player4");
            loginId(4);
            const tableSatusPlayers = [
                getSeatPlayer(1, 10000),
                getSeatPlayer(2, 10000),
                getSeatPlayer(3, 10000),
                getSeatPlayer(4, 10000),
            ];
            tableView.onTableStatusInfo(tableSatusPlayers, [], null, 4, 100, 10, null, null, null, null, null, true, 0, false, true, null, 0, 2);
            tableView.onGameStarted(1, players, actions, 4);
            tableView.onBet(1, 0, 100, 2);
            tableView.onBet(2, 0, 200, 3);
            tableView.onPlayerCards(1, [1, 2]);
            tableView.onPlayerCards(2, [1, 2]);
            tableView.onPlayerCards(3, [1, 2]);
            tableView.onPlayerCards(4, [1, 2]);
            tableView.onBet(3, 2, 200, 4);
            await tableView.queue.waitCurrentTask();
            while (tableView.queue.size() > 0) {
                await tableView.queue.execute();
                await tableView.queue.waitCurrentTask();
            }

            const currentPlayer = tableView.currentPlayer();
            expect(currentPlayer).not.toBeNull();
            expect(currentPlayer.PlayerId()).toBe(4);
            expect(tableView.minimumRaiseAmount()).toBe(400);
            expect(tableView.maximumRaiseAmount()).toBe(900);
        });
        it("Pot limit after raise", async () => {
            global.messages = {
            };
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
            });
            const players: GamePlayerStartInformation[] = [{
                PlayerId: 1,
                Money: 10000,
            }, {
                PlayerId: 2,
                Money: 10000,
            }, {
                PlayerId: 3,
                Money: 10000,
            }, {
                PlayerId: 4,
                Money: 10000,
            }];
            const actions: GameActionStartInformation[] = [];
            login("player4");
            loginId(4);
            const tableSatusPlayers = [
                getSeatPlayer(1, 10000),
                getSeatPlayer(2, 10000),
                getSeatPlayer(3, 10000),
                getSeatPlayer(4, 10000),
            ];
            tableView.onTableStatusInfo(tableSatusPlayers, [], null, 4, 100, 10, null, null, null, null, null, true, 0, false, true, null, 0, 2);
            tableView.onGameStarted(1, players, actions, 4);
            tableView.onBet(1, 0, 100, 2);
            tableView.onBet(2, 0, 200, 3);
            tableView.onPlayerCards(1, [1, 2]);
            tableView.onPlayerCards(2, [1, 2]);
            tableView.onPlayerCards(3, [1, 2]);
            tableView.onPlayerCards(4, [1, 2]);
            tableView.onBet(3, 3, 300, 4);
            await tableView.queue.waitCurrentTask();
            while (tableView.queue.size() > 0) {
                await tableView.queue.execute();
                await tableView.queue.waitCurrentTask();
            }

            const currentPlayer = tableView.currentPlayer();
            expect(currentPlayer).not.toBeNull();
            expect(currentPlayer.PlayerId()).toBe(4);
            expect(tableView.minimumRaiseAmount()).toBe(600);
            expect(tableView.maximumRaiseAmount()).toBe(1200);
        });
        it("Pot limit after raise and call", async () => {
            global.messages = {
            };
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
            });
            const players: GamePlayerStartInformation[] = [{
                PlayerId: 1,
                Money: 10000,
            }, {
                PlayerId: 2,
                Money: 10000,
            }, {
                PlayerId: 3,
                Money: 10000,
            }, {
                PlayerId: 4,
                Money: 10000,
            }];
            const actions: GameActionStartInformation[] = [];
            login("player1");
            loginId(1);
            const tableSatusPlayers = [
                getSeatPlayer(1, 10000),
                getSeatPlayer(2, 10000),
                getSeatPlayer(3, 10000),
                getSeatPlayer(4, 10000),
            ];
            tableView.onTableStatusInfo(tableSatusPlayers, [], null, 4, 100, 10, null, null, null, null, null, true, 0, false, true, null, 0, 2);
            tableView.onGameStarted(1, players, actions, 4);
            tableView.onBet(1, 0, 100, 2);
            tableView.onBet(2, 0, 200, 3);
            tableView.onPlayerCards(1, [1, 2]);
            tableView.onPlayerCards(2, [1, 2]);
            tableView.onPlayerCards(3, [1, 2]);
            tableView.onPlayerCards(4, [1, 2]);
            tableView.onBet(3, 3, 600, 4);
            tableView.onBet(4, 2, 600, 1);
            await tableView.queue.waitCurrentTask();
            while (tableView.queue.size() > 0) {
                await tableView.queue.execute();
                await tableView.queue.waitCurrentTask();
            }

            const currentPlayer = tableView.currentPlayer();
            expect(currentPlayer).not.toBeNull();
            expect(currentPlayer.PlayerId()).toBe(1);

            // This test different from server test, since maximumRasieAmount value does
            // not take into acount current bet which added to that value later.
            // Thus in this test value reduced by current player bet.
            expect(currentPlayer.Bet()).toBe(100);
            expect(tableView.minimumRaiseAmount()).toBe(1200);
            expect(tableView.maximumRaiseAmount()).toBe(2500);
        });
        it("Pot limit after flop", async () => {
            global.messages = {
            };
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
            });
            const players: GamePlayerStartInformation[] = [{
                PlayerId: 1,
                Money: 10000,
            }, {
                PlayerId: 2,
                Money: 10000,
            }, {
                PlayerId: 3,
                Money: 10000,
            }, {
                PlayerId: 4,
                Money: 10000,
            }];
            const actions: GameActionStartInformation[] = [];
            login("player1");
            loginId(1);
            const tableSatusPlayers = [
                getSeatPlayer(1, 10000),
                getSeatPlayer(2, 10000),
                getSeatPlayer(3, 10000),
                getSeatPlayer(4, 10000),
            ];
            tableView.onTableStatusInfo(tableSatusPlayers, [], null, 4, 100, 10, null, null, null, null, null, true, 0, false, true, null, 0, 2);
            tableView.onGameStarted(1, players, actions, 4);
            tableView.onBet(1, 0, 100, 2);
            tableView.onBet(2, 0, 200, 3);
            tableView.onPlayerCards(1, [1, 2]);
            tableView.onPlayerCards(2, [1, 2]);
            tableView.onPlayerCards(3, [1, 2]);
            tableView.onPlayerCards(4, [1, 2]);
            tableView.onBet(3, 2, 200, 4);
            tableView.onBet(4, 2, 200, 1);
            tableView.onBet(1, 2, 200, 2);
            tableView.onBet(2, 2, 200, 0);
            tableView.executeMoveMoneyToPot([800]);
            tableView.onOpenCards([3, 4, 5]);
            // Flop
            tableView.onBet(1, 3, 200, 2);
            tableView.onBet(2, 2, 200, 3);
            tableView.onBet(3, 3, 500, 4);
            tableView.onBet(4, 2, 500, 1);

            await tableView.queue.waitCurrentTask();
            while (tableView.queue.size() > 0) {
                await tableView.queue.execute();
                await tableView.queue.waitCurrentTask();
            }

            const currentPlayer = tableView.currentPlayer();
            expect(currentPlayer).not.toBeNull();
            expect(currentPlayer.PlayerId()).toBe(1);

            // This test different from server test, since maximumRasieAmount value does
            // not take into acount current bet which added to that value later.
            // Thus in this test value reduced by current player bet.
            expect(currentPlayer.Bet()).toBe(200);
            expect(tableView.minimumRaiseAmount()).toBe(1000);
            expect(tableView.maximumRaiseAmount()).toBe(2800);
        });
        it("Cards shown in the game", async () => {
            global.messages = {
            };
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
            });
            login("player1");
            loginId(1);
            tableView.onTableStatusInfo([], null, null, 4, 100, 10, null, null, null, null, null, true, 0, false, true, null, 0, 2);
            tableView.onSit(1, 1, "player1", 10000, "", 1, 1);

            await tableView.queue.waitCurrentTask();
            while (tableView.queue.size() > 0) {
                await tableView.queue.execute();
                await tableView.queue.waitCurrentTask();
            }

            expect(tableView.tablePlaces.place1().BackCards()).toEqual(allBacksClassesFourCards);
        });
        it("Cards shown after save", async () => {
            global.messages = {
            };
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
            });
            login("player1");
            loginId(1);
            const tableSatusPlayers = [
                getSeatPlayer(1, 10000),
                getSeatPlayer(2, 10000),
                getSeatPlayer(3, 10000),
                getSeatPlayer(4, 10000),
            ];
            tableView.onTableStatusInfo(tableSatusPlayers, null, null, 4, 100, 10, null, null, null, null, null, true, 0, false, true, null, 0, 2);

            await tableView.queue.waitCurrentTask();
            while (tableView.queue.size() > 0) {
                await tableView.queue.execute();
                await tableView.queue.waitCurrentTask();
            }

            expect(tableView.tablePlaces.place1().BackCards()).toEqual(allBacksClassesFourCards);
        });

    });
    describe("Hightlight omaha cards every time", () => {
        beforeAll(() => {
            GameActionsQueue.waitDisabled = true;
            GameActionsQueue.drainQueuePause = 0;
            debugSettings.tableView.trace = false;
        });
        afterAll(() => {
            GameActionsQueue.waitDisabled = false;
            GameActionsQueue.drainQueuePause = 100;
        });
        it("Cards Hightlighted should be true", async () => {
            const winner: GameWinnerModel[] = [
                {
                    Amount: 100,
                    Pot: 1,
                    CardsDescription: "",
                    PlayerId: 1,
                },
            ];
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
            });
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
            // Flop
            tableView.executeMoveMoneyToPot([100]);
            tableView.onOpenCards([19, 21, 22]);
            tableView.onBet(1, 2, 0, 2);
            tableView.onBet(2, 2, 0, 1);

            // Turn
            tableView.executeMoveMoneyToPot([0]);
            tableView.onOpenCards([19, 21, 22, 25]);
            tableView.onBet(1, 2, 0, 2);
            tableView.onBet(2, 2, 0, 1);
            // River
            tableView.executeMoveMoneyToPot([0]);
            tableView.onOpenCards([19, 21, 22, 25, 7]);

            tableView.onBet(1, 2, 0, 2);
            tableView.onBet(2, 4, 0, 1);
            tableView.executeMoveMoneyToPot([0]);
            tableView.onOpenCards([19, 21, 22, 25, 7]);
            tableView.onPlayerCards(1, [15, 5, 41, 18]);
            tableView.onGameFinished(1, winner, 0);
            await tableView.queue.waitCurrentTask();
            while (tableView.queue.size() > 0) {
                await tableView.queue.execute();
                await tableView.queue.waitCurrentTask();
            }
            expect(tableView.tablePlaces.place1().CardsHightlighted()).toEqual(true);
            expect(tableView.tablePlaces.place1().Card1Hightlighted()).toEqual(true);
            expect(tableView.tablePlaces.place1().Card2Hightlighted()).toEqual(false);
            expect(tableView.tablePlaces.place1().Card3Hightlighted()).toEqual(false);
            expect(tableView.tablePlaces.place1().Card4Hightlighted()).toEqual(true);
        });
    });
    describe("Verify game event notifications", () => {
        beforeAll(() => {
            GameActionsQueue.waitDisabled = true;
            GameActionsQueue.drainQueuePause = 0;
            debugSettings.tableView.trace = false;
        });
        afterAll(() => {
            GameActionsQueue.waitDisabled = false;
            GameActionsQueue.drainQueuePause = 100;
        });
        it("Verify preflop", async () => {
            const winner: GameWinnerModel[] = [
                {
                    Amount: 100,
                    Pot: 1,
                    CardsDescription: "",
                    PlayerId: 1,
                },
            ];
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
            });
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
            let preflopCounter = 0;
            let flopCounter = 0;
            let turnCounter = 0;
            let riverCounter = 0;

            tableView.onPlayerCardsDealed.add(() => { preflopCounter = preflopCounter + 1; }, this);
            tableView.onFlopDealed.add(() => { flopCounter = flopCounter + 1; }, this);
            tableView.onTurnDealed.add(() => { turnCounter = turnCounter + 1; }, this);
            tableView.onRiverDealed.add(() => { riverCounter = riverCounter + 1; }, this);

            tableView.onTableStatusInfo(tableSatusPlayers, [], null, 4, 100, 10, null, null, null, null, 1, true, 0, false, true, null, 0, 2);
            tableView.onGameStarted(1, players, actions, 4);
            tableView.onBet(2, 0, 100, 1);
            tableView.onBet(1, 0, 200, 2);
            tableView.onPlayerCards(1, [15, 5, 41, 18]);
            tableView.onPlayerCards(2, [1, 2, 3, 4]);
            tableView.onBet(2, 2, 50, 1);
            tableView.onBet(1, 2, 50, 1);
            await tableView.queue.waitCurrentTask();
            while (tableView.queue.size() > 0) {
                await tableView.queue.execute();
                await tableView.queue.waitCurrentTask();
            }
            expect(preflopCounter).toEqual(1);
            expect(flopCounter).toEqual(0);
            expect(turnCounter).toEqual(0);
            expect(riverCounter).toEqual(0);
        });
        it("Verify flop", async () => {
            const winner: GameWinnerModel[] = [
                {
                    Amount: 100,
                    Pot: 1,
                    CardsDescription: "",
                    PlayerId: 1,
                },
            ];
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
            });
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

            let preflopCounter = 0;
            let flopCounter = 0;
            let turnCounter = 0;
            let riverCounter = 0;

            tableView.onPlayerCardsDealed.add(() => { preflopCounter = preflopCounter + 1; }, this);
            tableView.onFlopDealed.add(() => { flopCounter = flopCounter + 1; }, this);
            tableView.onTurnDealed.add(() => { turnCounter = turnCounter + 1; }, this);
            tableView.onRiverDealed.add(() => { riverCounter = riverCounter + 1; }, this);

            tableView.onTableStatusInfo(tableSatusPlayers, [], null, 4, 100, 10, null, null, null, null, 1, true, 0, false, true, null, 0, 2);
            tableView.onGameStarted(1, players, actions, 4);
            tableView.onBet(2, 0, 100, 1);
            tableView.onBet(1, 0, 200, 2);
            tableView.onPlayerCards(1, [15, 5, 41, 18]);
            tableView.onPlayerCards(2, [1, 2, 3, 4]);
            tableView.onBet(2, 2, 50, 1);
            tableView.onBet(1, 2, 50, 1);

            tableView.executeMoveMoneyToPot([100]);
            tableView.onOpenCards([19, 21, 22]);
            tableView.onBet(1, 2, 0, 2);
            tableView.onBet(2, 2, 0, 1);
            await tableView.queue.waitCurrentTask();
            while (tableView.queue.size() > 0) {
                await tableView.queue.execute();
                await tableView.queue.waitCurrentTask();
            }
            expect(preflopCounter).toEqual(1);
            expect(flopCounter).toEqual(1);
            expect(turnCounter).toEqual(0);
            expect(riverCounter).toEqual(0);
        });
        it("Verify turn", async () => {
            const winner: GameWinnerModel[] = [
                {
                    Amount: 100,
                    Pot: 1,
                    CardsDescription: "",
                    PlayerId: 1,
                },
            ];
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
            });
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
            let preflopCounter = 0;
            let flopCounter = 0;
            let turnCounter = 0;
            let riverCounter = 0;

            tableView.onPlayerCardsDealed.add(() => { preflopCounter = preflopCounter + 1; }, this);
            tableView.onFlopDealed.add(() => { flopCounter = flopCounter + 1; }, this);
            tableView.onTurnDealed.add(() => { turnCounter = turnCounter + 1; }, this);
            tableView.onRiverDealed.add(() => { riverCounter = riverCounter + 1; }, this);

            tableView.onTableStatusInfo(tableSatusPlayers, [], null, 4, 100, 10, null, null, null, null, 1, true, 0, false, true, null, 0, 2);
            tableView.onGameStarted(1, players, actions, 4);
            tableView.onBet(2, 0, 100, 1);
            tableView.onBet(1, 0, 200, 2);
            tableView.onPlayerCards(1, [15, 5, 41, 18]);
            tableView.onPlayerCards(2, [1, 2, 3, 4]);
            tableView.onBet(2, 2, 50, 1);
            tableView.onBet(1, 2, 50, 1);

            tableView.executeMoveMoneyToPot([100]);
            tableView.onOpenCards([19, 21, 22]);
            tableView.onBet(1, 2, 0, 2);
            tableView.onBet(2, 2, 0, 1);

            // Turn
            tableView.executeMoveMoneyToPot([0]);
            tableView.onOpenCards([19, 21, 22, 25]);
            tableView.onBet(1, 2, 0, 2);
            tableView.onBet(2, 2, 0, 1);
            await tableView.queue.waitCurrentTask();
            while (tableView.queue.size() > 0) {
                await tableView.queue.execute();
                await tableView.queue.waitCurrentTask();
            }
            expect(preflopCounter).toEqual(1);
            expect(flopCounter).toEqual(1);
            expect(turnCounter).toEqual(1);
            expect(riverCounter).toEqual(0);
        });
        it("Verify river", async () => {
            const winner: GameWinnerModel[] = [
                {
                    Amount: 100,
                    Pot: 1,
                    CardsDescription: "",
                    PlayerId: 1,
                },
            ];
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
            });
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
            let preflopCounter = 0;
            let flopCounter = 0;
            let turnCounter = 0;
            let riverCounter = 0;

            tableView.onPlayerCardsDealed.add(() => { preflopCounter = preflopCounter + 1; }, this);
            tableView.onFlopDealed.add(() => { flopCounter = flopCounter + 1; }, this);
            tableView.onTurnDealed.add(() => { turnCounter = turnCounter + 1; }, this);
            tableView.onRiverDealed.add(() => { riverCounter = riverCounter + 1; }, this);

            tableView.onTableStatusInfo(tableSatusPlayers, [], null, 4, 100, 10, null, null, null, null, 1, true, 0, false, true, null, 0, 2);
            tableView.onGameStarted(1, players, actions, 4);
            tableView.onBet(2, 0, 100, 1);
            tableView.onBet(1, 0, 200, 2);
            tableView.onPlayerCards(1, [15, 5, 41, 18]);
            tableView.onPlayerCards(2, [1, 2, 3, 4]);
            tableView.onBet(2, 2, 50, 1);
            tableView.onBet(1, 2, 50, 1);

            tableView.executeMoveMoneyToPot([100]);
            tableView.onOpenCards([19, 21, 22]);
            tableView.onBet(1, 2, 0, 2);
            tableView.onBet(2, 2, 0, 1);

            // Turn
            tableView.executeMoveMoneyToPot([0]);
            tableView.onOpenCards([19, 21, 22, 25]);
            tableView.onBet(1, 2, 0, 2);
            tableView.onBet(2, 2, 0, 1);
            // River
            tableView.executeMoveMoneyToPot([0]);
            tableView.onOpenCards([19, 21, 22, 25, 7]);
            await tableView.queue.waitCurrentTask();
            while (tableView.queue.size() > 0) {
                await tableView.queue.execute();
                await tableView.queue.waitCurrentTask();
            }
            expect(preflopCounter).toEqual(1);
            expect(flopCounter).toEqual(1);
            expect(turnCounter).toEqual(1);
            expect(riverCounter).toEqual(1);
        });
        it("Verify all in", async () => {
            const winner: GameWinnerModel[] = [
                {
                    Amount: 100,
                    Pot: 1,
                    CardsDescription: "",
                    PlayerId: 1,
                },
            ];
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
            });
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
            let preflopCounter = 0;
            let flopCounter = 0;
            let turnCounter = 0;
            let riverCounter = 0;

            tableView.onPlayerCardsDealed.add(() => { preflopCounter = preflopCounter + 1; }, this);
            tableView.onFlopDealed.add(() => { flopCounter = flopCounter + 1; }, this);
            tableView.onTurnDealed.add(() => { turnCounter = turnCounter + 1; }, this);
            tableView.onRiverDealed.add(() => { riverCounter = riverCounter + 1; }, this);

            tableView.onTableStatusInfo(tableSatusPlayers, [], null, 4, 100, 10, null, null, null, null, 1, true, 0, false, true, null, 0, 2);
            tableView.onGameStarted(1, players, actions, 4);
            tableView.onBet(2, 0, 100, 1);
            tableView.onBet(1, 0, 200, 2);
            tableView.onPlayerCards(1, [15, 5, 41, 18]);
            tableView.onPlayerCards(2, [1, 2, 3, 4]);
            tableView.onBet(2, 2, 50, 1);
            tableView.onBet(1, 2, 9800, 1);

            tableView.executeMoveMoneyToPot([100]);
            tableView.onOpenCards([19, 21, 22, 25, 7]);

            await tableView.queue.waitCurrentTask();
            while (tableView.queue.size() > 0) {
                await tableView.queue.execute();
                await tableView.queue.waitCurrentTask();
            }
            expect(preflopCounter).toEqual(1);
            expect(flopCounter).toEqual(0);
            expect(turnCounter).toEqual(0);
            expect(riverCounter).toEqual(0);
        });
    });
    describe("Messages", () => {
        it("Receive admin message", function() {
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
            });
            const d = new Date(2017, 12, 25, 21, 56, 10);
            tableView.addMessage(1, d, "admin", "Test message");
            expect(tableView.messages().length).toEqual(1);
            expect(tableView.messages()[0].fullMessage()).toEqual("[21:56]admin - Test message");
            expect(tableView.messages()[0].isAdmin).toEqual(true);
        });
        it("Receive regular message", function() {
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
            });
            const d = new Date(2017, 12, 25, 21, 56, 10);
            tableView.addMessage(1, d, "Humpfy Dumpfy", "sat on a wall");
            expect(tableView.messages().length).toEqual(1);
            expect(tableView.messages()[0].fullMessage()).toEqual("[21:56]Humpfy Dumpfy - sat on a wall");
            expect(tableView.messages()[0].isAdmin).toEqual(false);
        });
        it("Testing messages limit", function() {
            TableView.MaxMessagesCount = 10;
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
            });
            const d = new Date(2017, 12, 25, 21, 56, 10);
            tableView.addMessage(1, d, "admin", "Test message 1");
            tableView.addMessage(2, d, "admin", "Test message 2");
            tableView.addMessage(3, d, "admin", "Test message 3");
            tableView.addMessage(4, d, "admin", "Test message 4");
            tableView.addMessage(5, d, "admin", "Test message 5");
            tableView.addMessage(6, d, "admin", "Test message 6");
            tableView.addMessage(7, d, "admin", "Test message 7");
            tableView.addMessage(8, d, "admin", "Test message 8");
            tableView.addMessage(9, d, "admin", "Test message 9");
            tableView.addMessage(10, d, "admin", "Test message 10");
            tableView.addMessage(11, d, "admin", "Test message 11");
            expect(tableView.messages().length).toEqual(10);
            expect(tableView.messages()[0].fullMessage()).toEqual("[21:56]admin - Test message 11");
        });
        it("Receive system message", function() {
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
            });
            const d = new Date(2017, 12, 25, 21, 56, 10);
            tableView.addSystemMessage(2, "Cover you bases!");
            expect(tableView.systemMessages().length).toEqual(1);
            expect(tableView.systemMessages()[0].message()).toEqual("Cover you bases!");
        });
    });
});
