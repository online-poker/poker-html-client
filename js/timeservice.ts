import * as ko from "knockout";
import * as moment from "moment";
import { Information } from "./api/information";
import { debugSettings } from "./debugsettings";
import * as runtimeSettings from "./table/runtimesettings";

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
        try {
            await this.updateServerDriftTime(() => new Date());
            const currentDate = new Date();
            this.updateCurrentTime(currentDate);

            // Wait until new minute starts.
            const currentTime = this.getCurrentDateTime(currentDate);
            const pauseBeforeStartLongInterval = TimeService.MillisecondsInMinutes - (currentTime.getSeconds() * 1000)
                + currentTime.getMilliseconds();
            this.setTimeout(() => {
                this.handle = this.setInterval(() => {
                    this.updateCurrentTime(new Date());
                }, TimeService.MillisecondsInMinutes);
            }, pauseBeforeStartLongInterval);
        } catch (e) {
            this.start();
        }
    }
    /**
     * Updates information about current server time and calculate server time drift.
     */
    public async updateServerDriftTime(currentTimeProvider: () => Date) {
        const api = new Information(host);
        const serverTime = await api.getDate();
        const currentDate = currentTimeProvider();
        this.timeDiff = serverTime - currentDate.valueOf();
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
    /**
     * Updates information about current time on server, using calculated server drift time.
     * @param currentDate Current date and time on the client.
     */
    public updateCurrentTime(currentDate: Date) {
        const d = this.getCurrentDateTime(currentDate);
        let date = moment(d.valueOf());
        if (debugSettings.application.useUtcDates) {
            date = date.utc();
        }

        const t = date.format("H:mm");
        if (runtimeSettings.updateTimer) {
            this.currentTime(t);
        }
    }
    private getCurrentDateTime(d: Date) {
        if (!this.timeDiff) {
            return d;
        }

        return new Date(d.valueOf() + this.timeDiff);
    }
}

const timeService = new TimeService();

export = timeService;
