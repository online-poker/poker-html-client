/// <reference path="../_references.ts" />
/// <reference path="../poker.commanding.api.ts" />
/// <reference path="../app.ts" />
/* tslint:disable:no-bitwise */

import { TournamentView } from "../table/tournamentview";
import { App } from "../app";
import * as authManager from "../authManager";

declare var apiHost: string;
declare var app: App;

export class TableMenuPopup {
    soundEnabled: KnockoutComputed<boolean>;
    autoSwitchTables: KnockoutComputed<boolean>;
    autoHideCards: KnockoutComputed<boolean>;
    showInRating: KnockoutObservable<boolean>;
    addMoneyAvailable = ko.observable(false);
    addMoneyAllowed: KnockoutObservable<boolean>;
    handHistoryAllowed: KnockoutObservable<boolean>;
    accountStatusAllowed: KnockoutObservable<boolean>;
    tournamentInformationAllowed: KnockoutObservable<boolean>;
    rebuyAllowed: KnockoutObservable<boolean>;
    doublerebuyAllowed: KnockoutObservable<boolean>;
    addonAllowed: KnockoutObservable<boolean>;
    isTournamentTable: KnockoutObservable<boolean>;

    /**
    * Tournament has rebuys.
    */
    tournamentHasRebuy = ko.observable(false);

    /**
    * Tournament has addons.
    */
    tournamentHasAddon = ko.observable(false);

    constructor() {
        this.soundEnabled = ko.computed<boolean>({
            read: function () {
                return settings.soundEnabled();
            },
            write: function (value) {
                settings.soundEnabled(value);
            },
            owner: this
        });
        this.autoSwitchTables = ko.computed<boolean>({
            read: function () {
                return settings.autoSwitchTables();
            },
            write: function (value) {
                settings.autoSwitchTables(value);
            },
            owner: this
        });
        this.autoHideCards = ko.computed<boolean>({
            read: function () {
                return settings.autoHideCards();
            },
            write: function (value) {
                settings.autoHideCards(value);
            },
            owner: this
        });
        this.showInRating = ko.observable(false);

        this.addMoneyAllowed = ko.observable(false);
        this.handHistoryAllowed = ko.observable(false);
        this.accountStatusAllowed = ko.observable(false);
        this.tournamentInformationAllowed = ko.observable(false);
        this.rebuyAllowed = ko.observable(false);
        this.doublerebuyAllowed = ko.observable(false);
        this.addonAllowed = ko.observable(false);
        this.isTournamentTable = ko.observable(false);
    }

    shown() {
        // Load settings
        var self = this;
        var currentTable = app.tablesPage.currentTable();
        var playerIsInGame = currentTable.myPlayer() != null;
        this.addMoneyAvailable(currentTable.tournament() == null && currentTable.opened());
        this.addMoneyAllowed(currentTable.couldAddChips());
        this.handHistoryAllowed(playerIsInGame && currentTable.lastHandHistory() != null);
        this.accountStatusAllowed(authManager.authenticated());

        var tournamentView = currentTable.tournament();
        this.isTournamentTable(tournamentView != null);
        this.tournamentInformationAllowed(tournamentView != null);
        if (tournamentView !== null && currentTable.opened()) {
            // Set rebuy/addon status temporary to current tournament status
            // until data is loaded.

            // The rebuy and addons could be not supported by the 
            // actual tournament so buttons should be hidden.
            var tdata = tournamentView.tournamentData();
            this.tournamentHasRebuy((tdata.Options & TournamentOptionsEnum.HasRebuy) > 0);
            this.tournamentHasAddon((tdata.Options & TournamentOptionsEnum.HasAddon) > 0);

            if ((this.tournamentHasRebuy() || this.tournamentHasAddon())
                && playerIsInGame) {
                var moneyInGame = currentTable.myPlayer().TotalBet() + currentTable.myPlayer().Money();
                this.addonAllowed(tournamentView.addonAllowed() && tournamentView.addonCount() === 0);
                this.rebuyAllowed(tournamentView.rebuyAllowed()
                    && (moneyInGame + tdata.ChipsAddedAtReBuy) <= tdata.MaximumAmountForRebuy
                    && !currentTable.hasPendingMoney());
                this.doublerebuyAllowed(tournamentView.rebuyAllowed()
                    && (moneyInGame + tdata.ChipsAddedAtDoubleReBuy) <= tdata.MaximumAmountForRebuy);
                if (tournamentView.addonAllowed() || tournamentView.rebuyAllowed()) {
                    var api = new OnlinePoker.Commanding.API.Account(apiHost);
                    api.GetPersonalAccount().then(function (data) {
                        var personalAccount = data.Data;
                        var currentMoney = self.getCurrentMoney(tournamentView, personalAccount);
                        var addonPrice = tdata.AddonPrice + tdata.AddonFee;
                        var rebuyPrice = tdata.RebuyFee + tdata.RebuyPrice;
                        self.addonAllowed(self.addonAllowed() && addonPrice < currentMoney);
                        self.rebuyAllowed(self.rebuyAllowed() && (rebuyPrice < currentMoney));
                        self.doublerebuyAllowed(self.doublerebuyAllowed() && ((2 * rebuyPrice) > currentMoney));
                    });
                }
            }
        } else {
            this.tournamentHasRebuy(false);
            this.tournamentHasAddon(false);

            this.addonAllowed(false);
            this.rebuyAllowed(false);
            this.doublerebuyAllowed(false);
        }
    }
    confirm() {
        app.closePopup();
    }
    cancel() {
        app.closePopup();
    }
    accountStatus() {
        if (!this.accountStatusAllowed()) {
            return;
        }

        app.showPopup("accountStatus");
    }
    handHistory() {
        if (!this.handHistoryAllowed()) {
            return;
        }

        var currentTable = app.tablesPage.currentTable();
        app.handHistoryPopup.tableView(currentTable);
        app.showPopup("handHistory");
    }
    addMoney() {
        if (!this.addMoneyAllowed()) {
            return;
        }

        var currentTable = app.tablesPage.currentTable();
        app.addMoneyPopup.tableView(currentTable);
        app.closePopup();
        app.showPopup("addMoney").done(function (results: { name: string; result: any }) {
            if (results.result === "cancel") {
                app.executeCommand("popup.tableMenu");
            }
        });
    }
    showTournamentInformation() {
        if (!this.tournamentInformationAllowed()) {
            return;
        }

        var currentTable = app.tablesPage.currentTable();
        var tournamentView = currentTable.tournament();
        app.lobbyPageBlock.showLobby();
        app.lobbyPageBlock.selectTournament({ TournamentId: tournamentView.tournamentId });
        app.tablesPage.deactivate();
        this.confirm();
    }
    rebuy() {
        var self = this;
        if (!this.rebuyAllowed()) {
            return;
        }

        var currentTable = app.tablesPage.currentTable();
        currentTable.showRebuyPrompt();
    }
    doubleRebuy() {
        var self = this;
        if (!this.doublerebuyAllowed()) {
            return;
        }

        var currentTable = app.tablesPage.currentTable();
        currentTable.showDoubleRebuyPrompt();
    }
    addon() {
        var self = this;
        if (!this.addonAllowed()) {
            return;
        }

        var currentTable = app.tablesPage.currentTable();
        currentTable.showAddonPrompt();
    }
    private getCurrentMoney(tournament: TournamentView, personalAccount: PersonalAccountData) {
        return personalAccount.RealMoney;
    }
}
