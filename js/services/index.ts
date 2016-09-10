import { KeyboardActivationService } from "./keyboardactivationservice";
import { SlowInternetService } from "./slowinternetservice";
import { ConnectionService } from "./connectionservice";
import { AccountService } from "./accountservice";
import { ImagePreloadService } from "./imagepreloadservice";
import { ReloadManager } from "./reloadmanager";
import { DeviceEventService } from "./deviceeventservice";
import { SoundManager } from "./soundmanager";

export var keyboardActivationService = new KeyboardActivationService();
export var slowInternetService = new SlowInternetService();
export var connectionService = new ConnectionService();
export var accountService = new AccountService();
export var imagePreloadService = new ImagePreloadService();
export var reloadManager = new ReloadManager();
export var deviceEvents = new DeviceEventService();
export var soundManager = new SoundManager();
