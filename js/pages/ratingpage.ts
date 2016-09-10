import { App } from "../app";

declare var apiHost: string;
declare var app: App;

export class RatingPage implements Page {
    ratings = ko.observableArray<UserRating>();
    loading = ko.observable(false);

    constructor() {
        App.addTabBarItemMapping("more", "rating");
    }
    deactivate() {
		// Do nothing.
    }
    activate() {
        var self = this;
        this.loading(true);
        var api = new OnlinePoker.Commanding.API.Account(apiHost);
        api.GetBestPlayers().done(function (data, status) {
            self.loading(false);
            if (data.Status === "Ok") {
                var ratings = <UserRating[]>data.Data;
                ratings.forEach((_: any) => {
                    var points = parseInt(_.Points, 10);
                    _.IsGold = points >= 500000;
                    _.IsSilver = points >= 200000 && points < 500000;
                    _.IsBronse = points >= 100000 && points < 200000;
                });
                self.ratings(ratings);
            }
        }).fail(function () {
            self.loading(false);
        });
    }
    back() {
        app.lobbyPageBlock.showLobby();
    }
}
