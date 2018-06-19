import { mergeDeep } from "poker/helpers";

export class AnimationSettings {

    public static platform = "default";

    public static setOverride(configuration: Partial<AnimationSettings>): void {
        AnimationSettings.configurationOverride = configuration;
    }

    public static getSettings(): AnimationSettings {
        let settings: AnimationSettings;
        switch (AnimationSettings.platform) {
            case "android":
                settings = AnimationSettings.androidSettings();
                break;
            case "tablet":
                settings = AnimationSettings.tabletSettings();
                break;
            default:
                settings = AnimationSettings.defaultSettings();
                break;
        }

        if (AnimationSettings.configurationOverride) {
            settings = mergeDeep(settings, AnimationSettings.configurationOverride);
        }

        return settings;
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

    private static configurationOverride?: Partial<AnimationSettings>;

    public dealCardsTime: number = 300;
    public finishGamePrePause: number = 100;
    public cleanupTableTimeout: number = 6000;
    public foldAnimationTimeout: number = 150;
    public betAnimationTimeout: number = 100;
    public movingMoneyToPotPrePause: number = 100;
    public movingMoneyToPotAnimationTimeout: number = 100;
    public showCardsTimeout: number = 3000;
}
