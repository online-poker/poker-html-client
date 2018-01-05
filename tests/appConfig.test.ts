import { appConfig, overrideConfiguration } from "poker/appconfig";

describe("App cofiguration", function () {
    it("Confguration override work with empty override", function () {
        overrideConfiguration({});
        expect(appConfig.game.handHistory).toBeDefined();
    });
    it("Confguration override work with game settings override", function () {
        overrideConfiguration({
            game: {
                noTableMoneyLimit: false,
            },
        });
        expect(appConfig.game.noTableMoneyLimit).toEqual(false);
        expect(appConfig.game.autoFoldAsFoldOnRaise).toEqual(true);
        expect(appConfig.game.handHistory).toBeDefined();
    });
});
