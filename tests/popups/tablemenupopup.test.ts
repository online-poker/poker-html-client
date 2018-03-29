import { Account, PersonalAccountData, TournamentOptionsEnum } from "@poker/api-server";
import { ICommandExecutor } from "poker/commandmanager";
import { debugSettings } from "poker/debugsettings";
import { TableMenuPopup } from "poker/popups";
import { IAccountManager } from "poker/services/accountManager";
import { notAuthenticated } from "tests/authHelper";
import { getTestTableView, getTestTournamentTableView, simpleInitialization } from "tests/table/helper";

const defaultPersonalAccountData = {
    RealMoney: 0,
    RealMoneyReserve: 0,
    GameMoney: 0,
    GameMoneyReserve: 0,
    Points: 0,
    LastIncomeDate: "",
    LastIncomeAmount: 0,
    LastRequestNumber: 0,
};
const dummyCommandExecutor: ICommandExecutor = {
    executeCommand: (name, args) => {
        // do nothing.
    },
};

function getAccount(baseData?: Partial<PersonalAccountData>) {
    const data: ApiResult<PersonalAccountData> = {
        Status: "Ok",
        Data: Object.assign({}, defaultPersonalAccountData, baseData || {}),
    };
    return Promise.resolve(data);
}

function getAccountManager(): IAccountManager {
    return {
        getAccount,
    };
}

describe("Table menu", function () {
    beforeAll(() => {
        global.messages = {
        };
        debugSettings.tableView.trace = false;
    });
    describe("rebuy button", function () {
        it("rebuy button don't visible for the regular table", async function () {
            const view = getTestTableView();
            await simpleInitialization(view, 1, [400, 200]);
            view.currentLogin("Player1");
            const currentTablePovider = {
                currentTable: () => view,
            };
            const accountManager = getAccountManager();
            const tableMenuPopup = new TableMenuPopup(currentTablePovider, dummyCommandExecutor, accountManager, notAuthenticated);
            await tableMenuPopup.shown();
            expect(tableMenuPopup.rebuyAllowed()).toEqual(false);
        });
        it("rebuy button don't visible when player does not sit on table", async function () {
            const view = getTestTableView();
            await simpleInitialization(view, 1, [400, 200]);
            view.currentLogin("Player3");
            const currentTablePovider = {
                currentTable: () => view,
            };
            const accountManager = getAccountManager();
            const tableMenuPopup = new TableMenuPopup(currentTablePovider, dummyCommandExecutor, accountManager, notAuthenticated);
            await tableMenuPopup.shown();
            expect(tableMenuPopup.rebuyAllowed()).toEqual(false);
        });
        it("rebuy button don't visible if tournament does not support rebuy", async function () {
            const view = getTestTournamentTableView({
                IsRebuyAllowed: false,
            });
            await simpleInitialization(view, 1, [400, 200]);
            view.currentLogin("Player1");
            const currentTablePovider = {
                currentTable: () => view,
            };
            const accountManager = getAccountManager();
            const tableMenuPopup = new TableMenuPopup(currentTablePovider, dummyCommandExecutor, accountManager, notAuthenticated);
            await tableMenuPopup.shown();
            expect(tableMenuPopup.isRebuyCurrentlyAllowed()).toEqual(false);
            expect(tableMenuPopup.isSufficientMoneyForRebuy()).toEqual(false);
            expect(tableMenuPopup.rebuyAllowed()).toEqual(false);
        });
        it("rebuy button don't visible if tournament does support rebuy, but table is not yet opened", async function () {
            const view = getTestTournamentTableView({
                IsRebuyAllowed: true,
                Options: TournamentOptionsEnum.HasRebuy,
            });
            await simpleInitialization(view, 1, [400, 200]);
            view.currentLogin("Player1");
            view.opened(false);
            const currentTablePovider = {
                currentTable: () => view,
            };
            const accountManager = getAccountManager();
            const tableMenuPopup = new TableMenuPopup(currentTablePovider, dummyCommandExecutor, accountManager, notAuthenticated);
            await tableMenuPopup.shown();
            expect(tableMenuPopup.isRebuyCurrentlyAllowed()).toEqual(false);
            expect(tableMenuPopup.isSufficientMoneyForRebuy()).toEqual(false);
            expect(tableMenuPopup.rebuyAllowed()).toEqual(false);
        });
        it("rebuy button initially visible if tournament support rebuy and player has less then max amount in the game", async function () {
            const view = getTestTournamentTableView({
                IsRebuyAllowed: true,
                Options: TournamentOptionsEnum.HasRebuy,
                MaximumAmountForRebuy: 1000,
            });
            await simpleInitialization(view, 1, [400, 200]);
            view.currentLogin("Player1");
            view.myPlayer().TotalBet(500);
            view.myPlayer().Money(100);
            view.tournament().addonCount(0);
            view.opened(true);
            const currentTablePovider = {
                currentTable: () => view,
            };
            let isGetAccountCalled = false;
            const accountManager = {
                getAccount: async () => {
                    isGetAccountCalled = true;
                    expect(tableMenuPopup.isRebuyCurrentlyAllowed()).toEqual(true);
                    expect(tableMenuPopup.isSufficientMoneyForRebuy()).toEqual(true);
                    expect(tableMenuPopup.rebuyAllowed()).toEqual(true);
                    return await getAccount();
                },
            };
            const tableMenuPopup = new TableMenuPopup(currentTablePovider, dummyCommandExecutor, accountManager, notAuthenticated);
            await tableMenuPopup.shown();
            expect(isGetAccountCalled).toBeTruthy();
        });
        it("rebuy button don't visible if player has no money to bought it", async function () {
            const view = getTestTournamentTableView({
                IsRebuyAllowed: true,
                Options: TournamentOptionsEnum.HasRebuy,
                RebuyFee: 1000,
                RebuyPrice: 0,
            });
            await simpleInitialization(view, 1, [400, 200]);
            view.currentLogin("Player1");
            view.myPlayer().TotalBet(0);
            view.myPlayer().Money(0);
            view.opened(true);
            const currentTablePovider = {
                currentTable: () => view,
            };
            let isGetAccountCalled = false;
            const accountManager = {
                getAccount: async () => {
                    isGetAccountCalled = true;
                    expect(tableMenuPopup.rebuyAllowed()).toEqual(true);
                    const account = await getAccount({
                        RealMoney: 900,
                        GameMoney: 900,
                    });
                    return account;
                },
            };
            const tableMenuPopup = new TableMenuPopup(currentTablePovider, dummyCommandExecutor, accountManager, notAuthenticated);
            await tableMenuPopup.shown();
            expect(isGetAccountCalled).toBeTruthy();
            expect(tableMenuPopup.isRebuyCurrentlyAllowed()).toEqual(true);
            expect(tableMenuPopup.isSufficientMoneyForRebuy()).toEqual(false);
            expect(tableMenuPopup.rebuyAllowed()).toEqual(false);
        });
        it("rebuy button visible if player has money to bought it", async function () {
            const view = getTestTournamentTableView({
                IsRebuyAllowed: true,
                Options: TournamentOptionsEnum.HasRebuy,
                RebuyFee: 1000,
                RebuyPrice: 0,
            });
            await simpleInitialization(view, 1, [400, 200]);
            view.currentLogin("Player1");
            view.myPlayer().TotalBet(0);
            view.myPlayer().Money(0);
            view.opened(true);
            const currentTablePovider = {
                currentTable: () => view,
            };
            let isGetAccountCalled = false;
            const accountManager = {
                getAccount: async () => {
                    isGetAccountCalled = true;
                    expect(tableMenuPopup.rebuyAllowed()).toEqual(true);
                    return await getAccount({
                        RealMoney: 10000,
                        GameMoney: 10000,
                    });
                },
            };
            const tableMenuPopup = new TableMenuPopup(currentTablePovider, dummyCommandExecutor, accountManager, notAuthenticated);
            await tableMenuPopup.shown();
            expect(tableMenuPopup.isRebuyCurrentlyAllowed()).toEqual(true);
            expect(tableMenuPopup.isSufficientMoneyForRebuy()).toEqual(true);
            expect(tableMenuPopup.rebuyAllowed()).toEqual(true);
        });
        it("rebuy button visible if player has just as much money as he need to buy it", async function () {
            const view = getTestTournamentTableView({
                IsRebuyAllowed: true,
                Options: TournamentOptionsEnum.HasRebuy,
                RebuyFee: 1000,
                RebuyPrice: 0,
            });
            await simpleInitialization(view, 1, [400, 200]);
            view.currentLogin("Player1");
            view.myPlayer().TotalBet(0);
            view.myPlayer().Money(0);
            view.opened(true);
            const currentTablePovider = {
                currentTable: () => view,
            };
            let isGetAccountCalled = false;
            const accountManager = {
                getAccount: async () => {
                    isGetAccountCalled = true;
                    expect(tableMenuPopup.rebuyAllowed()).toEqual(true);
                    return await getAccount({
                        RealMoney: 1000,
                        GameMoney: 0,
                    });
                },
            };
            const tableMenuPopup = new TableMenuPopup(currentTablePovider, dummyCommandExecutor, accountManager);
            await tableMenuPopup.shown();
            expect(tableMenuPopup.isRebuyCurrentlyAllowed()).toEqual(true);
            expect(tableMenuPopup.isSufficientMoneyForRebuy()).toEqual(true);
            expect(tableMenuPopup.rebuyAllowed()).toEqual(true);
        });
    });
    describe("double rebuy button", function () {
        it("double rebuy button don't visible for the regular table", async function () {
            const view = getTestTableView();
            await simpleInitialization(view, 1, [400, 200]);
            view.currentLogin("Player1");
            const currentTablePovider = {
                currentTable: () => view,
            };
            const accountManager = getAccountManager();
            const tableMenuPopup = new TableMenuPopup(currentTablePovider, dummyCommandExecutor, accountManager, notAuthenticated);
            await tableMenuPopup.shown();
            expect(tableMenuPopup.isDoubleRebuyCurrentlyAllowed()).toEqual(false);
            expect(tableMenuPopup.isSufficientMoneyForDoubleRebuy()).toEqual(false);
            expect(tableMenuPopup.doublerebuyAllowed()).toEqual(false);
        });
        it("double rebuy button don't visible when player does not sit on table", async function () {
            const view = getTestTableView();
            await simpleInitialization(view, 1, [400, 200]);
            view.currentLogin("Player3");
            const currentTablePovider = {
                currentTable: () => view,
            };
            const accountManager = getAccountManager();
            const tableMenuPopup = new TableMenuPopup(currentTablePovider, dummyCommandExecutor, accountManager, notAuthenticated);
            await tableMenuPopup.shown();
            expect(tableMenuPopup.isDoubleRebuyCurrentlyAllowed()).toEqual(false);
            expect(tableMenuPopup.isSufficientMoneyForDoubleRebuy()).toEqual(false);
            expect(tableMenuPopup.doublerebuyAllowed()).toEqual(false);
        });
        it("double rebuy button don't visible if tournament does not support rebuy", async function () {
            const view = getTestTournamentTableView({
                IsRebuyAllowed: false,
            });
            await simpleInitialization(view, 1, [400, 200]);
            view.currentLogin("Player1");
            const currentTablePovider = {
                currentTable: () => view,
            };
            const accountManager = getAccountManager();
            const tableMenuPopup = new TableMenuPopup(currentTablePovider, dummyCommandExecutor, accountManager, notAuthenticated);
            await tableMenuPopup.shown();
            expect(tableMenuPopup.isDoubleRebuyCurrentlyAllowed()).toEqual(false);
            expect(tableMenuPopup.isSufficientMoneyForDoubleRebuy()).toEqual(false);
            expect(tableMenuPopup.doublerebuyAllowed()).toEqual(false);
        });
        it("double rebuy button don't visible if tournament does support rebuy, but table is not yet opened", async function () {
            const view = getTestTournamentTableView({
                IsRebuyAllowed: true,
                Options: TournamentOptionsEnum.HasRebuy,
            });
            await simpleInitialization(view, 1, [400, 200]);
            view.currentLogin("Player1");
            view.opened(false);
            const currentTablePovider = {
                currentTable: () => view,
            };
            const accountManager = getAccountManager();
            const tableMenuPopup = new TableMenuPopup(currentTablePovider, dummyCommandExecutor, accountManager, notAuthenticated);
            await tableMenuPopup.shown();
            expect(tableMenuPopup.isDoubleRebuyCurrentlyAllowed()).toEqual(false);
            expect(tableMenuPopup.isSufficientMoneyForDoubleRebuy()).toEqual(false);
            expect(tableMenuPopup.doublerebuyAllowed()).toEqual(false);
        });
        it("double rebuy button don't visible if tournament does support rebuy, but table is not yet opened", async function () {
            const view = getTestTournamentTableView({
                IsRebuyAllowed: true,
                Options: TournamentOptionsEnum.HasRebuy,
            });
            await simpleInitialization(view, 1, [400, 200]);
            view.currentLogin("Player1");
            view.opened(false);
            const currentTablePovider = {
                currentTable: () => view,
            };
            const accountManager = getAccountManager();
            const tableMenuPopup = new TableMenuPopup(currentTablePovider, dummyCommandExecutor, accountManager, notAuthenticated);
            await tableMenuPopup.shown();
            expect(tableMenuPopup.isDoubleRebuyCurrentlyAllowed()).toEqual(false);
            expect(tableMenuPopup.isSufficientMoneyForDoubleRebuy()).toEqual(false);
            expect(tableMenuPopup.doublerebuyAllowed()).toEqual(false);
        });
        it("double rebuy button initially visible if tournament support rebuy and player has 0 in game", async function () {
            const view = getTestTournamentTableView({
                IsRebuyAllowed: true,
                Options: TournamentOptionsEnum.HasRebuy,
            });
            await simpleInitialization(view, 1, [400, 200]);
            view.currentLogin("Player1");
            view.myPlayer().TotalBet(0);
            view.myPlayer().Money(0);
            view.tournament().addonCount(0);
            view.opened(true);
            const currentTablePovider = {
                currentTable: () => view,
            };
            let isGetAccountCalled = false;
            const accountManager = {
                getAccount: async () => {
                    isGetAccountCalled = true;
                    expect(tableMenuPopup.isDoubleRebuyCurrentlyAllowed()).toEqual(true);
                    expect(tableMenuPopup.isSufficientMoneyForDoubleRebuy()).toEqual(true);
                    expect(tableMenuPopup.doublerebuyAllowed()).toEqual(true);
                    return await getAccount();
                },
            };
            const tableMenuPopup = new TableMenuPopup(currentTablePovider, dummyCommandExecutor, accountManager, notAuthenticated);
            await tableMenuPopup.shown();
            expect(isGetAccountCalled).toBeTruthy();
        });
        it("double rebuy button don't visible if player has no money to bought it", async function () {
            const view = getTestTournamentTableView({
                IsRebuyAllowed: true,
                Options: TournamentOptionsEnum.HasRebuy,
                RebuyFee: 1000,
                RebuyPrice: 0,
            });
            await simpleInitialization(view, 1, [400, 200]);
            view.currentLogin("Player1");
            view.myPlayer().TotalBet(0);
            view.myPlayer().Money(0);
            view.opened(true);
            const currentTablePovider = {
                currentTable: () => view,
            };
            let isGetAccountCalled = false;
            const accountManager = {
                getAccount: async () => {
                    isGetAccountCalled = true;
                    expect(tableMenuPopup.doublerebuyAllowed()).toEqual(true);
                    const account = await getAccount({
                        RealMoney: 1900,
                        GameMoney: 1900,
                    });
                    return account;
                },
            };
            const tableMenuPopup = new TableMenuPopup(currentTablePovider, dummyCommandExecutor, accountManager, notAuthenticated);
            await tableMenuPopup.shown();
            expect(isGetAccountCalled).toBeTruthy();
            expect(tableMenuPopup.isDoubleRebuyCurrentlyAllowed()).toEqual(true);
            expect(tableMenuPopup.isSufficientMoneyForDoubleRebuy()).toEqual(false);
            expect(tableMenuPopup.doublerebuyAllowed()).toEqual(false);
        });
        it("double rebuy button visible if player has money to bought it", async function () {
            const view = getTestTournamentTableView({
                IsRebuyAllowed: true,
                Options: TournamentOptionsEnum.HasRebuy,
                RebuyFee: 1000,
                RebuyPrice: 0,
            });
            await simpleInitialization(view, 1, [400, 200]);
            view.currentLogin("Player1");
            view.myPlayer().TotalBet(0);
            view.myPlayer().Money(0);
            view.opened(true);
            const currentTablePovider = {
                currentTable: () => view,
            };
            let isGetAccountCalled = false;
            const accountManager = {
                getAccount: async () => {
                    isGetAccountCalled = true;
                    expect(tableMenuPopup.doublerebuyAllowed()).toEqual(true);
                    return await getAccount({
                        RealMoney: 10000,
                        GameMoney: 10000,
                    });
                },
            };
            const tableMenuPopup = new TableMenuPopup(currentTablePovider, dummyCommandExecutor, accountManager, notAuthenticated);
            await tableMenuPopup.shown();
            expect(tableMenuPopup.isDoubleRebuyCurrentlyAllowed()).toEqual(true);
            expect(tableMenuPopup.isSufficientMoneyForDoubleRebuy()).toEqual(true);
            expect(tableMenuPopup.doublerebuyAllowed()).toEqual(true);
        });
        it("double rebuy button visible if player has just as much money as he need to buy it", async function () {
            const view = getTestTournamentTableView({
                IsRebuyAllowed: true,
                Options: TournamentOptionsEnum.HasRebuy,
                RebuyFee: 1000,
                RebuyPrice: 0,
            });
            await simpleInitialization(view, 1, [400, 200]);
            view.currentLogin("Player1");
            view.myPlayer().TotalBet(0);
            view.myPlayer().Money(0);
            view.opened(true);
            const currentTablePovider = {
                currentTable: () => view,
            };
            let isGetAccountCalled = false;
            const accountManager = {
                getAccount: async () => {
                    isGetAccountCalled = true;
                    expect(tableMenuPopup.doublerebuyAllowed()).toEqual(true);
                    return await getAccount({
                        RealMoney: 2000,
                        GameMoney: 0,
                    });
                },
            };
            const tableMenuPopup = new TableMenuPopup(currentTablePovider, dummyCommandExecutor, accountManager);
            await tableMenuPopup.shown();
            expect(tableMenuPopup.isDoubleRebuyCurrentlyAllowed()).toEqual(true);
            expect(tableMenuPopup.isSufficientMoneyForDoubleRebuy()).toEqual(true);
            expect(tableMenuPopup.doublerebuyAllowed()).toEqual(true);
        });
    });
    describe("addon button", function () {
        it("addon button don't visible for the regular table", async function () {
            const view = getTestTableView();
            await simpleInitialization(view, 1, [400, 200]);
            view.currentLogin("Player1");
            const currentTablePovider = {
                currentTable: () => view,
            };
            const accountManager = getAccountManager();
            const tableMenuPopup = new TableMenuPopup(currentTablePovider, dummyCommandExecutor, accountManager, notAuthenticated);
            await tableMenuPopup.shown();
            expect(tableMenuPopup.isAddonCurrentlyAllowed()).toEqual(false);
            expect(tableMenuPopup.isSufficientMoneyForAddon()).toEqual(false);
            expect(tableMenuPopup.addonAllowed()).toEqual(false);
        });
        it("addon button don't visible when player does not sit on table", async function () {
            const view = getTestTableView();
            await simpleInitialization(view, 1, [400, 200]);
            view.currentLogin("Player3");
            const currentTablePovider = {
                currentTable: () => view,
            };
            const accountManager = getAccountManager();
            const tableMenuPopup = new TableMenuPopup(currentTablePovider, dummyCommandExecutor, accountManager, notAuthenticated);
            await tableMenuPopup.shown();
            expect(tableMenuPopup.isAddonCurrentlyAllowed()).toEqual(false);
            expect(tableMenuPopup.isSufficientMoneyForAddon()).toEqual(false);
            expect(tableMenuPopup.addonAllowed()).toEqual(false);
        });
        it("addon button don't visible if tournament does not support addon", async function () {
            const view = getTestTournamentTableView({
                IsAddonAllowed: false,
            });
            await simpleInitialization(view, 1, [400, 200]);
            view.currentLogin("Player1");
            const currentTablePovider = {
                currentTable: () => view,
            };
            const accountManager = getAccountManager();
            const tableMenuPopup = new TableMenuPopup(currentTablePovider, dummyCommandExecutor, accountManager, notAuthenticated);
            await tableMenuPopup.shown();
            expect(tableMenuPopup.isAddonCurrentlyAllowed()).toEqual(false);
            expect(tableMenuPopup.isSufficientMoneyForAddon()).toEqual(false);
            expect(tableMenuPopup.addonAllowed()).toEqual(false);
        });
        it("addon button don't visible if tournament does support addon, but table is not yet opened", async function () {
            const view = getTestTournamentTableView({
                IsAddonAllowed: true,
                Options: TournamentOptionsEnum.HasAddon,
            });
            await simpleInitialization(view, 1, [400, 200]);
            view.currentLogin("Player1");
            view.opened(false);
            const currentTablePovider = {
                currentTable: () => view,
            };
            const accountManager = getAccountManager();
            const tableMenuPopup = new TableMenuPopup(currentTablePovider, dummyCommandExecutor, accountManager, notAuthenticated);
            await tableMenuPopup.shown();
            expect(tableMenuPopup.isAddonCurrentlyAllowed()).toEqual(false);
            expect(tableMenuPopup.isSufficientMoneyForAddon()).toEqual(false);
            expect(tableMenuPopup.addonAllowed()).toEqual(false);
        });
        it("addon button initially visible if tournament support addon", async function () {
            const view = getTestTournamentTableView({
                IsAddonAllowed: true,
                Options: TournamentOptionsEnum.HasAddon,
            });
            await simpleInitialization(view, 1, [400, 200]);
            view.currentLogin("Player1");
            view.myPlayer().TotalBet(10000);
            view.myPlayer().Money(10000);
            view.tournament().addonCount(0);
            view.opened(true);
            const currentTablePovider = {
                currentTable: () => view,
            };
            let isGetAccountCalled = false;
            const accountManager = {
                getAccount: async () => {
                    isGetAccountCalled = true;
                    expect(tableMenuPopup.isAddonCurrentlyAllowed()).toEqual(true);
                    expect(tableMenuPopup.isSufficientMoneyForAddon()).toEqual(true);
                    expect(tableMenuPopup.addonAllowed()).toEqual(true);
                    return await getAccount();
                },
            };
            const tableMenuPopup = new TableMenuPopup(currentTablePovider, dummyCommandExecutor, accountManager, notAuthenticated);
            await tableMenuPopup.shown();
            expect(isGetAccountCalled).toBeTruthy();
        });
        it("addon button don't visible if it was already bought", async function () {
            const view = getTestTournamentTableView({
                IsAddonAllowed: true,
                Options: TournamentOptionsEnum.HasAddon,
            });
            await simpleInitialization(view, 1, [400, 200]);
            view.currentLogin("Player1");
            view.myPlayer().TotalBet(10000);
            view.myPlayer().Money(10000);
            view.tournament().addonCount(1);
            view.opened(true);
            const currentTablePovider = {
                currentTable: () => view,
            };
            const accountManager = getAccountManager();
            const tableMenuPopup = new TableMenuPopup(currentTablePovider, dummyCommandExecutor, accountManager, notAuthenticated);
            await tableMenuPopup.shown();
            expect(tableMenuPopup.isAddonCurrentlyAllowed()).toEqual(false);
            expect(tableMenuPopup.isSufficientMoneyForAddon()).toEqual(false);
            expect(tableMenuPopup.addonAllowed()).toEqual(false);
        });
        it("addon button don't visible if player has no money to bought it", async function () {
            const view = getTestTournamentTableView({
                IsAddonAllowed: true,
                Options: TournamentOptionsEnum.HasAddon,
                AddonFee: 1000,
                AddonPrice: 0,
            });
            await simpleInitialization(view, 1, [400, 200]);
            view.currentLogin("Player1");
            view.myPlayer().TotalBet(10000);
            view.myPlayer().Money(10000);
            view.tournament().addonCount(0);
            view.opened(true);
            const currentTablePovider = {
                currentTable: () => view,
            };
            let isGetAccountCalled = false;
            const accountManager = {
                getAccount: async () => {
                    isGetAccountCalled = true;
                    expect(tableMenuPopup.addonAllowed()).toEqual(true);
                    return await getAccount({
                        RealMoney: 0,
                        GameMoney: 0,
                    });
                },
            };
            const tableMenuPopup = new TableMenuPopup(currentTablePovider, dummyCommandExecutor, accountManager, notAuthenticated);
            await tableMenuPopup.shown();
            expect(tableMenuPopup.isAddonCurrentlyAllowed()).toEqual(true);
            expect(tableMenuPopup.isSufficientMoneyForAddon()).toEqual(false);
            expect(tableMenuPopup.addonAllowed()).toEqual(false);
        });
        it("addon button visible if player has money to bought it", async function () {
            const view = getTestTournamentTableView({
                IsAddonAllowed: true,
                Options: TournamentOptionsEnum.HasAddon,
                AddonFee: 1000,
                AddonPrice: 0,
            });
            await simpleInitialization(view, 1, [400, 200]);
            view.currentLogin("Player1");
            view.myPlayer().TotalBet(10000);
            view.myPlayer().Money(10000);
            view.tournament().addonCount(0);
            view.opened(true);
            const currentTablePovider = {
                currentTable: () => view,
            };
            let isGetAccountCalled = false;
            const accountManager = {
                getAccount: async () => {
                    isGetAccountCalled = true;
                    expect(tableMenuPopup.addonAllowed()).toEqual(true);
                    return await getAccount({
                        RealMoney: 10000,
                        GameMoney: 10000,
                    });
                },
            };
            const tableMenuPopup = new TableMenuPopup(currentTablePovider, dummyCommandExecutor, accountManager, notAuthenticated);
            await tableMenuPopup.shown();
            expect(tableMenuPopup.isAddonCurrentlyAllowed()).toEqual(true);
            expect(tableMenuPopup.isSufficientMoneyForAddon()).toEqual(true);
            expect(tableMenuPopup.addonAllowed()).toEqual(true);
        });

        it("addon button visible if player has just as much money as he need to buy it", async function () {
            const view = getTestTournamentTableView({
                IsAddonAllowed: true,
                Options: TournamentOptionsEnum.HasAddon,
                AddonFee: 1000,
                AddonPrice: 0,
            });
            await simpleInitialization(view, 1, [400, 200]);
            view.currentLogin("Player1");
            view.myPlayer().TotalBet(10000);
            view.myPlayer().Money(10000);
            view.tournament().addonCount(0);
            view.opened(true);
            const currentTablePovider = {
                currentTable: () => view,
            };
            let isGetAccountCalled = false;
            const accountManager = {
                getAccount: async () => {
                    isGetAccountCalled = true;
                    expect(tableMenuPopup.addonAllowed()).toEqual(true);
                    return await getAccount({
                        RealMoney: 1000,
                        GameMoney: 0,
                    });
                },
            };
            const tableMenuPopup = new TableMenuPopup(currentTablePovider, dummyCommandExecutor, accountManager);
            await tableMenuPopup.shown();
            expect(tableMenuPopup.isAddonCurrentlyAllowed()).toEqual(true);
            expect(tableMenuPopup.isSufficientMoneyForAddon()).toEqual(true);
            expect(tableMenuPopup.addonAllowed()).toEqual(true);
        });
    });
});
