import { Account } from "../api/account";
declare var host: string;

export class AccountManager {
    public async getAccount() {
        const api = new Account(host);
        return api.getAccount();
    }
    public async changePasword(oldPasword: string, newPassword: string) {
        const api = new Account(host);
        return api.changePassword(oldPasword, newPassword);
    }
}
