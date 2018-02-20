import { PersonalAccountData } from "@poker/api-server";
import { AccountService } from "../../js/services/accountservice";

function defineMockResponse(response: ApiResult<PersonalAccountData>) {
    global.host = "";
    global.authToken = "";
    global.fetch = jest.fn().mockImplementation(() => {
        const p = new Promise((resolve, reject) => {
          resolve({
            ok: true,
            Id: "123",
            json() {
                return Promise.resolve(response);
            },
          });
        });

        return p;
    });
}

describe("account service", function () {
    it("get account information", async function() {
        defineMockResponse({
            Status: "Ok",
            Data: {
                RealMoney: 1234,
                RealMoneyReserve: 50,
                GameMoney: 2345,
                GameMoneyReserve: 70,
                Points: 13000,
                LastIncomeDate: "",
                LastIncomeAmount: 578,
                LastRequestNumber: 99990,
            },
        });
        const sut = new AccountService(true, true);
        const result = await sut.getAccount();
        expect(result.accounts).not.toBeNull();
        expect(result.accounts.length).toEqual(2);
        expect(result.lastTransaction).not.toBeNull();
        expect(result.lastTransaction).toEqual({
            id: 99990,
            amount: 578,
            date: "",
        });

        const realGame = result.accounts.filter((_) => _.currencyName === "currency.realmoney");
        expect(realGame.length).toEqual(1);
        expect(realGame[0].available).toEqual(1234);
        expect(realGame[0].ingame).toEqual(50);
        expect(realGame[0].total).toEqual(1284);

        const gameMoneyAccount = result.accounts.filter((_) => _.currencyName === "currency.gamemoney");
        expect(gameMoneyAccount.length).toEqual(1);
        expect(gameMoneyAccount[0].available).toEqual(2345);
        expect(gameMoneyAccount[0].ingame).toEqual(70);
        expect(gameMoneyAccount[0].total).toEqual(2415);
    });
    it("get account information, format 2", async function() {
        defineMockResponse({
            Status: "Ok",
            Data: {
                RealMoney: 1234,
                RealMoneyReserve: null,
                GameMoney: 2345,
                GameMoneyReserve: null,
                Points: 13000,
                LastIncomeDate: "",
                LastIncomeAmount: 578,
                LastRequestNumber: 99990,
            },
        });
        const sut = new AccountService(true, true);
        const result = await sut.getAccount();
        expect(result.accounts).not.toBeNull();
        expect(result.accounts.length).toEqual(2);
        expect(result.lastTransaction).not.toBeNull();
        expect(result.lastTransaction).toEqual({
            id: 99990,
            amount: 578,
            date: "",
        });

        const realGame = result.accounts.filter((_) => _.currencyName === "currency.realmoney");
        expect(realGame.length).toEqual(1);
        expect(realGame[0].available).toEqual(1234);
        expect(realGame[0].ingame).toEqual(0);
        expect(realGame[0].total).toEqual(1234);

        const gameMoneyAccount = result.accounts.filter((_) => _.currencyName === "currency.gamemoney");
        expect(gameMoneyAccount.length).toEqual(1);
        expect(gameMoneyAccount[0].available).toEqual(2345);
        expect(gameMoneyAccount[0].ingame).toEqual(0);
        expect(gameMoneyAccount[0].total).toEqual(2345);
    });
    it("get account information when game money not supported", async function() {
        defineMockResponse({
            Status: "Ok",
            Data: {
                RealMoney: 1234,
                RealMoneyReserve: 50,
                GameMoney: 2345,
                GameMoneyReserve: 70,
                Points: 13000,
                LastIncomeDate: "",
                LastIncomeAmount: 578,
                LastRequestNumber: 99990,
            },
        });
        const sut = new AccountService(true, false);
        const result = await sut.getAccount();
        expect(result.accounts).not.toBeNull();
        expect(result.accounts.length).toEqual(1);
        expect(result.lastTransaction).not.toBeNull();
        expect(result.lastTransaction).toEqual({
            id: 99990,
            amount: 578,
            date: "",
        });

        const realGame = result.accounts.filter((_) => _.currencyName === "currency.realmoney");
        expect(realGame.length).toEqual(1);
        expect(realGame[0].available).toEqual(1234);
        expect(realGame[0].ingame).toEqual(50);
        expect(realGame[0].total).toEqual(1284);

        const gameMoneyAccount = result.accounts.filter((_) => _.currencyName === "currency.gamemoney");
        expect(gameMoneyAccount.length).toEqual(0);
    });
    it("get account information when real money does not supported", async function() {
        defineMockResponse({
            Status: "Ok",
            Data: {
                RealMoney: 1234,
                RealMoneyReserve: 50,
                GameMoney: 2345,
                GameMoneyReserve: 70,
                Points: 13000,
                LastIncomeDate: "",
                LastIncomeAmount: 578,
                LastRequestNumber: 99990,
            },
        });
        const sut = new AccountService(false, true);
        const result = await sut.getAccount();
        expect(result.accounts).not.toBeNull();
        expect(result.accounts.length).toEqual(1);
        expect(result.lastTransaction).not.toBeNull();
        expect(result.lastTransaction).toEqual({
            id: 99990,
            amount: 578,
            date: "",
        });

        const realGame = result.accounts.filter((_) => _.currencyName === "currency.realmoney");
        expect(realGame.length).toEqual(0);

        const gameMoneyAccount = result.accounts.filter((_) => _.currencyName === "currency.gamemoney");
        expect(gameMoneyAccount.length).toEqual(1);
        expect(gameMoneyAccount[0].available).toEqual(2345);
        expect(gameMoneyAccount[0].ingame).toEqual(70);
        expect(gameMoneyAccount[0].total).toEqual(2415);
    });
});
