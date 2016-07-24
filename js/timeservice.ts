/// <reference path="./_references.ts" />
/// <reference path="table/runtimesettings.ts" />
/// <reference path="debugsettings.ts" />

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
        var self = this;
        var api = new OnlinePoker.Commanding.API.Metadata(apiHost);
        api.GetDate(function (serverTime) {
            var currentDate = new Date();
            self.timeDiff = serverTime - currentDate.valueOf();
        }).done(function () {
            // Wait until new minute starts.
            var currentTime = self.getCurrentDateTime();
            var pauseBeforeStartLongInterval = TimeService.MillisecondsInMinutes - (currentTime.getSeconds() * 1000)
				+ currentTime.getMilliseconds();
			self.updateCurrentTime();
            self.setTimeout(() => {
                self.handle = self.setInterval(function () {
                    self.updateCurrentTime();
                }, TimeService.MillisecondsInMinutes);
            }, pauseBeforeStartLongInterval);
        }).fail(() => self.start());
    }
    stop() {
        this.timeDiff = 0;
        this.clearInterval(this.handle);
    }
    setTimeout(handler: any, timeout?: any, ...args: any[]): number {
        var self = this;
        var handle = setTimeout(() => {
            self.timeouts = self.timeouts.filter((_) => _ !== handle);
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
        var handle = setInterval(handler, timeout, args);
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
		var d = this.getCurrentDateTime();
		var date = moment(d.valueOf());
		if (debugSettings.application.useUtcDates) {
			date = date.utc();
		}

		var t = date.format("H:mm");
		if (runtimeSettings.updateTimer) {
			this.currentTime(t);
		}
	}
    private getCurrentDateTime() {
        var d = new Date();
        if (!this.timeDiff) {
            return d;
        }

        return new Date(d.valueOf() + this.timeDiff);
    }
}

var timeService = new TimeService();
