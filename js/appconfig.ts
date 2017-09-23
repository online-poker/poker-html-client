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

class AppConfig {
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
    };
    public tournament = {
        enabled: false,
        openTableAutomatically: true,
    };
    public joinTable = {
        allowUsePersonalAccount: false,
        allowTickets: true,
    };
}

export const appConfig = new AppConfig();
