import { debugSettings } from "../debugsettings";

export class ReloadManager {
    callback: () => void;
    setReloadCallback(callback: () => void) {
        this.callback = callback;
    }
    execute() {
        this.log("Executing reload callback");
        if (this.callback != null) {
            this.callback();
        }
    }

    private log(message: string) {
        if (debugSettings.application.reloadManager) {
            console.log(message);
        }
    }
}
