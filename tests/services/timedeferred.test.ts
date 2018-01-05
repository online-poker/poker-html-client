import { wait } from "poker/services/timedeferred";

describe("deferred service", function () {
    it("wait at least given time", async function() {
        const startDate = new Date();
        await wait(100);
        const finishDate = new Date();
        expect(finishDate.valueOf() - startDate.valueOf()).toBeGreaterThanOrEqual(100);
    });
});
