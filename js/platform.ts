/// <reference types="jquery" />
/// <reference path="platform.d.ts" />

class Platform implements PlatformInterface {
    mediaRoot = "";
    reloadOnResume = false;
    isTablet = false;
    statusBarHeight() {
        return 0;
    }
    hasTabBar() {
        return true;
    }
    hasMenu() {
        return false;
    }
    hasTouch() {
        return window["ontouchstart"] !== undefined;
    }
}

var platformInfo = <PlatformInterface>new Platform();
