class GameHandHistory {
    /**
     * Show game history with cards.
     */
    public showPictureHistory = true;

    /**
     * Show game history as text.
     */
    public showTextHistory = true;
}

class GameActionBlock {
    /**
     * Wherether action panel is present on the application
     */
    public hasSecondaryPanel = true;
}

export interface TimeSettings {
    moveTime?: number | undefined;
}

export class AppConfig {
    public auth = {
        automaticLogin: true,
        automaticTableSelection: true,
        allowGuest: false,
        allowSelfRegistration: true,
        allowRememberMe: true,
        allowPasswordRecovery: true,
    };
    public game = {
        handHistory: new GameHandHistory(),
        actionBlock: new GameActionBlock(),
        seatMode: document.body.classList.contains("poker-feature-single-seat"),
        tablePreviewMode: document.body.classList.contains("poker-feature-table-preview"),
        autoFoldAsFoldOnRaise: true,
        useSignalR: false,
        noTableMoneyLimit: true,
        showTournamentTables: true,
        isRoundNotificationEnabled: true,
        collapseRaiseBlockWhenExpanded: true,
        tableReloadSupported: true,
        hasRating: false,
        hasPageReload: false,
        soundTheme: "poker",
        hasHumanVoice: true,
        cardsOverlaySupported: true,
    };
    public tournament = {
        enabled: false,
        openTableAutomatically: true,
        enableTournamentOnly: false,
    };
    public joinTable = {
        allowUsePersonalAccount: false,
        allowTickets: true,
    };
    public registration = {
        allowSelectUserAvatar: true,
        requireEmail: true,
        requirePhoneNumber: false,
        requireFirstName: false,
        requireLastName: false,
    };
    public lobby = {
        openTableRequireAuthentication: true,
        cashTablesEnabled: true,
        tournamentTablesEnabled: true,
        sngTablesEnabled: true,
    };
    public info = {
        hasInfoPages: false,
        hasSupportPages: false,
    };
    public timeSettings: TimeSettings = {
    };
    public ui = {
        isDesktopApp: false,
        realMoneyCurrencySymbol: "$",
        gameMoneySymbol: "",
    };
}
/**
 * Simple object check.
 * @param item
 * @returns {boolean}
 */
function isObject(item: any) {
    return (item && typeof item === "object" && !Array.isArray(item));
}

/**
 * Deep merge two objects.
 * @param target
 * @param ...sources
 */
function mergeDeep(target: any, ...sources: any[]): any {
    if (!sources.length) { return target; }
    const source = sources.shift();

    if (isObject(target) && isObject(source)) {
        for (const key in source) {
            if (isObject(source[key])) {
                if (!target[key]) { Object.assign(target, { [key]: {} }); }
                mergeDeep(target[key], source[key]);
            } else {
                Object.assign(target, { [key]: source[key] });
            }
        }
    }

    return mergeDeep(target, ...sources);
}

export type PartialConfiguration<T> = {
    [P in keyof T]?: Partial<T[P]>;
};

export function overrideConfiguration(localConfiguration: PartialConfiguration<AppConfig>) {
    appConfig = mergeDeep(appConfig, localConfiguration);
}

export let appConfig = new AppConfig();
