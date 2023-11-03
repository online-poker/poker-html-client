interface PlatformInterface {
    mediaRoot: string;
    reloadOnResume: boolean;
    isTablet: boolean;
    statusBarHeight(): number;
    hasTabBar(): boolean;
    hasMenu(): boolean;
    hasTouch(): boolean;
}

declare const platformInfo: PlatformInterface;
