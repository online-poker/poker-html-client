import { withCommas } from "../js/helpers";

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
