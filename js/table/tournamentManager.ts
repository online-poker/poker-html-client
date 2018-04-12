import * as signals from "signals";
import { TournamentView } from "./tournamentview";

/** Tournament Manager */
class TournamentManager {
    /**
     * Tournaments in which player registered.
     */
    public tournaments: KnockoutObservableArray<TournamentView>;

    /**
     * Notifies that tournament started
     */
    public tournamentStarted = new signals.Signal();

    /**
     * Notifies that tournament cancelled
     */
    public tournamentCancelled = new signals.Signal();

    /**
     * Gets tournament by it's id
     * @param id Number Id of the tournament to retreive
     */
    public getTournament(id: number): TournamentView {
        throw new Error("Not implemented");
    }

    /**
     * Initialize manager
     */
    public initialize(): void {
        // $.connection.hub.Game.client.
    }
}
