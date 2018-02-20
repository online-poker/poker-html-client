import { IAccount, IChat, IGame, ITournament, LobbyTournamentItem, PersonalAccountData, TournamentDefinition, TournamentPlayerStateDefinition } from "@poker/api-server";
import { IApiProvider } from "../../js/api";
import { GameActionsQueue } from "../../js/table/gameactionsqueue";
import {
    TableView,
} from "../../js/table/tableview";

export function simpleSit(view: TableView, gameType: number, money: number[]) {
    view.currentLogin("Player1");
    view.onTableStatusInfo([], [], null, 2, 10, 10, 30, 0, 1, 0, 1, true, 0, false, this, null, null, gameType);
    const data = [];
    for (let i = 1; i <= money.length; i++) {
        view.onSit(i, i, "Player" + i, money[i - 1], "url", 10, 1);
        data.push({ PlayerId: i, Money: money[i - 1] });
    }

    return data;
}

export function simpleInitialization(view: TableView, gameType: number, money: number[], dealer: number = null) {
    const data = simpleSit(view, gameType, money);

    if (dealer == null) {
        if (money.length === 2) {
            dealer = 1;
        } else {
            dealer = money.length;
        }
    }

    view.onGameStarted(1, data, [], dealer);
}

export function getTable() {
    return {
        TableId: 1,
        TableName: "Table 1",
        SmallBlind: 10,
        BigBlind: 20,
        AveragePotSize: 0,
        CurrencyId: 1,
        HandsPerHour: 1,
        IsAuthorized: true,
        JoinedPlayers: 0,
        MaxPlayers: 10,
        PotLimitType: 3,
    };
}

const statusResponse = (status: string) => {
    return Promise.resolve({ Status: status });
};
const successStatus = statusResponse("Ok");
export const noopAccountApi: IAccount = {
    logout: () => successStatus,
    authenticate: (login: string, password: string, rememberMe: boolean) => Promise.resolve({
        Status: "Ok",
        Id: 1,
        IsGuest: false,
        FirstName: "name",
        LastName: "lastName",
        PatronymicName: "patronimyc",
        Login: "player1",
        Money: [0, 0],
        Email: "test@test.com",
        Country: "",
        City: "",
        ImageUrl: "",
        Properties: {} as Map<string, string>,
    }),
    activateAccount: (login: string, token: string) => successStatus,
    cancelAccountActivation: (login: string, token: string) => successStatus,
    changePassword: (oldPassword: string, newPassword: string) => successStatus,
    getAccount: () => Promise.resolve(null as ApiResult<PersonalAccountData>),
    getPlayer: () => Promise.resolve(null as ApiResult<PlayerDefinition>),
    getAccountHistory: (fromDate: string | null, toDate: string | null, fromAmount: number | null, toAmount: number | null, operationType: number | null) => Promise.resolve(null as ApiResult<OperationData[]>),
    registerGuest: () => Promise.resolve(null as RegisterGuestResponse),
    register: (login: string, email: string, password: string, phoneNumber: string, firstName: string, lastName: string, patronymicName: string, country: number, city: string, additionalProperties: any) => successStatus,
    registrationCheck: (login: string, email: string, phoneNumber: string) => successStatus,
    requestResetPassword: (login: string, email: string) => successStatus,
    resetPassword: (token: string, newPassword: string) => successStatus,
    resetAvatar: () => successStatus,
    setAvatarUrl: (url: string) => successStatus,
    updatePlayerProfile: (phoneNumber: string, firstName: string, lastName: string, patronymicName: string, email: string, country: number, city: number) => successStatus,
    uploadAvatar: (image: any) => successStatus,
    getBestPlayers: () => Promise.resolve(null as ApiResult<UserRating[]>),
};

export const noopChatApi: IChat = {
    send: (tableId: number, message: string) => successStatus,
};

export const noopGameApi: IGame = {
    getTables: (fullTables: boolean | null, privateTables: number | null, maxPlayers: number, betLevels: number, moneyType: number, limitType: number, showTournamentTables: boolean) => Promise.resolve(null as ApiResult<LobbyTableItem[]>),
    getTableById: (tableId: number) => Promise.resolve(null as ApiResult<GameTableModel>),
    getSitingTables: () => Promise.resolve({ Status: "Ok", Data: [] }),
    sit: (tableId: number, seat: number, amount: number, ticketCode: string) => Promise.resolve({ Status: "Ok", MinimalAmount: amount }),
    sitAnywhere: (tableId: number, amount: number) => Promise.resolve({ Status: "Ok", MinimalAmount: amount }),
    standup: (tableId: number) => successStatus,
    fold: (tableId: number) => successStatus,
    checkOrCall: (tableId: number) => successStatus,
    betOrRaise: (tableId: number, amount: number) => successStatus,
    changeWaitQueueSettings: (tableId: number, waitBigBlind: boolean) => successStatus,
    addBalance: (tableId: number, amount: number, ticketCode: string) => Promise.resolve({ Status: "Ok", Amount: amount }),
    sitOut: (tableId: number) => successStatus,
    comeBack: (tableId: number) => successStatus,
    muck: (tableId: number) => successStatus,
    showCards: (tableId: number) => successStatus,
    showHoleCard: (tableId: number, cardPosition: number) => successStatus,
    setTableParameters: (tableId: number, openCardsAutomatically: boolean) => successStatus,
};

export const noopTournamentApi: ITournament = {
    getTournaments: (prizeCurrency: number, tournamentType: number, speed: number, buyin: number, maxPlayers: number) => Promise.resolve(null as ApiResult<LobbyTournamentItem[]>),
    getTournament: (tournamentId: number) => Promise.resolve(null as ApiResult<TournamentDefinition>),
    register: (tournamentId: number) => successStatus,
    cancelRegistration: (tournamentId: number) => successStatus,
    rebuy: (tournamentId: number, double: boolean) => successStatus,
    addon: (tournamentId: number) => successStatus,
    getRegisteredTournaments: () => Promise.resolve(null as ApiResult<TournamentPlayerStateDefinition[]>),
};

export const noopApiProvider: IApiProvider = {
    getAccount: () => noopAccountApi,
    getChat: () => noopChatApi,
    getGame: () => noopGameApi,
    getTournament: () => noopTournamentApi,
};

export function getTestTableView(): TableView {
    const tableModel = getTable();
    return new TableView(1, tableModel, noopApiProvider);
}

/**
 * Drain all pending execution tasks in the queue.
 * @param queue Queue which tasks should be drained.
 */
export async function drainQueue(queue: GameActionsQueue) {
    await queue.waitCurrentTask();
    while (queue.size() > 0) {
        await queue.execute();
        await queue.waitCurrentTask();
    }
}

export function printTableView(tableView: TableView) {
    console.log(tableView.places().filter((_) => _).map((_) => {
        return {
            PlayerId: _.PlayerId(),
            PlayerName: _.PlayerName(),
            Money: _.Money(),
            Bet: _.Bet(),
        };
    }));
}
