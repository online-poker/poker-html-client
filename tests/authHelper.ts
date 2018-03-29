import { AuthManager, IAuthenticationInformation, IDisposable } from "poker/authmanager";

export const notAuthenticated: IAuthenticationInformation = {
    login: () => null,
    loginId: () => null,
    authenticated: () => false,
    registerAuthenticationChangedHandler(handler: (authenticated: boolean) => void): IDisposable {
        return;
    },
};
