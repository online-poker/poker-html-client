import { debugSettings } from "../../js/debugsettings";
import * as timeService from "../../js/timeservice";

function defineMockResponse(response: number) {
    global.host = "";
    global.authToken = "";
    global.fetch = jest.fn().mockImplementation(() => {
        const p = new Promise((resolve, reject) => {
          resolve({
            ok: true,
            Id: "123",
            json() {
                return Promise.resolve(response);
            },
          });
        });

        return p;
    });
}

describe("time service", function () {
    beforeEach(function () {
        debugSettings.application.useUtcDates = false;
        timeService.stop();
    });
    it("set time drift", async function() {
        const serverTime = new Date(2017, 12, 26, 12, 29, 10);
        defineMockResponse(serverTime.valueOf());
        const clientTimeWhenDriftCalculates = new Date(2017, 12, 26, 12, 30, 10);
        await timeService.updateServerDriftTime(() => clientTimeWhenDriftCalculates);
        expect(timeService.timeDiff).toEqual(-60 * 1000);
    });
    it("update current time before drift calculation happens", function() {
        const clientTime = new Date(2017, 12, 26, 12, 30, 10);
        timeService.updateCurrentTime(clientTime);
        expect(timeService.timeDiff).toEqual(0);
        expect(timeService.currentTime()).toEqual("12:30");
    });
    it("current time take time drift into account", async function() {
        const serverTime = new Date(2017, 12, 26, 12, 29, 10);
        defineMockResponse(serverTime.valueOf());
        const clientTimeWhenDriftCalculates = new Date(2017, 12, 26, 12, 30, 10);
        await timeService.updateServerDriftTime(() => clientTimeWhenDriftCalculates);
        expect(timeService.timeDiff).toEqual(-60 * 1000);
        const clientTime = new Date(2017, 12, 26, 12, 30, 10);
        timeService.updateCurrentTime(clientTime);
        expect(timeService.currentTime()).toEqual("12:29");
    });
    it("Use UTC when specified in the configuration", function() {
        debugSettings.application.useUtcDates = true;
        const clientTime = new Date("2014-03-07T12:30:10Z");
        timeService.updateCurrentTime(clientTime);
        expect(timeService.timeDiff).toEqual(0);
        expect(timeService.currentTime()).toEqual("12:30");
    });
});
