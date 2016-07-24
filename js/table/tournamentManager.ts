/// <reference path="../_references.ts" />
/// <reference path="../authmanager.ts" />
/// <reference path="../app.ts" />
/// <reference path="../commandmanager.ts" />
/// <reference path="tableview.ts" />
/// <reference path="tournamentview.ts" />

class TournamentManager {
    /**
    * Tournaments in which player registered.
    */
    tournaments: KnockoutObservableArray<TournamentView>;

    /**
    * Notifies that tournament started
    */
    tournamentStarted = new signals.Signal();

    /**
    * Notifies that tournament cancelled
    */
    tournamentCancelled = new signals.Signal();

    /**
    * Gets tournament by it's id
    * @param id Number Id of the tournament to retreive
    */
    getTournament(id: number): TournamentView {
        throw new Error("Not implemented");
    }

    /**
    * Initialize manager
    */
    initialize(): void {
        // $.connection.hub.Game.client.
    }
}
