import { IAuthenticationInformation } from "poker/authmanager";
import { AccountManager } from "./accountManager";

export class AccountService {
    private realMoneySupported: boolean;
    private gameMoneySupported: boolean;
    private authInformation: IAuthenticationInformation;

    constructor(realMoneySupported: boolean, gameMoneySupported: boolean, authInformation: IAuthenticationInformation) {
        this.realMoneySupported = realMoneySupported;
        this.gameMoneySupported = gameMoneySupported;
        this.authInformation = authInformation;
    }
    public async getAccount() {
        const api = new AccountManager();
        const apiResult = await api.getAccount();
        const data = apiResult.Data;
        const accountsData = [] as AccountInformation[];
        if (this.realMoneySupported) {
            accountsData.push({
                available: data.RealMoney,
                currencyName: "currency.realmoney",
                ingame: data.RealMoneyReserve == null ? 0 : data.RealMoneyReserve,
                total: Number(data.RealMoney) + Number(data.RealMoneyReserve == null ? 0 : data.RealMoneyReserve),
            });
        }

        if (this.gameMoneySupported) {
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
            login: this.authInformation.login(),
        };
    }
}
