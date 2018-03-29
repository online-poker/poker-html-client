import { AuthManager, IAuthenticationInformation } from "poker/authmanager";

export function getTestAuthManagerAuthenticated(login: string, loginId: number) {
    const authManager = new AuthManager();
    authManager.login(login);
    authManager.loginId(loginId);
    authManager.authenticated(true);
    return authManager;
}

export function getTestAuthManagerNonAuthenticated() {
    const authManager = new AuthManager();
    authManager.login(null);
    authManager.loginId(null);
    authManager.authenticated(false);
    return authManager;
}