import { getDeleteRequestInit, getPostRequestInit, getPutRequestInit, getRequestInit } from "./helper";

/**
 * Represents player status in the tournament.
 */
export enum TournamentPlayerStatus {
    /**
     * Player registered to play in the tournament
     */
    Registered,

    /**
     * Player cancel his registration.
     */
    RegistrationCancelled,

    /**
     * Player is currently playing in the tournament.
     */
    Playing,

    /**
     * Player complete playing in the tournament.
     */
    Completed,
}

export enum TournamentOptionsEnum {
    None = 0,
    HasBuyIn = 1,
    HasEntryFee = 2,
    HasRebuy = 4,
    HasAddon = 8,
    RebuyGoesToPrizePool = 16,
    RebuyGoesToCasino = 32,
    AddonGoesToPrizePool = 64,
    AddonGoesToCasino = 128,
}

export interface LobbyTournamentItem {
    TournamentId: number;
    Type: number;
    TournamentName: string;
    IsRegistered: boolean;
    CurrencyId: number;
    RegistrationStartDate: string;
    RegistrationEndDate: string;
    StartDate: string;
    EndDate: string;
    FinishDate: string;
    JoinedPlayers: number;
    MinPlayers: number;
    MaxPlayers: number;
    PrizeAmount: number;
    Status: TournamentStatus;
    PrizeCurrencyId: number;
    BuyInAmount: number;
    EntryMoneyAmount: number;
    IsPaused: boolean;
}

export interface TournamentDefinition {
    TournamentId: number;
    TournamentName: string;
    Description: string;
    Type: number;
    CurrencyId: number;
    PrizeCurrencyId: number;
    RegistrationStartDate: string;
    RegistrationEndDate: string;
    StartDate: string;
    EndDate: string;
    FinishDate: string;
    JoinedPlayers: number;
    TournamentTables: TournamentTableDefinition[];
    TournamentPlayers: TournamentPlayerDefinition[];
    BetLevel: number;
    PrizeAmount: number;
    CollectedPrizeAmount: number;
    JoinFee: number;
    BuyIn: number;
    StartingChipsAmount: number;
    WellKnownBetStructure: number;
    WellKnownPrizeStructure: number;
    BlindUpdateTime: number;
    IsRebuyAllowed: boolean;
    RebuyPrice: number;
    RebuyFee: number;
    RebuyPeriodTime: number;
    IsAddonAllowed: boolean;
    AddonPrice: number;
    AddonFee: number;
    AddonPeriodTime: number;
    PauseTimeout: number;
    Options: TournamentOptionsEnum;
    MaximumAmountForRebuy: number;
    IsRegistered: boolean;
    ChipsAddedAtReBuy: number;
    ChipsAddedAtDoubleReBuy: number;
    Status: TournamentStatus;
    IsPaused: boolean;
    MinPlayers: number;
    MaxPlayers: number;
}

/**
 * DTO for the tournament player information.
 */
interface TournamentTablePlayerDefinition {
    /**
     * Gets or sets Id of the player
     */
    PlayerId: number;

    /**
     * Gets or sets name of the player.
     */
    PlayerName: string;

    /**
     * Gets or sets amount of money which player currently has.
     */
    PlayerMoney: number;
}

/**
 * DTO for the tournament table information.
 */
export interface TournamentTableDefinition {
    /**
     * Gets or sets unique id of the table.
     */
    TableId: number;

    /**
     * Gets or sets name of the table.
     */
    TableName: string;

    /**
     * Gets or sets number of players which joins the game.
     */
    JoinedPlayers: number;

    /**
     * Gets or sets a value indicating whether table is closed.
     */
    IsClosed: boolean;

    /**
     * Gets or sets list of the players which is sitting on the table now.
     */
    Players: TournamentTablePlayerDefinition[];
}

export interface TournamentPlayerDefinition {
    TournamentId: number;
    TournamentName: string;
    PlayerId: number;
    PlayerName: string;
    TableId: number;
    Status: TournamentPlayerStatus;
    Prize: number;
    Stack: number;
}

export class Tournament {
    constructor(public host: string) {
    }

    public async getTournaments(prizeCurrency, tournamentType, speed, buyin, maxPlayers) {
        const data = {
            TournamentType: tournamentType,
            PrizeCurrency: prizeCurrency,
            Speed: speed,
            BuyIn: buyin,
            MaxPlayers: maxPlayers,
        };
        const response = await fetch(this.host + `/api/tournaments`, getRequestInit());
        const jsonData = await response.json() as ApiResult<LobbyTournamentItem[]>;
        return jsonData;
    }

    public async getTournament(tournamentId: number) {
        const response = await fetch(this.host + `/api/tournaments/${tournamentId}`, getRequestInit());
        const jsonData = await response.json() as ApiResult<TournamentDefinition>;
        return jsonData;
    }

    public async register(tournamentId: number) {
        const response = await fetch(this.host + `/api/tournaments/${tournamentId}/registration`, getPutRequestInit());
        const jsonData = await response.json() as StatusResponse;
        return jsonData;
    }

    public async cancelRegistration(tournamentId) {
        const response = await fetch(this.host + `/api/tournaments/${tournamentId}/registration`, getDeleteRequestInit());
        const jsonData = await response.json() as StatusResponse;
        return jsonData;
    }

    public async rebuy(tournamentId: number, double: boolean) {
        const data = { IsDoubleRebuy: double };
        const response = await fetch(this.host + `/api/tournaments/${tournamentId}/rebuys`, getPutRequestInit(data));
        const jsonData = await response.json() as StatusResponse;
        return jsonData;
    }

    public async addon(tournamentId: number) {
        const response = await fetch(this.host + `/api/tournaments/${tournamentId}/addons`, getPutRequestInit());
        const jsonData = await response.json() as StatusResponse;
        return jsonData;
    }

    public async getRegisteredTournaments(): Promise<ApiResult<TournamentPlayerStateDefinition[]>> {
        const response = await fetch(this.host + `/api/account/my/tournaments`, getRequestInit());
        const jsonData = await response.json() as ApiResult<TournamentPlayerStateDefinition[]>;
        return jsonData;
    }
}
