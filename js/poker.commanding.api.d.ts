/// <reference path="poker.commanding.api.ts" />

// Interface

// tslint:disable-next-line:no-namespace
declare namespace SignalR {
    // tslint:disable-next-line:no-namespace
    namespace Hub {
        interface Connection {
            Game: {
                server: GameHubServer;
                client: GameHubClient;
            };
            Chat: {
                server: ChatHubServer;
                client: ChatHubClient;
            };
        }
    }
}

interface GameHubServer {
    join(tableId: number);
    leave(tableId: number);
    subscribeLobby();
    unsubscribeLobby();
    subscribeTournamentLobby();
    unsubscribeTournamentLobby();
    subscribeTournament(tournamentId: number);
    unsubscribeTournament(tournamentId: number);
    betOrRaise(tableId: number, amount: number);
    checkOrCall(tableId: number);
    fold(tableId: number);
}

interface StatusResponse {
    Status: string;
}

interface ApiResult<T> {
    Status: string;
    Data: T;
}

interface AvatarsResponse extends StatusResponse {
    Avatars: string[];
}

interface InboxMessagesData {
    Messages: string[];
}

interface SitResponse extends StatusResponse {
    MinimalAmount: number;
}

/**
 * Response for the RegisterGuest API call.
 */
interface RegisterGuestResponse extends StatusResponse {
    UserId: number;
    Login: string;
    Password: string;
}

/**
 * Response for the VersionCheck API call
 */
interface VersionCheckResponse {
    /**
     * Current version of server API.
     */
    ServerApiVersion: number;
    /**
     * Minimum compatible version of client API.
     */
    MinimumClientApiVersion: number;
}

interface PlayerStatusInfo {
    PlayerId: number;
    PlayerName: string;
    PlayerUrl: string;
    Money: number;
    Seat: number;
    Cards: string;
    Bet: number;
    Status: number;
    Points: number;
    Stars: number;
}

declare enum TournamentStatus {
    Pending,
    RegistrationStarted,
    RegistrationCancelled,
    SettingUp,
    WaitingTournamentStart,
    Started,
    Completed,
    Cancelled,
    LateRegistration,
}

interface TournamentPlayerStateDefinition {
    TournamentId: number;
    TableId: number;
    Status: TournamentStatus;
}

interface UserRating {
    Id: number;
    Login: string;
    Points: number;
    Stars: number;
}

interface GameWinnerModel {
    PlayerId: number;
    Pot: number;
    CardsDescription: string;
    Amount: number;
}

interface PlayerDefinitionProperties {
    Language: string;
    Points: string;
    Stars: string;
}

interface PlayerDefinition {
    Email: string;
    PhoneNumber: string;
    FirstName: string;
    LastName: string;
    RealMoney: number;
    GameMoney: number;
    Points: number;
    Properties: PlayerDefinitionProperties;
}

interface GameTableModel {
    TableId: number;
    TableName: string;
    SmallBlind: number;
    BigBlind: number;
    AveragePotSize: number;
    CurrencyId: number;
    HandsPerHour: number;
    JoinedPlayers: number;
    MaxPlayers: number;
    PotLimitType: number;
    TournamentId?: number;
}

interface BannerData {
    /**
     * Id of the banner
     */
    Id: number;

    /**
     * Text representation of the banner
     */
    Title: string;

    /**
     * URL which could be used to retrieve banner.
     */
    Url: string;

    /**
     * URL which could be used to navigate when click on the banner.
     */
    Link: string;
}

interface GamePlayerStartInformation {
    /**
     * Id of the player which participate in the game.
     */
    PlayerId: number;
    /**
     * Money which player has on hand.
     */
    Money: number;
}

interface GameActionStartInformation {
    /**
     * Id of the player which executed action in the game.
     */
    PlayerId: number;
    /**
     * Type of executed action
     */
    Type: number;
    /**
     * Amount of money which put in the pot
     */
    Amount: number;
}

interface GameHubClient {
    /**
     * Informs about current state on the table.
     * @param tableId Id of the table for which notification passed.
     * @param players Array of PlayerStatusInfo objects which describe current status of the players
     * @param pots Array of pots on the table.
     * @param cards Cards open on the table
     * @param dealerSeat Current dealer seat. 0 if no game on the table.
     * @param buyIn Minimum amount of money which player should bring on the table.
     * @param baseBuyIn Base amount in BB for joining table under normal conditions. 
     *                   20*baseBuyIn is maximum amount which player could bring-in.
     * @param leaveTime Time when player leave table last time.
     * @param timePass Time in second which is pass from last player turn.
     * @param currentPlayerId Id of the current player in the game.
     * @param lastRaise Amount of last raise in the game.
     * @param gameId Id of the game
     * @param authenticated Value indicating whether current user is authenticated or not.
     * @param actionsCount Count of actions which was performed by the player.
     * @param frozen A value indicating whether game on the table is frozen or not.
     * @param opened A value indicating whether the table is opened or not.
     * @param pauseData Unix time when game was paused. If game not paused, then null.
     * @param lastMessageId Last id of the message.
     * @param gameType Type of the game which is start playing on the table.
     */
    TableStatusInfo: (tableId: number, players: PlayerStatusInfo[], pots: number[], cards, dealerSeat,
        buyIn, baseBuyIn, leaveTime, timePass, currentPlayerId, lastRaise, gameId, authenticated,
        actionsCount: number, frozen: boolean, opened: boolean, pauseDate: number, lastMessageId: number,
        gameType: number | undefined) => void;

    GameStarted: (tableId: number, gameId: number, players: GamePlayerStartInformation[],
        actions: GameActionStartInformation[], dealerSeat: number) => void;
    Bet: (tableId: number, playerId: number, type: number, amount: number, nextPlayerId: number, actionId: number) => void;
    OpenCards: (tableId: number, type, cards: string, pots: number[]) => void;
    /**
     * Informs that player adds money on the table.
     * @param tableId Id of the table for which notification passed.
     * @param playerId Id of the player.
     * @param amount Amount of money added
     */
    MoneyAdded: (tableId: number, playerId: number, amount: number) => void;
    /**
     * Informs that player removes money on the table.
     * @param tableId Id of the table for which notification passed.
     * @param playerId Id of the player.
     * @param amount Amount of money removed
     */
    MoneyRemoved: (tableId: number, playerId: number, amount: number) => void;
    PlayerCards: (tableId: number, playerId, cards) => void;

    /**
     * Inform about player open card.
     * @param tableId Id of the table where card opened.
     * @param playerId Id of the player for which card opened.
     * @param cardPosition Number of card in the hand.
     * @param card Value of the card.
     */
    PlayerCardOpened: (tableId: number, playerId: number, cardPosition: number, card: number) => void;
    PlayerCardsMucked: (tableId: number, playerId, cards) => void;
    MoveMoneyToPot: (tableId, amount) => void;
    GameFinished: (tableId, gameId, winners, rake) => void;
    PlayerStatus: (tableId, playerId, status) => void;
    /**
     * Informs that player sits on the table.
     * @param tableId Id of the table for which notification passed.
     * @param playerId Id of the player.
     * @param amount Amount of money added
     */
    Sit: (tableId: number, playerId: number, playerName: string, seat: number, amount: number,
        playerUrl: string, points: number, stars: number) => void;
    Standup: (tableId, playerId) => void;

    /**
     * Informs that table frozen.
     * @param tableId Id of the table which was frozen.
     */
    TableFrozen: (tableId: number) => void;

    /**
     * Informs that table unfrozen.
     * @param tableId Id of the table which was unfrozen.
     */
    TableUnfrozen: (tableId: number) => void;

    /**
     * Informs that table opened.
     * @param tableId Id of the table which was opened.
     */
    TableOpened: (tableId: number) => void;

    /**
     * Informs that table closed.
     * @param tableId Id of the table which closed.
     */
    TableClosed: (tableId: number) => void;

    /**
     * Informs that table resumed.
     * @param tableId Id of the table which was resumed.
     */
    TableResumed: (tableId: number) => void;

    /**
     * Informs that table paused.
     * @param tableId Id of the table which paused.
     */
    TablePaused: (tableId: number) => void;

    /**
     * Inform about cards which could be opened.
     * @param tableId Id of the table where cards hinted.
     * @param cards String which represent cards.
     */
    FinalTableCardsOpened: (tableId: number, cards: string) => void;

    /**
     * Inform that table bet parameters changed.
     * @param tableId Id of the table where bet paramters changed.
     * @param smallBlind New value of small blind on the table
     * @param bigBlind New value of big blind on the table
     * @param ante New value of the ante on the table
     */
    TableBetParametersChanged: (tableId: number, smallBlind: number, bigBlind: number, ante: number) => void;

    /**
    * Inform that table game type changed.
    * @param tableId Id of the table where bet paramters changed.
    * @param gameType New value of the gametype on the table
    */
    TableGameTypeChanged: (tableId: number, gameType: number) => void;

    /**
     * Inform about table's tournament change.
     * @param tableId Id of the table which tournament changed.
     * @param tournamentId Id of the tournament to which table becomes belonging.
     */
    TableTournamentChanged: (tableId: number, tournamentId: number | null) => void;

    /**
     * Notifies that tournament status is changed
     * tournamentId Number Id of the tournament which status was changed.
     * status TournamentStatus New status of the tournament
     */
    TournamentStatusChanged: (tournamentId: number, status: TournamentStatus) => void;

    /**
     * Notifies that tournament table changed.
     * tournamentId Number Id of the tournament where table changed.
     * tableId Number Id of the table to which player should sit.
     */
    TournamentTableChanged: (tournamentId: number, tableId: number) => void;

    /**
     * Notifies that player finishing game in the tournament.
     * tournamentId Number Id of the tournament where player finish game.
     * placeTaken Number Place which player take in the tournament.
     */
    TournamentPlayerGameCompleted: (tournamentId: number, placeTaken: number) => void;

    /**
     * Notifies that tournament bet level changed.
     * tournamentId Number Id of the tournament where bet level changed.
     * level Number New bet level
     */
    TournamentBetLevelChanged: (tournamentId: number, level: number) => void;

    /**
     * Notifies that tournament round changed.
     * tournamentId Number Id of the tournament where round changed.
     * round Number Next tournament round.
     */
    TournamentRoundChanged: (tournamentId: number, round: number) => void;

    /**
     * Notifies that in tournament status for doing rebuy or addon.
     * tournamentId Number Id of the tournament round win by current player.
     * rebuyAllowed Boolean Indicates that rebuy allowed.
     * addonAllowed Boolean Indicates that add-on allowed.
     */
    TournamentRebuyStatusChanged: (tournamentId: number, rebuyAllowed: boolean, addonAllowed: boolean) => void;

    /**
     * Notifies that in tournament count of made rebuy or addons changed.
     * tournamentId Number Id of the tournament where count of rebuys/add-ons changed.
     * rebuyCount Count of rebuys which player done.
     * addonCount Count of add-ons which player done.
     */
    TournamentRebuyCountChanged: (tournamentId: number, rebuyCount: number, addonCount: number) => void;

    /**
     * Informs that tournament frozen.
     * @param tournamentId Id of the tournament which was frozen.
     */
    TournamentFrozen: (tournamentId: number) => void;

    /**
     * Informs that tournament unfrozen.
     * @param tournamentId Id of the tournament which was unfrozen.
     */
    TournamentUnfrozen: (tournamentId: number) => void;

    /**
     * Notifies that player registered in the tournament.
     * tournamentId Number Id of the tournament where player registered.
     */
    TournamentRegistration: (tournamentId: number) => void;

    /**
     * Notifies that player cancel registration in the tournament.
     * tournamentId Number Id of the tournament where player cancel registration.
     */
    TournamentRegistrationCancelled: (tournamentId: number) => void;
}

interface ChatHubServer {
    join(tableId: number);
    leave(tableId: number);
}

interface ChatHubClient {
    ChatConnected: (tableId: number, lastMessageId: number) => void;
    Message: (messageId: number, tableId: number, type: string, sender: string, message: string) => void;
    MessageChanged: (messageId: number, tableId: number, type: string, sender: string, message: string) => void;
}

/**
 * Table information in the lobby.
 */
interface LobbyTableItem {
    /**
     * Unique id of the table.
     */
    TableId: number;

    /**
     * Name of the table
     */
    TableName: string;

    SmallBlind: number;
    BigBlind: number;
    JoinedPlayers: number;
    MaxPlayers: number;
    PotLimitType: number;
    AveragePotSize: number;
    HandsPerHour: number;
    CurrencyId: number;
    SeatMask: number;
}

interface BaseRequest<T> {
    Status: string;
    Data: T;
}

interface OperationData {
    Amount: number;
    OperationDate: string;
    Operation: number;
    Comments: number;
    BookingOffice: string;
    Status: string;
}
