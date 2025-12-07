import { debugSetZones, decodeCoordinates, getZonesAngle } from "poker/pages/tablespage";

function getZones(zoneCount: number, position: number, element: any) {
    const zones = [];
    for (let i = 0; i < zoneCount; i++) {
        zones.push({});
    }
    zones[position] = element;
    return zones;
}

function createElement(desc: { rect: DOMRectInit, transform: string }): HTMLElement {
    return {
        getBoundingClientRect: () => desc.rect,
        offsetParent: {
            transform: desc.transform
        },
    } as never;
}

const getNewComputedStyleMock: jest.Mock = 
    jest.fn((arg: any) => {
            return {                 
                getPropertyValue: (name: string) => {
                    switch (name) {
                        case "width":
                            return "920px";
                        case "height":
                            return "705px";
                        case "transform":
                            return arg.transform;
                        case "transform-origin":
                            return "460px 0px";
                        default:
                            return "";
                    }
                }
            }
        });
describe("decodeCoordinates for 8 seat table", () => {
    let originalGetComputedStyle: any;

    beforeAll(() => {
        originalGetComputedStyle = (window as any).getComputedStyle;
        (window as any).getComputedStyle = getNewComputedStyleMock;
    });

    afterAll(() => {
        (window as any).getComputedStyle = originalGetComputedStyle;
    });

    afterEach(() => {
        // reset zones between tests
        debugSetZones(undefined);
        jest.clearAllMocks();
    });

    it("returns client coordinates for position 1", () => {
        const p1 = {
            "x":1945,
            "y":10,
            "width":920,
            "height":705,
            "top":10,
            "right":2865,
            "bottom":715,
            "left":1945
        };
        const element = createElement({ rect: p1, transform: "matrix(-1, 0, 0, -1, 0, 0)" });
        debugSetZones(getZones(8, 0, element));
        // Make sure that zone detection works as expected
        expect(getZonesAngle(element)).toEqual(180);

        const res = decodeCoordinates(element, 2410, 326);
        expect(res).toEqual({ clientX: 455, clientY: 389 });
    });

    it("returns client coordinates for position 2", () => {
        const p2 = {
            "x":2708.220703125,
            "y":12.730880737304688,
            "width":1149.04833984375,
            "height":1149.048583984375,
            "top":12.730880737304688,
            "right":3857.26904296875,
            "bottom":1161.7794647216797,
            "left":2708.220703125
        };
        const element = createElement({ rect: p2, transform: "matrix(0.707107, 0.707107, -0.707107, 0.707107, 0, 0)" });
        debugSetZones(getZones(8, 1, element));
        // Make sure that zone detection works as expected
        expect(getZonesAngle(element)).toEqual(225);

        const res = decodeCoordinates(element, 3206.72156, 12.93088073730);
        expect(res).toEqual({ clientX: 919.8651609829609, clientY: 704.8520876008746 });
    });

    it("returns client coordinates for position 3", () => {
        const p3 = {
            "x":2708.220703125,
            "y":998.2205810546875,
            "width":1149.04833984375,
            "height":1149.0484619140625,
            "top":998.2205810546875,
            "right":3857.26904296875,
            "bottom":2147.26904296875,
            "left":2708.220703125};
        const element = createElement({ rect: p3, transform: "matrix(0.707107, 0.707107, -0.707107, 0.707107, 0, 0)" });
        debugSetZones(getZones(8, 2, element));
        // Make sure that zone detection works as expected
        expect(getZonesAngle(element)).toEqual(135);

        // const res2 = decodeCoordinates(element, 2708.220703125, 1648.7588197463112);
        // expect(res2).toEqual({ clientX: 0, clientY: 0 });
        const res = decodeCoordinates(element, 3857, 1497.924849);
        expect(res).toEqual({ clientX: 918.9653544550364, clientY: 705.6539073590166 });
    });

    it("returns client coordinates for position 4", () => {
        const p4 = {
            "x":1945,
            "y":1445,
            "width":920,
            "height":705,
            "top":1445,
            "right":2865,
            "bottom":2150,
            "left":1945};
        const element = createElement({ rect: p4, transform: "matrix(-1, 0, 0, -1, 0, 0)" });
        debugSetZones(getZones(8, 3, element));
        // Make sure that zone detection works as expected
        expect(getZonesAngle(element)).toEqual(0);

        const res2 = decodeCoordinates(element, 1945, 1445);
        expect(res2).toEqual({ clientX: 0, clientY: 0 });
        const res = decodeCoordinates(element, 2865, 2150);
        expect(res).toEqual({ clientX: 920, clientY: 705 });
    });

    it("returns client coordinates for position 5", () => {
        const p5 = {
            "x":975,
            "y":1445,
            "width":920,
            "height":705,
            "top":1445,
            "right":1895,
            "bottom":2150,
            "left":975};
        const element = createElement({ rect: p5, transform: "matrix(-1, 0, 0, -1, 0, 0)" });
        debugSetZones(getZones(8, 4, element));
        // Make sure that zone detection works as expected
        expect(getZonesAngle(element)).toEqual(0);

        const res2 = decodeCoordinates(element, 975, 1445);
        expect(res2).toEqual({ clientX: 0, clientY: 0 });
        const res = decodeCoordinates(element, 1895, 2150);
        expect(res).toEqual({ clientX: 920, clientY: 705 });
    });

    it("returns client coordinates for position 6", () => {
        const p6 = {
            "x":-15.26911926269531,
            "y":1001.2205810546875,
            "width":1149.048583984375,
            "height":1149.0484619140625,
            "top":1001.2205810546875,
            "right":1133.7794647216797,
            "bottom":2150.26904296875,
            "left":-15.26911926269531   };
        const element = createElement({ rect: p6, transform: 'matrix(-0.707107, -0.707107, 0.707107, -0.707107, 0, 0)' });
        debugSetZones(getZones(8, 5, element));
        // Make sure that zone detection works as expected
        expect(getZonesAngle(element)).toEqual(45);

        // const res2 = decodeCoordinates(element, 483.241161473821, 1001.2205810546875);
        // expect(res2).toEqual({ clientX: 0, clientY: 0 });
        const res = decodeCoordinates(element, 635.269183985164, 2150.26904296875);
        expect(res).toEqual({ clientX: 920.000004979558, clientY: 704.9999136832539 });
    });

    it("returns client coordinates for position 7", () => {
        const p7 = {
            "x":-15.26911926269531,
            "y":9.730880737304688,
            "width":1149.048583984375,
            "height":1149.048583984375,
            "top":9.730880737304688,
            "right":1133.7794647216797,
            "bottom":1158.7794647216797,
            "left":-15.26911926269531
        };
        const element = createElement({ rect: p7, transform: 'matrix(0.707107, -0.707107, 0.707107, 0.707107, 0, 0)' });
        debugSetZones(getZones(8, 6, element));
        // Make sure that zone detection works as expected
        expect(getZonesAngle(element)).toEqual(315);

        // const res2 = decodeCoordinates(element, 1133.7794647216797, 508.241161473821);
        // expect(res2).toEqual({ clientX: 0, clientY: 0 });
        const res = decodeCoordinates(element, -15.2691192626951, 660.269119428928);
        expect(res).toEqual({ clientX: 920.0000456481512, clientY: 705.0000456481519 });
    });

    it("returns client coordinates for position 8", () => {
        const p8 = {
            "x":975,
            "y":10,
            "width":920,
            "height":705,
            "top":10,
            "right":1895,
            "bottom":715,
            "left":975
        };
        const element = createElement({ rect: p8, transform: "matrix(-1, 0, 0, -1, 0, 0)" });
        debugSetZones(getZones(8, 7, element));
        // Make sure that zone detection works as expected
        expect(getZonesAngle(element)).toEqual(180);

        const res = decodeCoordinates(element, 975, 10);
        expect(res).toEqual({ clientX: 920, clientY: 705 });
    });
});
