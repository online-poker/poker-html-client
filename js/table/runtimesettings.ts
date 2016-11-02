class RuntimeSettings {
    /**
    * Enables or disables all timer related content update on the pages
    */
    updateTimer: boolean = true;
    /**
    * Enables or disables all timer related content update on the pages
    */
    tableCardsAnimating: boolean = true;

    /**
    * Enables or disables showing news popup.
    */
    showNewsAfterLogin: boolean = true;

    /**
     * Game settings
     */
    game = {
        /**
         * Time to perform the move in seconds.
         */
        moveTime: 60,

        /**
         * Enables or disables flag indicating whether auto-fold and auto-check functionality would be reset each new game.
         */
        clearAutoFoldOrCheckOnNewGame: true,
    };

    /**
    * Sound settings
    */
    sounds = {
        /**
        * Value indicating whether play sound of deal cards
        */
        dealCardsEnabled: false
    };

    setShowNewsAfterLogin(value: boolean) {
        this.showNewsAfterLogin = value;
    }
}

const runtimeSettings = new RuntimeSettings();
export = runtimeSettings;
