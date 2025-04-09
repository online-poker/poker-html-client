import { ChipItem } from "../../js/table/chipitem";

describe("chipItem", function () {
    it("test 7500", function () {
        const chipsAmount = [1, 2, 5, 10, 25, 50, 100, 250, 500, 1000];
        const chipItem = new ChipItem(10);
        const stack = chipItem.calculateStackSimple(7500, chipsAmount);
        for (let i = 0; i < stack.length; i++) {
            const stackItem = stack[i];
            expect(stackItem.amount).toEqual(5);
        }
    });
    it("test 58 - two stack", function () {
        const chipItem = new ChipItem(1);
        const stackData = chipItem.getData(5 * 10 + 4 * 2);
        expect(stackData.length).toEqual(2);      
    });
    it("test 58 - single stack", function () {
        const chipItem = new ChipItem(1, 1);
        const stackData = chipItem.getData(5 * 10 + 4 * 2);
        expect(stackData.length).toEqual(1);
    });
});
