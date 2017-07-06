/// <reference path="poker.commanding.api.ts" />

declare var apiHost: string;
declare var appInsights: Client;

import ko = require("knockout");
import { settings } from "./settings";
import { App } from "./app";
import { appConfig } from "./appConfig";

declare const app: App;

class AuthManager {
    authenticated: KnockoutObservable<boolean>;
    login: KnockoutObservable<string>;
    loginId: KnockoutObservable<number>;

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
        const accountApi = new OnlinePoker.Commanding.API.Account(apiHost);
        if (rememberMe) {
            settings.login(login);
            settings.password(password);
            settings.saveSettings();
        }

        try {
            const data = await accountApi.Authenticate(login, password, false);
            if (data.Status === "Ok") {
                this.authenticated(true);
                this.login(data.Login);
                this.loginId(data.Id);
                settings.isGuest(data.IsGuest);
                settings.saveSettings();
                if (appConfig.game.seatMode) {
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
    logout() {
        settings.login(null);
        settings.password(null);
        settings.saveSettings();

        authToken = null;
        this.authenticated(false);
        this.login(null);
    }
    /**
     * Initiate login as guest request to server.
     */
    async loginAsGuest(): Promise<string> {
        const accountApi = new OnlinePoker.Commanding.API.Account(apiHost);
        try {
            const value = await accountApi.RegisterGuest();
            if (!value) {
                return "";
            } else {
                settings.login(value.Login);
                settings.password(value.Password);
                settings.saveSettings();
                app.processing(false);
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
