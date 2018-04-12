import {
    IAccount,
    IChat,
    IGame,
    ITournament,
    LobbyTournamentItem,
    PersonalAccountData,
    Tournament,
    TournamentDefinition,
    TournamentOptionsEnum,
    TournamentPlayerStateDefinition,
    TournamentStatus,
} from "@poker/api-server";
import { TournamentView } from "poker/table/tournamentview";
import { IApiProvider } from "../../js/api";
import { GameActionsQueue } from "../../js/table/gameactionsqueue";
import {
    TableView,
} from "../../js/table/tableview";

/**
 * Sit players on the table
 * @param view Current table view.
 * @param gameType Current game type.
 * @param money Players money.
 */
export async function simpleSit(view: TableView, gameType: number, money: number[]) {
    view.currentLogin("Player1");
    view.onTableStatusInfo([], [], null, 2, 10, 10, 30, 0, 1, 0, 1, true, 0, false, true, null, null, gameType);
    const data = [];
    for (let i = 1; i <= money.length; i++) {
        await view.onSit(i, i, "Player" + i, money[i - 1], "url", 10, 1);
        data.push({ PlayerId: i, Money: money[i - 1] });
    }

    return data;
}

/**
 * Initialize new game
 * @param view Current table view.
 * @param gameType Current game type.
 * @param money Players money.
 * @param dealer Dealers seat number.
 */
export async function simpleInitialization(view: TableView, gameType: number, money: number[], dealer: number | null = null) {
    const data = await simpleSit(view, gameType, money);

    if (dealer === null) {
        if (money.length === 2) {
            dealer = 1;
        } else {
            dealer = money.length;
        }
    }

    view.onGameStarted(1, data, [], dealer);
}

/** Returns game table object */
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

/** Get tableview for tests */
export function getTestTableView(): TableView {
    const tableModel = getTable();
    return new TableView(1, tableModel, noopApiProvider);
}

export const baseTournament: TournamentDefinition = {
    TournamentId: 1,
    TournamentName: "name",
    Description: "desc",
    Type: 1,
    CurrencyId: 1,
    PrizeCurrencyId: 1,
    RegistrationStartDate: "",
    RegistrationEndDate: "",
    StartDate: "",
    EndDate: null,
    FinishDate: null,
    JoinedPlayers: 0,
    TournamentTables: [],
    TournamentPlayers: [],
    BetLevel: null,
    PrizeAmount: 1000,
    PrizeAmountType: 0,
    CollectedPrizeAmount: 0,
    JoinFee: 0,
    BuyIn: 0,
    StartingChipsAmount: 1000,
    WellKnownBetStructure: 1,
    WellKnownPrizeStructure: 1,
    BlindUpdateTime: 0,
    IsRebuyAllowed: false,
    RebuyPrice: 100,
    RebuyFee: null,
    RebuyPeriodTime: 60,
    IsAddonAllowed: false,
    AddonPrice: 100,
    AddonFee: null,
    AddonPeriodTime: 60,
    PauseTimeout: null,
    Options: TournamentOptionsEnum.None,
    MaximumAmountForRebuy: 1000,
    IsRegistered: true,
    ChipsAddedAtReBuy: 1000,
    ChipsAddedAtDoubleReBuy: 2000,
    ChipsAddedAtAddOn: 2500,
    Status: TournamentStatus.Started,
    IsPaused: false,
    MinPlayers: 2,
    MaxPlayers: 1000,
};

/**
 * Get tournament table view for tests.
 * @param tournamentDataOverride
 */
export function getTestTournamentTableView(tournamentDataOverride?: Partial<TournamentDefinition>): TableView {
    const tableModel = getTable();
    const view = new TableView(1, tableModel, noopApiProvider);
    const tournamentData = Object.assign({}, baseTournament, tournamentDataOverride || {});
    const tournamentView = new TournamentView(1, tournamentData);
    view.tournament(tournamentView);
    return view;
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

/**
 * Log all tableView places
 * @param tableView
 */
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
