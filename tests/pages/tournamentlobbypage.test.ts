import {
    TournamentDefinition,
    TournamentOptionsEnum,
    TournamentStatus,
    TournamentPlayerStatus,
} from "@poker/api-server";
import * as authManager from "poker/authmanager";
import { TournamentLobbyPage } from "poker/pages/tournamentlobbypage";
import * as metadataManager from "poker/metadatamanager";

const baseTournament: TournamentDefinition = {
    TournamentId: 1,
    TournamentName: "name",
    Description: "desc",
    Type: 1,
    CurrencyId: 1,
    PrizeCurrencyId: 1,
    RegistrationStartDate: "",
    RegistrationEndDate: "",
    StartDate: "",
    EndDate: null,
    FinishDate: null,
    JoinedPlayers: 0,
    TournamentTables: [],
    TournamentPlayers: [],
    BetLevel: null,
    PrizeAmount: 1000,
    CollectedPrizeAmount: 0,
    JoinFee: 0,
    BuyIn: 0,
    StartingChipsAmount: 1000,
    WellKnownBetStructure: 1,
    WellKnownPrizeStructure: 1,
    BlindUpdateTime: 0,
    IsRebuyAllowed: false,
    RebuyPrice: 100,
    RebuyFee: null,
    RebuyPeriodTime: 60,
    IsAddonAllowed: false,
    AddonPrice: 100,
    AddonFee: null,
    AddonPeriodTime: 60,
    PauseTimeout: null,
    Options: TournamentOptionsEnum.None,
    MaximumAmountForRebuy: 1000,
    IsRegistered: true,
    ChipsAddedAtReBuy: 1000,
    ChipsAddedAtDoubleReBuy: 2000,
    Status: TournamentStatus.Started,
    IsPaused: false,
    MinPlayers: 2,
    MaxPlayers: 1000,
};

const registeredTournament: TournamentDefinition = Object.assign(baseTournament, { IsRegistered: true });
const notRegisteredTournament: TournamentDefinition = Object.assign(baseTournament, { IsRegistered: false });

describe("Tournament lobby page", function () {
    beforeAll(() => {
        global.messages = {
        };
        metadataManager.bets = [
            [],
            [
                { Level: 1, SmallBlind: 10, BigBlind: 20, Ante: undefined },
            ],
        ];
        metadataManager.prizes = [
            [],
            [
                { MaxPlayer: 10, PrizeLevel: [50, 30, 20] },
            ],
        ];
    });
    describe("Numeric text", function () {
        it("Value that is > as 1000 shoud be with comma", function () {
            const tlobbyPage = new TournamentLobbyPage();
            const numericText = tlobbyPage.numericText(6526);

            expect(numericText).toEqual("6,526");
        });
        it("Value that is < as 1000 shoud be without comma", function () {
            const tlobbyPage = new TournamentLobbyPage();
            const numericText = tlobbyPage.numericText(652);

            expect(numericText).toEqual("652");
        });
    });

    describe("Registration button", function () {
        it("Unauthenticted could not register", function () {
            const tlobbyPage = new TournamentLobbyPage();
            authManager.login(null);

            expect(tlobbyPage.couldRegister()).toEqual(false);
        });
        it("When data is not received could not register", function () {
            const tlobbyPage = new TournamentLobbyPage();
            authManager.authenticated(true);

            tlobbyPage.tournamentData(null);

            expect(tlobbyPage.couldRegister()).toEqual(false);
        });
        it("Could not register if already registered", function () {
            const tlobbyPage = new TournamentLobbyPage();
            authManager.authenticated(true);

            const tournament = Object.assign(baseTournament, { IsRegistered: true });
            tlobbyPage.tournamentData(tournament);

            expect(tlobbyPage.couldRegister()).toEqual(false);
        });
        it("Could not register if status is Cancelled", function () {
            const tlobbyPage = new TournamentLobbyPage();
            authManager.authenticated(true);
            const tournament = Object.assign(notRegisteredTournament, { IsRegistered: false, Status: TournamentStatus.Cancelled });

            tlobbyPage.tournamentData(tournament);

            expect(tlobbyPage.couldRegister()).toEqual(false);
        });
        it("Could not register if status is Completed", function () {
            const tlobbyPage = new TournamentLobbyPage();
            authManager.authenticated(true);
            const tournament = Object.assign(notRegisteredTournament, { IsRegistered: false, Status: TournamentStatus.Completed });

            tlobbyPage.tournamentData(tournament);

            expect(tlobbyPage.couldRegister()).toEqual(false);
        });
        it("Could not register if status is RegistrationCancelled", function () {
            const tlobbyPage = new TournamentLobbyPage();
            authManager.authenticated(true);
            const tournament = Object.assign(notRegisteredTournament, { IsRegistered: false, Status: TournamentStatus.RegistrationCancelled });

            tlobbyPage.tournamentData(tournament);

            expect(tlobbyPage.couldRegister()).toEqual(false);
        });
        it("Could not register if status is Pending", function () {
            const tlobbyPage = new TournamentLobbyPage();
            authManager.authenticated(true);
            const tournament = Object.assign(notRegisteredTournament, { IsRegistered: false, Status: TournamentStatus.Pending });

            tlobbyPage.tournamentData(tournament);

            expect(tlobbyPage.couldRegister()).toEqual(false);
        });
        it("Could register if status is RegistrationStarted", function () {
            const tlobbyPage = new TournamentLobbyPage();
            authManager.authenticated(true);
            const tournament = Object.assign(notRegisteredTournament, { IsRegistered: false, Status: TournamentStatus.RegistrationStarted });

            tlobbyPage.tournamentData(tournament);

            expect(tlobbyPage.couldRegister()).toEqual(true);
        });
        it("Could register if status is LateRegistration", function () {
            const tlobbyPage = new TournamentLobbyPage();
            authManager.authenticated(true);
            const tournament = Object.assign(notRegisteredTournament, { IsRegistered: false, Status: TournamentStatus.LateRegistration });

            tlobbyPage.tournamentData(tournament);

            expect(tlobbyPage.couldRegister()).toEqual(true);
        });
    });
    describe("Cancel registration button", function () {
        it("Could not cancel registration if not authenticated", function () {
            const tlobbyPage = new TournamentLobbyPage();
            authManager.login(null);

            expect(tlobbyPage.couldUnregister()).toEqual(false);
        });
        it("Could not cancel registration if not registered", function () {
            const tlobbyPage = new TournamentLobbyPage();
            authManager.authenticated(true);
            const tournament = Object.assign(notRegisteredTournament);
            tlobbyPage.tournamentData(tournament);

            expect(tlobbyPage.couldUnregister()).toEqual(false);
        });
        it("Could not cancel registration if status is LateRegistration", function () {
            const tlobbyPage = new TournamentLobbyPage();
            authManager.authenticated(true);
            const tournament = Object.assign(registeredTournament, { IsRegistered: true, Status: TournamentStatus.LateRegistration });
            tlobbyPage.tournamentData(tournament);

            expect(tlobbyPage.couldUnregister()).toEqual(false);
        });
        it("Could not cancel registration if status is Cancelled", function () {
            const tlobbyPage = new TournamentLobbyPage();
            authManager.authenticated(true);
            const tournament = Object.assign(registeredTournament, { IsRegistered: true, Status: TournamentStatus.Cancelled });
            tlobbyPage.tournamentData(tournament);

            expect(tlobbyPage.couldUnregister()).toEqual(false);
        });
        it("Could not cancel registration if status is RegistrationCancelled", function () {
            const tlobbyPage = new TournamentLobbyPage();
            authManager.authenticated(true);
            const tournament = Object.assign(registeredTournament, { IsRegistered: true, Status: TournamentStatus.RegistrationCancelled });
            tlobbyPage.tournamentData(tournament);

            expect(tlobbyPage.couldUnregister()).toEqual(false);
        });
        it("Could cancel registration if status is RegistrationStarted", function () {
            const tlobbyPage = new TournamentLobbyPage();
            authManager.authenticated(true);
            const tournament = Object.assign(registeredTournament, { IsRegistered: true, Status: TournamentStatus.RegistrationStarted });
            tlobbyPage.tournamentData(tournament);

            expect(tlobbyPage.couldUnregister()).toEqual(true);
        });
    });
    describe("Continue game button", function () {
        it("Could not continue if not authenticated", function () {
            const tlobbyPage = new TournamentLobbyPage();
            authManager.authenticated(false);

            expect(tlobbyPage.couldContinueGame()).toEqual(false);
        });
        it("Could not continue if data does not received", function () {
            const tlobbyPage = new TournamentLobbyPage();
            authManager.authenticated(true);
            tlobbyPage.tournamentData(null);

            expect(tlobbyPage.couldContinueGame()).toEqual(false);
        });
        it("Could not continue if tournament does not started", function () {
            const tlobbyPage = new TournamentLobbyPage();
            authManager.authenticated(true);
            const tournament = Object.assign(registeredTournament, { IsRegistered: true, Status: TournamentStatus.RegistrationStarted });
            tlobbyPage.tournamentData(tournament);

            expect(tlobbyPage.couldContinueGame()).toEqual(false);
        });
        [TournamentStatus.Started, TournamentStatus.LateRegistration].forEach((testedStatus) => {
            it(`Could continue if tournament started with status ${testedStatus} and in game`, function () {
                const tlobbyPage = new TournamentLobbyPage();
                authManager.authenticated(true);
                authManager.loginId(1);
                const tournament = Object.assign(registeredTournament, {
                    IsRegistered: true,
                    Status: testedStatus,
                    TournamentPlayers: [
                        {
                            TournamentId: 1,
                            TournamentName: "",
                            PlayerId: 1,
                            PlayerName: "Login",
                            TableId: 1,
                            Status: TournamentPlayerStatus.Playing,
                            Prize: undefined,
                            Stack: undefined,
                        },
                    ],
                });
                tlobbyPage.tournamentData(tournament);

                expect(tlobbyPage.couldContinueGame()).toEqual(true);
            });
            it(`Could not continue if tournament started with status ${testedStatus} and player lose`, function () {
                const tlobbyPage = new TournamentLobbyPage();
                authManager.authenticated(true);
                authManager.loginId(1);
                const tournament = Object.assign(registeredTournament, {
                    IsRegistered: true,
                    Status: testedStatus,
                    TournamentPlayers: [
                        {
                            TournamentId: 1,
                            TournamentName: "",
                            PlayerId: 1,
                            PlayerName: "Login",
                            TableId: 1,
                            Status: TournamentPlayerStatus.Completed,
                            Prize: undefined,
                            Stack: undefined,
                        },
                    ],
                });
                tlobbyPage.tournamentData(tournament);

                expect(tlobbyPage.couldContinueGame()).toEqual(false);
            });
        });
    });
});
