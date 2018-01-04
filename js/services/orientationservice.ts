/// <reference path="../typings/cordova.d.ts" />

export class OrientationService {
    private lastOrientation: string = null;
    private disableRotation = false;

    public setOrientation(orientation: string) {
        if (this.isScreenOrientationSupported() && !this.disableRotation) {
            // ScreenOrientation.setOrientation(orientation);
            screen.orientation.lock(orientation);
        }

        this.lastOrientation = orientation;
    }

    public suppressRotation() {
        this.disableRotation = true;
    }

    public enableRotation() {
        this.disableRotation = false;
    }

    public lock() {
        if (this.isScreenOrientationSupported() && !this.disableRotation) {
            // ScreenOrientation.lock();
        }
    }

    public unlock() {
        if (this.isScreenOrientationSupported() && !this.disableRotation) {
            // ScreenOrientation.unlock();
        }
    }

    public setLastOrientation() {
        this.setOrientation(this.lastOrientation);
    }

    private isScreenOrientationSupported() {
        /* tslint:disable:no-string-literal */
        return screen["orientation"];
        /* tslint:enable:no-string-literal */
    }
}
