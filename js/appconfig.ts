class GameHandHistory {
    /**
    * Show game history with cards.
    */
    showPictureHistory = true;

    /**
    * Show game history as text.
    */
    showTextHistory = true;
}

class GameActionBlock {
    /**
    * Wherether action panel is present on the application
    */
    hasSecondaryPanel = true;
}

class AppConfig {
    game = {
        handHistory: new GameHandHistory(),
        actionBlock: new GameActionBlock(),
        seatMode: document.body.classList.contains("poker-feature-single-seat")
    };
    tournament = {
        enabled: false,
        openTableAutomatically: true
    };
}

export var appConfig = new AppConfig();
