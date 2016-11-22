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
        export namespace API {
            export enum MoneyType {
                Tenge = 1,
                GameChips = 2,
            };
            export let logging: boolean = false;
            export let version = 1;
            export class WebApiProxy {
                baseUrl: string;
                timeout = 5000;

                constructor(public host: string, public baseName: string) {
                    this.baseUrl = host + '/' + baseName + '/';
                }
                Call(methodName: string, parameters: any, successCallback: JQueryTypedCallback<any>): JQueryXHR {
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
                        dataType: 'json'
                    });
                }
                async CallAsync<T>(methodName: string, parameters: any) {
                    return new Promise<T>(function (resolve, reject) {
                        this.Call(methodName, parameters, null).then(resolve, reject);
                    });
                }
                SimpleCall<T>(methodName: string, successCallback: JQueryTypedCallback<T>): JQueryPromise<T> {
                    const data = {};
                    return <JQueryPromise<T>>this.Call(methodName, data, successCallback);
                }
                Log(api, msg) {
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

                Send(tableId: number, message: string, callback: JQueryTypedCallback<any>) {
                    const data = { tableId: tableId, message: message };
                    return super.Call('Send', data, callback);
                }
            }
            export class Message extends WebApiProxy {
                constructor(host) {
                    super(host, 'Message');
                }

                Send(recepient: number, subject: string, body: string, callback: JQueryTypedCallback<any>) {
                    const data = { Recipient: recepient, Subject: subject, Body: body };
                    return super.Call('Send', data, callback);
                }
                GetInboxMessages(page: number, pageSize: number, filter: number, sortOrder: boolean, callback: JQueryTypedCallback<any>) {
                    const data = { Page: page, PageSize: pageSize, Filter: filter, SortOrder: sortOrder };
                    return super.Call('GetInboxMessages', data, callback);
                }
                GetSentMessages(page: number, pageSize: number, filter: number, sortOrder: boolean, callback: JQueryTypedCallback<any>) {
                    const data = { Page: page, PageSize: pageSize, Filter: filter, SortOrder: sortOrder };
                    return super.Call('GetSentMessages', data, callback);
                }
                GetMessage(id: number, callback: JQueryTypedCallback<any>) {
                    const data = { Id: id };
                    return super.Call('GetMessage', data, callback);
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

                GetTables(fullTables: number | null, privateTables: number | null, maxPlayers: number | null, betLevels: number, moneyType: number, limitType: number,
                    callback?: (data: ApiResult<LobbyTableItem[]>, textStatus: string, jqXHR: JQueryXHR) => any) {
                    const data = {
                        FullTables: fullTables,
                        Private: privateTables,
                        MaxPlayers: maxPlayers,
                        BetLevels: betLevels,
                        MoneyType: moneyType,
                        LimitType: limitType
                    };
                    return <JQueryPromise<ApiResult<LobbyTableItem[]>>>super.Call('GetTables', data, callback);
                }
                async GetTablesAsync(fullTables: number | null, privateTables: number | null, maxPlayers: number | null, betLevels: number, moneyType: number, limitType: number) {
                    const data = {
                        FullTables: fullTables,
                        Private: privateTables,
                        MaxPlayers: maxPlayers,
                        BetLevels: betLevels,
                        MoneyType: moneyType,
                        LimitType: limitType
                    };
                    return super.CallAsync<ApiResult<LobbyTableItem[]>>('GetTables', data);
                }
                GetTable(tableId: number, callback?) {
                    const data = { TableId: tableId };
                    return <JQueryPromise<ApiResult<GameTableModel>>>super.Call('GetTable', data, callback);
                }
                GetSitingTables(callback?: JQueryTypedCallback<ApiResult<number[]>>) {
                    const data = {};
                    return <JQueryPromise<ApiResult<number[]>>>super.Call('GetSitingTables', data, callback);
                }
                Sit(tableId, seat, amount, callback) {
                    const data = { TableId: tableId, Seat: seat, Amount: amount };
                    return super.Call('Sit', data, callback);
                }
                SitAnywhere(tableId, amount, callback) {
                    const data = { TableId: tableId, Amount: amount };
                    return super.Call('SitAnywhere', data, callback);
                }
                Standup(tableId, callback) {
                    const data = { TableId: tableId };
                    return super.Call('Standup', data, callback);
                }
                Fold(tableId, callback) {
                    const data = { TableId: tableId };
                    return super.Call('Fold', data, callback);
                }
                CheckOrCall(tableId, callback) {
                    const data = { TableId: tableId };
                    return super.Call('CheckOrCall', data, callback);
                }
                BetOrRaise(tableId, amount, callback) {
                    const data = { TableId: tableId, Amount: amount };
                    return super.Call('BetOrRaise', data, callback);
                }
                ForceJoinGame(tableId: number, callback?) {
                    const data = { TableId: tableId };
                    return super.Call('ForceJoin', data, callback);
                }
                WaitBigBlind(tableId: number, callback?) {
                    const data = { TableId: tableId };
                    return super.Call('WaitBigBlind', data, callback);
                }
                AddBalance(tableId, amount, callback) {
                    const data = { TableId: tableId, Amount: amount };
                    return super.Call('AddBalance', data, callback);
                }
                SitOut(tableId: number, callback?) {
                    const data = { TableId: tableId };
                    return super.Call('SitOut', data, callback);
                }
                ForceSitout(tableId: number, callback?) {
                    const data = { TableId: tableId };
                    return super.Call('ForceSitout', data, callback);
                }
                ComeBack(tableId: number, callback?) {
                    const data = { TableId: tableId };
                    return super.Call('ComeBack', data, callback);
                }
                Muck(tableId: number, callback?) {
                    const data = { TableId: tableId };
                    return super.Call('Muck', data, callback);
                }
                ShowCards(tableId: number, callback?) {
                    const data = { TableId: tableId };
                    return super.Call('ShowCards', data, callback);
                }
                SetOpenCardsParameters(tableId: number, openCardsAutomatically: boolean, callback) {
                    const data = { TableId: tableId, OpenCardsAutomatically: openCardsAutomatically };
                    return super.Call('SetOpenCardsParameters', data, callback);
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

                GetTournaments(prizeCurrency, tournamentType, speed, buyin, maxPlayers,
                    callback?: (data: ApiResult<LobbyTournamentItem[]>, textStatus: string, jqXHR: JQueryXHR) => void) {
                    const data = {
                        TournamentType: tournamentType,
                        PrizeCurrency: prizeCurrency,
                        Speed: speed,
                        BuyIn: buyin,
                        MaxPlayers: maxPlayers
                    };
                    return <JQueryPromise<ApiResult<LobbyTournamentItem[]>>>super.Call('GetTournaments', data, callback);
                }

                GetTournament(tournamentId, callback?: JQueryTypedCallback<ApiResult<TournamentDefinition>>) {
                    const data = { Id: tournamentId };
                    return <JQueryPromise<ApiResult<TournamentDefinition>>>super.Call('GetTournament', data, callback);
                }

                Register(tournamentId, callback?: (data: StatusResponse, textStatus: string, jqXHR: JQueryXHR) => void) {
                    const data = { Id: tournamentId };
                    return super.Call('Register', data, callback);
                }

                CancelRegistration(tournamentId, callback?: (data: StatusResponse, textStatus: string, jqXHR: JQueryXHR) => void) {
                    const data = { Id: tournamentId };
                    return super.Call('CancelRegistration', data, callback);
                }

                Rebuy(tournamentId: number, double: boolean, callback?: JQueryTypedCallback<StatusResponse>) {
                    const data = { Id: tournamentId, Double: double };
                    return <JQueryPromise<StatusResponse>>super.Call('Rebuy', data, callback);
                }

                Addon(tournamentId: number, callback?: (data: StatusResponse, textStatus: string, jqXHR: JQueryXHR) => void) {
                    const data = { Id: tournamentId };
                    return <JQueryPromise<StatusResponse>>super.Call('Addon', data, callback);
                }

                GetRegisteredTournamentsStatus(callback?: JQueryTypedCallback<ApiResult<TournamentPlayerStateDefinition[]>>) {
                    const data = {};
                    // return super.SimpleCall('GetRegisteredTournamentsStatus', callback);
                    return <JQueryPromise<ApiResult<TournamentPlayerStateDefinition[]>>>
                        super.Call('GetRegisteredTournamentsStatus', data, callback);
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
                ActivateAccount(login, token, callback) {
                    const data = { Login: login, Token: token };
                    return super.Call('ActivateAccount', data, callback);
                }
                Logout(callback) {
                    const data = {};
                    authToken = null;
                    return super.Call('Logout', data, callback);
                }
                Authenticate(login, password, rememberMe, callback?: JQueryTypedCallback<AuthenticateResponse>) {
                    const data = { Login: login, Password: password, RememberMe: rememberMe };
                    const aquireTokenCallback = function (data: AuthenticateResponse, textStatus: string, xhr: JQueryXHR) {
                        authToken = xhr.getResponseHeader('X-Auth-Token');
                        console.log("Aquired auth token", authToken);
                        if (callback != null) {
                            callback(data, textStatus, xhr);
                        }
                    };
                    return <JQueryPromise<AuthenticateResponse>>super.Call('Authenticate', data, aquireTokenCallback);
                }
                CancelAccountActivation(login, token, callback) {
                    const data = { Login: login, Token: token };
                    return super.Call('CancelAccountActivation', data, callback);
                }
                ChangePassword(oldPassword, newPassword, callback?) {
                    const data = { OldPassword: oldPassword, NewPassword: newPassword };
                    return super.Call('ChangePassword', data, callback);
                }
                GetPersonalAccount(callback?) {
                    const data = {};
                    return <JQueryPromise<ApiResult<PersonalAccountData>>>super.Call('GetPersonalAccount', data, callback);
                }
                GetPlayerAccountHistory(fromDate, toDate, fromAmount, toAmount, operationType, callback) {
                    const data = {
                        FromDate: fromDate,
                        ToDate: toDate,
                        FromAmount: fromAmount,
                        ToAmount: toAmount,
                        OperationType: operationType
                    };
                    return super.Call('GetPlayerAccountHistory', data, callback);
                }
                GetPlayerDefinition(callback?: (data: ApiResult<PlayerDefinition>, textStatus: string, jqXHR: JQueryXHR) => void) {
                    const data = {};
                    return <JQueryPromise<ApiResult<PlayerDefinition>>>super.Call('GetPlayerDefinition', data, callback);
                }
                PutWithdrawalRequest(type, amount, parameters, callback) {
                    const data = { Type: type, Amount: amount, Parameters: parameters };
                    return super.Call('PutWithdrawalRequest', data, callback);
                }
                Register(login, email, password, firstName, lastName, patronymicName, country, city, additionalProperties, image,
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
                        AdditionalProperties: additionalProperties
                    };
                    return $.ajax({
                        type: 'POST',
                        url: url,
                        data: JSON.stringify(data),
                        success: callback,
                        crossDomain: true,
                        contentType: 'application/json',
                        beforeSend: beforeSendHandler,
                        dataType: 'json'
                    });
                }
                RequestResetPassword(login, email, callback) {
                    const data = { Login: login, Email: email };
                    return super.Call('RequestResetPassword', data, callback);
                }
                ResetAvatar(callback) {
                    const data = {};
                    return super.Call('ResetAvatar', data, callback);
                }
                ResetPassword(token, newPassword, callback) {
                    const data = { Token: token, Password: newPassword };
                    return super.Call('ResetPassword', data, callback);
                }
                SetAvatarUrl(url, callback?) {
                    const data = { Url: url };
                    return super.Call('SetAvatarUrl', data, callback);
                }
                UpdatePlayerProfile(firstName, lastName, patronymicName, email, country, city, image, callback) {
                    throw new Error('Calls with multipart data not supported');
                }
                UploadAvatar(image, callback?) {
                    throw new Error('Calls with multipart data not supported');
                }
                GetBestPlayers(callback?) {
                    const data = {};
                    return super.Call('GetBestPlayers', data, callback);
                }
                RegisterGuest(callback?) {
                    const data = {};
                    return <JQueryPromise<RegisterGuestResponse>>super.Call('RegisterGuest', data, callback);
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
                GetServerLayout(callback = null) {
                    const data = {};
                    return super.Call('GetServerLayout', data, callback);
                }
                GetDefaultAvatars(callback = null) {
                    const data = {};
                    return super.Call('GetDefaultAvatars', data, callback);
                }
                GetWellKnownBetStructure(callback = null) {
                    const data = {};
                    return super.Call('GetWellKnownBetStructure', data, callback);
                }
                GetWellKnownPrizeStructure(callback = null) {
                    const data = {};
                    return super.Call('GetWellKnownPrizeStructure', data, callback);
                }
                GetNews(callback = null) {
                    const data = {};
                    return super.Call('GetNews', data, callback);
                }
                GetOnlinePlayers(callback = null) {
                    const data = {};
                    return <JQueryPromise<ApiResult<number[]>>>super.Call('GetOnlinePlayers', data, callback);
                }
                GetBanners(format, callback = null) {
                    const data = { Format: format};
                    return super.Call('GetBanners', data, callback);
                }
                /**
                * Request server date.
                * @param callback A callback function that is executed if the request succeeds.
                */
                GetDate(callback = null) {
                    const data = { };
                    return <JQueryPromise<number>>super.Call('GetDate', data, callback);
                }
                /**
                * Perform version check.
                * @param callback A callback function that is executed if the request succeeds.
                */
                VersionCheck(callback: JQueryTypedCallback<any> = null) {
                    const data = {};
                    return <JQueryPromise<VersionCheckResponse>>super.Call('VersionCheck', data, callback);
                }
            }
            export class Support extends WebApiProxy {
                constructor(host) {
                    super(host, 'Support');
                }

                ContactUs(fullName: string, email: string, subject: string, message: string,
                    callback?: JQueryTypedCallback<StatusResponse>) {
                    const data = {
                        FullName: fullName,
                        Email: email,
                        Subject: subject,
                        Body: message
                    };
                    return <JQueryPromise<StatusResponse>>super.Call('ContactUs', data, callback);
                }
            }
        }
    }
}


