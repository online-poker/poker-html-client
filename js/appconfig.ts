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

export class AppConfig {
    public auth = {
        automaticLogin: true,
        automaticTableSelection: true,
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
    };
    public tournament = {
        enabled: false,
        openTableAutomatically: true,
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
}
/**
 * Simple object check.
 * @param item
 * @returns {boolean}
 */
function isObject(item) {
    return (item && typeof item === "object" && !Array.isArray(item));
}

/**
 * Deep merge two objects.
 * @param target
 * @param ...sources
 */
function mergeDeep(target, ...sources) {
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

export function overrideConfiguration(localConfiguration: Partial<AppConfig>) {
    appConfig = mergeDeep(appConfig, localConfiguration);
}

export let appConfig = new AppConfig();
