/* tslint:disable:quotemark */
declare var authToken: string;
const beforeSendHandler = function (xhr) {
    xhr.withCredentials = true;
    if (authToken != null) {
        xhr.setRequestHeader("X-Auth-Token", authToken);
    }
};

interface JQueryTypedCallback<T> {
    (data: T, textStatus: string, xhr: JQueryXHR): void;
}

enum TournamentStatus {
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

/**
 * Represents player status in the tournament.
 */
enum TournamentPlayerStatus {
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
    Completed
}

enum TournamentOptionsEnum {
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

namespace OnlinePoker {
    export namespace Commanding {
        // tslint:disable-next-line:no-namespace
        export namespace API {
            export enum MoneyType {
                Tenge = 1,
                GameChips = 2,
            };
            export let logging: boolean = false;
            export let version = 1;
            export class WebApiProxy {
                public baseUrl: string;
                public timeout = 5000;

                constructor(public host: string, public baseName: string) {
                    this.baseUrl = host + '/' + baseName + '/';
                }
                public Call(methodName: string, parameters: any, successCallback: JQueryTypedCallback<any>): JQueryXHR {
                    const self = this;
                    let parametersString = "null";
                    if (parameters != null) {
                        parametersString = JSON.stringify(parameters);
                    }

                    this.Log(this.baseName, "Method " + methodName + " called. Parameters: " + parametersString);
                    const url = this.baseUrl + methodName;
                    return $.ajax({
                        type: 'POST',
                        url: url,
                        data: JSON.stringify(parameters),
                        success: (data, textStatus, jqXHR) => {
                            const dataString = data != null ? JSON.stringify(data) : "NULL";
                            textStatus = textStatus != null ? textStatus : "NULL";

                            const logMessage = "Method " + methodName + " finished. Status: " + textStatus + ". Results: " + dataString;
                            self.Log(self.baseName, logMessage);
                            if (successCallback != null) {
                                successCallback(data, textStatus, jqXHR);
                            }
                        },
                        timeout: this.timeout,
                        crossDomain: true,
                        async: true,
                        contentType: 'application/json',
                        beforeSend: beforeSendHandler,
                        dataType: 'json',
                    });
                }
                public async getAsync<T>(methodName: string, parameters: any): Promise<T> {
                    const self = this;
                    let parametersString = "null";
                    if (parameters != null) {
                        parametersString = JSON.stringify(parameters);
                    }

                    this.Log(this.baseName, "Method " + methodName + " called. Parameters: " + parametersString);
                    const url = this.baseUrl + methodName;
                    return await $.ajax({
                        type: 'GET',
                        url: url,
                        data: parameters,
                        success: (data, textStatus, jqXHR) => {
                            const dataString = data != null ? JSON.stringify(data) : "NULL";
                            textStatus = textStatus != null ? textStatus : "NULL";

                            const logMessage = `Method ${methodName} finished. Status: ${textStatus}. Results: ${dataString}`;
                            this.Log(self.baseName, logMessage);
                        },
                        timeout: this.timeout,
                        crossDomain: true,
                        async: true,
                        contentType: 'application/json',
                        beforeSend: beforeSendHandler,
                        dataType: 'json',
                    });
                }
                public async putAsync<T>(methodName: string, parameters: any): Promise<T> {
                    const self = this;
                    let parametersString = "null";
                    if (parameters != null) {
                        parametersString = JSON.stringify(parameters);
                    }

                    this.Log(this.baseName, "Method " + methodName + " called. Parameters: " + parametersString);
                    const url = this.baseUrl + methodName;
                    return await $.ajax({
                        type: 'PUT',
                        url: url,
                        data: parameters,
                        success: (data, textStatus, jqXHR) => {
                            const dataString = data != null ? JSON.stringify(data) : "NULL";
                            textStatus = textStatus != null ? textStatus : "NULL";

                            const logMessage = `Method ${methodName} finished. Status: ${textStatus}. Results: ${dataString}`;
                            this.Log(self.baseName, logMessage);
                        },
                        timeout: this.timeout,
                        crossDomain: true,
                        async: true,
                        contentType: 'application/json',
                        beforeSend: beforeSendHandler,
                    });
                }
                public async deleteAsync<T>(methodName: string, parameters: any): Promise<T> {
                    const self = this;
                    let parametersString = "null";
                    if (parameters != null) {
                        parametersString = JSON.stringify(parameters);
                    }

                    this.Log(this.baseName, "Method " + methodName + " called. Parameters: " + parametersString);
                    const url = this.baseUrl + methodName;
                    return await $.ajax({
                        type: 'DELETE',
                        url: url,
                        data: parameters,
                        success: (data, textStatus, jqXHR) => {
                            const dataString = data != null ? JSON.stringify(data) : "NULL";
                            textStatus = textStatus != null ? textStatus : "NULL";

                            const logMessage = `Method ${methodName} finished. Status: ${textStatus}. Results: ${dataString}`;
                            this.Log(self.baseName, logMessage);
                        },
                        timeout: this.timeout,
                        crossDomain: true,
                        async: true,
                        contentType: 'application/json',
                        beforeSend: beforeSendHandler,
                    });
                }
                public async CallAsync<T>(methodName: string, parameters: any) {
                    return new Promise<T>((resolve, reject) => {
                        this.Call(methodName, parameters, null).then(resolve, reject);
                    });
                }
                public Log(api, msg) {
                    if (API.logging === false) {
                        return;
                    }

                    if (typeof (window.console) === "undefined") {
                        return;
                    }

                    const m = "[" + new Date().toTimeString() + "] OnlinePoker API(" + this.baseName + "): " + msg;
                    if (window.console.debug) {
                        window.console.debug(m);
                    } else if (window.console.log) {
                        window.console.log(m);
                    }
                }
            }
            export class Chat extends WebApiProxy {
                constructor(host) {
                    super(host, 'Chat');
                }

                public SendAsync(tableId: number, message: string): Promise<StatusResponse> {
                    const data = { tableId: tableId, message: message };
                    return super.CallAsync<StatusResponse>('Send', data);
                }
            }
            export class Message extends WebApiProxy {
                constructor(host) {
                    super(host, 'Message');
                }

                public Send(recepient: number, subject: string, body: string) {
                    const data = { Recipient: recepient, Subject: subject, Body: body };
                    return super.CallAsync('Send', data);
                }
                public GetInboxMessages(page: number, pageSize: number, filter: number, sortOrder: boolean) {
                    const data = { Page: page, PageSize: pageSize, Filter: filter, SortOrder: sortOrder };
                    return super.CallAsync<ApiResult<InboxMessagesData>>('GetInboxMessages', data);
                }
                public GetSentMessages(page: number, pageSize: number, filter: number, sortOrder: boolean) {
                    const data = { Page: page, PageSize: pageSize, Filter: filter, SortOrder: sortOrder };
                    return super.CallAsync('GetSentMessages', data);
                }
                public GetMessage(id: number) {
                    const data = { Id: id };
                    return super.CallAsync('GetMessage', data);
                }
            }
            export class Game extends WebApiProxy {
                /**
                 * Wrapper for the Game Commanding API
                 * @param host Host with Metadata Commanding API installed
                 */
                constructor(host) {
                    super(host, 'Game');
                }

                public GetTables(
                    fullTables: number | null,
                    privateTables: number | null,
                    maxPlayers: number | null,
                    betLevels: number,
                    moneyType: number,
                    limitType: number) {
                    const data = {
                        FullTables: fullTables,
                        Private: privateTables,
                        MaxPlayers: maxPlayers,
                        BetLevels: betLevels,
                        MoneyType: moneyType,
                        LimitType: limitType,
                    };
                    return super.CallAsync<ApiResult<LobbyTableItem[]>>('GetTables', data);
                }
                public GetTable(tableId: number) {
                    const data = { TableId: tableId };
                    return super.CallAsync<ApiResult<GameTableModel>>('GetTable', data);
                }
                public GetSitingTables() {
                    const data = {};
                    return super.CallAsync<ApiResult<number[]>>('GetSitingTables', data);
                }
                public Sit(tableId: number, seat: number, amount: number, ticketCode: string) {
                    const data = { TableId: tableId, Seat: seat, Amount: amount, TicketCode: ticketCode };
                    return super.CallAsync<SitResponse>('Sit', data);
                }
                public SitAnywhere(tableId, amount) {
                    const data = { TableId: tableId, Amount: amount };
                    return super.CallAsync<SitResponse>('SitAnywhere', data);
                }
                public async Standup(tableId) {
                    const data = { TableId: tableId };
                    return await super.CallAsync<StatusResponse>('Standup', data);
                }
                public Fold(tableId) {
                    const data = { TableId: tableId };
                    return super.CallAsync<StatusResponse>('Fold', data);
                }
                public CheckOrCall(tableId) {
                    const data = { TableId: tableId };
                    return super.CallAsync<StatusResponse>('CheckOrCall', data);
                }
                public BetOrRaise(tableId, amount) {
                    const data = { TableId: tableId, Amount: amount };
                    return super.CallAsync<StatusResponse>('BetOrRaise', data);
                }
                public ForceJoinGame(tableId: number) {
                    const data = { TableId: tableId };
                    return super.CallAsync<StatusResponse>('ForceJoin', data);
                }
                public WaitBigBlind(tableId: number) {
                    const data = { TableId: tableId };
                    return super.CallAsync<StatusResponse>('WaitBigBlind', data);
                }
                public AddBalance(tableId: number, amount: number, ticketCode: string) {
                    const data = { TableId: tableId, Amount: amount, TicketCode: ticketCode };
                    return super.CallAsync<StatusResponse>('AddBalance', data);
                }
                public SitOut(tableId: number) {
                    const data = { TableId: tableId };
                    return super.CallAsync<StatusResponse>('SitOut', data);
                }
                public ForceSitout(tableId: number) {
                    const data = { TableId: tableId };
                    return super.CallAsync<StatusResponse>('ForceSitout', data);
                }
                public ComeBack(tableId: number) {
                    const data = { TableId: tableId };
                    return super.CallAsync<StatusResponse>('ComeBack', data);
                }
                public Muck(tableId: number) {
                    const data = { TableId: tableId };
                    return super.CallAsync<StatusResponse>('Muck', data);
                }
                public ShowCards(tableId: number) {
                    const data = { TableId: tableId };
                    return super.CallAsync<StatusResponse>('ShowCards', data);
                }
                public ShowHoleCards(tableId: number, cardPosition: number) {
                    const data = { TableId: tableId, CardPosition: cardPosition };
                    return super.CallAsync<StatusResponse>('ShowHoleCards', data);
                }
                public SetOpenCardsParameters(tableId: number, openCardsAutomatically: boolean) {
                    const data = { TableId: tableId, OpenCardsAutomatically: openCardsAutomatically };
                    return super.CallAsync('SetOpenCardsParameters', data);
                }
            }
            export class Tournament extends WebApiProxy {
                /**
                 * Wrapper for the Tournament Commanding API
                 * @param host Host with Tournament Commanding API installed
                 */
                constructor(host) {
                    super(host, 'Tournament');
                }

                public GetTournaments(prizeCurrency, tournamentType, speed, buyin, maxPlayers) {
                    const data = {
                        TournamentType: tournamentType,
                        PrizeCurrency: prizeCurrency,
                        Speed: speed,
                        BuyIn: buyin,
                        MaxPlayers: maxPlayers,
                    };
                    return super.CallAsync<ApiResult<LobbyTournamentItem[]>>('GetTournaments', data);
                }

                public GetTournament(tournamentId) {
                    const data = { Id: tournamentId };
                    return super.CallAsync<ApiResult<TournamentDefinition>>('GetTournament', data);
                }

                public Register(tournamentId) {
                    const data = { Id: tournamentId };
                    return super.CallAsync<StatusResponse>('Register', data);
                }

                public CancelRegistration(tournamentId) {
                    const data = { Id: tournamentId };
                    return super.CallAsync<StatusResponse>('CancelRegistration', data);
                }

                public Rebuy(tournamentId: number, double: boolean) {
                    const data = { Id: tournamentId, Double: double };
                    return super.CallAsync<StatusResponse>('Rebuy', data);
                }

                public Addon(tournamentId: number) {
                    const data = { Id: tournamentId };
                    return super.CallAsync<StatusResponse>('Addon', data);
                }

                public GetRegisteredTournamentsStatus(): Promise<ApiResult<TournamentPlayerStateDefinition[]>> {
                    const data = {};
                    // return super.SimpleCall('GetRegisteredTournamentsStatus', callback);
                    return super.CallAsync('GetRegisteredTournamentsStatus', data);
                }
            }
            export class Account extends WebApiProxy {
                /**
                 * Wrapper for the Account Commanding API
                 * @param host Host with Account Commanding API installed
                 */
                constructor(host) {
                    super(host, 'Account');
                }
                public ActivateAccount(login, token) {
                    const data = { Login: login, Token: token };
                    return super.CallAsync('ActivateAccount', data);
                }
                public Logout() {
                    const data = {};
                    authToken = null;
                    return super.CallAsync('Logout', data);
                }
                public Authenticate(login, password, rememberMe, callback?: JQueryTypedCallback<AuthenticateResponse>) {
                    const data = { Login: login, Password: password, RememberMe: rememberMe };
                    const aquireTokenCallback = function (
                        // tslint:disable-next-line:no-shadowed-variable
                        data: AuthenticateResponse,
                        textStatus: string,
                        xhr: JQueryXHR) {
                        authToken = xhr.getResponseHeader('X-Auth-Token');
                        console.log("Aquired auth token", authToken);
                        if (callback != null) {
                            callback(data, textStatus, xhr);
                        }
                    };
                    return <JQueryPromise<AuthenticateResponse>>super.Call('Authenticate', data, aquireTokenCallback);
                }
                public CancelAccountActivation(login, token) {
                    const data = { Login: login, Token: token };
                    return super.CallAsync('CancelAccountActivation', data);
                }
                public ChangePassword(oldPassword, newPassword) {
                    const data = { OldPassword: oldPassword, NewPassword: newPassword };
                    return super.CallAsync<StatusResponse>('ChangePassword', data);
                }
                public GetPersonalAccount() {
                    const data = {};
                    return super.CallAsync<ApiResult<PersonalAccountData>>('GetPersonalAccount', data);
                }
                public GetPlayerAccountHistory(fromDate, toDate, fromAmount, toAmount, operationType) {
                    const data = {
                        FromDate: fromDate,
                        ToDate: toDate,
                        FromAmount: fromAmount,
                        ToAmount: toAmount,
                        OperationType: operationType,
                    };
                    return super.CallAsync<ApiResult<OperationData[]>>('GetPlayerAccountHistory', data);
                }
                public GetPlayerDefinition() {
                    const data = {};
                    return super.CallAsync<ApiResult<PlayerDefinition>>('GetPlayerDefinition', data);
                }
                public PutWithdrawalRequest(type, amount, parameters) {
                    const data = { Type: type, Amount: amount, Parameters: parameters };
                    return super.CallAsync('PutWithdrawalRequest', data);
                }
                public Register(
                    login, email, password, firstName, lastName, patronymicName,
                    country, city, additionalProperties, image,
                    callback) {
                    const url = this.baseUrl + 'Register';
                    const data = {
                        Login: login,
                        Email: email,
                        Password: password,
                        FirstName: firstName,
                        LastName: lastName,
                        PatronymicName: patronymicName,
                        Country: country,
                        City: city,
                        Image: image,
                        AdditionalProperties: additionalProperties,
                    };
                    return $.ajax({
                        type: 'POST',
                        url: url,
                        data: JSON.stringify(data),
                        success: callback,
                        crossDomain: true,
                        contentType: 'application/json',
                        beforeSend: beforeSendHandler,
                        dataType: 'json',
                    });
                }
                public RequestResetPassword(login, email) {
                    const data = { Login: login, Email: email };
                    return super.CallAsync<StatusResponse>('RequestResetPassword', data);
                }
                public ResetAvatar() {
                    const data = {};
                    return super.CallAsync('ResetAvatar', data);
                }
                public ResetPassword(token, newPassword) {
                    const data = { Token: token, Password: newPassword };
                    return super.CallAsync<StatusResponse>('ResetPassword', data);
                }
                public SetAvatarUrl(url) {
                    const data = { Url: url };
                    return super.CallAsync('SetAvatarUrl', data);
                }
                public UpdatePlayerProfile(firstName, lastName, patronymicName, email, country, city, image) {
                    throw new Error('Calls with multipart data not supported');
                }
                public UploadAvatar(image) {
                    throw new Error('Calls with multipart data not supported');
                }
                public GetBestPlayers() {
                    const data = {};
                    return super.CallAsync<ApiResult<UserRating[]>>('GetBestPlayers', data);
                }
                public RegisterGuest() {
                    const data = {};
                    return super.CallAsync<RegisterGuestResponse>('RegisterGuest', data);
                }
            }
            export class Metadata extends WebApiProxy {
                /**
                 * Wrapper for the Metadata Commanding API
                 * @param host Host with Metadata Commanding API installed
                 */
                constructor(host) {
                    super(host, 'Metadata');
                    this.timeout = 10000;
                }
                public GetServerLayout() {
                    const data = {};
                    return super.CallAsync('GetServerLayout', data);
                }
                public GetDefaultAvatars() {
                    const data = {};
                    return super.CallAsync<AvatarsResponse>('GetDefaultAvatars', data);
                }
                public GetWellKnownBetStructure() {
                    const data = {};
                    return super.CallAsync<ApiResult<TournamentBetStructure[][]>>('GetWellKnownBetStructure', data);
                }
                public GetWellKnownPrizeStructure() {
                    const data = {};
                    return super.CallAsync<ApiResult<TournamentPrizeStructure[][]>>('GetWellKnownPrizeStructure', data);
                }
                public GetNews() {
                    const data = {};
                    return super.CallAsync<ApiResult<string[]>>('GetNews', data);
                }
                public GetOnlinePlayers() {
                    const data = {};
                    return super.CallAsync<ApiResult<number[]>>('GetOnlinePlayers', data);
                }
                public GetBanners(format) {
                    const data = { Format: format };
                    return super.CallAsync<ApiResult<BannerData[]>>('GetBanners', data);
                }
                /**
                 * Request server date.
                 */
                public GetDate() {
                    const data = {};
                    return super.CallAsync<number>('GetDate', data);
                }
                /**
                 * Perform version check.
                 */
                public VersionCheck() {
                    const data = {};
                    return super.CallAsync<VersionCheckResponse>('VersionCheck', data);
                }
            }
            export class Support extends WebApiProxy {
                constructor(host) {
                    super(host, 'Support');
                }

                public ContactUs(fullName: string, email: string, subject: string, message: string) {
                    const data = {
                        FullName: fullName,
                        Email: email,
                        Subject: subject,
                        Body: message,
                    };
                    return super.CallAsync<StatusResponse>('ContactUs', data);
                }
            }
            export class TableReload extends WebApiProxy {
                constructor(host) {
                    super(host, 'server/api');
                }

                public async getTableReload(tableId: number) {
                    return await super.getAsync<TableReloadInformation>(`reload/${tableId}`, {});
                }

                public async confirmEmergencyReload(tableId: number) {
                    return await super.deleteAsync<void>(`reload/${tableId}/table/emergency`, {});
                }

                public async confirmTableReload(tableId: number) {
                    return await super.putAsync<void>(`reload/${tableId}/table`, {});
                }

                public async confirmSeatReload(tableId: number, seatId: number) {
                    return await super.putAsync<void>(`reload/${tableId}/seats/${seatId}`, {});
                }
            }
        }
    }
}
