import { debugSettings } from "../debugsettings";

/**
 * Service which provides ability to subscribe on the
 * device events.
 */
export class DeviceEventService {
    public ready: Signal;
    public active: Signal;
    public resignActive: Signal;
    public pause: Signal;
    public resume: Signal;

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
    public initialize() {
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
