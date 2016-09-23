import { TournamentView } from "./tournamentView";

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
