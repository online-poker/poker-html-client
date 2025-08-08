import { appConfig } from "poker/appconfig";
import { authManager } from "poker/authmanager";
import * as metadataManager from "poker/metadatamanager";
import { HomePage } from "poker/pages/homepage";
import { settings } from "poker/settings";
import { Authenticated, notAuthenticated } from "tests/authHelper";

describe("Home page", function () {
    beforeAll(() => {
        global.messages = {
        };
    });
    describe("Screen overlay", function () {
        let enableScreenOverlay: boolean;
        let seatMode: boolean;
        beforeEach(() => {
            enableScreenOverlay = appConfig.ui.enableScreenOverlay;
            seatMode = appConfig.game.seatMode;
            appConfig.ui.enableScreenOverlay = true;
            appConfig.game.seatMode = true;
        });
        afterEach(() => {
            appConfig.ui.enableScreenOverlay = enableScreenOverlay;
            appConfig.game.seatMode = seatMode;
        });
        it("if screen overlay is disabled, do not show screen overlay", function () {
            appConfig.ui.enableScreenOverlay = false;
            const homePage = new HomePage();
            expect(homePage.showScreenOverlay()).toEqual(false);
        });
        
        it("if no login specified (undefined) in the configuration, allow enter login password", function () {
            settings.login(undefined);
            const homePage = new HomePage();

            expect(homePage.showScreenOverlay()).toEqual(false);
        });
        it("if no login specified (null) in the configuration, allow enter login password", function () {
            settings.login(null);
            const homePage = new HomePage();

            expect(homePage.showScreenOverlay()).toEqual(false);
        });
        it("if no login specified ('') in the configuration, allow enter login password", function () {
            settings.login("");
            const homePage = new HomePage();

            expect(homePage.showScreenOverlay()).toEqual(false);
        });
        it("if login specified in the configuration, enable screen overlay", function () {
            settings.login("user");
            const homePage = new HomePage();

            expect(homePage.showScreenOverlay()).toEqual(true);
        });
    });
});
