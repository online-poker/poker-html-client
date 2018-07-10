import { siFormatter, withCommas } from "../js/helpers";

describe("Number formatting", () => {

    it("Value less then thousand does not splitted", () => {
        expect(withCommas("20", ".")).toBe("20");
    });

    it("Decimal point counted separately", () => {
        expect(withCommas("201.1", " ")).toBe("201.1");
    });

    it("Values bigger then thousand separated", () => {
        expect(withCommas("1020.1", " ")).toBe("1 020.1");
    });

    it("Values bigger then million separated", () => {
        expect(withCommas("1286020.1", " ")).toBe("1 286 020.1");
    });
});

describe("Money si formatting", () => {

    it("Value less then thousand does not formatted", () => {
        expect(siFormatter(20, 2, ",", ".", 10000)).toBe("20");
    });

    it("Values bigger then thousand will be formatted", () => {
        expect(siFormatter(1642, 2, ",", ".", 1000)).toBe("1.64k");
    });

    it("Values less then min convertible value will not be formatted ", () => {
        expect(siFormatter(1642, 2, ",", ".", 10000)).toBe("1,642");
    });

    it("Values bigger then million will be formatted", () => {
        expect(siFormatter(1286020.1, 2, ",", ".", 10000)).toBe("1.28M");
    });
});
