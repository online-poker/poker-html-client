import { getPostRequestInit, getRequestInit } from "./helper";

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
    Properties: any;
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
    public registerGuest(): Promise<RegisterGuestResponse> {
        throw new Error("Not implmented.");
    }
}
