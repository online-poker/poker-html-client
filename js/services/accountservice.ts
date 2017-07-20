declare var apiHost: string;

import * as authManager from "../authmanager";
import { AccountManager } from "./accountManager";

export class AccountService {
    public async getAccount() {
        const realMoneySupported = true;
        const gameMoneySupported = false;
        const api = new AccountManager();
        const apiResult = await api.getAccount();
        const data = apiResult.Data;
        const accountsData = [] as AccountInformation[];
        if (realMoneySupported) {
            accountsData.push({
                available: data.RealMoney,
                currencyName: "currency.realmoney",
                ingame: data.RealMoneyReserve == null ? 0 : data.RealMoneyReserve,
                total: Number(data.RealMoney) + Number(data.RealMoneyReserve == null ? 0 : data.RealMoneyReserve),
            });
        }

        if (gameMoneySupported) {
            accountsData.push({
                available: data.GameMoney,
                currencyName: "currency.gamemoney",
                ingame: data.GameMoneyReserve == null ? 0 : data.GameMoneyReserve,
                total: Number(data.GameMoney) + Number(data.GameMoneyReserve == null ? 0 : data.GameMoneyReserve),
            });
        }

        const transactionInfo: AccountTransactionInformation = {
            amount: data.LastIncomeAmount,
            date: data.LastIncomeDate,
            id: data.LastRequestNumber,
        };
        return {
            accounts: accountsData,
            lastTransaction: transactionInfo,
            login: authManager.login(),
        };
    }
}
