import { authManager } from "poker/authmanager";
import { TableView } from "poker/table/tableview";
import { appConfig } from "../appconfig";
import { AccountService } from "./accountservice";
import { AppReloadService } from "./appreloadservice";
import { ConnectionService } from "./connectionservice";
import { DeviceEventService } from "./deviceeventservice";
import { ImagePreloadService } from "./imagepreloadservice";
import { KeyboardActivationService } from "./keyboardactivationservice";
import { OrientationService } from "./orientationservice";
import { PushService } from "./pushservice";
import { ReloadManager } from "./reloadmanager";
import { SlowInternetService } from "./slowinternetservice";
import { SoundManager } from "./soundmanager";
export { WebsiteService } from "./websiteService";

let soundManager: SoundManager;
export function getSoundManager() {
    if (!soundManager) {
        soundManager = new SoundManager(appConfig.game.soundTheme, appConfig.game.hasHumanVoice);
    }

    return soundManager;
}

export let keyboardActivationService = new KeyboardActivationService();
export let slowInternetService = new SlowInternetService();
export let connectionService = new ConnectionService();
export let accountService = new AccountService(true, false, authManager);
export let imagePreloadService = new ImagePreloadService();
export let reloadManager = new ReloadManager();
export let deviceEvents = new DeviceEventService();
export let orientationService = new OrientationService(screen);
export let pushService = new PushService();
export const appReloadService = new AppReloadService();

export interface ICurrentTableProvider {
    currentTable(): TableView;
}
