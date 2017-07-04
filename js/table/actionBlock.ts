/// <reference path="../typings/signalr.d.ts" />

import * as ko from "knockout";
import { App } from "../app";
import { TableSlider } from "./tableSlider";
import { PlayerMessage } from "./playerMessage";
import { SystemMessage } from "./SystemMessage";
import { TablePlaceModel } from "./tabpleplacemodel";
import { TableView } from "./tableview";
import * as authManager from "../authmanager";
import { SimplePopup } from "../popups";
import { appConfig } from "../appconfig";
import { debugSettings } from "../debugsettings";
import { _ } from "../languagemanager";
import { withCommas } from "../helpers";

declare var apiHost: string;
declare var app: App;

export class ActionBlock {
    public tableSlider: TableSlider;
    public dealsAllowed: KnockoutObservable<boolean>;
    public buttonsEnabled: KnockoutObservable<boolean>;
    public showCardsEnabled: KnockoutObservable<boolean> = ko.observable(false);

    /**
     * Indicates that user could show first hole card.
     */
    public showHoleCard1Enabled: KnockoutObservable<boolean> = ko.observable(false);

    /**
     * Indicates that user could show second hole card.
     */
    public showHoleCard2Enabled: KnockoutObservable<boolean> = ko.observable(false);
    public processing: KnockoutObservable<boolean>;
    public turnEnabled: KnockoutObservable<boolean>;
    public isSitOut: KnockoutObservable<boolean>;
    public inGame: KnockoutObservable<boolean>;
    /**
    * Indicating whether authenticated player is playing in the game
    */
    public myPlayerInGame: KnockoutObservable<boolean>;
    public isCheck: KnockoutObservable<boolean>;

    /**
     * Indicating whether current check/call amount will lead to all-in condition.
     */
    public isAllInDuringCheckOrCall: KnockoutComputed<boolean>;
    public isRaise: KnockoutObservable<boolean>;

    /**
     * Indicating whether current raise amount will lead to all-in condition.
     */
    public isAllInDuringBetOrRaise: KnockoutComputed<boolean>;

    /**
    * Messages in the chat
    */
    public messages: KnockoutObservableArray<PlayerMessage>;

    /**
    * Messages from system in the chat
    */
    public systemMessages: KnockoutObservableArray<SystemMessage>;

    /**
    * Indicating thether player will support same amount which 
    * he should suport currently to stay in the game.
    */
    public supportDirectAmount: KnockoutObservable<boolean>;

    /**
    * Indicating thether player will support any amount which other players 
    * put on the table.
    */
    public supportAny: KnockoutObservable<boolean>;

    /**
    * Indicating whether cards should be folded automatically.
    */
    public foldOnRaise: KnockoutObservable<boolean>;

    /**
    * Text which would be 
    */
    public supportDirectAmountCaption: KnockoutObservable<string>;
    public supportAnyCaption: KnockoutObservable<string>;
    public foldOnRaiseCaption: KnockoutObservable<string>;
    public amountSupported: KnockoutObservable<number>;

    public expanded: KnockoutObservable<boolean>;
    public waitbb: KnockoutObservable<boolean>;
    public suppressWaitBBNotifications = false;
    public skipDeals: KnockoutObservable<boolean>;
    public autoFoldOrCheck: KnockoutObservable<boolean>;
    public allInCaption: KnockoutObservable<string>;
    public halfPotCaption: KnockoutObservable<string>;
    public potCaption: KnockoutObservable<string>;
    public maxAmountOfMoneyForOtherActivePlayers: KnockoutObservable<number>;

    public callAmount: KnockoutObservable<number>;
    public playerMoney: KnockoutObservable<number>;
    public couldRaise: KnockoutComputed<boolean>;
    public checkCallButtonCaption: KnockoutComputed<string>;
    public raiseBetButtonCaption: KnockoutComputed<string>;
    public checkOrCallAmount: KnockoutObservable<number>;
    public notMyTurn: KnockoutObservable<boolean>;
    public isInGame: KnockoutObservable<boolean>;
    public button1Caption: KnockoutObservable<string>;
    public button2Caption: KnockoutObservable<string>;
    public button3Caption: KnockoutObservable<string>;
    public button1Amount: KnockoutObservable<number>;
    public button2Amount: KnockoutObservable<number>;
    public button3Amount: KnockoutObservable<number>;
    public button1Visible = ko.observable(false);
    public button2Visible = ko.observable(false);
    public button3Visible = ko.observable(false);
    public needBB: KnockoutObservable<boolean>;
    public myPlayer: KnockoutObservable<TablePlaceModel>;
    private myPlayerWasInGame: KnockoutObservable<boolean>;
    /**
    * Indicates that game finished.
    */
    private gameFinished: KnockoutObservable<boolean>;
    /**
    * Indicates that prizes distributed in the game.
    */
    public prizesDistributed: KnockoutObservable<boolean>;
    public tableView: TableView;
    private suppressSetSitoutStatus: boolean;

    /**
    * Suppress actual execution of the operations. This property is for testing purpose only.
    */
    public suppressActions: boolean;

    /**
    * Notifies that fold executed.
    */
    public foldExecuted: Signal;

    /**
    * Notifies that check or call executed.
    */
    public checkOrCallExecuted: Signal;

    /**
    * Notifies that bet or raise executed.
    */
    public betOrRaiseExecuted: Signal;

    /**
    * Value indicating whether chat block is visible.
    */
    public chatVisible: KnockoutComputed<boolean>;

    /**
    * Value indicating whether SitOut block is visible.
    */
    public sitoutBlockVisible: KnockoutComputed<boolean>;

    /**
    * Value indicating whether Start block is visible.
    */
    public startBlockVisible: KnockoutComputed<boolean>;

    /**
    * Value indicating whether Observer block is visible.
    */
    public observerModeBlockVisible: KnockoutComputed<boolean>;

    /**
    * Value indicating whether Wait for BB checkbox is visible
    */
    public waitBigBlindBlockVisible = ko.observable<boolean>(true);

    /**
    * Value indicating whether Main buttons block is visible.
    */
    public mainButtonsBlockVisible: KnockoutComputed<boolean>;

    /**
    * Value indicating whether Auto buttons block is visible.
    */
    public autoButtonsBlockVisible: KnockoutComputed<boolean>;

    /**
    * Value indicating whether Raise block is visible.
    */
    public raiseBlockVisible: KnockoutComputed<boolean>;

    /**
    * Value indicating where game is closed.
    */
    public gameClosed = ko.observable(false);

    /**
    * Value indicating where component operating in test mode and some checks are disabled.
    */
    public testMode = ko.observable(false);

    public cardsOverlayVisible = ko.observable(true);

    constructor() {
        const self = this;
        this.tableSlider = new TableSlider();
        this.dealsAllowed = ko.observable(false);
        this.buttonsEnabled = ko.observable(false);
        this.processing = ko.observable(false);
        this.isSitOut = ko.observable(false);
        this.turnEnabled = ko.observable(false);
        this.inGame = ko.observable(false);
        this.isCheck = ko.observable(false);
        this.isRaise = ko.observable(true);
        this.callAmount = ko.observable(0);
        this.playerMoney = ko.observable(0);
        this.supportDirectAmount = ko.observable(false);
        this.supportAny = ko.observable(false);
        this.foldOnRaise = ko.observable(false);
        this.supportDirectAmountCaption = ko.observable("Чек");
        this.supportAnyCaption = ko.observable("Колл любую");
        this.foldOnRaiseCaption = ko.observable("Чек/Фолд");
        this.amountSupported = ko.observable(-1);
        this.maxAmountOfMoneyForOtherActivePlayers = ko.observable<number>();
        this.myPlayer = ko.observable<TablePlaceModel>();
        this.notMyTurn = ko.observable(false);
        this.isInGame = ko.observable(false);
        this.myPlayerInGame = ko.observable(false);
        this.myPlayerWasInGame = ko.observable(false);
        this.messages = ko.observableArray<PlayerMessage>();
        this.systemMessages = ko.observableArray<SystemMessage>();
        this.needBB = ko.observable<boolean>(false);
        this.gameFinished = ko.observable(true);
        this.prizesDistributed = ko.observable(true);

        this.expanded = ko.observable(false);
        this.waitbb = ko.observable(true);
        this.skipDeals = ko.observable(false);
        this.autoFoldOrCheck = ko.observable(false);
        this.allInCaption = ko.observable("");
        this.halfPotCaption = ko.observable("");
        this.potCaption = ko.observable("");
        this.checkOrCallAmount = ko.observable<number>();

        this.button1Caption = ko.observable(_("table.halfpot"));
        this.button2Caption = ko.observable(_("table.pot"));
        this.button3Caption = ko.observable(_("table.allin"));

        this.button1Amount = ko.observable(0);
        this.button2Amount = ko.observable(0);
        this.button3Amount = ko.observable(0);

        this.foldExecuted = new signals.Signal();
        this.checkOrCallExecuted = new signals.Signal();
        this.betOrRaiseExecuted = new signals.Signal();

        this.suppressSetSitoutStatus = false;
        this.suppressActions = false;

        this.couldRaise = ko.computed(() => {
            const amountLess = this.checkOrCallAmount() < this.playerMoney();
            if (!amountLess) {
                return false;
            }

            const maxAmountOfMoneyForOtherActivePlayers = this.maxAmountOfMoneyForOtherActivePlayers();
            const otherPlayersHasMoneyToSupport = this.maxAmountOfMoneyForOtherActivePlayers() > this.callAmount();
            return otherPlayersHasMoneyToSupport;
        });
        this.isAllInDuringCheckOrCall = ko.computed(() => {
            let currentAmount = self.checkOrCallAmount();
            currentAmount = currentAmount == null ? 0 : currentAmount;
            let playerMoney = self.playerMoney();
            playerMoney = playerMoney == null ? 0 : playerMoney;
            if (playerMoney <= currentAmount) {
                return true;
            }

            return false;
        });
        this.checkCallButtonCaption = ko.computed(() => {
            let currentAmount = self.checkOrCallAmount();
            currentAmount = currentAmount == null ? 0 : currentAmount;
            let playerMoney = self.playerMoney();
            playerMoney = playerMoney == null ? 0 : playerMoney;
            if (playerMoney <= currentAmount) {
                const myself = self.myPlayer();
                if (myself != null) {
                    return _("table.allin").replace("#amount", withCommas((myself.Bet() + playerMoney).toString(), ","));
                }

                return "";
            } else {
                if (self.isCheck()) {
                    return _("table.check");
                } else {
                    return _("table.call").replace("#amount", withCommas(currentAmount.toString(), ","));
                }
            }
        });
        this.isAllInDuringBetOrRaise = ko.computed(() => {
            let currentAmount = self.tableSlider.current();
            currentAmount = currentAmount == null ? 0 : currentAmount;
            const player = self.myPlayer();
            let playerMoney = self.playerMoney();
            if (player != null) {
                playerMoney += player.Bet();
            }

            playerMoney = playerMoney == null ? 0 : playerMoney;
            if (playerMoney <= currentAmount) {
                return true;
            }

            return false;
        });
        this.raiseBetButtonCaption = ko.computed(function () {
            let currentAmount = self.tableSlider.current();
            currentAmount = currentAmount == null ? 0 : currentAmount;
            const player = self.myPlayer();
            let playerMoney = self.playerMoney();
            if (player != null) {
                playerMoney += player.Bet();
            }

            playerMoney = playerMoney == null ? 0 : playerMoney;
            if (self.isAllInDuringBetOrRaise()) {
                const myself = self.myPlayer();
                if (myself != null) {
                    return _("table.allin").replace("#amount", withCommas(playerMoney, ",").toString());
                }

                return "";
            } else {
                if (self.isRaise()) {
                    return _("table.raise").replace("#amount", withCommas(currentAmount, ",").toString());
                } else {
                    return _("table.bet").replace("#amount", withCommas(currentAmount, ",").toString());
                }
            }
        });

        this.foldOnRaise.subscribe(function (value) {
            if (value) {
                self.supportAny(false);
                self.supportDirectAmount(false);
            }
        });
        this.supportDirectAmount.subscribe(function (value) {
            if (value) {
                self.supportAny(false);
                self.foldOnRaise(false);

                self.amountSupported(self.tableView.maximumBet() - self.tableView.myBet());
            }
        });
        this.supportAny.subscribe(function (value) {
            if (value) {
                self.supportDirectAmount(false);
                self.foldOnRaise(false);
            }
        });
        this.sitoutBlockVisible = ko.computed(function () {
            return self.isSitOut() && !self.gameClosed();
        });
        this.mainButtonsBlockVisible = ko.computed(function () {
            return self.turnEnabled() && !self.isSitOut() && self.buttonsEnabled()
                && self.dealsAllowed() && self.myPlayerInGame()
                && !self.gameClosed();
        });
        this.autoButtonsBlockVisible = ko.computed(function () {
            if (!self.isInGame()) {
                return false;
            }

            return !self.turnEnabled() && !self.isSitOut()
                && self.notMyTurn()
                && self.dealsAllowed() && self.myPlayerInGame()
                && !self.gameClosed();
        });
        this.raiseBlockVisible = ko.computed(function () {
            if (self.gameFinished()) {
                return false;
            }

            return self.mainButtonsBlockVisible()
                && self.couldRaise() && self.myPlayerInGame()
                && !self.gameClosed();
        });
        this.observerModeBlockVisible = ko.computed(function () {
            return (!authManager.authenticated() && !self.testMode()) || self.myPlayer() == null;
        });
        this.startBlockVisible = ko.computed(function () {
            if (self.sitoutBlockVisible()) {
                return false;
            }

            if (self.autoButtonsBlockVisible()) {
                return false;
            }

            if (self.mainButtonsBlockVisible()) {
                return false;
            }

            return !self.gameClosed() && !self.observerModeBlockVisible();
        });
        this.chatVisible = ko.computed(function () {
            return !self.raiseBlockVisible()
                && !self.gameClosed();
        });

        if (debugSettings.actionBlock.traceBlocksVisbility) {
            this.waitBigBlindBlockVisible.subscribe(function (visbile) {
                self.log("WaitBB block " + (visbile ? "visible" : "hidden"));
            });
            this.mainButtonsBlockVisible.subscribe(function (visbile) {
                self.log("Main Buttons block " + (visbile ? "visible" : "hidden"));
            });
            this.sitoutBlockVisible.subscribe(function (visbile) {
                self.log("Sit out block " + (visbile ? "visible" : "hidden"));
            });
            this.autoButtonsBlockVisible.subscribe((visbile) => {
                this.log("Auto Buttons block " + (visbile ? "visible" : "hidden"));
            });
        }
    }
    attach(tableView: TableView) {
        if (this.tableView != null) {
            throw new Error("Table view already attached to the action block");
        }

        this.tableView = tableView;
        if (tableView.model != null) {
            this.tableSlider.setStep(tableView.model.BigBlind);
            tableView.bigBlind.subscribe((bigBlind) => {
                this.tableSlider.setStep(bigBlind);
            });
        }

        this.tableView.turnEnabled.subscribe((value) => {
            this.turnEnabled(value);
        });

        this.tableView.isSitOut.subscribe((value) => {
            if (value !== this.isSitOut()) {
                this.suppressSetSitoutStatus = true;
                this.isSitOut(value);
                this.skipDeals(value);
                this.suppressSetSitoutStatus = false;
            }
        });

        this.tableView.myPlayer.subscribe((value) => {
            this.myPlayer(value);
            if (value == null) {
                this.inGame(false);
            } else {
                this.inGame(true);
            }
        });
        this.tableView.minimumRaiseAmount.subscribe((value) => {
            this.tableSlider.minimum(value);
            const myself = this.tableView.myPlayer();
            if (myself != null) {
                this.playerMoney(myself.Money());
            }
        });
        this.tableView.messages.subscribe((value) => {
            this.messages(value);
        });
        this.tableView.systemMessages.subscribe((value) => {
            this.systemMessages(value);
        });
        this.tableView.myPlayerInGame.subscribe((value) => {
            this.myPlayerInGame(value);
        });
        this.tableView.myPlayerWasInGame.subscribe((value) => {
            this.myPlayerWasInGame(value);
        });
        this.tableView.gameFinished.subscribe((value) => {
            this.gameFinished(value);
        });
        this.tableView.prizesDistributed.subscribe((value) => {
            this.prizesDistributed(value);
        });
        this.tableView.notMyTurn.subscribe((value) => {
            this.notMyTurn(value);
        });
        this.tableView.isInGame.subscribe((value) => {
            this.isInGame(value);
        });
        this.tableView.maximumRaiseAmount.subscribe((value) => {
            const myself = this.tableView.myPlayer();
            if (myself != null) {
                this.tableSlider.maximum(value + myself.Bet());
            }
        });
        this.tableView.checkOrCallAmount.subscribe((value) => {
            this.isCheck(value === 0);
            this.checkOrCallAmount(value);
        });
        this.tableView.maximumBet.subscribe((value) => {
            this.callAmount(value);
        });
        this.tableView.maxAmountOfMoneyForOtherActivePlayers.subscribe((value) => {
            this.maxAmountOfMoneyForOtherActivePlayers(value);
        });

        this.waitbb.subscribe((value) => {
            if (this.suppressWaitBBNotifications) {
                return;
            }

            const gameApi = new OnlinePoker.Commanding.API.Game(apiHost);
            if (value) {
                gameApi.WaitBigBlind(this.tableView.tableId);
            } else {
                gameApi.ForceJoinGame(this.tableView.tableId);
            }
        });

        this.autoFoldOrCheck.subscribe((value) => {
            this.expanded(false);
        });

        this.skipDeals.subscribe((value) => {
            if (this.suppressSetSitoutStatus) {
                return;
            }

            const gameApi = new OnlinePoker.Commanding.API.Game(apiHost);
            if (value) {
                gameApi.SitOut(this.tableView.tableId);
            } else {
                gameApi.ComeBack(this.tableView.tableId);
            }

            this.expanded(false);
        });
    }
    resetWaitBB() {
        this.suppressWaitBBNotifications = true;
        this.waitbb(true);
        this.suppressWaitBBNotifications = false;
    }
    fold() {
        if (!this.suppressActions) {
            this.tableView.fold();
        }

        this.expanded(false);
        this.foldExecuted.dispatch();
    }
    async checkOrCall() {
        if (!this.suppressActions) {
            if (this.isAllInDuringCheckOrCall()) {
                const result = await app.promptAsync(_("table.allInConfirmCaption"), [_("table.allInConfirm")]);
                if (!result) {
                    return;
                }
            }

            this.tableView.checkOrCall();
        }

        this.expanded(false);
        this.checkOrCallExecuted.dispatch();
    }
    async betOrRaise() {
        if (!this.suppressActions) {
            if (this.isAllInDuringBetOrRaise()) {
                const result = await app.promptAsync(_("table.allInConfirmCaption"), [_("table.allInConfirm")]);
                if (!result) {
                    return;
                }
            }

            this.tableView.betOrRaise();
        }

        this.expanded(false);
        this.betOrRaiseExecuted.dispatch();
    }
    showChatPopup() {
        app.tableChatPopup.attach(this.tableView);
        app.showPopup("tableChat");
    }
    async comeBack() {
        if (this.tableView.myPlayer().Money() === 0) {
            if (this.tableView.tournament() != null) {
                this.tableView.proposeRebuyOrAddon();
                return;
            }

            if (appConfig.game.seatMode) {
                SimplePopup.display(_("table.comeback"), _("table.askAdministratorToAddMoney"));
            } else {
                app.addMoneyPopup.tableView(this.tableView);
                const results = await app.showPopup("addMoney");
                if (results.result === "ok") {
                    await this.comeBackCore();
                }
            }
        } else {
            await this.comeBackCore();
        }
    }
    private async comeBackCore() {
        if (this.processing()) {
            return;
        }

        this.processing(true);
        try {
            await this.tableView.comeBack();
        } catch (e) {
            this.processing(false);
        }
    }
    updateBounds() {
        if ($(".slider-line").length > 0) {
            const lineWidth = $(".slider-line").width();
            const handleWidth = $(".slider-handle").width();
            const adj = -5;
            const translator = (pageX) => {
                const startOffset = $(".slider-line").offset().left;
                return pageX - startOffset + adj;
            };
            // -5 is base adjustment from one size; width - 5(base adj.) - 10(?)
            this.tableSlider.setBounds(adj, lineWidth - handleWidth + (-adj), translator);
        } else {
            this.tableSlider.setBounds(1, 100, x => x);
        }
    }
    resetAutomaticAction() {
        this.supportAny(false);
        this.supportDirectAmount(false);
        this.foldOnRaise(false);
        this.amountSupported(-1);
    }
    performAutomaticActions() {
        if (this.automaticallyFold()) {
            return true;
        }

        if (this.supportAnyBet()) {
            return true;
        }

        if (this.supportDirectAmountBet()) {
            return true;
        }

        if (this.checkOrFold()) {
            return true;
        }

        return false;
    }
    /**
    * Automatically fold cards if possible.
    *
    * @returns true if cards was folded; false otherwise.
    */
    automaticallyFold() {
        if (this.autoFoldOrCheck()) {
            const requiredBet = this.tableView.maximumBet() - this.tableView.myBet();
            if (requiredBet === 0 && appConfig.game.autoFoldAsFoldOnRaise) {
                this.checkOrCall();
            } else {
                this.fold();
            }

            return true;
        }

        return false;
    }
    /**
    * Automatically support any bet placed on the table.
    * @returns true if automatic action was performed; false otherwise.
    */
    supportAnyBet() {
        if (this.supportAny()) {
            this.checkOrCall();
            return true;
        }

        return false;
    }
    /**
    * Automatically support any bet placed on the table.
    * @returns true if automatic action was performed; false otherwise.
    */
    supportDirectAmountBet() {
        if (this.supportDirectAmount() && (this.amountSupported() >= 0)) {
            this.checkOrCall();
            this.supportDirectAmount(false);
            this.amountSupported(-1);
            return true;
        }

        this.amountSupported(-1);
        return false;
    }
    /**
    * Automatically check current bet or fold in case of bet raise.
    * @returns if automatic action was performed; false otherwise.
    */
    checkOrFold() {
        if (this.foldOnRaise()) {
            const requiredBet = this.tableView.maximumBet() - this.tableView.myBet();
            if (requiredBet === 0) {
                this.checkOrCall();
                this.foldOnRaise(false);
            } else {
                this.fold();
            }

            return true;
        }

        return false;
    }
    updateAutomaticActionsText(playerMoney: number, requiredBet: number) {
        if (requiredBet === 0) {
            this.supportDirectAmountCaption("Чек");
        } else {
            if (playerMoney <= requiredBet) {
                this.supportDirectAmountCaption("Олл-ин #amount".replace("#amount", withCommas(playerMoney.toFixed(), ",")));
            } else {
                const callAmount = (this.tableView.maximumBet() - this.tableView.myBet()).toFixed();
                this.supportDirectAmountCaption("Колл #amount".replace("#amount", withCommas(callAmount, ",")));
            }
        }

        if (this.supportDirectAmount()) {
            if (requiredBet > this.amountSupported()) {
                this.amountSupported(-1);
                this.supportDirectAmount(false);
            }
        }

        if (requiredBet > 0) {
            this.foldOnRaiseCaption("Фолд");
        } else {
            this.foldOnRaiseCaption("Чек/Фолд");
        }

        if (requiredBet > 0) {
            this.supportAnyCaption("Колл любую ставку");
        } else {
            this.supportAnyCaption("Колл любую ставку/Чек");
        }
    }
    updateSupportDirectAmountStatus(requiredBet: number) {
        const isDirectAmountSupported = (requiredBet === this.amountSupported());
        this.supportDirectAmount(isDirectAmountSupported);
        if (!isDirectAmountSupported) {
            this.amountSupported(-1);
        }
    }
    updateAdditionalButtons() {
        const threebbAmountOriginal = this.callAmount() + (3 * this.tableView.model.BigBlind);
        const threebbAmount = this.tableSlider.withinRange(threebbAmountOriginal);

        let potAmountOriginal = this.tableView.pots().reduce(function (pv, v) {
            return pv + v;
        }, 0); // + this.checkOrCallAmount();
        potAmountOriginal += this.tableView.places().reduce(function (pv: number, v: TablePlaceModel) {
            if (v.Bet() == null) {
                return pv;
            }

            return pv + v.Bet();
        }, 0);
        potAmountOriginal += this.checkOrCallAmount();

        // Since we calculate pot amount in the last calculations
        // we have to add current max bet.
        potAmountOriginal += this.tableView.maximumBet();
        const potAmount = this.tableSlider.withinRange(potAmountOriginal);

        const maxMoneyAmount = this.tableSlider.maximum();

        this.button1Amount(threebbAmount);
        this.button2Amount(potAmount);
        this.button3Amount(maxMoneyAmount);

        this.button1Caption(_("table.halfpot").replace("#amount", withCommas(this.button1Amount().toFixed(), ",")));
        this.button2Caption(_("table.pot").replace("#amount", withCommas(this.button2Amount().toFixed(), ",")));
        const player = this.myPlayer();
        let playerMoney = this.playerMoney();
        if (player != null) {
            playerMoney += player.Bet();
        }

        if (playerMoney <= this.maxAmountOfMoneyForOtherActivePlayers()) {
            this.button3Caption(_("table.allin").replace("#amount", withCommas(playerMoney.toFixed(), ",")));
        } else {
            this.button3Caption(_("table.raise").replace("#amount", withCommas(this.button3Amount().toFixed(), ",")));
        }

        this.button1Visible(this.tableSlider.isWithinRange(threebbAmountOriginal));
        this.button2Visible(this.tableSlider.isWithinRange(potAmountOriginal));
        this.button3Visible(true);
    }
    /**
    * Updates block visibility.
    */
    updateBlocks() {
        const waitBBBlockVisible = this.getWaitBBBlockVisible();
        this.waitBigBlindBlockVisible(waitBBBlockVisible);
    }
    /**
    * Toggles automatic panel.
    */
    toggle() {
        if (!appConfig.game.actionBlock.hasSecondaryPanel) {
            return;
        }

        this.expanded(!this.expanded());
    }

    /**
    * Expand automatic panel.
    */
    expand() {
        if (!appConfig.game.actionBlock.hasSecondaryPanel) {
            return;
        }

        if (!this.mainButtonsBlockVisible()) {
            return;
        }

        this.expanded(true);
    }

    /**
    * Collapse automatic panel.
    */
    collapse() {
        if (!appConfig.game.actionBlock.hasSecondaryPanel) {
            return;
        }

        if (!this.mainButtonsBlockVisible()) {
            return;
        }

        this.expanded(false);
    }
    allin() {
        this.tableSlider.current(this.button3Amount());
        this.betOrRaise();
        this.expanded(false);
    }
    halfPot() {
        this.tableSlider.current(this.button1Amount());
        this.betOrRaise();
        this.expanded(false);
    }
    pot() {
        this.tableSlider.current(this.button2Amount());
        this.betOrRaise();
        this.expanded(false);
    }
    updateNeedBB() {
        const currentPlayer = this.tableView.myPlayer();
        const hasPlayer = currentPlayer != null;
        if (!hasPlayer) {
            this.needBB(false);
            return;
        }

        const tableIsBig = this.tableView.places().filter(item => item != null).length > 3;
        const paused = this.tableView.paused();
        this.needBB(!paused && tableIsBig && !currentPlayer.IsParticipatingStatus());
    }
    toggleAutoFoldOrCheck() {
        this.autoFoldOrCheck(!this.autoFoldOrCheck());
    }
    toggleSkipDeals() {
        this.skipDeals(!this.skipDeals());
    }
    toggleWaitBB() {
        this.waitbb(!this.waitbb());
    }
    private getWaitBBBlockVisible() {
        if (this.sitoutBlockVisible()) {
            return false;
        }

        if (!this.needBB()) {
            return false;
        }

        if (this.myPlayer() == null) {
            return false;
        }

        const waitBBHidden = this.isInGame() || this.myPlayerWasInGame();
        return !waitBBHidden;
    }
    private log(message: string, ...params: any[]) {
        if (debugSettings.actionBlock.traceBlocksVisbility) {
            console.log(message, params);
        }
    }
}
