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
        soundManager = new SoundManager(appConfig.game.soundPath, appConfig.game.soundTheme, appConfig.game.hasHumanVoice);
    }

    return soundManager;
}

export const keyboardActivationService = new KeyboardActivationService();
export const slowInternetService = new SlowInternetService();
export const connectionService = new ConnectionService();
export const accountService = new AccountService(true, false, authManager);
export const imagePreloadService = new ImagePreloadService();
export const reloadManager = new ReloadManager();
export const deviceEvents = new DeviceEventService();
export const orientationService = new OrientationService(screen);
export const pushService = new PushService();
export const appReloadService = new AppReloadService();

export interface ICurrentTableProvider {
    currentTable(): TableView;
}
