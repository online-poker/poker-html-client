import { OrientationService } from "poker/services/orientationservice";

const screenNotSupportedEntirely: IScreen = { } as any;

let lastOrientation: string = "";
let lockCallCount = 0;
const screenOrientationSupported: IScreen = {
    orientation: {
        async lock(orientation: string) {
            lockCallCount++;
            lastOrientation = orientation;
        },
    },
};
const screenOrientationNotSupportedApi: IScreen = {
    orientation: {
        async lock(orientation: string) {
            lockCallCount++;
            lastOrientation = orientation;
            throw new DOMException("screen.orientation.lock() is not available on this device.", "notsuported");
        },
    },
};

const deviceVariants = [
    { name: "Screen does not support Orientation API", value: screenNotSupportedEntirely, supported: false },
    { name: "Screen support Orientation API, but does not suported", value: screenOrientationNotSupportedApi, supported: true },
    { name: "Screen support Orientation API", value: screenOrientationSupported, supported: true },
];
describe("Orientation service", function () {
    beforeEach(() => {
        lockCallCount = 0;
        lastOrientation = "";
    });
    deviceVariants.forEach((item) => {
        describe(item.name, function () {
            it("Support status", function () {
                const orientationService = new OrientationService(item.value);
                const supported = orientationService.isScreenOrientationSupported();
                expect(supported).toEqual(item.supported);
            });
            it("Suppress rotation", async function () {
                const orientationService = new OrientationService(item.value);
                orientationService.suppressRotation();
                await orientationService.setOrientation("portrait");
                expect(lockCallCount).toEqual(0);
            });
            if (item.supported) {
                it("If enable rotation after supress, rotation will work", async function () {
                    const orientationService = new OrientationService(item.value);
                    orientationService.suppressRotation();
                    await orientationService.setOrientation("portrait");
                    expect(lockCallCount).toEqual(0);
                    orientationService.enableRotation();
                    await orientationService.setOrientation("landscape");
                    expect(lockCallCount).toEqual(1);
                });
                it("setLastOrientation set last orientation", async function () {
                    const orientationService = new OrientationService(item.value);
                    await orientationService.setOrientation("portrait");
                    lastOrientation = "";
                    await orientationService.setLastOrientation();
                    expect(lastOrientation).toEqual("portrait");
                });
            }
            it("lock", function () {
                const orientationService = new OrientationService(item.value);
                orientationService.lock();
            });
            it("unlock", function () {
                const orientationService = new OrientationService(item.value);
                orientationService.unlock();
            });
        });
    });
});
