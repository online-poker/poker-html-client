class AnimationSettings {
    dealCardsTime: number = 300;
    finishGamePrePause: number = 100;
    cleanupTableTimeout: number = 4000;
    foldAnimationTimeout: number = 150;
    betAnimationTimeout: number = 100;
    movingMoneyToPotPrePause: number = 100;
    movingMoneyToPotAnimationTimeout: number = 100;
    showCardsTimeout: number = 3000;

    static platform = "default";

    static getSettings() {
        if (AnimationSettings.platform === "android") {
            return AnimationSettings.androidSettings();
        }

        if (AnimationSettings.platform === "tablet") {
            return AnimationSettings.tabletSettings();
        }

        return AnimationSettings.defaultSettings();
    }

    static defaultSettings() {
        return new AnimationSettings();
    }

    static androidSettings() {
        const settings = new AnimationSettings();
        return settings;
    }

    static tabletSettings() {
        const settings = new AnimationSettings();
        settings.dealCardsTime = 500;
        return settings;
    }
}
