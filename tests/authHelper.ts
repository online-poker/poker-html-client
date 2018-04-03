import { AuthManager, IAuthenticationInformation, IDisposable } from "poker/authmanager";

export const notAuthenticated: IAuthenticationInformation = {
    login: () => null,
    loginId: () => null,
    authenticated: () => false,
    registerAuthenticationChangedHandler(handler: (authenticated: boolean) => void): IDisposable {
        return;
    },
};

export const Authenticated: IAuthenticationInformation = {
    login: () => "player1",
    loginId: () => 1,
    authenticated: () => true,
    registerAuthenticationChangedHandler(handler: (authenticated: boolean) => void): IDisposable {
        return;
    },
};
