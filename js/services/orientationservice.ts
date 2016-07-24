/// <reference path="../_references.ts" />
/// <reference path="../typings/cordova.d.ts" />

class OrientationService {
    lastOrientation: string = null;
    disableRotation = false;

    setOrientation(orientation: string) {
        if (this.isScreenOrientationSupported() && !this.disableRotation) {
            ScreenOrientation.setOrientation(orientation);
        }

        this.lastOrientation = orientation;
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

var orientationService = new OrientationService();
