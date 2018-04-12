import { debugSettings } from "../debugsettings";

/** Reload Manager */
export class ReloadManager {
    private callback: () => void;
    public setReloadCallback(callback: () => void) {
        this.callback = callback;
    }
    public execute() {
        this.log("Executing reload callback");
        if (this.callback != null) {
            this.callback();
        }
    }

    private log(message: string) {
        if (debugSettings.application.reloadManager) {
            // tslint:disable-next-line:no-console
            console.log(message);
        }
    }
}
