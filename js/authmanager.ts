declare var host: string;
declare var appInsights: Client;

import { Account, setAuthToken } from "@poker/api-server";
import ko = require("knockout");
import { appConfig } from "./appconfig";
import { settings } from "./settings";

class AuthManager {
    public authenticated: KnockoutObservable<boolean>;
    public login: KnockoutObservable<string>;
    public loginId: KnockoutObservable<number>;

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

const authManager: AuthManager = new AuthManager();
export = authManager;
