/// <reference path="../typings/cordova.d.ts" />

/** Service that applies needed orientation for current page */
export class OrientationService {
    private lastOrientation: string = null;
    private disableRotation = false;

    constructor (private screen: IScreen) {
    }

    public async setOrientation(orientation: string) {
        if (this.isScreenOrientationSupported() && !this.disableRotation) {
            // ScreenOrientation.setOrientation(orientation);
            try {
                await this.screen.orientation.lock(orientation);
            } catch {
                // If DOMException happens, do nothing.
            }
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

    public async setLastOrientation() {
        await this.setOrientation(this.lastOrientation);
    }

    public isScreenOrientationSupported(): boolean {
        /* tslint:disable:no-string-literal */
        return !!this.screen["orientation"];
        /* tslint:enable:no-string-literal */
    }
}
