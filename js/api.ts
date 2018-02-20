import {
    Account,
    Chat,
    Game,
    IAccount,
    IChat,
    IGame,
    IInformation,
    IMessage,
    ISupport,
    ITableReload,
    ITournament,
    Tournament,
} from "@poker/api-server";

export interface IApiProvider {
    getGame(): IGame;
    getTournament(): ITournament;
    getChat(): IChat;
    getAccount(): IAccount;
}

declare let host: string;

export let DefaultApiProvider: IApiProvider = {
    getGame: () => new Game(host),
    getTournament: () => new Tournament(host),
    getChat: () => new Chat(host),
    getAccount: () => new Account(host),
};
