declare var host: string;

import { Account, setAuthToken } from "@poker/api-server";
import ko = require("knockout");
import { appConfig } from "./appconfig";
import { settings } from "./settings";

export interface IDisposable {
    dispose(): void;
}

/**
 * Provides information about authentication status for application user.
 */
export interface IAuthenticationInformation {
    /**
     * Returns information about current login.
     */
    login(): string;

    /**
     * Returns information about id of the current login.
     */
    loginId(): number;

    /**
     * Returns authentication status of the application user.
     */
    authenticated(): boolean;

    /**
     * Register handler function for the authentication state change.
     * @param handler Function which would be called when authentication state is changed.
     * @returns Object which allow disposing of the subscription
     */
    registerAuthenticationChangedHandler(handler: (authenticated: boolean) => void): IDisposable;
}

/**
 * Controls authentication of the application user.
 */
export interface IAuthenticationManager {
    /**
     * Authenticate user with given password and return status of operation.
     * @param login Login which use for authentication.
     * @param password Password which user for login.
     * @param rememberMe Value indicating whether remember user in manager.
     * @returns Promise with status code of operation.
     */
    authenticate(login: string, password: string, rememberMe: boolean): Promise<string>;
    /**
     * Logout currently authenticated user.
     */
    logout(): void;
    /**
     * Initiate login as guest request to server.
     */
    loginAsGuest(): Promise<string>;
}

export class AuthManager implements IAuthenticationInformation, IAuthenticationManager {
    /**
     * Returns authentication status of the application user.
     */
    public authenticated: ko.Observable<boolean>;

    /**
     * Returns information about current login.
     */
    public login: ko.Observable<string>;

    /**
     * Returns information about id of the current login.
     */
    public loginId: ko.Observable<number>;

    constructor() {
        this.authenticated = ko.observable(false);
        this.login = ko.observable<string>();
        this.loginId = ko.observable<number>();
    }

    /**
     * Authenticate user with given password and return status of operation.
     * @param login Login which use for authentication.
     * @param password Password which user for login.
     * @param rememberMe Value indicating whether remember user in manager.
     * @returns Promise with status code of operation.
     */
    public async authenticate(login: string, password: string, rememberMe: boolean = false): Promise<string> {
        const accountApi = new Account(host);
        if (rememberMe) {
            settings.login(login);
            settings.password(password);
            settings.saveSettings();
        }

        try {
            const data = await accountApi.authenticate(login, password, false);
            if (data.Status === "Ok") {
                this.authenticated(true);
                this.login(data.Login);
                this.loginId(data.Id);
                settings.isGuest(data.IsGuest);
                settings.saveSettings();
                if (appConfig.game.seatMode) {
                    // tslint:disable-next-line:no-string-literal
                    appInsights.context["device"].model = "Individual Console: " + login;
                }
            } else {
                // Report authentication or authorization errors
                this.authenticated(false);
                this.login(null);
                this.loginId(null);
            }

            return data.Status;
        } catch (e) {
            return "";
        }
    }

    /**
     * Register handler function for the authentication state change.
     * @param handler Function which would be called when authentication state is changed.
     * @returns Object which allow disposing of the subscription
     */
    public registerAuthenticationChangedHandler(handler: (authenticated: boolean) => void): IDisposable {
        return this.authenticated.subscribe(handler);
    }

    /**
     * Logout currently authenticated user.
     */
    public logout() {
        settings.login(null);
        settings.password(null);
        settings.saveSettings();

        setAuthToken(null);
        this.authenticated(false);
        this.login(null);
    }
    /**
     * Initiate login as guest request to server.
     */
    public async loginAsGuest(): Promise<string> {
        const accountApi = new Account(host);
        try {
            const value = await accountApi.registerGuest();
            if (!value) {
                return "";
            } else {
                settings.login(value.Login);
                settings.password(value.Password);
                settings.saveSettings();
                if (value.Status === "Ok") {
                    return await this.authenticate(value.Login, value.Password, true);
                } else {
                    return value.Status;
                }
            }
        } catch (e) {
            return "";
        }
    }
}

export const authManager: AuthManager = new AuthManager();
