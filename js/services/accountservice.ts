/// <reference path="services.d.ts" />
/// <reference path="../poker.commanding.api.ts" />

declare var apiHost: string;

import { slowInternetService } from "./index";
import * as authManager from "../authmanager";

export class AccountService {
    public async getAccount() {
        const realMoneySupported = true;
        const gameMoneySupported = false;
        const api = new OnlinePoker.Commanding.API.Account(apiHost);
        const apiResult = await api.GetPersonalAccount();
        const data = apiResult.Data;
        const accountsData = <AccountInformation[]>[];
        if (realMoneySupported) {
            accountsData.push({
                currencyName: "currency.realmoney",
                available: data.RealMoney,
                ingame: data.RealMoneyReserve == null ? 0 : data.RealMoneyReserve,
                total: Number(data.RealMoney) + Number(data.RealMoneyReserve == null ? 0 : data.RealMoneyReserve)
            });
        }

        if (gameMoneySupported) {
            accountsData.push({
                currencyName: "currency.gamemoney",
                available: data.GameMoney,
                ingame: data.GameMoneyReserve == null ? 0 : data.GameMoneyReserve,
                total: Number(data.GameMoney) + Number(data.GameMoneyReserve == null ? 0 : data.GameMoneyReserve)
            });
        }

        const transactionInfo: AccountTransactionInformation = {
            date: data.LastIncomeDate,
            amount: data.LastIncomeAmount,
            id: data.LastRequestNumber
        };
        return {
            login: authManager.login(),
            accounts: accountsData,
            lastTransaction: transactionInfo
        };
    }
}
