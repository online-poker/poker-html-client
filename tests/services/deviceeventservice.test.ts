import { debugSettings } from "../../js/debugsettings";
import { DeviceEventService } from "../../js/services/deviceeventservice";

describe("device event service", function () {
    debugSettings.ios.hasMultitasking = true;

    function attachEvents(sut: DeviceEventService) {
        const result = {
            readyFired: 0,
            pauseFired: 0,
            activeFired: 0,
            resignActiveFired: 0,
            resumeFired: 0,
        };
        sut.ready.add(function () {
            result.readyFired++;
        });
        sut.pause.add(function () {
            result.pauseFired++;
        });
        sut.active.add(function () {
            result.activeFired++;
        });
        sut.resignActive.add(function () {
            result.resignActiveFired++;
        });
        sut.resume.add(function () {
            result.resumeFired++;
        });
        return result;
    }
    it("deviceready event", function () {
        const sut = new DeviceEventService();
        const eventsCounter = attachEvents(sut);
        sut.initialize();
        const event = new Event("deviceready", { bubbles: true });
        document.dispatchEvent(event);
        expect(eventsCounter.readyFired).toEqual(1);
        expect(eventsCounter.pauseFired).toEqual(0);
        expect(eventsCounter.activeFired).toEqual(0);
        expect(eventsCounter.resignActiveFired).toEqual(0);
        expect(eventsCounter.resumeFired).toEqual(0);
    });
    it("pause event", function () {
        const sut = new DeviceEventService();
        const eventsCounter = attachEvents(sut);
        sut.initialize();
        const event = new Event("pause", { bubbles: true });
        document.dispatchEvent(event);
        expect(eventsCounter.readyFired).toEqual(0);
        expect(eventsCounter.pauseFired).toEqual(1);
        expect(eventsCounter.activeFired).toEqual(0);
        expect(eventsCounter.resignActiveFired).toEqual(0);
        expect(eventsCounter.resumeFired).toEqual(0);
    });
    it("active event", function () {
        const sut = new DeviceEventService();
        const eventsCounter = attachEvents(sut);
        sut.initialize();
        const event = new Event("active", { bubbles: true });
        document.dispatchEvent(event);
        expect(eventsCounter.readyFired).toEqual(0);
        expect(eventsCounter.pauseFired).toEqual(0);
        expect(eventsCounter.activeFired).toEqual(1);
        expect(eventsCounter.resignActiveFired).toEqual(0);
        expect(eventsCounter.resumeFired).toEqual(0);
    });
    it("resignActive event", function () {
        const sut = new DeviceEventService();
        const eventsCounter = attachEvents(sut);
        sut.initialize();
        const event = new Event("resign", { bubbles: true });
        document.dispatchEvent(event);
        expect(eventsCounter.readyFired).toEqual(0);
        expect(eventsCounter.pauseFired).toEqual(0);
        expect(eventsCounter.activeFired).toEqual(0);
        expect(eventsCounter.resignActiveFired).toEqual(1);
        expect(eventsCounter.resumeFired).toEqual(0);
    });
    it("resume event", function () {
        const sut = new DeviceEventService();
        const eventsCounter = attachEvents(sut);
        sut.initialize();
        const event = new Event("resume", { bubbles: true });
        document.dispatchEvent(event);
        expect(eventsCounter.readyFired).toEqual(0);
        expect(eventsCounter.pauseFired).toEqual(0);
        expect(eventsCounter.activeFired).toEqual(0);
        expect(eventsCounter.resignActiveFired).toEqual(0);
        expect(eventsCounter.resumeFired).toEqual(1);
    });
});
