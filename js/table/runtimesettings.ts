class RuntimeSettings {
    /**
     * Enables or disables all timer related content update on the pages
     */
    public updateTimer: boolean = true;
    /**
     * Enables or disables all timer related content update on the pages
     */
    public tableCardsAnimating: boolean = true;

    /**
     * Enables or disables showing news popup.
     */
    public showNewsAfterLogin: boolean = true;

    /**
     * Game settings
     */
    public game = {
        /**
         * Time to perform the move in seconds.
         */
        moveTime: 60,

        /**
         * Enables or disables flag indicating whether auto-fold
         * and auto-check functionality would be reset each new game.
         */
        clearAutoFoldOrCheckOnNewGame: true,
    };

    /**
     * Sound settings
     */
    public sounds = {
        /**
         * Value indicating whether play sound of deal cards
         */
        dealCardsEnabled: false,
    };

    public setShowNewsAfterLogin(value: boolean) {
        this.showNewsAfterLogin = value;
    }
}

const runtimeSettings = new RuntimeSettings();
export = runtimeSettings;
