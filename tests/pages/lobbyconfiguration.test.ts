import { LobbyPage } from "poker/pages";

describe("Lobby page cofiguration", function () {
    global.messages = {
    };
    it("All tables should be enabled", function () {
        const testAppConfig: any = {
            lobby: {
                cashTablesEnabled: true,
                sngTablesEnabled: true,
                tournamentTablesEnabled: true,
            },
            tournament: {
                enabled: true,
                enableTournamentOnly: false,
            },
        };
        const lobbyPage = new LobbyPage(testAppConfig);
        expect(lobbyPage.cashTablesEnabled()).toBeTruthy();
        expect(lobbyPage.sngTablesEnabled()).toBeTruthy();
        expect(lobbyPage.tournamentTablesEnabled()).toBeTruthy();
    });
    it("Only cash tables should be enabled, if tournament in general is disabled", function () {
        const testAppConfig: any = {
            lobby: {
                cashTablesEnabled: true,
                sngTablesEnabled: true,
                tournamentTablesEnabled: true,
            },
            tournament: {
                enabled: false,
                enableTournamentOnly: true,
            },
        };
        const lobbyPage = new LobbyPage(testAppConfig);
        expect(lobbyPage.cashTablesEnabled()).toBeTruthy();
        expect(lobbyPage.sngTablesEnabled()).not.toBeTruthy();
        expect(lobbyPage.tournamentTablesEnabled()).not.toBeTruthy();
    });
    it("Only tournament tables should be enabled, if tournamentonly config is turned on", function () {
        const testAppConfig: any = {
            lobby: {
                cashTablesEnabled: true,
                sngTablesEnabled: true,
                tournamentTablesEnabled: true,
            },
            tournament: {
                enabled: true,
                enableTournamentOnly: true,
            },
        };
        const lobbyPage = new LobbyPage(testAppConfig);
        expect(lobbyPage.cashTablesEnabled()).not.toBeTruthy();
        expect(lobbyPage.sngTablesEnabled()).not.toBeTruthy();
        expect(lobbyPage.tournamentTablesEnabled()).toBeTruthy();
    });
});
