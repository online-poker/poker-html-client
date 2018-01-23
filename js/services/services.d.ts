interface AccountTransactionInformation {
    id: number;
    amount: number;
    date: string;
}

interface AccountInformation {
    available: number;
    ingame: number;
    total: number;
    currencyName: string;
}

interface AccountServiceInformation {
    login: string;
    accounts: AccountInformation[];
    lastTransaction: AccountTransactionInformation | null;
}
