/// <reference path="../_references.ts" />
/// <reference path="services.d.ts" />
/// <reference path="../poker.commanding.api.ts" />
/// <reference path="../authmanager.ts" />

declare var apiHost: string;

class AccountService {
    getAccount() {
        var result = $.Deferred();
        var realMoneySupported = true;
        var gameMoneySupported = false;
        var api = new OnlinePoker.Commanding.API.Account(apiHost);
        api.GetPersonalAccount(null).done(function(apiResult: ApiResult<PersonalAccountData>) {
            var data = apiResult.Data;

            var accountsData = <AccountInformation[]>[];
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

            var transactionInfo: AccountTransactionInformation = {
                    date: data.LastIncomeDate,
                    amount: data.LastIncomeAmount,
                    id: data.LastRequestNumber
                };
            result.resolve({
                login: authManager.login(),
                accounts: accountsData,
                lastTransaction: transactionInfo
            });

        }).fail(function() {
            result.reject();
        });

        return result;
    }
}

var accountService = new AccountService();
