import * as ko from "knockout";
import { App } from "../app";
import { AccountManager } from "../services/accountManager";

declare const app: App;

export class RatingPage implements Page {
    public ratings = ko.observableArray<UserRatingModel>();
    public loading = ko.observable(false);

    public deactivate() {
        // Do nothing.
    }
    public async activate() {
        this.loading(true);
        const api = new AccountManager();
        try {
            const data = await api.getBestPlayers();
            this.loading(false);
            if (data.Status !== "Ok") {
                return;
            }

            const ratings: UserRatingModel[] = data.Data.map((_: UserRating) => {
                return {
                    Id: _.Id,
                    Login: _.Login,
                    Points: _.Points,
                    Stars: _.Stars,
                    IsGold: _.Points >= 500000,
                    IsSilver: _.Points >= 200000 && _.Points < 500000,
                    IsBronse: _.Points >= 100000 && _.Points < 200000,
                };
            });

            this.ratings(ratings);
        } catch (e) {
            this.loading(false);
        }
    }
    public back() {
        app.lobbyPageBlock.showLobby();
    }
}
