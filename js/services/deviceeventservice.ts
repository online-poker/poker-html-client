import { debugSettings } from "../debugsettings";

/**
* Service which provides ability to subscribe on the 
* device events.
*/
export class DeviceEventService {
    ready: Signal;
    active: Signal;
    resignActive: Signal;
    pause: Signal;
    resume: Signal;

    constructor() {
        this.ready = new signals.Signal();
        this.active = new signals.Signal();
        this.resignActive = new signals.Signal();
        this.pause = new signals.Signal();
        this.resume = new signals.Signal();
    }
    /**
    * Initializes the device event handler
    */
    initialize() {
        document.addEventListener("deviceready", () => this.onDeviceReady(), false);
        if (debugSettings.ios.hasMultitasking) {
            document.addEventListener("resign", () => this.onResign(), false);
            document.addEventListener("active", () => this.onActive(), false);
        }

        document.addEventListener("pause", () => this.onPause(), false);
        document.addEventListener("resume", () => this.onResume(), false);
    }
    private onDeviceReady() {
        this.ready.dispatch();
    }
    private onResign() {
        this.resignActive.dispatch();
    }
    private onActive() {
        this.active.dispatch();
    }
    private onPause() {
        this.pause.dispatch();
    }
    private onResume() {
        this.resume.dispatch();
    }
}
