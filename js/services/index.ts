import { KeyboardActivationService } from "./keyboardactivationservice";
import { SlowInternetService } from "./slowinternetservice";
import { ConnectionService } from "./connectionservice";
import { AccountService } from "./accountservice";
import { ImagePreloadService } from "./imagepreloadservice";

export var keyboardActivationService = new KeyboardActivationService();
export var slowInternetService = new SlowInternetService();
export var connectionService = new ConnectionService();
export var accountService = new AccountService();
export var imagePreloadService = new ImagePreloadService();
