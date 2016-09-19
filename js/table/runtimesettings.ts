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
    * Sound settings
    */
    sounds = {
        /**
        * Value indicating whether play sound of deal cards
        */
        dealCardsEnabled: false
    };
}

var runtimeSettings = new RuntimeSettings();
