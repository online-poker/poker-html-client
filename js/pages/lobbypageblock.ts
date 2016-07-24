/// <reference path="../pageblock.ts" />
/// <reference path="lobbypage.ts" />
/// <reference path="tableslistpage.ts" />
/// <reference path="tournamentslistpage.ts" />
/// <reference path="tournamentlobbypage.ts" />

class LobbyPageBlock extends PageBlock {
    sngListPage: TournamentsListPage;
    tournamentsListPage: TournamentsListPage;
    lobbyPage: LobbyPage;
    tournamentLobbyPage: TournamentLobbyPage;
	tablesListPage: TablesListPage;

    constructor() {
        let lobbyPage = new LobbyPage();
        super("lobby", "filter", lobbyPage);

        this.lobbyPage = lobbyPage;
		this.tablesListPage = new TablesListPage();
        this.addSecondary("tablesList", this.tablesListPage);
        this.tournamentLobbyPage = new TournamentLobbyPage();
        App.addTabBarItemMapping("lobby", "tournamentLobby");
        this.addSecondary("tournamentLobby", this.tournamentLobbyPage);
        this.tournamentsListPage = new TournamentsListPage();
        App.addTabBarItemMapping("lobby", "tournamentsList");
        this.addSecondary("tournamentsList", this.tournamentsListPage);
        this.sngListPage = new TournamentsListPage();
        App.addTabBarItemMapping("lobby", "sngList");
        this.addSecondary("sngList", this.sngListPage);

        this.addSecondary("lobby", this.lobbyPage, true);
        this.currentPage = "lobby";
    }
    showLobby() {
        app.executeCommand("pageblock.lobby");
        app.lobbyPageBlock.showSecondary("lobby");
    }
    selectTournament(tournament) {
        this.tournamentLobbyPage.setTournament(tournament.TournamentId, this.currentPage);
        this.showSecondary("tournamentLobby");
    }
}
