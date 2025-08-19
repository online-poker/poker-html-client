/* tslint:disable:no-bitwise */
import { PersonalAccountData, TournamentOptionsEnum } from "@poker/api-server";
import * as ko from "knockout";
import { IAuthenticationInformation } from "poker/authmanager";
import { ICommandExecutor } from "poker/commandmanager";
import { _ } from "poker/languagemanager";
import { PageBlock } from "poker/pageblock";
import { SimplePopup } from "poker/popups/index";
import { ICurrentTableProvider } from "poker/services";
import { App } from "../app";
import { appConfig } from "../appconfig";
import { IAccountManager } from "../services/accountManager";
import { settings } from "../settings";
import { tableManager } from "../table/tablemanager";
import { TournamentView } from "../table/tournamentview";

declare const app: App;

export class TableMenuPopup {
    public soundEnabled: ko.Computed<boolean>;
    public autoSwitchTables: ko.Computed<boolean>;
    public autoHideCards: ko.Computed<boolean>;
    public showInRating: ko.Observable<boolean>;
    public addMoneyAvailable = ko.observable(false);
    public addMoneyAllowed: ko.Observable<boolean>;
    public handHistoryAllowed: ko.Observable<boolean>;
    public leaveAllowed: ko.Observable<boolean>;
    public toggleSkipDealsAllowed: ko.Observable<boolean>;
    public accountStatusAllowed: ko.Observable<boolean>;
    public tournamentInformationAllowed: ko.Observable<boolean>;

    public rebuyAllowed: ko.Computed<boolean>;
    public doublerebuyAllowed: ko.Computed<boolean>;
    public addonAllowed: ko.Computed<boolean>;

    public isRebuyCurrentlyAllowed: ko.Observable<boolean>;
    public isDoubleRebuyCurrentlyAllowed: ko.Observable<boolean>;
    public isAddonCurrentlyAllowed: ko.Observable<boolean>;

    public isSufficientMoneyForRebuy: ko.Observable<boolean>;
    public isSufficientMoneyForDoubleRebuy: ko.Observable<boolean>;
    public isSufficientMoneyForAddon: ko.Observable<boolean>;

    public isTournamentTable: ko.Observable<boolean>;
    public allowUsePersonalAccount: ko.Observable<boolean>;
    public allowTickets: ko.Observable<boolean>;
    public standupText: ko.PureComputed<"table.takeWin" | "table.leave">;
    public allowSettings: ko.Computed<boolean>;
    public settingsCaption: ko.PureComputed<"settings.cardsVariantCaption" | "settings.orientationModeCaption" | "settings.caption">;
    /**
     * Tournament has rebuys.
     */
    public tournamentHasRebuy = ko.observable(false);

    /**
     * Tournament has addons.
     */
    public tournamentHasAddon = ko.observable(false);

    /**
     * Indicate that page reload is supported.
     */
    public pageReloadSupported = ko.observable(appConfig.game.hasPageReload);

    /**
     * Indicate that rating is supported.
     */
    public ratingSupported = ko.observable(appConfig.game.hasRating);
    /**
     * Indicate whether sitout status set.
     */
    public skipDeals: ko.Observable<boolean>;

    constructor(
        private currentTableProvider: ICurrentTableProvider,
        private commandExecutor: ICommandExecutor,
        private accountManager: IAccountManager,
        private authInformation: IAuthenticationInformation) {
        this.soundEnabled = ko.computed<boolean>({
            owner: this,
            read() {
                return settings.soundEnabled();
            },
            write(value) {
                settings.soundEnabled(value);
            },
        });
        this.autoSwitchTables = ko.computed<boolean>({
            owner: this,
            read() {
                return settings.autoSwitchTables();
            },
            write(value) {
                settings.autoSwitchTables(value);
            },
        });
        this.autoHideCards = ko.computed<boolean>({
            owner: this,
            read() {
                return settings.autoHideCards();
            },
            write(value) {
                settings.autoHideCards(value);
            },
        });
        this.showInRating = ko.observable(false);

        this.addMoneyAllowed = ko.observable(false);
        this.handHistoryAllowed = ko.observable(false);
        this.leaveAllowed = ko.observable(false);
        this.toggleSkipDealsAllowed = ko.observable(false);
        this.accountStatusAllowed = ko.observable(false);
        this.tournamentInformationAllowed = ko.observable(false);

        this.isAddonCurrentlyAllowed = ko.observable(false);
        this.isRebuyCurrentlyAllowed = ko.observable(false);
        this.isDoubleRebuyCurrentlyAllowed = ko.observable(false);

        this.isSufficientMoneyForAddon = ko.observable(false);
        this.isSufficientMoneyForRebuy = ko.observable(false);
        this.isSufficientMoneyForDoubleRebuy = ko.observable(false);

        this.rebuyAllowed = ko.computed(() =>
            this.isSufficientMoneyForRebuy() && this.isRebuyCurrentlyAllowed(),
        );
        this.doublerebuyAllowed = ko.computed(() =>
            this.isSufficientMoneyForDoubleRebuy() && this.isDoubleRebuyCurrentlyAllowed(),
        );
        this.addonAllowed = ko.computed(() =>
            this.isSufficientMoneyForAddon() && this.isAddonCurrentlyAllowed(),
        );

        this.isTournamentTable = ko.observable(false);

        this.allowUsePersonalAccount = ko.observable(appConfig.joinTable.allowUsePersonalAccount);
        this.allowTickets = ko.observable(appConfig.joinTable.allowTickets);
        this.standupText = ko.pureComputed(() => {
            const currentTable = this.currentTableProvider.currentTable();
            const player = currentTable.myPlayer();
            if (player === null) {
                return "table.takeWin";
            }
            const hasWin = player.Money() > 0 || currentTable.myPlayerInGame();
            return hasWin ? "table.takeWin" : "table.leave";
        });
        this.skipDeals = ko.observable<boolean>(false).extend({ rateLimit: 500 });
        this.allowSettings = ko.pureComputed(() =>
            this.allowTickets() || (appConfig.ui.usePortraitAndLandscapeOrientationModes && !PageBlock.useDoubleView),
        );
        this.settingsCaption = ko.pureComputed(() => {
            if (this.allowTickets() && !appConfig.ui.usePortraitAndLandscapeOrientationModes) {
                return "settings.cardsVariantCaption";
            }

            if (!this.allowTickets() && appConfig.ui.usePortraitAndLandscapeOrientationModes) {
                return "settings.orientationModeCaption";
            }

            return "settings.caption";
        });
    }

    public async shown() {
        // Load settings
        const currentTable = this.currentTableProvider.currentTable();
        const myPlayer = currentTable.myPlayer();
        const playerIsInGame = myPlayer != null;
        this.toggleSkipDealsAllowed(playerIsInGame);
        this.addMoneyAvailable(currentTable.addMoneyAvailable());
        this.addMoneyAllowed(currentTable.couldAddChips());
        this.handHistoryAllowed(currentTable.handHistoryAllowed());
        const leaveAllowed = myPlayer != null && !currentTable.myPlayerInGame() && myPlayer.IsSitoutStatus();
        this.leaveAllowed(!appConfig.game.seatMode || leaveAllowed);
        this.accountStatusAllowed(this.authInformation.authenticated());
        this.skipDeals(currentTable.isSitOut());

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
                const moneyInGame = myPlayer.TotalBet() + myPlayer.Money();

                this.isAddonCurrentlyAllowed(tournamentView.addonAllowed() && tournamentView.addonCount() === 0);
                this.isRebuyCurrentlyAllowed(tournamentView.rebuyAllowed()
                    && moneyInGame <= tdata.MaximumAmountForRebuy
                    && !currentTable.hasPendingMoney());
                this.isDoubleRebuyCurrentlyAllowed(tournamentView.rebuyAllowed()
                    && moneyInGame === 0);
                // Set isSufficientMoney status temporary to current allowed status
                // until data is loaded.
                this.isSufficientMoneyForDoubleRebuy(this.isDoubleRebuyCurrentlyAllowed());
                this.isSufficientMoneyForAddon(this.isAddonCurrentlyAllowed());
                this.isSufficientMoneyForRebuy(this.isRebuyCurrentlyAllowed());

                if (tournamentView.addonAllowed() || tournamentView.rebuyAllowed()) {
                    const data = await this.accountManager.getAccount();
                    const personalAccount = data.Data;
                    const currentMoney = this.getCurrentMoney(tournamentView, personalAccount);
                    const addonPrice = tdata.AddonPrice + tdata.AddonFee;
                    const rebuyPrice = tdata.RebuyFee + tdata.RebuyPrice;
                    this.isSufficientMoneyForAddon(addonPrice <= currentMoney);
                    this.isSufficientMoneyForRebuy(rebuyPrice <= currentMoney);
                    this.isSufficientMoneyForDoubleRebuy((2 * rebuyPrice) <= currentMoney);
                }
            }
        } else {
            this.tournamentHasRebuy(false);
            this.tournamentHasAddon(false);

            this.isRebuyCurrentlyAllowed(false);
            this.isDoubleRebuyCurrentlyAllowed(false);
            this.isAddonCurrentlyAllowed(false);
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

        const currentTable = this.currentTableProvider.currentTable();
        currentTable.displayHandHistory();
    }
    public async addMoney() {
        if (!this.addMoneyAllowed()) {
            return;
        }

        const currentTable = this.currentTableProvider.currentTable();
        currentTable.addMoney();
    }
    public showTournamentInformation() {
        if (!this.tournamentInformationAllowed()) {
            return;
        }

        const currentTable = this.currentTableProvider.currentTable();
        const tournamentView = currentTable.tournament();
        app.lobbyPageBlock.showLobby();
        app.lobbyPageBlock.selectTournament(tournamentView.tournamentData());
        app.tablesPage.deactivate();
        this.confirm();
    }
    public rebuy() {
        if (!this.isRebuyCurrentlyAllowed()) {
            return;
        }

        if (!this.isSufficientMoneyForRebuy()) {
            this.showInsufficientFundsPrompt("table.rebuyPromptCaption");
            return;
        }

        const currentTable = this.currentTableProvider.currentTable();
        currentTable.showRebuyPrompt();
    }
    public doubleRebuy() {
        if (!this.isDoubleRebuyCurrentlyAllowed()) {
            return;
        }

        if (!this.isSufficientMoneyForDoubleRebuy()) {
            this.showInsufficientFundsPrompt("table.doubleRebuyPromptCaption");
            return;
        }

        const currentTable = this.currentTableProvider.currentTable();
        currentTable.showDoubleRebuyPrompt();
    }
    public addon() {
        if (!this.isAddonCurrentlyAllowed()) {
            return;
        }

        if (!this.isSufficientMoneyForAddon()) {
            this.showInsufficientFundsPrompt("table.addonPromptCaption");
            return;
        }

        const currentTable = this.currentTableProvider.currentTable();
        currentTable.showAddonPrompt();
    }
    public async showSettingsPrompt() {
        const value = await app.requireAuthentication();
        if (value.authenticated) {
            this.commandExecutor.executeCommand("popup.settings");
        }
    }
    public async showRules() {
        const value = await app.requireAuthentication();
        if (value.authenticated) {
            this.commandExecutor.executeCommand("popup.rules");
        }
    }
    public async showCombinations() {
        const value = await app.requireAuthentication();
        if (value.authenticated) {
            this.commandExecutor.executeCommand("popup.combinations");
        }
    }
    public async showSweepstakesRules() {
        const value = await app.requireAuthentication();
        if (value.authenticated) {
            this.commandExecutor.executeCommand("popup.sweepstakesRules");
        }
    }
    /**
     * Reload console window.
     */
    public reload(): void {
        window.location.reload();
    }
    public leave() {
        const index = tableManager.currentIndex();
        const tableView = tableManager.tables()[index];

        if (this.leaveAllowed() && appConfig.game.seatMode) {
            tableView.showStandupPrompt();
        }

        if (!appConfig.game.seatMode) {
            const removeCurrentTable = () => {
                // Navigate back to the lobby.
                if (tableManager.tables().length === 0) {
                    app.lobbyPageBlock.showLobby();
                    app.tablesPage.deactivate();
                    app.closePopup();
                }
            };
            const leaved = this.commandExecutor.executeCommand("app.leaveTable", [tableView.tableId]) as JQueryDeferred<() => void>;
            leaved.then(removeCurrentTable);
        }
    }
    public toLobby() {
        const tableView = app.tablesPage.currentTable();
        const redirectToLobby = () => {
            app.lobbyPageBlock.showLobby();
            app.tablesPage.deactivate();
            app.closePopup();
        };
        if (tableView.myPlayer() != null) {
            redirectToLobby();
        } else {
            const removeCurrentTable = () => {
                // Navigate back to the lobby.
                if (tableManager.tables().length === 0) {
                    redirectToLobby();
                }
            };
            const leaved = this.commandExecutor.executeCommand("app.leaveTable", [tableView.tableId]) as JQueryDeferred<() => void>;
            leaved.then(removeCurrentTable);
        }
    }
    private toggleSkipDeals() {
        this.skipDeals(!this.skipDeals());
        const currentTable = this.currentTableProvider.currentTable();
        currentTable.toggleSkipDeals(this.skipDeals());
        this.confirm();
    }
    private getCurrentMoney(tournament: TournamentView, personalAccount: PersonalAccountData) {
        return personalAccount.RealMoney;
    }

    private showInsufficientFundsPrompt(promptTitle: string) {
        SimplePopup.display(_(promptTitle), _("tableMenu.insufficientFunds"));
    }
}
