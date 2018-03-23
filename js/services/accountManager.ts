import { Account, PersonalAccountData } from "@poker/api-server";
declare var host: string;

export interface IAccountManager {
    getAccount(): Promise<ApiResult<PersonalAccountData>>;
}

export class AccountManager implements IAccountManager {
    public async getAccount() {
        const api = new Account(host);
        return api.getAccount();
    }
    public async getPlayer() {
        const api = new Account(host);
        return api.getPlayer();
    }
    public async changePasword(oldPasword: string, newPassword: string) {
        const api = new Account(host);
        return api.changePassword(oldPasword, newPassword);
    }
    public async resetPassword(token: string, newPassword: string) {
        const api = new Account(host);
        return api.resetPassword(token, newPassword);
    }
    public async requestResetPassword(login: string, email: string) {
        const api = new Account(host);
        return api.requestResetPassword(login, email);
    }
    public async register(
        login: string,
        email: string,
        password: string,
        phoneNumber: string,
        firstName: string,
        lastName: string,
        patronymicName: string,
        country: number,
        city: string,
        additionalProperties: any) {
        const api = new Account(host);
        return await api.register(login, email, password, phoneNumber, firstName, lastName, patronymicName, country, city, additionalProperties);
    }
    public async getAccountHistory(fromDate, toDate, fromAmount, toAmount, operationType): Promise<ApiResult<OperationData[]>> {
        const api = new Account(host);
        return await api.getAccountHistory(fromDate, toDate, fromAmount, toAmount, operationType);
    }
    public async getBestPlayers(): Promise<ApiResult<UserRating[]>> {
        const api = new Account(host);
        return await api.getBestPlayers();
    }
}
