import { Account } from "../api/account";
import { App } from "../app";

declare var apiHost: string;
declare var app: App;

export class RatingPage implements Page {
    public ratings = ko.observableArray<UserRating>();
    public loading = ko.observable(false);

    constructor() {
        App.addTabBarItemMapping("more", "rating");
    }
    public deactivate() {
        // Do nothing.
    }
    public async activate() {
        const self = this;
        this.loading(true);
        const api = new Account(apiHost);
        try {
            const data = await api.getBestPlayers();
            self.loading(false);
            if (data.Status !== "Ok") {
                return;
            }

            const ratings = data.Data;
            ratings.forEach((_: any) => {
                const points = parseInt(_.Points, 10);
                _.IsGold = points >= 500000;
                _.IsSilver = points >= 200000 && points < 500000;
                _.IsBronse = points >= 100000 && points < 200000;
            });
            self.ratings(ratings);
        } catch (e) {
            self.loading(false);
        }
    }
    public back() {
        app.lobbyPageBlock.showLobby();
    }
}
