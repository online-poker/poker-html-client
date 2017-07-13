/// <reference path="../poker.commanding.api.ts" />
/* tslint:disable:no-bitwise */

import { TournamentView } from "../table/tournamentview";
import { App } from "../app";
import * as authManager from "../authmanager";
import { settings } from "../settings";
import { appConfig } from "../appconfig";
import * as commandManager from "../commandmanager";
import { tableManager } from "../table/tablemanager";

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
    public allowUsePersonalAccount: KnockoutObservable<boolean>;
    public allowTickets: KnockoutObservable<boolean>;
    private standupText: KnockoutComputed<string>;
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

    shown() {
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

        const currentTable = app.tablesPage.currentTable();
        app.handHistoryPopup.tableView(currentTable);
        app.showPopup("handHistory");
    }
    addMoney() {
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
    showTournamentInformation() {
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
    rebuy() {
        if (!this.rebuyAllowed()) {
            return;
        }

        const currentTable = app.tablesPage.currentTable();
        currentTable.showRebuyPrompt();
    }
    doubleRebuy() {
        if (!this.doublerebuyAllowed()) {
            return;
        }

        const currentTable = app.tablesPage.currentTable();
        currentTable.showDoubleRebuyPrompt();
    }
    addon() {
        if (!this.addonAllowed()) {
            return;
        }

        const currentTable = app.tablesPage.currentTable();
        currentTable.showAddonPrompt();
    }
    async showSettingsPrompt() {
        const self = this;
        const authenticated = await app.requireAuthentication();
        if (authenticated) {
            app.executeCommand("popup.settings");
        }
    }
    async showRules() {
        const self = this;
        const authenticated = await app.requireAuthentication();
        if (authenticated) {
            app.executeCommand("popup.rules");
        }
    }
    leave() {
        let index = tableManager.currentIndex();
        let tableView = tableManager.tables()[index];
        tableView.showStandupPrompt();
    }
    private getCurrentMoney(tournament: TournamentView, personalAccount: PersonalAccountData) {
        return personalAccount.RealMoney;
    }
}
