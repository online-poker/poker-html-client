/// <reference path="../typings/cordova.d.ts" />

export class OrientationService {
    lastOrientation: string = null;
    disableRotation = false;

    setOrientation(orientation: string) {
        if (this.isScreenOrientationSupported() && !this.disableRotation) {
            ScreenOrientation.setOrientation(orientation);
        }

        this.lastOrientation = orientation;
    }

    suppressRotation() {
        this.disableRotation = true;
    }

    enableRotation() {
        this.disableRotation = false;
    }

    lock() {
        if (this.isScreenOrientationSupported() && !this.disableRotation) {
            ScreenOrientation.lock();
        }
    }

    unlock() {
        if (this.isScreenOrientationSupported() && !this.disableRotation) {
            ScreenOrientation.unlock();
        }
    }

    setLastOrientation() {
        this.setOrientation(this.lastOrientation);
    }

    private isScreenOrientationSupported() {
        /* tslint:disable:no-string-literal */
        return window["ScreenOrientation"] && ScreenOrientation["setOrientation"];
        /* tslint:enable:no-string-literal */
    }
}
