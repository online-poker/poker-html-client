class AnimationSettings {

    public static platform = "default";

    public static getSettings() {
        if (AnimationSettings.platform === "android") {
            return AnimationSettings.androidSettings();
        }

        if (AnimationSettings.platform === "tablet") {
            return AnimationSettings.tabletSettings();
        }

        return AnimationSettings.defaultSettings();
    }

    public static defaultSettings() {
        return new AnimationSettings();
    }

    public static androidSettings() {
        const settings = new AnimationSettings();
        return settings;
    }

    public static tabletSettings() {
        const settings = new AnimationSettings();
        settings.dealCardsTime = 500;
        return settings;
    }

    public dealCardsTime: number = 300;
    public finishGamePrePause: number = 100;
    public cleanupTableTimeout: number = 6000;
    public foldAnimationTimeout: number = 150;
    public betAnimationTimeout: number = 100;
    public movingMoneyToPotPrePause: number = 100;
    public movingMoneyToPotAnimationTimeout: number = 100;
    public showCardsTimeout: number = 3000;
}
