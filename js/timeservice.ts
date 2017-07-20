import * as ko from "knockout";
import * as moment from "moment";
import { Information } from "./api/information";
import { debugSettings } from "./debugsettings";
import * as runtimeSettings from "./table/runtimesettings";

declare var apiHost: string;
declare var host: string;

class TimeService {
    private static MillisecondsInMinutes = 60 * 1000;
    public currentTime: KnockoutObservable<string>;
    public timeDiff: number = 0;
    private handle: number;
    private timeouts: number[] = [];
    private intervals: number[] = [];

    constructor() {
        this.currentTime = ko.observable<string>();
    }
    public async start() {
        const api = new Information(host);
        try {
            const serverTime = await api.getDate();
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
        } catch (e) {
            this.start();
        }
    }
    public stop() {
        this.timeDiff = 0;
        this.clearInterval(this.handle);
    }
    public setTimeout(handler: any, timeout?: any, ...args: any[]): number {
        const handle = setTimeout(() => {
            this.timeouts = this.timeouts.filter((_) => _ !== handle);
            handler();
        }, timeout, args);
        this.timeouts.push(handle);
        return handle;
    }
    public clearTimeout(handle: number) {
        this.timeouts = this.timeouts.filter((_) => _ !== handle);
        clearTimeout(handle);
    }
    public setInterval(handler: any, timeout?: any, ...args: any[]): number {
        const handle = setInterval(handler, timeout, args);
        this.intervals.push(handle);
        return handle;
    }
    public clearInterval(handle: number) {
        this.intervals = this.intervals.filter((_) => _ !== handle);
        clearInterval(handle);
    }
    public printDebug() {
        if (debugSettings.application.debugTimeouts) {
            // tslint:disable-next-line:no-console
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
