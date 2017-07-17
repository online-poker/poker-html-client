/// <reference path="../poker.commanding.api.ts" />
/* tslint:disable:no-bitwise */

import { TournamentView } from "../table/tournamentview";
import { App } from "../app";
import * as authManager from "../authmanager";
import { settings } from "../settings";
import { appConfig } from "../appconfig";
import { tableManager } from "../table/tablemanager";

declare var apiHost: string;
declare var app: App;

export class TableMenuPopup {
    public soundEnabled: KnockoutComputed<boolean>;
    public autoSwitchTables: KnockoutComputed<boolean>;
    public autoHideCards: KnockoutComputed<boolean>;
    public showInRating: KnockoutObservable<boolean>;
    public addMoneyAvailable = ko.observable(false);
    public addMoneyAllowed: KnockoutObservable<boolean>;
    public handHistoryAllowed: KnockoutObservable<boolean>;
    public accountStatusAllowed: KnockoutObservable<boolean>;
    public tournamentInformationAllowed: KnockoutObservable<boolean>;
    public rebuyAllowed: KnockoutObservable<boolean>;
    public doublerebuyAllowed: KnockoutObservable<boolean>;
    public addonAllowed: KnockoutObservable<boolean>;
    public isTournamentTable: KnockoutObservable<boolean>;
    public allowUsePersonalAccount: KnockoutObservable<boolean>;
    public allowTickets: KnockoutObservable<boolean>;
    public standupText: KnockoutComputed<string>;
    /**
     * Tournament has rebuys.
     */
    public tournamentHasRebuy = ko.observable(false);

    /**
     * Tournament has addons.
     */
    public tournamentHasAddon = ko.observable(false);

    constructor() {
        this.soundEnabled = ko.computed<boolean>({
            owner: this,
            read: function () {
                return settings.soundEnabled();
            },
            write: function (value) {
                settings.soundEnabled(value);
            },
        });
        this.autoSwitchTables = ko.computed<boolean>({
            owner: this,
            read: function () {
                return settings.autoSwitchTables();
            },
            write: function (value) {
                settings.autoSwitchTables(value);
            },
        });
        this.autoHideCards = ko.computed<boolean>({
            owner: this,
            read: function () {
                return settings.autoHideCards();
            },
            write: function (value) {
                settings.autoHideCards(value);
            },
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
        this.allowUsePersonalAccount = ko.observable(appConfig.joinTable.allowUsePersonalAccount);
        this.allowTickets = ko.observable(appConfig.joinTable.allowTickets);
        this.standupText = ko.pureComputed(() => {
            const currentTable = app.tablesPage.currentTable();
            const player = currentTable.myPlayer();
            if (player === null) {
                return "table.takeWin";
            }
            const hasWin = player.Money() > 0 || currentTable.myPlayerInGame();
            return hasWin ? "table.takeWin" : "table.leave";
        });
    }

    public shown() {
        // Load settings
        const self = this;
        const currentTable = app.tablesPage.currentTable();
        const playerIsInGame = currentTable.myPlayer() != null;
        this.addMoneyAvailable(currentTable.tournament() == null && currentTable.opened());
        this.addMoneyAllowed(currentTable.couldAddChips());
        this.handHistoryAllowed(playerIsInGame && currentTable.lastHandHistory() != null);
        this.accountStatusAllowed(authManager.authenticated());

        const tournamentView = currentTable.tournament();
        this.isTournamentTable(tournamentView != null);
        this.tournamentInformationAllowed(tournamentView != null);
        if (tournamentView !== null && currentTable.opened()) {
            // Set rebuy/addon status temporary to current tournament status
            // until data is loaded.

            // The rebuy and addons could be not supported by the 
            // actual tournament so buttons should be hidden.
            const tdata = tournamentView.tournamentData();
            this.tournamentHasRebuy((tdata.Options & TournamentOptionsEnum.HasRebuy) > 0);
            this.tournamentHasAddon((tdata.Options & TournamentOptionsEnum.HasAddon) > 0);

            if ((this.tournamentHasRebuy() || this.tournamentHasAddon())
                && playerIsInGame) {
                const moneyInGame = currentTable.myPlayer().TotalBet() + currentTable.myPlayer().Money();
                this.addonAllowed(tournamentView.addonAllowed() && tournamentView.addonCount() === 0);
                this.rebuyAllowed(tournamentView.rebuyAllowed()
                    && (moneyInGame + tdata.ChipsAddedAtReBuy) <= tdata.MaximumAmountForRebuy
                    && !currentTable.hasPendingMoney());
                this.doublerebuyAllowed(tournamentView.rebuyAllowed()
                    && (moneyInGame + tdata.ChipsAddedAtDoubleReBuy) <= tdata.MaximumAmountForRebuy);
                if (tournamentView.addonAllowed() || tournamentView.rebuyAllowed()) {
                    const api = new OnlinePoker.Commanding.API.Account(apiHost);
                    api.GetPersonalAccount().then(function (data) {
                        const personalAccount = data.Data;
                        const currentMoney = self.getCurrentMoney(tournamentView, personalAccount);
                        const addonPrice = tdata.AddonPrice + tdata.AddonFee;
                        const rebuyPrice = tdata.RebuyFee + tdata.RebuyPrice;
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
    public confirm() {
        app.closePopup();
    }
    public cancel() {
        app.closePopup();
    }
    public accountStatus() {
        if (!this.accountStatusAllowed()) {
            return;
        }

        app.showPopup("accountStatus");
    }
    public handHistory() {
        if (!this.handHistoryAllowed()) {
            return;
        }

        const currentTable = app.tablesPage.currentTable();
        app.handHistoryPopup.tableView(currentTable);
        app.showPopup("handHistory");
    }
    public addMoney() {
        if (!this.addMoneyAllowed()) {
            return;
        }

        const currentTable = app.tablesPage.currentTable();
        app.addMoneyPopup.tableView(currentTable);
        app.closePopup();
        app.showPopup("addMoney").then(function (results: { name: string; result: any }) {
            if (results.result === "cancel") {
                app.executeCommand("popup.tableMenu");
            }
        });
    }
    public showTournamentInformation() {
        if (!this.tournamentInformationAllowed()) {
            return;
        }

        const currentTable = app.tablesPage.currentTable();
        const tournamentView = currentTable.tournament();
        app.lobbyPageBlock.showLobby();
        app.lobbyPageBlock.selectTournament({ TournamentId: tournamentView.tournamentId });
        app.tablesPage.deactivate();
        this.confirm();
    }
    public rebuy() {
        if (!this.rebuyAllowed()) {
            return;
        }

        const currentTable = app.tablesPage.currentTable();
        currentTable.showRebuyPrompt();
    }
    public doubleRebuy() {
        if (!this.doublerebuyAllowed()) {
            return;
        }

        const currentTable = app.tablesPage.currentTable();
        currentTable.showDoubleRebuyPrompt();
    }
    public addon() {
        if (!this.addonAllowed()) {
            return;
        }

        const currentTable = app.tablesPage.currentTable();
        currentTable.showAddonPrompt();
    }
    public async showSettingsPrompt() {
        const authenticated = await app.requireAuthentication();
        if (authenticated) {
            app.executeCommand("popup.settings");
        }
    }
    public async showRules() {
        const authenticated = await app.requireAuthentication();
        if (authenticated) {
            app.executeCommand("popup.rules");
        }
    }
    public leave() {
        let index = tableManager.currentIndex();
        let tableView = tableManager.tables()[index];
        tableView.showStandupPrompt();
    }
    private getCurrentMoney(tournament: TournamentView, personalAccount: PersonalAccountData) {
        return personalAccount.RealMoney;
    }
}
