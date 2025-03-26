import { mergeDeep } from "poker/helpers";

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
    updateTimeFromServer?: boolean | undefined;
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
        soundPath: "/snd",
        cardsOverlaySupported: true,
        messageDisplaySize: 17,
        messageDisplayDuration: 2000,
        clearActionDuration: 2000,
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
        firstNameVisible: true,
        lastNameVisible: true,
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
        updateTimeFromServer: true
    };
    public ui = {
        isDesktopApp: false,
        realMoneyCurrencySymbol: "$",
        gameMoneySymbol: "",
        allowExpandActionBlockGuestureOnlyOnMyTurn: false,
        usePortraitAndLandscapeOrientationModes: false,
        defaultOrientation: "landscape",
        useShortMoneyRepresentationForBets: false,
        minConvertibleToSIBetValue: 10000,
        moneySeparator: ",",
        fractionalDigitsCount: 2,
        moneyFractionalSeparator: ".",
        enableScreenOverlay: false,
        deploymentPath: "",
        hasKeyPad: false,
        relayTouches: false,
        debugTouches: false,
        touchToggleCards: false,
        fastTouch: false,
        advancedBets: false,
        verticalSlider: false,
    };
}

export type PartialConfiguration<T> = {
    [P in keyof T]?: Partial<T[P]>;
};

export function overrideConfiguration(localConfiguration: PartialConfiguration<AppConfig>) {
    appConfig = mergeDeep(appConfig, localConfiguration);
}

export let appConfig = new AppConfig();
