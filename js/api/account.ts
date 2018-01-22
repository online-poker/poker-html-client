import { getDeleteRequestInit, getPostRequestInit, getPutRequestInit, getRequestInit } from "./helper";

/**
 * Response for the RegisterGuest API call.
 */
export interface AuthenticateResponse extends StatusResponse {
    /**
     * Id of the authorized user, or 0 otherwise.
     */
    Id: number;

    /**
     * A value indicating whether this user is guest or not.
     */
    IsGuest: boolean;

    /**
     * First name of the user.
     */
    FirstName: string;

    /**
     * Last name of the user.
     */
    LastName: string;

    /**
     * Patronymic name of the user.
     */
    PatronymicName: string;

    /**
     * Login of the user.
     */
    Login: string;

    /**
     * Money which player has in different currencies.
     */
    Money: number[];

    /**
     * Email of the user.
     */
    Email: string;

    /**
     * Country of the user.
     */
    Country: string;

    /**
     * City of the user
     */
    City: string;

    /**
     * Url of the image to display in the UI
     */
    ImageUrl: string;

    /**
     * Gets or sets additional properties for the player.
     */
    Properties: Map<string, string>;
}

export interface PersonalAccountData {
    RealMoney: number;
    RealMoneyReserve: number;
    GameMoney: number;
    GameMoneyReserve: number;

    /**
     * Amount of points
     */
    Points: number;
    LastIncomeDate: string;
    LastIncomeAmount: number;
    LastRequestNumber: number;
}

export class Account {
    constructor(public host: string) {
    }
    public async logout() {
        const data = { };
        const response = await fetch(this.host + `/api/account/my/logout`, getPostRequestInit());
        const jsonData = await response.json() as StatusResponse;
        return jsonData;
    }
    public async authenticate(login: string, password: string, rememberMe: boolean) {
        const data = { Login: login, Password: password, RememberMe: rememberMe };
        const init = getPostRequestInit(data);
        init.credentials = "include";
        const response = await fetch(this.host + `/api/account/my/login`, init);
        authToken = response.headers.get("X-Auth-Token");
        console.log("Aquired auth token", authToken);
        const jsonData = await response.json() as AuthenticateResponse;
        return jsonData;
    }
    public async activateAccount(login: string, token: string) {
        const data = { Token: token };
        const response = await fetch(this.host + `/api/activations/${login}`, getPostRequestInit(data));
        const jsonData = await response.json() as StatusResponse;
        return jsonData;
    }
    public async cancelAccountActivation(login, token) {
        const data = { Token: token };
        const response = await fetch(this.host + `/api/activations/${login}`, getDeleteRequestInit(data));
        const jsonData = await response.json() as StatusResponse;
        return jsonData;
    }
    public async changePassword(oldPassword: string, newPassword: string) {
        const data = { OldPassword: oldPassword, NewPassword: newPassword };
        const response = await fetch(this.host + `/api/account/my/password`, getPostRequestInit(data));
        const jsonData = await response.json() as StatusResponse;
        return jsonData;
    }
    public async getAccount() {
        const response = await fetch(this.host + `/api/account/my`, getRequestInit());
        const jsonData = await response.json() as ApiResult<PersonalAccountData>;
        return jsonData;
    }
    public async getPlayer(): Promise<ApiResult<PlayerDefinition>> {
        const response = await fetch(this.host + `/api/account/my/detailed`, getRequestInit());
        const jsonData = await response.json() as ApiResult<PlayerDefinition>;
        return jsonData;
    }
    public async getAccountHistory(fromDate, toDate, fromAmount, toAmount, operationType): Promise<ApiResult<OperationData[]>> {
        const response = await fetch(this.host + `/api/account/my/history?fromDate=${fromDate}&toDate=${toDate}&fromAmount=${fromAmount}&toAmount=${toAmount}&operationType=${operationType}`, getRequestInit());
        const jsonData = await response.json() as ApiResult<OperationData[]>;
        return jsonData;
    }
    public async registerGuest(): Promise<RegisterGuestResponse> {
        const response = await fetch(this.host + `/api/registration/guests`, getPostRequestInit());
        const jsonData = await response.json() as RegisterGuestResponse;
        return jsonData;
    }
    public async register(
        login: string,
        email: string,
        password: string,
        phoneNumber: string,
        firstName: string,
        lastName: string,
        patronymicName: string,
        country: number,
        city: string,
        additionalProperties: any): Promise<StatusResponse> {
        const data = {
            login,
            email,
            password,
            phoneNumber,
            firstName,
            lastName,
            patronymicName,
            country,
            city,
            additionalProperties,
        };
        const response = await fetch(this.host + `/api/registration`, getPostRequestInit(data));
        const jsonData = await response.json() as StatusResponse;
        return jsonData;
    }
    public async registrationCheck(
        login: string,
        email: string): Promise<StatusResponse> {
        const data = {
            login,
            email,
        };
        const response = await fetch(this.host + `/api/registration/check`, getPostRequestInit(data));
        const jsonData = await response.json() as StatusResponse;
        return jsonData;
    }
    public async requestResetPassword(login, email): Promise<StatusResponse> {
        const data = {
            login,
            email,
        };
        const response = await fetch(this.host + `/api/account/password-reset/requests`, getPostRequestInit(data));
        const jsonData = await response.json() as StatusResponse;
        return jsonData;
    }
    public async resetPassword(token, newPassword): Promise<StatusResponse> {
        const data = {
            password: newPassword,
        };
        const response = await fetch(this.host + `/api/account/password-reset/requests/${token}`, getPostRequestInit(data));
        const jsonData = await response.json() as StatusResponse;
        return jsonData;
    }
    public async resetAvatar() {
        const response = await fetch(this.host + `/api/accont/avatar`, getDeleteRequestInit());
        const jsonData = await response.json() as StatusResponse;
        return jsonData;
    }
    public async setAvatarUrl(url) {
        const data = { url };
        const response = await fetch(this.host + `/api/accont/avatar/url`, getPutRequestInit(data));
        const jsonData = await response.json() as StatusResponse;
        return jsonData;
    }
    public async updatePlayerProfile(phoneNumber: string, firstName: string, lastName: string, patronymicName: string, email: string, country, city) {
        const data = { phoneNumber, firstName, lastName, patronymicName, email, country, city };
        const response = await fetch(this.host + `/api/accont/profile`, getPostRequestInit(data));
        const jsonData = await response.json() as StatusResponse;
        return jsonData;
    }
    public uploadAvatar(image) {
        throw new Error("Not implmented.");
    }
    public async getBestPlayers(): Promise<ApiResult<UserRating[]>> {
        const response = await fetch(this.host + `/api/players/best`, getRequestInit());
        const jsonData = await response.json() as ApiResult<UserRating[]>;
        return jsonData;
    }
}
