import * as ko from "knockout";
import * as moment from "moment";
import { debugSettings } from "./debugsettings";
import * as runtimeSettings from "./table/runtimesettings";

declare var apiHost: string;

class TimeService {
    currentTime: KnockoutObservable<string>;
    handle: number;
    timeDiff: number = 0;
    private timeouts: number[] = [];
    private intervals: number[] = [];
    private static MillisecondsInMinutes = 60 * 1000;

    constructor() {
        this.currentTime = ko.observable<string>();
    }
    start() {
        const api = new OnlinePoker.Commanding.API.Metadata(apiHost);
        api.GetDate().then((serverTime) => {
            const currentDate = new Date();
            this.timeDiff = serverTime - currentDate.valueOf();

            // Wait until new minute starts.
            const currentTime = this.getCurrentDateTime();
            const pauseBeforeStartLongInterval = TimeService.MillisecondsInMinutes - (currentTime.getSeconds() * 1000)
                + currentTime.getMilliseconds();
            this.updateCurrentTime();
            this.setTimeout(() => {
                this.handle = this.setInterval(() => {
                    this.updateCurrentTime();
                }, TimeService.MillisecondsInMinutes);
            }, pauseBeforeStartLongInterval);
        }).then(null, () => this.start());
    }
    stop() {
        this.timeDiff = 0;
        this.clearInterval(this.handle);
    }
    setTimeout(handler: any, timeout?: any, ...args: any[]): number {
        const handle = setTimeout(() => {
            this.timeouts = this.timeouts.filter((_) => _ !== handle);
            handler();
        }, timeout, args);
        this.timeouts.push(handle);
        return handle;
    }
    clearTimeout(handle: number) {
        this.timeouts = this.timeouts.filter((_) => _ !== handle);
        clearTimeout(handle);
    }
    setInterval(handler: any, timeout?: any, ...args: any[]): number {
        const handle = setInterval(handler, timeout, args);
        this.intervals.push(handle);
        return handle;
    }
    clearInterval(handle: number) {
        this.intervals = this.intervals.filter((_) => _ !== handle);
        clearInterval(handle);
    }
    printDebug() {
        if (debugSettings.application.debugTimeouts) {
            console.log("Timeouts running = " + this.timeouts.length + ". "
                + "Intervals running = " + this.intervals.length);
        }
    }
    private updateCurrentTime() {
        const d = this.getCurrentDateTime();
        let date = moment(d.valueOf());
        if (debugSettings.application.useUtcDates) {
            date = date.utc();
        }

        const t = date.format("H:mm");
        if (runtimeSettings.updateTimer) {
            this.currentTime(t);
        }
    }
    private getCurrentDateTime() {
        const d = new Date();
        if (!this.timeDiff) {
            return d;
        }

        return new Date(d.valueOf() + this.timeDiff);
    }
}

const timeService = new TimeService();

export = timeService;
