/* tslint:disable:no-bitwise */
import * as ko from "knockout";
import * as moment from "moment";
import { IApiProvider } from "poker/api";
import { authManager } from "poker/authmanager";
import { AccountManager } from "poker/services/accountManager";
import * as signals from "signals";
import { App } from "../app";
import { appConfig } from "../appconfig";
import { debugSettings } from "../debugsettings";
import { withCommas } from "../helpers";
import { _ } from "../languagemanager";
import { SimplePopup } from "../popups/simplepopup";
import { connectionService, getSoundManager, slowInternetService } from "../services";
import { ConnectionWrapper } from "../services/connectionwrapper";
import { SlowInternetService } from "../services/slowinternetservice";
import { settings } from "../settings";
import * as timeService from "../timeservice";
import { ActionBlock } from "./actionBlock";
import { AnimationSettings } from "./animationsettings";
import { allBacksClassesFourCards, allBacksClassesTwoCards, convertToCards, decodeCardsArray } from "./cardsHelper";
import { GameActionsQueue } from "./gameactionsqueue";
import * as HoldemHand from "./hand";
import { HandHistory } from "./handhistory";
import { PlayerMessage } from "./playerMessage";
import * as runtimeSettings from "./runtimesettings";
import { SystemMessage } from "./SystemMessage";
import { TableCardsPlace } from "./tableCardsPlace";
import { TablePlaces } from "./tableplaces";
import { TablePlaceModel } from "./tabpleplacemodel";
import { TournamentView } from "./tournamentview";

declare let app: App;

function getBackCardsFromGameType(gameType: number) {
    return gameType === 1 ? allBacksClassesTwoCards : allBacksClassesFourCards;
}

interface CardsRepresentation {
    Cards: number[];
    Suits: number[];
}

export class TableView {
    public static MaxMessagesCount: number = 100;
    public tableName: KnockoutObservable<string>;

    /**
     * Current login which sitting on this view.
     */
    public currentLogin: KnockoutObservable<string>;

    /**
     * Represents the value indicating that information
     * about the table is retreiving.
     */
    public connecting: KnockoutObservable<boolean>;

    /**
     * Request which performs connecting to the table.
     */
    public connectingRequest: JQueryDeferred<any> | null = null;

    public smallBlind: KnockoutObservable<number>;
    public bigBlind: KnockoutObservable<number>;
    public ante: KnockoutObservable<number>;
    public changeBetParametersNextGame = ko.observable(false);
    public changeGameTypeNextGame = ko.observable(false);
    public nextGameSmallBlind: KnockoutObservable<number> = ko.observable(0);
    public nextGameBigBlind: KnockoutObservable<number> = ko.observable(0);
    public nextGameType: KnockoutObservable<number> = ko.observable(0);
    public nextGameAnte: KnockoutObservable<number> = ko.observable(0);
    public nextGameInformation: KnockoutComputed<string>;
    public nextGameTypeInformation: KnockoutComputed<string>;
    public currentCombinationVisible: KnockoutComputed<boolean>;
    /**
     * Minimal amount of money which currently authenticated player
     * could bring on the table if he stand up from the table lately.
     */
    public minimalPlayerBuyIn: KnockoutObservable<number>;
    /**
     * Minimal base amount of buy-in in BB to bring on the table.
     */
    public minimalBuyIn: KnockoutObservable<number>;
    public gamePlayers: KnockoutObservableArray<number>;
    public places: KnockoutComputed<TablePlaceModel[]>;
    public pots: KnockoutObservableArray<number>;
    public tableCards: TableCardsPlace;
    public messages: KnockoutObservableArray<PlayerMessage>;
    public systemMessages: KnockoutObservableArray<SystemMessage>;
    public lastRaise: KnockoutObservable<number>;
    public timePass: KnockoutObservable<number>;
    /**
     * Count of actual actions which was performed by the players during the current game
     */
    public actionsCount: KnockoutObservable<number>;
    /**
     * Indicating whether authenticated player is playing in the game
     */
    public myPlayerInGame: KnockoutComputed<boolean>;
    /**
     * Indicating whether authenticated player was playing in the game
     */
    public myPlayerWasInGame: KnockoutComputed<boolean>;
    /**
     * Id of the current game on the table.
     */
    public gameId: KnockoutObservable<number>;
    public currentGameId: KnockoutObservable<number>;
    /**
     * Indicates that game finished.
     */
    public gameFinished: KnockoutObservable<boolean>;
    /**
     * Indicates that prizes distributed in the game.
     */
    public prizesDistributed: KnockoutObservable<boolean>;
    /**
     * Indicates that game started.
     */
    public gameStarted: KnockoutObservable<boolean>;
    /**
     * Count of active players in the game
     */
    public activePlayersCount: KnockoutComputed<number>;
    /**
     * Value indicating whether all bets are rounded.
     */
    public allBetsRounded: KnockoutObservable<boolean>;
    /**
     * Value indicating whether use cards variant up
     */
    public cardsVariantUp: KnockoutObservable<boolean>;
    /**
     * Value indicating whether use cards variant down
     */
    public cardsVariantDown: KnockoutObservable<boolean>;
    /**
     * Css rules for table-container
     */
    public containerCss: KnockoutObservable<any>;

    /**
     * Indicate game type
     */
    public gameType: KnockoutObservable<number>;
    public has2Cards: KnockoutComputed<boolean>;
    public has4Cards: KnockoutComputed<boolean>;

    public timeLeft: KnockoutComputed<number>;
    public timerInterval: number = 0;
    public chipWidth: number;

    public chatMessage: KnockoutObservable<string>;
    public combinations: KnockoutObservableArray<string>;
    public currentPlayer: KnockoutComputed<TablePlaceModel | null>;
    public myPlayer: KnockoutComputed<TablePlaceModel | null>;
    public mainButtonsEnabled: KnockoutObservable<boolean>;
    public playerActions: KnockoutObservable<any>;
    public turnEnabled: KnockoutComputed<boolean>;
    public isMyTurn: KnockoutComputed<boolean>;
    public notMyTurn: KnockoutComputed<boolean>;
    public isInGame: KnockoutComputed<boolean>;
    public checkOrCallAmount: KnockoutComputed<number>;

    /**
     * Bet amount for currently active player.
     */
    public currentBet: KnockoutComputed<number>;

    /**
     * Bet amount for player.
     */
    public myBet: KnockoutComputed<number>;
    public currentTotalBet: KnockoutComputed<number>;
    public maximumBet: KnockoutComputed<number>;
    public currentRaise: KnockoutComputed<number>;
    public minimumRaiseAmount: KnockoutComputed<number | null>;
    public maximumRaiseAmount: KnockoutComputed<number | null>;
    public amountSupported: KnockoutObservable<number>;
    public maxAmountOfMoneyForOtherActivePlayers: KnockoutObservable<number>;
    public isSitOut: KnockoutComputed<boolean>;
    public totalPot: KnockoutComputed<number>;
    public totalPotCaption: KnockoutComputed<string>;
    public currentCombination = ko.observable("");
    public actionBlock: ActionBlock;
    public onMyTurn: Signal;
    public onGamefinished: Signal;
    public tablePlaces: TablePlaces;
    public lastHandHistory: KnockoutObservable<HandHistory>;
    public hasPreviousHand: KnockoutComputed<boolean>;
    public tableBetsCaption: KnockoutComputed<string>;
    public currentHandCaption: KnockoutComputed<string>;
    public previousHandCaption: KnockoutComputed<string>;

    public roundNotification: KnockoutObservable<string>;
    public roundNotificationCaption: KnockoutComputed<string>;
    public isRoundNotificationShown: KnockoutComputed<boolean>;
    public onPlayerCardsDealed: Signal;
    public onFlopDealed: Signal;
    public onTurnDealed: Signal;
    public onRiverDealed: Signal;
    /**
     * Indicates that animation is suppressed from playing.
     */
    public animationSuppressed = ko.observable(false);

    /**
     * Tournament to which belongs given table.
     */
    public tournament = ko.observable<TournamentView>(null);

    /**
     * Indicates that table is frozen.
     */
    public frozen = ko.observable(false);

    /**
     * Indicates that table is opened
     */
    public opened = ko.observable(true);

    /**
     * Indicates that table is paused
     */
    public paused = ko.observable(false);
    public pauseDate = ko.observable<number>(null);
    public soundEnabled = false;
    public hasPendingMoney = ko.observable(false);
    public hasNotification = ko.observable(false);
    public notification = ko.observable("");
    public couldAddChips: KnockoutComputed<boolean>;

    /* If of the last message Id starting from which messages could be displayed */
    public lastMessageId = 0;

    public queue: GameActionsQueue;
    private animationSettings = AnimationSettings.getSettings();
    private sitting = false;
    private cardsReceived: boolean;
    private handHistory: HandHistory;
    private pauseDescription = ko.observable("");
    private pauseDescriptionHandle: number | null = null;
    private notificationHandleTimeout: number | null = null;
    private notificationHandleInterval: number | null = null;
    private displayingRebuyAddonNotification = false;

    /**
     * Indicates that Ante detected during current game.
     */
    private anteDetected = false;

    private enableInjectPlayerCards = false;

    /**
     * Initializes a new instance of the @see TableView class
     * @param tableId Id of the table.
     * @param model View model.
     * @param apiProvider API provider for performing operation.
     */
    constructor(public tableId: number, public model: GameTableModel, private apiProvider: IApiProvider) {
        const self = this;
        this.tableId = tableId;
        this.tableName = ko.observable(model === null ? "0" : model.TableName);
        this.connecting = ko.observable(true);
        this.gamePlayers = ko.observableArray<number>([]);
        this.pots = ko.observableArray<number>([]);
        this.tableCards = new TableCardsPlace();
        this.messages = ko.observableArray<PlayerMessage>([]);
        this.systemMessages = ko.observableArray<SystemMessage>([]);
        this.chatMessage = ko.observable("");
        this.playerActions = ko.observable();
        this.mainButtonsEnabled = ko.observable(false);
        this.gameId = ko.observable<number>();
        this.currentGameId = ko.observable<number>();
        this.actionsCount = ko.observable(0);
        this.bigBlind = ko.observable<number>(model === null ? 0 : model.BigBlind);
        this.smallBlind = ko.observable<number>(model === null ? 0 : model.SmallBlind);
        this.ante = ko.observable<number>(null);
        this.minimalPlayerBuyIn = ko.observable<number>();
        this.minimalBuyIn = ko.observable<number>();
        this.lastRaise = ko.observable<number>();
        this.timePass = ko.observable<number>();
        this.gameFinished = ko.observable(true);
        this.prizesDistributed = ko.observable(true);
        this.gameStarted = ko.observable(false);
        this.combinations = ko.observableArray<string>([]);
        this.actionBlock = new ActionBlock();
        this.tablePlaces = new TablePlaces(model == null ? 0 : model.MaxPlayers);
        this.chipWidth = 30;
        this.cardsReceived = false;
        this.onMyTurn = new signals.Signal();
        this.onGamefinished = new signals.Signal();
        this.queue = new GameActionsQueue();
        this.cardsVariantUp = ko.observable<boolean>(false);
        this.cardsVariantDown = ko.observable<boolean>(true);

        this.roundNotification = ko.observable("");
        this.roundNotificationCaption = ko.computed(() => this.roundNotification());
        this.isRoundNotificationShown = ko.computed(() => appConfig.game.isRoundNotificationEnabled && this.roundNotification() !== "");
        this.onPlayerCardsDealed = new signals.Signal();
        this.onFlopDealed = new signals.Signal();
        this.onTurnDealed = new signals.Signal();
        this.onRiverDealed = new signals.Signal();

        this.gameType = ko.observable();
        this.has2Cards = ko.computed(() => this.gameType() === 1);
        this.has4Cards = ko.computed(() => this.gameType() === 2);

        this.places = ko.computed(function () {
            return self.tablePlaces.places();
        }, this);
        this.gameType.subscribe((gameType) => {
            this.places().forEach((place) => {
                place.BackCards(getBackCardsFromGameType(gameType));
            });
            this.actionBlock.isPotLimitGame(gameType !== 1);
        });
        // Trigger repopulation of Back cards on the places.
        this.gameType(1);

        if (typeof window !== "undefined") {
            if (window.innerWidth >= 1024 || window.innerHeight >= 1024) {
                this.chipWidth = 60;
                if (window.innerWidth >= 1920 || window.innerHeight >= 1920) {
                    this.chipWidth = 2 * 83;
                }

                if (window.innerWidth >= 3840 || window.innerHeight >= 3840) {
                    this.chipWidth = 4 * 83;
                }
            }
        }

        this.myPlayer = ko.computed(function () {
            self.tablePlaces.placesRefreshTrigger();
            const p = self.places().filter((item) => {
                return item.PlayerName() === self.currentLogin();
            });
            if (p.length > 0) {
                return p[0];
            }

            return null;
        }, this).extend({ notify: "always" });

        this.myPlayer.subscribe(function (value) {
            if (value !== null && authManager.loginId() === value.PlayerId() && appConfig.game.cardsOverlaySupported) {
                value.needCardsOverlay(true);
            }
        });

        this.myPlayerInGame = ko.computed(function () {
            const gid = self.gameId();
            if (gid === null || gid === 0) {
                return false;
            }

            const myself = self.myPlayer();
            if (myself === null) {
                return false;
            }

            return (myself.Cards() !== null) && (myself.Cards().length !== 0);
        }, this);

        this.currentLogin = ko.observable(authManager.login());
        authManager.registerAuthenticationChangedHandler(function (value) {
            self.currentLogin(authManager.login());
        });

        this.timeLeft = ko.computed(function () {
            if (self.frozen()) {
                return -1;
            }

            let pass = self.timePass();
            pass = pass === null ? 0 : pass;
            const moveTime = appConfig.timeSettings.moveTime || runtimeSettings.game.moveTime;
            return moveTime - pass;
        });
        this.currentRaise = ko.computed<number>({
            owner: this,
            read() {
                return self.actionBlock.tableSlider.current();
            },
            write(value) {
                self.actionBlock.tableSlider.current(value);
            },
        });
        this.currentPlayer = ko.computed(function () {
            self.tablePlaces.placesRefreshTrigger();
            const p = self.places().filter((item) => {
                return item.IsCurrent();
            });
            if (p.length > 0) {
                return p[0];
            }

            return null;
        }, this);

        this.activePlayersCount = ko.computed(function () {
            self.tablePlaces.placesRefreshTrigger();
            const activePlayersCount = self.places().reduce((prev: number, value: TablePlaceModel) => {
                const isActive = value.WasInGame() && (value.Cards() !== null);
                return prev + (isActive ? 1 : 0);
            }, 0);
            return activePlayersCount;
        }, this);

        this.myPlayerWasInGame = ko.computed(function () {
            self.tablePlaces.placesRefreshTrigger();
            const myself = self.myPlayer();
            if (myself === null) {
                return false;
            }

            return (myself.WasInGame() === true);
        }, this);

        this.turnEnabled = ko.computed(() => {
            self.tablePlaces.placesRefreshTrigger();
            const cp = self.currentPlayer();
            if (cp === null) {
                return false;
            }

            const activePlayersCount = this.places().reduce((prev: number, value: TablePlaceModel) => {
                const isActive = value.WasInGame() && (value.Cards() !== null);
                return prev + (isActive ? 1 : 0);
            }, 0);
            return (cp.PlayerName() === self.currentLogin()) && activePlayersCount > 1;
        }, this);

        this.isMyTurn = ko.computed(function () {
            self.tablePlaces.placesRefreshTrigger();
            const cp = self.myPlayer();
            if (cp === null || !cp.IsInGameStatus()) {
                return false;
            }

            if (!self.gameStarted()) {
                return false;
            }

            if (cp.IsCurrent() === null) {
                return false;
            }

            return cp.IsCurrent();
        }, this);

        this.notMyTurn = ko.computed(function () {
            self.tablePlaces.placesRefreshTrigger();
            const cp = self.myPlayer();
            if (cp === null || !cp.IsInGameStatus()) {
                return false;
            }

            if (cp.IsCurrent() === null) {
                return true;
            }

            return !cp.IsCurrent();
        }, this);

        this.isInGame = ko.computed(function () {
            self.tablePlaces.placesRefreshTrigger();
            const cp = self.myPlayer();
            if (cp === null || !cp.IsInGameStatus()) {
                return false;
            }

            return true;
        });

        this.maximumBet = ko.computed(function () {
            self.tablePlaces.placesRefreshTrigger();
            let result = 0;
            result = self.places().reduce(function (previousValue: number, currentValue: TablePlaceModel) {
                return Math.max(previousValue, currentValue.Bet());
            }, 0);
            return result;
        }, this);

        this.allBetsRounded = ko.computed(function () {
            self.tablePlaces.placesRefreshTrigger();
            const playersInGame = self.places().filter((value) => value.WasInGame()).length;
            const activePlayers = self.places().filter((value) => value.WasInGame() && (value.Cards() !== null));
            const maxBet = self.maximumBet();
            const allRounded = activePlayers.filter((player) => (player.Bet() === maxBet)
                || (player.Money() === 0)).length === activePlayers.length;
            if (allRounded && (self.actionsCount() >= playersInGame)) {
                return true;
            }

            return false;
        }, this);

        this.currentBet = ko.computed(function () {
            self.tablePlaces.placesRefreshTrigger();
            const result = self.places().reduce(function (previousValue: number, currentValue: TablePlaceModel) {
                if (currentValue.IsCurrent()) {
                    return currentValue.Bet();
                }

                return previousValue;
            }, 0);
            return result;
        }, this);

        this.myBet = ko.computed(function () {
            self.tablePlaces.placesRefreshTrigger();
            const myPlayer = self.myPlayer();
            if (myPlayer === null) {
                return 0;
            }

            return myPlayer.Bet();
        }, this);

        this.currentTotalBet = ko.computed(function () {
            self.tablePlaces.placesRefreshTrigger();
            const result = self.places().reduce(function (previousValue: number, currentValue: TablePlaceModel) {
                if (currentValue.IsCurrent()) {
                    return currentValue.TotalBet();
                }

                return previousValue;
            }, 0);
            return result;
        }, this);

        this.checkOrCallAmount = ko.computed(function () {
            return self.maximumBet() - self.currentBet();
        }, this);

        this.minimumRaiseAmount = ko.computed(function () {
            self.tablePlaces.placesRefreshTrigger();
            const currentPlayer = self.myPlayer();
            if (currentPlayer === null) {
                return null;
            }

            const oldVersion = false;
            if (oldVersion) {
                const currentBet = self.currentBet();
                let mb = 2 * (self.lastRaise() - currentBet) - self.checkOrCallAmount();

                // No less then big blind.
                mb = Math.max(mb, self.bigBlind());

                // No more then current money
                mb = Math.min(mb, currentPlayer.Money());
                const addon = currentBet + self.checkOrCallAmount();
                let raiseAmount = mb + addon;
                const maxAmountOfMoneyForOtherActivePlayers = self.maxAmountOfMoneyForOtherActivePlayers();
                raiseAmount = Math.min(raiseAmount, maxAmountOfMoneyForOtherActivePlayers);
                return raiseAmount;
            } else {
                let basicRaise = self.maximumBet() + self.lastRaise();

                // No less then big blind.
                basicRaise = Math.max(basicRaise, self.bigBlind());

                // No more then current money
                basicRaise = Math.min(basicRaise, currentPlayer.Money() + currentPlayer.Bet());

                // No more then money which other players has.
                const maxAmountOfMoneyForOtherActivePlayers = self.maxAmountOfMoneyForOtherActivePlayers();
                const raiseAmount = Math.min(basicRaise, maxAmountOfMoneyForOtherActivePlayers);
                return raiseAmount;
            }
        }, this);

        this.isSitOut = ko.computed(() => {
            self.tablePlaces.placesRefreshTrigger();
            const currentPlayer = this.myPlayer();
            if (currentPlayer === null) {
                return false;
            }

            return (currentPlayer.Status() & 1) !== 0;
        }, this);

        this.maxAmountOfMoneyForOtherActivePlayers = ko.computed(function () {
            let result = 0;
            result = self.places().reduce(function (previousValue: number, currentValue: TablePlaceModel) {
                if (currentValue.PlayerName() === self.currentLogin()) {
                    return previousValue;
                }

                if (!currentValue.IsInGameStatus()) {
                    return previousValue;
                }

                if (currentValue.Cards() === null) {
                    return previousValue;
                }

                return Math.max(previousValue, currentValue.Bet() + currentValue.Money());
            }, 0);
            return result;
        }).extend({ notify: "always" });

        this.containerCss = ko.computed(() => {
            const cardsVariant = settings.cardsVariant();
            if (cardsVariant === "up") {
                this.cardsVariantUp = ko.observable<boolean>(true);
                this.cardsVariantDown = ko.observable<boolean>(false);
            } else if (cardsVariant === "down") {
                this.cardsVariantUp = ko.observable<boolean>(false);
                this.cardsVariantDown = ko.observable<boolean>(true);
            }
            return {
                "expanded": this.actionBlock.expanded(),
                "cardsvariant-up": this.cardsVariantUp(),
                "cardsvariant-down": this.cardsVariantDown(),
            };
        });
        this.nextGameTypeInformation = ko.computed(() => {
            if (!this.changeGameTypeNextGame()) {
                return "";
            }

            const gameTypeName = this.nextGameType() === 1 ? _("table.holdem") : _("table.omaha");
            return _("table.gameTypeChangeNextGame", {
                gameType: gameTypeName,
            });
        });
        this.nextGameInformation = ko.computed(() => {
            if (!this.changeBetParametersNextGame()) {
                return "";
            }

            if (!this.nextGameAnte()) {
                return _("table.betLevelChangeNextGame",
                    {
                        smallBlind: this.nextGameSmallBlind(),
                        bigBlind: this.nextGameBigBlind(),
                    });
            } else {
                return _("table.betLevelChangeNextGameWithAnte", {
                    smallBlind: this.nextGameSmallBlind(),
                    bigBlind: this.nextGameBigBlind(),
                    ante: this.nextGameAnte(),
                });
            }
        });
        this.maximumRaiseAmount = ko.computed(() => {
            const currentPlayer = this.myPlayer();
            if (currentPlayer === null) {
                return null;
            }

            let max = self.maxAmountOfMoneyForOtherActivePlayers();
            if (this.gameType() === 2) {
                max = Math.min(max, this.actionBlock.getPot());
            }

            const bet = currentPlayer.Bet();
            const money = currentPlayer.Money();
            return Math.min(money + bet, max) - bet;
        }, this).extend({ notify: "always" });

        this.totalPot = ko.computed(function () {
            self.tablePlaces.placesRefreshTrigger();
            const totalBetsOnTable = self.places().reduce((prev: number, item: TablePlaceModel) => {
                return prev + item.Bet();
            }, 0);
            const potsArray = self.pots();
            if (potsArray === null) {
                return totalBetsOnTable;
            }

            const pots = potsArray.reduce((prev: number, item: number) => {
                return prev + item;
            }, 0);

            return totalBetsOnTable + pots;
        }, this);

        this.totalPotCaption = ko.computed(function () {
            self.tablePlaces.placesRefreshTrigger();
            const totalPot = self.totalPot();
            if (totalPot === null || totalPot === 0) {
                return "";
            }

            return _("table.totalpot")
                .replace("#amount", withCommas(totalPot.toFixed(), ","));
        }, this);

        this.tableBetsCaption = ko.computed(function () {
            const hasAnte = self.ante() != null;
            if (hasAnte) {
                return _("table.betsWithAnte", { ante: self.ante(), bb: self.bigBlind(), sb: self.smallBlind() });
            }

            return _("table.bets", { bb: self.bigBlind(), sb: self.smallBlind() });
        }, this);

        this.couldAddChips = ko.pureComputed(function () {
            const me = self.myPlayer();
            if (me == null) {
                return false;
            }

            if (self.hasPendingMoney()) {
                return false;
            }

            if (appConfig.game.noTableMoneyLimit) {
                return true;
            }

            const totalBet = (me.TotalBet() == null ? 0 : me.TotalBet());
            const baseMinimalBuyIn = self.minimalBuyIn() * self.model.BigBlind;
            const tableTotal = totalBet + me.Money() + me.Bet();
            return (20 * baseMinimalBuyIn) > tableTotal;
        }, this);
        this.currentCombinationVisible = ko.computed(() => {
            const myPlayer = this.myPlayer();
            if (!myPlayer) {
                return false;
            }

            if (!appConfig.game.cardsOverlaySupported) {
                return true;
            }

            return !myPlayer.cardsOverlayVisible();
        });
        this.currentCombinationVisible.subscribe((value) => {
            const myPlayer = this.myPlayer();
            if (myPlayer === null) {
                return;
            }
            if (value) {
                myPlayer.DisplayedHandCards(myPlayer.HandCards());
                return;
            }

            myPlayer.DisplayedHandCards(getBackCardsFromGameType(self.gameType()));
        });
        this.actionBlock.attach(this);

        this.initHandHistory();
    }

    /**
     * Gets current cards combination
     */
    public getCurrentCombination() {
        const my = this.myPlayer();
        if (my == null) {
            return null;
        }

        const tableCards = this.tableCards.tableCardsData();
        return my.getCombination(tableCards);
    }
    public startTimer(startTime: number = 1) {
        const self: TableView = this;
        if (this.frozen()) {
            return;
        }

        self.timePass(startTime);
        this.timerInterval = timeService.setInterval(function () {
            if (runtimeSettings.updateTimer) {
                const time = self.timePass();
                self.timePass(time + 1);
                if (self.timeLeft() === 7) {
                    if (self.currentPlayer() === self.myPlayer()) {
                        if (self.soundEnabled) {
                            const soundManager = getSoundManager();
                            soundManager.playTurnReminder();
                        }
                    } else {
                        if (self.soundEnabled) {
                            const soundManager = getSoundManager();
                            soundManager.playTurnReminderForAll();
                        }
                    }
                }
            }
        }, 1000);
    }
    public clearTimer() {
        timeService.clearInterval(this.timerInterval);
        this.timePass(null);
    }
    public clearInformation() {
        this.messages([]);
    }
    /**
     * Updates information about the table from the server.
     */
    public async updateTableInformation() {
        const self = this;
        if (this.connectingRequest !== null && this.connectingRequest.state() === "pending") {
            this.log("Cancelling the connection request process");
            this.cancelUpdateTableInformation();
            // Re-schedule updating information.
            try {
                await this.connectingRequest;
            } catch (e) {
                this.log("Rescheduling the updating information.");
                await this.updateTableInformation();
            }

            return;
        }

        this.connecting(true);
        const currentLoadingRequest = $.Deferred();
        this.clearTimer();
        const wrapper = connectionService.currentConnection;
        if (wrapper === null) {
            console.error(`Connection to ${this.tableId} should be initialied at this point. This indicate serious error.`);
            return;
        }

        let hubId = wrapper.connection.id;
        const connectionInfo = "HID:" + hubId;
        this.log("Connecting to table " + this.tableId + " on connection " + connectionInfo);
        const startConnection = app.buildStartConnection();
        const api = this.apiProvider.getGame();

        // Set opening card parameters in parallel to other operations.
        await api.setTableParameters(this.tableId, !settings.autoHideCards());
        try {
            this.connectingRequest = currentLoadingRequest;
            await startConnection;
            if (wrapper.terminated) {
                self.log(`Connection  ${hubId} appears to be terminated`);
                return;
            }

            hubId = wrapper.connection.id;
            self.log("Attempting to connect to table and chat over connection " + hubId);

            const joinTableRequest = this.joinTable(wrapper);
            const joinChatRequest = this.joinChat(wrapper);
            const joinRequest = $.when(joinTableRequest, joinChatRequest);
            currentLoadingRequest.progress(function (command: string) {
                self.log("Receiving request to cancel all joining operations");
                joinTableRequest.notify(command);
                joinChatRequest.notify(command);
            });
            await joinRequest.then(function () {
                if (wrapper.terminated) {
                    console.log("Cancel terminated connection.");
                    currentLoadingRequest.reject("Cancelled");
                    return;
                }

                self.log("Jointing to table finished");
                currentLoadingRequest.resolve();
            }, function (result1, result2) {
                if (wrapper.terminated) {
                    self.log("Don't use terminated connection.");
                    return;
                }

                let message: string;
                if (result2 == null) {
                    let taskFailed;
                    if (result1[2] === joinTableRequest) {
                        taskFailed = "join table";
                    } else {
                        taskFailed = "join chat";
                    }

                    message = "Rejecting request due to " + taskFailed + " failure in the connection."
                        + "Failed request: " + result1[0];
                } else {
                    message = "Rejecting request due to one of the error in the connection."
                        + "First request: " + result1[0]
                        + "Second request: " + result2[0];
                }

                self.log(message);
                currentLoadingRequest.reject(message);
            });
        } catch (message) {
            self.log("Table connection failed. Error: " + message);
            currentLoadingRequest.reject("Table connection failed. Error: " + message);
        }
    }
    public cancelUpdateTableInformation() {
        if (this.connectingRequest !== null) {
            this.connectingRequest.notify("cancel");
            this.connectingRequest = null;
        }
    }
    public joinTable(wrapper: ConnectionWrapper, maxAttempts = 3) {
        const self = this;
        const result = $.Deferred();
        if (maxAttempts === 0 || wrapper.terminated) {
            this.log("Stop connecting to table");
            result.reject("Stop connecting to table", false);
            return result;
        }

        const hubId = connectionService.currentConnection.connection.id;
        const connectionInfo = "HID:" + hubId;
        this.log("Joining table on connection " + connectionInfo);
        let cancelled = false;
        let subsequentDeferred: JQueryDeferred<any> | null = null;
        const cancelOperation = function () {
            self.log("Cancelling join table request");
            result.reject("Cancelled", true);
        };

        wrapper.buildStartConnectionAsync().then(function () {
            if (wrapper.terminated) {
                cancelOperation();
                return;
            }

            self.log(`Executing Game.join on connection ${wrapper.connection.id} in state ${wrapper.connection.state}`);
            const operation = wrapper.connection.Game.server.join(self.tableId)
                .then(function () {
                    if (wrapper.terminated) {
                        cancelOperation();
                        return;
                    }

                    result.resolve();
                }, function (error: any) {
                    if (wrapper.terminated || cancelled || error === "Cancelled") {
                        cancelOperation();
                        return;
                    }

                    const message = "" + error as string;
                    self.log("Failed to join table " + self.tableId + ", " + connectionInfo + ". Reason: " + message);
                    if (message.indexOf("Connection was disconnected before invocation result was received.") >= 0) {
                        self.log("Stopped connecting to table since underlying connection is broken");
                        slowInternetService.showReconnectFailedPopup();
                        result.reject("Stopped connecting to table since underlying connection is broken", false);
                        return;
                    } else {
                        subsequentDeferred = self.joinTable(wrapper, maxAttempts - 1);
                        return subsequentDeferred.then(function () {
                            result.resolve();
                        }, function (subsequentError, subsequentCancelled: boolean) {
                            result.reject(subsequentError, subsequentCancelled);
                        });
                    }
                });

            result.progress(function (command: string) {
                cancelled = true;
                result.reject("Cancelled");
                if (subsequentDeferred !== null) {
                    subsequentDeferred.notify("cancel");
                    subsequentDeferred = null;
                }
            });
        }, function () {
            cancelOperation();
        });
        return result;
    }
    public joinChat(wrapper: ConnectionWrapper, maxAttempts = 3) {
        const self = this;
        const result = $.Deferred();
        if (maxAttempts === 0 || wrapper.terminated) {
            this.log("Stop connecting to table chat");
            result.reject("Stop connecting to table chat", false);
            return result;
        }

        let cancelled = false;
        let subsequentDeferred: JQueryDeferred<any> | null = null;
        const cancelOperation = function () {
            self.log("Cancelling join table request");
            result.reject("Cancelled", true);
        };

        wrapper.buildStartConnection()().then(function () {
            if (wrapper.terminated) {
                cancelOperation();
                return;
            }

            self.log(`Executing Game.join on connection ${wrapper.connection.id} in state ${wrapper.connection.state}`);
            const operation = wrapper.connection.Chat.server.join(self.tableId)
                .then(function () {
                    if (wrapper.terminated) {
                        cancelOperation();
                        return;
                    }

                    result.resolve();
                }, function (message: string) {
                    if (wrapper.terminated || cancelled) {
                        self.log("Cancelling join table chat request");
                        result.reject("Cancelled", true);
                        return;
                    }

                    self.log("Failed to join table " + self.tableId + " chat. Reason: " + message);
                    subsequentDeferred = self.joinChat(wrapper, maxAttempts - 1);
                    return subsequentDeferred.then(function () {
                        result.resolve();
                    }, function (subsequentError, subsequentCancelled: boolean) {
                        result.reject(subsequentError, subsequentCancelled);
                    });
                });

            result.progress(function (command: string) {
                cancelled = true;
                result.reject("Cancelled");
                if (subsequentDeferred !== null) {
                    subsequentDeferred.notify("cancel");
                    subsequentDeferred = null;
                }
            });
        }, function () {
            cancelOperation();
        });
        return result;
    }
    public disconnect() {
        /// <signature>
        ///     <summary>Updates the information about the table from the server</summary>
        /// </signature>
        const self = this;
        // HACK: Game server should correctly leave from table.
        // Looks like when calling leave status stop receiving player specific
        // notifications. Which is looks like SignalR connection is not correctly
        // removed from the corresponding group.
        // connectionService.currentConnection.connection.Game.server.leave(this.tableId);
        // connectionService.currentConnection.connection.Chat.server.leave(this.tableId);
    }
    public setButtons(dealerSeat: number) {
        if (dealerSeat === 0) {
            this.setDealer(0);
            this.setSmallBlind(0);
            this.setBigBlind(0);
        } else {
            const smallBlindSeat = this.getNextPlayerSeat(dealerSeat) || 0;
            const bigBlindSeat = this.getNextPlayerSeat(smallBlindSeat) || 0;

            this.setDealer(dealerSeat);
            this.setSmallBlind(smallBlindSeat);
            this.setBigBlind(bigBlindSeat);
        }

        const playersInGame = this.places().filter((value) => value.WasInGame() && value.IsInGameStatus()).length;
        if (playersInGame === 2) {
            const bigBlindSeat = this.getNextPlayerSeat(dealerSeat) || 0;

            this.setDealer(dealerSeat);
            this.setSmallBlind(dealerSeat);
            this.setBigBlind(bigBlindSeat);
        }
    }
    public setDealer(dealerSeat: number) {
        const players = this.places();
        players.forEach((p) => {
            if (p.Seat() === dealerSeat) {
                p.IsDealer(true);
            } else {
                p.IsDealer(null);
            }
        });
        // this.places(players);
    }

    public setSmallBlind(smallBlindSeat: number) {
        const players = this.places();
        players.forEach((p) => {
            if (p.Seat() === smallBlindSeat) {
                p.IsSmallBlind(true);
                return;
            } else {
                p.IsSmallBlind(false);
            }
        });
    }

    public setBigBlind(bigBlindSeat: number) {
        const players = this.places();
        players.forEach((p) => {
            if (p.Seat() === bigBlindSeat) {
                p.IsBigBlind(true);
                return;
            } else {
                p.IsBigBlind(false);
            }
        });
    }

    public getNextPlayerSeat(currentSeat: number): number | null {
        const players = this.places();
        let comparePlayer = currentSeat;
        let nextPlayer: number | null = null;
        const maxPlayers = this.tablePlaces.getMaxPlayers();
        for (let i = 0; i < maxPlayers; i++) {
            if (nextPlayer != null) {
                break;
            }

            comparePlayer = (comparePlayer + 1) % maxPlayers;
            if (comparePlayer === 0) {
                comparePlayer = maxPlayers;
            }

            players.forEach((p) => {
                if (nextPlayer !== null) {
                    return;
                }

                if (p.Seat() === comparePlayer) {

                    if (p.WasInGame() && p.IsInGameStatus()) {
                        nextPlayer = p.Seat();
                    }
                }
            });
        }

        return nextPlayer;
    }

    public setCurrent(currentPlayerId: number) {
        const players = this.places();
        players.forEach((p) => {
            if (p.PlayerId() === currentPlayerId) {
                p.IsCurrent(true);
            } else {
                p.IsCurrent(null);
            }
        });
    }

    /**
     * Sits players on the table
     * @param playerId Id of the player which join the table
     * @param seat Number of seat where player sit
     * @param playerName Name of the player which join the table
     * @param amount Amount of money which player bring to the table
     * @param playerUrl URL for the player avatar.
     * @param points Point which player account has
     * @param stars Stars which player account has
     */
    public async onSit(
        playerId: number,
        seat: number,
        playerName: string,
        amount: number,
        playerUrl: string,
        points: number,
        stars: number) {
        this.logGameEvent("Player " + playerId + " sit on the seat " + seat);
        const places = this.places();

        const initialStatus = !this.paused() ? 0 : (8 /* IsParticipatingStatus */ + 16 /* IsInGame */);
        const playerModel = new TablePlaceModel({
            Bet: 0,
            Cards: null,
            Money: amount,
            PlayerId: playerId,
            PlayerName: playerName,
            PlayerUrl: playerUrl,
            Points: points,
            Seat: seat,
            Stars: stars,
            Status: initialStatus,
        });
        playerModel.BackCards(getBackCardsFromGameType(this.gameType()));
        this.tablePlaces.sit(seat, playerModel);
        this.refreshPlaces();
        this.actionBlock.updateNeedBB();
        this.actionBlock.updateBlocks();
        if (playerName === this.currentLogin()) {
            const api = this.apiProvider.getGame();
            await api.setTableParameters(this.tableId, !settings.autoHideCards());
        }
    }
    public onStandup(playerId: number) {
        /// <signature>
        ///     <summary>Standup player from the table.</summary>
        ///     <param name="playerId" type="Number">Id of the player which join the table</param>
        /// </signature>
        const places = this.places();
        let lastAmount = 0;
        for (const p in places) {
            if (!places.hasOwnProperty(p)) {
                continue;
            }

            const currentPlayer = places[p];
            if (currentPlayer.PlayerId() === playerId) {
                if (currentPlayer.WasInGame()) {
                    this.actionsCount(Math.max(0, this.actionsCount() - 1));
                }

                lastAmount = currentPlayer.Money();
                this.tablePlaces.standup(currentPlayer.Seat());
                break;
            }
        }

        // If we no longer on the table then leave it.
        if (this.myPlayer() === null) {
            this.minimalPlayerBuyIn(lastAmount);
            this.updateCurrentCombination();
        }

        this.refreshPlaces();
        this.actionBlock.updateNeedBB();
        this.actionBlock.updateBlocks();
    }
    public onFrozen() {
        this.frozen(true);
        this.clearTimer();
    }
    public onUnfrozen() {
        this.frozen(false);
        this.startTimer();
    }
    public onOpened() {
        this.pushCallback(() => {
            this.opened(true);
        });
    }
    public onClosed() {
        this.pushCallback(() => {
            this.opened(false);
            this.tablePlaces.clear();
            this.pots([]);
            this.tableCards.clear();
        });
    }
    public onPaused() {
        this.paused(true);
        this.pauseDate(new Date().valueOf());
        this.updatePauseDescription();
    }
    public onResumed() {
        this.clearPauseMessage();
    }
    public onFinalTableCardsOpened(cards: number[]) {
        this.handHistory.onFinalTableCardsOpened(cards);
    }
    public onTableBetParametersChanged(smallBind: number, bigBlind: number, ante: number | null) {
        this.setTableBetingParametersNextGame(smallBind, bigBlind, ante);
    }

    public onTableGameTypeChanged(gameType: number) {
        this.setTableGameTypeNextGame(gameType);
    }

    /**
     * Notifies that table is tournament table.
     * @param tournamentId Id of the tournament to which table becomes belonging.
     */
    public onTableTournamentChanged(tournamentId: number | null) {
        throw new Error("TableView.onTableTournamentChanged not implemented");
    }

    /**
     * Informs about current state on the table.
     * @param players Array of PlayerStatusInfo objects which describe current status of the players
     * @param pots Array of pots on the table.
     * @param cards Cards open on the table
     * @param dealerSeat Current dealer seat. 0 if no game on the table.
     * @param buyIn Minimum amount of money which player should bring on the table.
     * @param baseBuyIn Base amount in BB for joining table under normal conditions.
     *                   20*baseBuyIn is maximum amount which player could bring-in.
     * @param leaveTime Time when player leave table last time.
     * @param timePass Time in second which is pass from last player turn.
     * @param currentPlayerId Id of the current player in the game.
     * @param lastRaise Amount of last raise in the game.
     * @param gameId Id of the game
     * @param authenticated Value indicating whether current user is authenticated or not.
     * @param actionsCount Count of actions which was performed by the player.
     * @param frozen A value indicating whether game on the table is frozen or not.
     * @param opened A value indicating whether the table is opened or not.
     * @param pauseData Unix time when game was paused. If game not paused, then null.
     * @param lastMessageId Last id of the message.
     * @param gameType Type of the game which starts on the table.
     */
    public onTableStatusInfo(
        players: PlayerStatusInfo[], pots: number[] | null, cards: string | null, dealerSeat: number, buyIn: number,
        baseBuyIn: number, leaveTime: number, timePass: number, currentPlayerId: number, lastRaise: number, gameId: number,
        authenticated: boolean, actionsCount: number, frozen: boolean, opened: boolean, pauseDate: number,
        lastMessageId: number, gameType: number) {
        const tablePlayers = [] as TablePlayer[];
        for (let i = 0; i < players.length; i++) {
            const p = (players[i] as any) as TablePlayer;
            tablePlayers.push(p);
        }

        this.gameType(gameType);

        this.lastMessageId = lastMessageId;
        this.frozen(frozen);
        this.opened(opened);
        this.paused(pauseDate != null);
        this.pauseDate(pauseDate);
        this.updatePauseDescription();
        this.queue.clear();
        if (opened) {
            this.gameId(gameId);
            this.actionsCount(actionsCount);
            const gameFinished = gameId === 0 || gameId === null;
            this.gameFinished(gameFinished);
            this.gameStarted(!gameFinished);
            this.prizesDistributed(this.gameFinished());
            this.tablePlaces.setPlayers(players);
            this.tablePlaces.places().forEach((place) => {
                if (place) {
                    place.BackCards(getBackCardsFromGameType(gameType));
                }
            });
            if (this.activePlayersCount() <= 1) {
                this.gameFinished(true);
            }

            const cardsArr = decodeCardsArray(cards);
            this.setCards(cardsArr);
            this.setButtons(dealerSeat);

            this.actionBlock.buttonsEnabled(true);
            this.actionBlock.showCardsEnabled(true);
            this.actionBlock.showHoleCard1Enabled(true);
            this.actionBlock.showHoleCard2Enabled(true);
            this.actionBlock.dealsAllowed(true);
            timeService.setTimeout(() => {
                this.actionBlock.updateBounds();
            }, 500);
            this.setCurrent(currentPlayerId);
            this.minimalPlayerBuyIn(buyIn);
            this.minimalBuyIn(baseBuyIn);
            this.pots(pots || []);
            this.refreshPlaces();
            this.cardsReceived = true;

            if (cards != null) {
                if (cards.length === 0) {
                    lastRaise = Math.max(lastRaise, this.bigBlind());
                }
            }

            this.lastRaise(lastRaise);
            this.currentRaise(this.minimumRaiseAmount());
            this.actionBlock.isRaise(lastRaise > 0);
            this.actionBlock.isCheck(this.checkOrCallAmount() === 0);
            this.actionBlock.checkOrCallAmount(this.checkOrCallAmount());
            this.actionBlock.resetWaitBB();
            this.actionBlock.processing(false);
            this.actionBlock.updateBlocks();
            const myself = this.myPlayer();
            if (myself != null) {
                this.actionBlock.updateAutomaticActionsText(myself.Money(), this.maximumBet() - this.myBet());
            }

            this.updateCurrentCombination();
        } else {
            this.tablePlaces.clear();
            this.pots([]);
            this.tableCards.clear();
        }

        this.cleanTableAfterGameFinish();
        this.connecting(false);
        this.log("Finishing connecting to table " + this.tableId);
    }
    /**
     * Start the game
     * @param gameId Id of the player which join the table
     * @param players Players in the game
     * @param actions Actions in the game
     * @param dealerSeat Seat where dealer sitting
     */
    public onGameStarted(
        gameId: number,
        players: GamePlayerStartInformation[],
        actions: GameActionStartInformation[],
        dealerSeat: number) {
        this.queue.pushCallback(() => {
            this.onGameStartedCore(gameId, players, actions, dealerSeat);
            this.handHistory.onGameStarted(gameId, players, actions, dealerSeat, this.gameType());
        });
        const isInGame = players.some((player) => player.PlayerId === authManager.loginId());
        if (!isInGame) {
            this.startDealCards();
        }
    }
    public onGameFinished(gameId: number, winners: GameWinnerModel[], rake: number) {
        /// <signature>
        ///     <summary>Start the game.</summary>
        ///     <param name="gameId" type="Number">Id of the player which join the table</param>
        ///     <param name="winners" type="Array"
        ///             value="[{PlayerId:1,Pot:1,Amount:100,CardsDescription:'Hands 1'}]">
        ///     </param>
        ///     <param name="rake" type="Number">Amount of rake paid.</param>
        /// </signature>
        const self = this;
        this.queue.wait(this.animationSettings.finishGamePrePause);
        if (this.pots().length === 0 && winners.length > 0) {
            this.executeMoveMoneyToPot(winners.map((winner) => winner.Amount));
        }

        if (debugSettings.game.singleSidePots) {
            this.queue.pushCallback(() => {
                this.logGameEvent("Game finished");
                self.gameFinished(true);
                this.actionBlock.expanded(false);
                self.gameStarted(false);
                self.gamePlayers([]);
                const places = self.places();
                self.finishAnimation(places);

                const needHightlightCards = true;
                const activePlayersCount = this.activePlayersCount();
                this.logGameEvent("Active players count", activePlayersCount);
                if (needHightlightCards) {
                    self.tableCards.CardsHightlighted(true);
                }

                const c = this.calculateWinnerAmount(places, winners, needHightlightCards);
                if (self.soundEnabled) {
                    const soundManager = getSoundManager();
                    soundManager.playWinChips();
                }

                self.combinations(c);

                self.setButtons(0);
                self.cardsReceived = false;
                self.actionBlock.buttonsEnabled(false);
                self.actionBlock.dealsAllowed(false);
                self.setCurrent(0);
                self.pots([]);
                self.refreshPlaces();
                self.clearTimer();

                self.gameId(null);

                self.handHistory.onGameFinished(gameId, winners, rake);
                self.saveHandHistory();
                this.enableInjectPlayerCards = true;
            });
            this.queue.waitWithInterruption(this.animationSettings.cleanupTableTimeout);
        } else {
            this.queue.pushCallback(() => {
                this.logGameEvent("Game finished");
                self.gameFinished(true);
                this.actionBlock.expanded(false);
                self.gameStarted(false);
                self.gamePlayers([]);
                const places = self.places();
                self.finishAnimation(places);

                const activePlayersCount = this.activePlayersCount();
                this.logGameEvent("Active players count", activePlayersCount);
                const needHightlightCards = true;
                if (needHightlightCards) {
                    self.tableCards.CardsHightlighted(true);
                }

                self.setButtons(0);
                self.actionBlock.buttonsEnabled(false);
                self.actionBlock.dealsAllowed(false);
                self.setCurrent(0);
                self.clearTimer();
                self.gameId(null);
            });
            this.queue.pushCallback(() => {
                const places = self.places();
                const activePlayersCount = this.activePlayersCount();
                const needHightlightCards = true;
                this.logGameEvent("Distribute pots: ", this.pots().slice());
                const potsCount = winners.reduce((prev, current) => Math.max(prev, current.Pot), 0);
                for (let potNumber = 1; potNumber <= potsCount; potNumber++) {
                    // Inject wait first, since next callback will override that.
                    this.queue.injectWaitWithInterruption(2000);
                    this.queue.injectCallback(() => {
                        this.logGameEvent("Distribute pot " + potNumber);

                        // Clear previous win amount for all players so all animation will play correctly.
                        for (const place of this.places()) {
                            if (place) {
                                place.WinAmount(null);
                                place.CardsHightlighted(false);
                            }
                        }

                        const potWinners = winners.filter((winner) => winner.Pot === potNumber);
                        const c = this.calculateWinnerAmount(places, potWinners, needHightlightCards);
                        if (this.soundEnabled) {
                            const soundManager = getSoundManager();
                            soundManager.playWinChips();
                        }

                        this.combinations(c);
                        this.handHistory.onPotDistributed(this.gameId(), potNumber, winners);
                        this.refreshPlaces();

                        // Remove processed pot.
                        const pots = this.pots();
                        pots.pop();
                        this.pots(pots);
                        this.pots.notifySubscribers();
                        this.logGameEvent("Removing pot", this.pots().slice());
                        this.refreshPlaces();
                    });
                }
            });
            this.queue.pushCallback(() => {
                // tslint:disable-next-line:no-console
                console.log("Finishing the game");
                self.cardsReceived = false;
                self.pots([]);

                self.handHistory.onGameFinished(gameId, winners, rake);
                self.saveHandHistory();
                this.enableInjectPlayerCards = true;
            });
            // this.queue.wait(this.animationSettings.cleanupTableTimeout - 8000);
        }

        this.queue.pushCallback(() => {
            this.enableInjectPlayerCards = false;
            this.onGamefinished.dispatch(this.tableId);
        });
    }
    public onPlayerStatus(playerId: number, status: number) {
        this.queue.pushCallback(() => {
            this.onPlayerStatusCore(playerId, status);
        });
    }
    public onPlayerCards(playerId: number, cards: number[]) {
        const self = this;
        if (this.enableInjectPlayerCards) {
            this.queue.injectCallback(() => {
                this.onPlayerCardsCore(playerId, cards);
                this.ensureCardsOpened(playerId);
            });
        } else {
            this.queue.pushCallback(() => {
                if (!self.cardsReceived) {
                    if (playerId === authManager.loginId()) {
                        self.startDealCards();
                        this.queue.pushCallback(() => {
                            self.onPlayerCardsCore(playerId, cards);
                        });
                    } else {
                        self.onPlayerCardsCore(playerId, cards);
                    }
                } else {
                    self.onPlayerCardsCore(playerId, cards);
                }
            });
        }
    }
    public onPlayerCardOpened(playerId: number, cardPosition: number, cardValue: number) {
        const self = this;
        if (this.enableInjectPlayerCards) {
            this.queue.injectCallback(() => {
                this.onPlayerCardOpenedCore(playerId, cardPosition, cardValue);
            });
        } else {
            this.queue.pushCallback(() => {
                self.onPlayerCardOpenedCore(playerId, cardPosition, cardValue);
            });
        }
    }
    public onPlayerCardsMucked(playerId: number) {
        this.queue.pushCallback(() => {
            const currentPlayer = this.tablePlaces.getPlaceByPlayerId(playerId);
            if (currentPlayer === null) {
                console.error(`The player ${playerId} could not muck cards since it is not on the table ${this.tableId}.`);
                return;
            }

            this.foldCardsForPlayer(currentPlayer, this.animationSettings.foldAnimationTimeout / 2);
        });
    }
    public onBet(playerId: number, type: number, amount: number, nextPlayerId: number) {
        /// <signature>
        ///     <summary>Do bet.</summary>
        ///     <param name="playerId" type="Number">Id of the player which join the table</param>
        ///     <param name="type" type="Number">
        ///     Type of the bet.<br/>
        ///     0 - Blind
        ///     1 - Ante
        ///     2 - Check/Call
        ///     3 - Bet/Raise
        ///     4 - Fold
        ///     5 - ForcedBet
        ///     6 - ReturnMoney
        ///     </param>
        ///     <param name="amount" type="Number">Amount of money which player put in the bet</param>
        ///     <param name="nextPlayerId" type="Number">Id of the player which join the table</param>
        /// </signature>
        this.enableInjectPlayerCards = false;
        this.queue.pushCallback(() => {
            this.onBetCore(playerId, type, amount, nextPlayerId);
            this.handHistory.onBet(playerId, type, amount, nextPlayerId);
        });
    }
    public onMoveMoneyToPot(amount: number[]) {
        // do nothing
        this.queue.pushCallback(() => {
            // if detected any ante then collect pots
            if (this.anteDetected) {
                this.logGameEvent("Updating pots");
                this.setPots(amount);

                this.logGameEvent("Clearing bets");
                const places = this.places();
                places.forEach(function (value) {
                    value.collectBet();
                });
                this.refreshPlaces();

                // Clear ante detection flag for current game
                this.anteDetected = false;
            }
        });
    }
    public executeMoveMoneyToPot(amount: number[]) {
        // Trigger animation.
        const self = this;
        this.actionBlock.buttonsEnabled(false);
        this.queue.wait(this.animationSettings.movingMoneyToPotPrePause);
        this.queue.pushCallback(() => {
            self.startMovingChipsToPotAnimation();
        });
        this.queue.wait(this.animationSettings.movingMoneyToPotAnimationTimeout);
        this.queue.pushCallback(() => {
            self.logGameEvent("Updating pots");
            self.setPots(amount);

            self.logGameEvent("Clearing bets");
            const places = self.places();
            self.places().forEach(function (value) {
                value.collectBet();
            });
            self.refreshPlaces();

            self.lastRaise(0);
            self.currentRaise(self.minimumRaiseAmount());
            self.actionBlock.isRaise(false);
            self.actionBlock.buttonsEnabled(true);
        });
    }
    public onMoneyAdded(playerId: number, amount: number) {
        const self = this;
        const places = this.places();
        places.forEach(function (value) {
            if (value.PlayerId() === playerId) {
                // Add money only if player not currently eligible to be in game.
                // And when no game on the table.
                if (!value.IsInGameStatus() || self.gameId() === null) {
                    value.Money(value.Money() + amount);
                }
            }
        });
        this.refreshPlaces();
    }
    public onMoneyRemoved(playerId: number, amount: number) {
        const self = this;
        const places = this.places();
        places.forEach(function (value) {
            if (value.PlayerId() === playerId) {
                // Add money only if player not currently eligible to be in game.
                // And when no game on the table.
                if (!value.IsInGameStatus() || self.gameId() === null) {
                    value.Money(value.Money() - amount);
                }
            }
        });
        this.refreshPlaces();
    }
    public setPots(amount: number[]) {
        // Add first number to the last pot.
        const currentPots = this.pots();
        const skipCollectingPot = (currentPots.length === amount.length
            && currentPots[currentPots.length - 1] === amount[currentPots.length - 1]);
        if (!skipCollectingPot) {
            this.handHistory.onMoveMoneyToPot(amount);
        }

        let main = amount[0];
        if (this.pots().length === 0) {
            // First pot created.
            this.handHistory.onPotCreated(1, main);
        } else {
            // Update last pot
            main = amount[this.pots().length - 1];
            if (currentPots[this.pots().length - 1] !== main) {
                this.handHistory.onPotUpdated(currentPots.length, main);
            }
        }

        // Append other amounts to the end of stack.
        // and generate split pots
        for (let i = Math.max(1, currentPots.length); i < amount.length; i++) {
            if (currentPots[i] !== amount[i]) {
                this.handHistory.onPotCreated(i + 1, amount[i]);
            }
        }

        this.pots(amount);
    }

    public setCards(cards: number[]) {
        /// <signature>
        ///     <summary>Set cards on the table.</summary>
        ///     <param name="cards" type="Array">Array of table cards to display</param>
        /// </signature>
        this.tableCards.setCards(cards);
    }

    public async showOfflineSitPrompt() {
        const seatNumber = await this.getCurrentOfflineTableSeat();
        this.showSitPrompt(seatNumber);
    }

    /**
     * Gets current seat number for offline table
     */
    public async getCurrentOfflineTableSeat(): Promise<number> {
        let seatNumber = 0;
        const value = await app.requireAuthentication();
        if (value.authenticated) {
            const currentPlayer = this.currentLogin();
            seatNumber = parseInt(currentPlayer.replace("Игрок", ""), 10);
        }

        return seatNumber;
    }

    public async showSitPrompt(seat: number) {
        if (this.sitting) {
            return;
        }

        this.sitting = true;
        try {
            const value = await app.requireAuthentication();
            if (value.authenticated) {
                const currentPlayer = this.myPlayer();
                if (currentPlayer === null) {
                    app.joinTablePopup.tableView(this);
                    app.joinTablePopup.seatNumber(seat);
                    app.executeCommand("popup.joinTable");
                }
            }
        } finally {
            this.sitting = false;
        }
    }
    public async rebuy() {
        const self = this;
        const tournamentView = this.tournament();
        const tapi = this.apiProvider.getTournament();
        try {
            const data = await tapi.rebuy(tournamentView.tournamentId, false);
            if (data.Status === "Ok") {
                self.hasPendingMoney(true);
                if (!self.hasPlayersWithoutMoney()) {
                    // self.clearNotification();
                }

                SimplePopup.display(_("tableMenu.rebuy"), _("tableMenu.rebuySuccess"));
            } else {
                SimplePopup.display(_("tableMenu.rebuy"), _("errors." + data.Status));
            }
        } catch (e) {
            SimplePopup.display(_("tableMenu.rebuy"), _("tableMenu.rebuyError"));
        }
    }
    public async doubleRebuy() {
        const self = this;
        const tournamentView = this.tournament();
        const tapi = this.apiProvider.getTournament();
        try {
            const data = await tapi.rebuy(tournamentView.tournamentId, true);
            if (data.Status === "Ok") {
                self.hasPendingMoney(true);
                if (!self.hasPlayersWithoutMoney()) {
                    // self.clearNotification();
                }

                SimplePopup.display(_("tableMenu.doublerebuy"), _("tableMenu.doublerebuySuccess"));
            } else {
                SimplePopup.display(_("tableMenu.doublerebuy"), _("errors." + data.Status));
            }
        } catch (e) {
            SimplePopup.display(_("tableMenu.doublerebuy"), _("tableMenu.doublerebuyError"));
        }
    }
    public async addon() {
        const self = this;
        const tournamentView = this.tournament();
        const tapi = this.apiProvider.getTournament();
        try {
            const data = await tapi.addon(tournamentView.tournamentId);
            if (data.Status === "Ok") {
                self.hasPendingMoney(true);
                if (!self.hasPlayersWithoutMoney()) {
                    // self.clearNotification();
                }

                // self.tournament().addonCount(self.tournament().addonCount() + 1);
                SimplePopup.display(_("tableMenu.addon"), _("tableMenu.addonSuccess"));
            } else {
                SimplePopup.display(_("tableMenu.addon"), _("errors." + data.Status));
            }
        } catch (e) {
            SimplePopup.display(_("tableMenu.addon"), _("tableMenu.addonError"));
        }
    }

    /**
     * Show prompt for buying rebuy.
     */
    public async showRebuyPrompt() {
        const tdata = this.tournament().tournamentData();
        const accountMoney = await this.getAccountMoney();
        const prompt = [
            _("table.rebuyPrompt", { price: tdata.RebuyFee + tdata.RebuyPrice }),
            _("table.rebuyPrompt2", { chips: tdata.ChipsAddedAtReBuy }),
            _("table.myPlayerMoneyPromt", { money: accountMoney }),
        ];
        await app.prompt(_("table.rebuyPromptCaption"), prompt);
        await this.rebuy();
    }

    /**
     * Show prompt for buying double rebuy.
     */
    public async showDoubleRebuyPrompt() {
        const tdata = this.tournament().tournamentData();
        const accountMoney = await this.getAccountMoney();
        const prompt = [
            _("table.doubleRebuyPrompt", { price: 2 * (tdata.RebuyFee + tdata.RebuyPrice) }),
            _("table.doubleRebuyPrompt2", { chips: tdata.ChipsAddedAtDoubleReBuy }),
            _("table.myPlayerMoneyPromt", { money: accountMoney }),
        ];
        await app.prompt(_("table.doubleRebuyPromptCaption"), prompt);
        await this.doubleRebuy();
    }

    /**
     * Show prompt for buying addon.
     */
    public async showAddonPrompt() {
        const tdata = this.tournament().tournamentData();
        const accountMoney = await this.getAccountMoney();
        const prompt = [
            _("table.addonPrompt", { price: tdata.AddonFee + tdata.AddonPrice }),
            _("table.addonPrompt2", { chips: tdata.ChipsAddedAtAddOn }),
            _("table.myPlayerMoneyPromt", { money: accountMoney }),
        ];
        await app.prompt(_("table.addonPromptCaption"), prompt);
        await this.addon();
    }
    public async sit(seat: number, amount: number, ticketCode: string) {
        const self = this;
        const gameApi = this.apiProvider.getGame();
        try {
            const data = await gameApi.sit(self.tableId, seat, amount, ticketCode);
            // report on successfull seating.
            if (data.Status === "OperationNotValidAtThisTime") {
                return {
                    minimalAmount: undefined,
                    status: data.Status,
                    success: false,
                };
            }

            if (data.Status !== "Ok") {
                return {
                    minimalAmount: data.MinimalAmount,
                    status: data.Status,
                    success: false,
                };
            } else {
                return {
                    minimalAmount: data.MinimalAmount,
                    status: data.Status,
                    success: true,
                };
            }
        } catch (e) {
            return {
                minimalAmount: undefined,
                status: "NotSufficiendFunds",
                success: false,
            };
        }
    }

    /**
     * Shows stand up prompt
     */
    public async showStandupPrompt() {
        const myPlayer = this.myPlayer();
        if (myPlayer === null) {
            return;
        }

        const tournament = this.tournament();
        let messages: string[];
        let caption: string;
        if (tournament == null) {
            const hasWin = myPlayer.Money() > 0 || this.myPlayerInGame();
            const promptMesssage = hasWin ? "table.standupPrompt" : "table.standupPromptWithoutWin";
            caption = hasWin ? "table.standupPromptCaption" : "table.leave";
            messages = [_(promptMesssage)];
        } else {
            if (tournament.finishedPlaying()) {
                return;
            }

            caption = "table.leave";
            messages = [_("table.standupTournamentPrompt")];
        }

        const approved = await app.promptAsync(_(caption), messages);
        if (approved) {
            if (this.tournament() == null) {
                await this.standup();
            }
        }
    }
    public showStandupConfirm() {
        let messages: string[];
        messages = [_("table.standupSuccessMessage")];
        const title = _("table.standupSuccessTitle");
        SimplePopup.display(title, messages);
    }
    public async standup() {
        const self = this;
        const gameApi = this.apiProvider.getGame();
        const data = await gameApi.standup(this.tableId);
        // report on successfull seating.
        if (data.Status === "AuthorizationError") {
            self.reportApiError("Ошибка авторизации");
        } else if (data.Status === "Ok" && appConfig.game.seatMode) {
            self.showStandupConfirm();
        }
    }

    public showAddBalancePrompt(seat: number, ticketCode: string) {
        /// <signature>
        ///     <summary>Shows add balance prompt.</summary>
        ///     <param name="seat" type="Number">Seat where player willing to join</param>
        ///     <param name="tableView" type="TableView">Table view where to join</param>
        /// </signature>
        const targetPlayer = this.tablePlaces.getPlaceBySeat(seat);
        const playerId = targetPlayer.PlayerId();

        const amount = prompt("Укажите сумму для пополнения счета?", "1000");
        if (amount) {
            this.addBalance(Number(amount), ticketCode);
        }
    }

    public async addBalance(amount: number, ticketCode: string) {
        const places = this.places();
        const targetPlayer = this.myPlayer();
        const gameApi = this.apiProvider.getGame();
        try {
            const data = await gameApi.addBalance(this.tableId, amount, ticketCode);
            // report on successfull seating.
            if (data.Status !== "Ok") {
                throw new Error(data.Status);
            }

            if (data.Status === "Ok") {
                if (this.myPlayerInGame()) {
                    this.hasPendingMoney(true);
                }
            }

            return amount;
        } catch (e) {
            throw new Error("OperationNotAllowed");
        }
    }

    public addMessage(messageId: number, date: Date, sender: string, message: string) {
        const messageExists = this.messages().filter((m) => m.messageId === messageId).length > 0;
        if (!messageExists) {
            const m = new PlayerMessage(messageId, date, sender, message);
            this.messages.unshift(m);
            while (this.messages().length > TableView.MaxMessagesCount) {
                this.messages.pop();
            }

            const messages = this.messages();
            this.messages([]);
            this.messages(messages);
        }

        if (this.lastMessageId >= messageId) {
            return;
        }

        const player = this.getPlayerByLogin(sender);
        if (player != null) {
            player.displayChatMessage(message);
        }
    }

    public addSystemMessage(messageId: number, message: string) {
        if (this.lastMessageId >= messageId && messageId !== 0) {
            return;
        }

        const m = new SystemMessage(messageId, message);
        this.systemMessages.unshift(m);
        while (this.systemMessages().length > TableView.MaxMessagesCount) {
            this.systemMessages.pop();
        }
    }

    public updateMessage(messageId: number, sender: string, message: string) {
        // TODO: Implement updating messages.
    }

    public updateSystemMessage(messageId: number, message: string) {
        // TODO: Implement updating messages.
    }

    /**
     * Sends mesage to the table chat.
     */
    public async sendMessage() {
        const chatApi = this.apiProvider.getChat();
        const data = await chatApi.send(this.tableId, this.chatMessage());
        if (data.Status !== "Ok") {
            SimplePopup.display(_("chat.sendingMessage"), _("errors." + data.Status));
        }

        this.chatMessage("");
    }

    public async fold() {
        const self = this;
        this.actionBlock.buttonsEnabled(false);
        const gameApi = this.apiProvider.getGame();
        if (appConfig.game.useSignalR) {
            // TODO: We should provide notification, which will return any error from the server.
            connectionService.currentConnection.connection.Game.server.fold(this.tableId);
        } else {
            try {
                const data = await gameApi.fold(this.tableId);
                if (data.Status === "OperationNotValidAtThisTime") {
                    self.turnRecovery();
                    return;
                }

                if (data.Status === "OperationNotValidWhenTableFrozen") {
                    self.turnRecovery("table.tableFreezed");
                    return;
                }

                if (data.Status !== "Ok") {
                    self.reportApiError(data.Status);
                }
            } catch (e) {
                self.turnRecovery();
            }
        }
    }

    public async checkOrCall() {
        const self = this;
        this.actionBlock.buttonsEnabled(false);
        const gameApi = this.apiProvider.getGame();
        if (appConfig.game.useSignalR) {
            // TODO: We should provide notification, which will return any error from the server.
            connectionService.currentConnection.connection.Game.server.checkOrCall(this.tableId);
        } else {
            try {
                const data = await gameApi.checkOrCall(this.tableId);
                if (data.Status === "OperationNotValidAtThisTime") {
                    self.turnRecovery();
                    return;
                }

                if (data.Status === "OperationNotValidWhenTableFrozen") {
                    self.turnRecovery("table.tableFreezed");
                    return;
                }

                if (data.Status !== "Ok") {
                    self.reportApiError(data.Status);
                }
            } catch (e) {
                self.turnRecovery();
            }
        }
    }

    public async betOrRaise() {
        const self = this;
        this.actionBlock.buttonsEnabled(false);
        const gameApi = this.apiProvider.getGame();
        const amount: number = this.currentRaise() - this.currentBet();
        if (appConfig.game.useSignalR) {
            // TODO: We should provide notification, which will return any error from the server.
            connectionService.currentConnection.connection.Game.server.betOrRaise(this.tableId, amount);
        } else {
            try {
                const data = await gameApi.betOrRaise(this.tableId, amount);
                if (data.Status === "OperationNotValidAtThisTime") {
                    self.turnRecovery();
                    return;
                }

                if (data.Status === "OperationNotValidWhenTableFrozen") {
                    self.turnRecovery("table.tableFreezed");
                    return;
                }

                if (data.Status !== "Ok") {
                    self.reportApiError(data.Status);
                }
            } catch (e) {
                self.turnRecovery();
            }
        }
    }

    /**
     * Show cards for the current player.
     */
    public async showCards() {
        this.actionBlock.showCardsEnabled(false);
        const gameApi = this.apiProvider.getGame();
        try {
            const data = await gameApi.showCards(this.tableId);
            if (data.Status !== "Ok") {
                this.reportApiError(data.Status);
            }
        } catch (e) {
            if (app.currentPopup !== SlowInternetService.popupName) {
                SimplePopup.display(_("table.turn"), _("table.connectionError", { tableName: this.tableName() }));
            }

            this.actionBlock.showCardsEnabled(true);
        }
    }

    /**
     * Muck cards for the current player.
     */
    public async muckCards() {
        this.actionBlock.showCardsEnabled(false);
        const gameApi = this.apiProvider.getGame();
        try {
            const data = await gameApi.muck(this.tableId);
            if (data.Status !== "Ok") {
                this.reportApiError(data.Status);
            }
        } catch (e) {
            this.actionBlock.showCardsEnabled(true);
        }
    }

    public toggleCards() {
        const my = this.myPlayer();
        if (!my) {
            console.error(`Player ${authManager.loginId()} does not sit on the table ${this.tableId}.`);
            return;
        }

        if (my.IsCardsOpened()) {
            this.muckCards();
        } else {
            this.showCards();
        }
    }

    public showFirstCard() {
        return this.showCard(0);
    }

    public showSecondCard() {
        return this.showCard(1);
    }

    /**
     * Show cards for the current player.
     */
    public async showCard(cardPosition: 0 | 1) {
        const showCardVariable = cardPosition === 0
            ? this.actionBlock.showHoleCard1Enabled
            : this.actionBlock.showHoleCard2Enabled;
        showCardVariable(false);
        const gameApi = this.apiProvider.getGame();
        try {
            const data = await gameApi.showHoleCard(this.tableId, cardPosition);
            if (data.Status !== "Ok") {
                this.reportApiError(data.Status);
            }
        } catch (e) {
            if (app.currentPopup !== SlowInternetService.popupName) {
                SimplePopup.display(_("table.turn"), _("table.connectionError", { tableName: this.tableName() }));
            }

            showCardVariable(true);
        }
    }

    /**
     * Cards opening on the table.
     * @param cards Cards which was opened on the table.
     */
    public onOpenCards(cards: number[]) {
        const self = this;
        this.queue.pushCallback(() => {
            self.actionsCount(0);
            const currentCardsOpened = self.tableCards.tableCards().length;
            const myPlayer = this.myPlayer();
            if (myPlayer) {
                myPlayer.cardsOverlayVisible(true);
            }

            self.tableCards.openCards(cards);
            self.handHistory.onOpenCards(cards);
            if (currentCardsOpened === 0 && cards.length === 3) {
                self.handHistory.onFlop(cards[0], cards[1], cards[2]);
                self.actionBlock.dealsAllowed(true);
                const soundManager = getSoundManager();
                soundManager.playFlopCards();
                self.onFlopDealed.dispatch(this.tableId);
            }
            if (currentCardsOpened === 3 && cards.length === 4) {
                self.handHistory.onTurn(cards[3]);
                self.actionBlock.dealsAllowed(true);
                const soundManager = getSoundManager();
                soundManager.playTurn();
                self.onTurnDealed.dispatch(this.tableId);
            }
            if (currentCardsOpened === 4 && cards.length === 5) {
                self.handHistory.onRiver(cards[4]);
                self.actionBlock.dealsAllowed(true);
                const soundManager = getSoundManager();
                soundManager.playRiver();
                self.onRiverDealed.dispatch(this.tableId);
            }
            if (currentCardsOpened === 3 && cards.length === 5) {
                self.handHistory.onTurn(cards[3]);
                self.handHistory.onRiver(cards[4]);
                // soundManager.playAllIn();
            }
            if (currentCardsOpened === 0 && cards.length === 5) {
                self.handHistory.onFlop(cards[0], cards[1], cards[2]);
                self.handHistory.onTurn(cards[3]);
                self.handHistory.onRiver(cards[4]);
                // soundManager.playAllIn();
            }
            self.actionBlock.resetAutomaticAction();
            self.actionBlock.updateAdditionalButtons();
        });
        if (self.soundEnabled) {
            const soundManager = getSoundManager();
            soundManager.playFlop();
        }

        this.queue.wait(this.animationSettings.showCardsTimeout);
        this.queue.pushCallback(() => {
            self.updateCurrentCombination();
            self.tableCards.clearAnimation();
        });
    }

    public async comeBack() {
        const self = this;
        const gameApi = this.apiProvider.getGame();
        const data = await gameApi.comeBack(this.tableId);
        if (data.Status === "OperationNotValidAtThisTime") {
            return;
        }

        if (data.Status !== "Ok") {
            self.reportApiError(data.Status);
        }
    }

    public async sitOut() {
        const self = this;
        const gameApi = this.apiProvider.getGame();
        const data = await gameApi.sitOut(this.tableId);
        if (data.Status === "OperationNotValidAtThisTime") {
            return;
        }

        if (data.Status !== "Ok") {
            self.reportApiError(data.Status);
        }
    }

    public toggleSkipDeals(skipDeals: boolean) {
        if (skipDeals) {
            this.sitOut();
            return;
        }

        this.comeBack();
    }
    /**
     * Set new table betting parameters.
     * @param smallBlind Small blind
     * @param bigBlind Big blind
     * @param ante Ante
     */
    public setTableBetingParameters(smallBlind: number, bigBlind: number, ante: number) {
        this.bigBlind(bigBlind);
        this.smallBlind(smallBlind);
        this.ante(ante);
    }

    /**
     * Set new table game type parameters.
     * @param gameType Small blind
     */
    public setTableGameType(gameType: number) {
        this.gameType(gameType);
    }

    /**
     * Set new table betting parameters.
     * @param smallBlind Small blind
     * @param bigBlind Big blind
     * @param ante Ante
     */
    public setTableBetingParametersNextGame(smallBlind: number, bigBlind: number, ante: number | null) {
        this.nextGameBigBlind(bigBlind);
        this.nextGameSmallBlind(smallBlind);
        this.nextGameAnte(ante);
        this.changeBetParametersNextGame(true);
    }

    /**
     * Set new table gameType parameters.
     * @param gameType Small blind
     */
    public setTableGameTypeNextGame(gameType: number) {
        this.nextGameType(gameType);
        this.changeGameTypeNextGame(true);
    }

    public showPlayerParameters() {
        // tablePlayerParameterSelector.showPlayerParameters(this);
    }

    /**
     * Displays last hand in the history
     */
    public showPreviousHand() {
        app.handHistoryPopup.tableView(this);
        app.showPopup("handHistory");
    }
    public rotate(offset: number) {
        const myself = this.myPlayer();
        if (myself == null) {
            return;
        }

        const currentOffset = this.tablePlaces.getRealOffset(myself.Seat());
        if (currentOffset === offset) {
            return;
        }

        const self = this;
        app.prompt(_("table.changeplace"),
            [_("table.doyouwantchangeplace")]).then(function () {
                self.tablePlaces.rotate(offset - currentOffset);
            });
    }

    public hasPlayersWithoutMoney() {
        return this.places().some((place) => place.Money() === 0);
    }

    public proposeRebuyOrAddon() {
        const tournamentView = this.tournament();
        const myPlayer = this.myPlayer();
        if (tournamentView !== null && myPlayer !== null && myPlayer.Money() === 0 && !this.hasPendingMoney()) {
            if (tournamentView.rebuyAllowed()) {
                this.proposeBuyRebuy();
            }

            if (tournamentView.addonAllowed() && tournamentView.addonCount() === 0) {
                this.proposeBuyAddon();
            }
        }
    }

    /**
     * Show table notification
     */
    public showNotification(message: string) {
        this.notification(message);
        this.hasNotification(true);
    }

    /**
     * Show table notification for specific period of time
     */
    public showNotificationWithDelay(message: string, duration: number) {
        this.clearNotification();
        this.showNotification(message);
        this.notificationHandleTimeout = timeService.setTimeout(() => {
            this.clearNotification();
        }, duration);
    }

    public pushCallback(callback: () => void) {
        this.queue.pushCallback(callback);
    }

    public clearTable() {
        this.anteDetected = false;
        this.prizesDistributed(true);
        this.tableCards.CardsHightlighted(false);
        this.setCards([]);
        this.pots([]);
        const places = this.places();
        places.forEach(function (item) {
            item.prepareForNewGame();
        });
    }

    /*
     * Display counter which indicates how much time left to buy addon or rebuy
     * if player lose game.
     */
    public displayRebuyOrAddonTime() {
        const self = this;
        const tournamentView = this.tournament();

        // Display notification about rebuy or addon prompt
        // only for tournament games.
        if (tournamentView === null || tournamentView === undefined) {
            return;
        }

        // Display notification about rebuy or addon prompt
        // only if rebuy or addon allowed.
        if (!tournamentView.rebuyAllowed() && !tournamentView.addonAllowed()) {
            return;
        }

        if (this.hasPlayersWithoutMoney()) {
            // This time should be 500ms bigger then the actual time specified
            // on the server, to accomodate for the 500ms update period.
            this.displayingRebuyAddonNotification = true;
            const totalDuration = 20.5;
            let i = 0;
            let messageTemplate: string;
            let popupCaption: string;
            if (tournamentView.rebuyAllowed()) {
                messageTemplate = "table.waitingForOtherPlayersRebuy";
                popupCaption = "table.tournamentGameFinishedRebuyCaption";
            } else if (tournamentView.addonAllowed()) {
                messageTemplate = "table.waitingForOtherPlayersAddon";
                popupCaption = "table.tournamentGameFinishedAddonCaption";
            } else {
                // tslint:disable-next-line:no-console
                console.error("Unknown state during display rebuy of addon time");
            }

            this.notificationHandleInterval = timeService.setInterval(() => {
                const secondsLeft = Math.floor(totalDuration - (i / 2));
                self.showNotification(_(messageTemplate, { time: secondsLeft }));
                app.customPopup.title(_(popupCaption, { time: secondsLeft }));
                i++;
                if (i >= totalDuration * 2) {
                    self.clearNotification();
                    if (app.currentPopup === "custom") {
                        app.closePopup();
                    }
                }
            }, 500);
        }
    }

    /**
     * Get current user money amount
     */
    private async getAccountMoney() {
        const manager = new AccountManager();
        const data = await manager.getAccount();
        if (data.Status !== "Ok") {
            console.error("Error during making call to Account.GetPlayerDefinition");
            return 0;
        }

        const personalAccountData = data.Data;
        const total = settings.isGuest() ? personalAccountData.GameMoney : personalAccountData.RealMoney;
        return total;
    }
    /**
     * Propose buying rebuy or double rebuy
     */
    private proposeBuyRebuy() {
        const self = this;
        const player = this.myPlayer();
        if (player === null) {
            return;
        }

        if (player.Money() === 0 && !this.hasPendingMoney()) {
            // Display popup with three buttons.
            const result = $.Deferred<void>();
            const tdata = this.tournament().tournamentData();
            const messages = [
                _("table.tournamentGameFinishedRebuy"),
                _("table.rebuyPrompt", { price: tdata.RebuyFee + tdata.RebuyPrice }),
                _("table.doubleRebuyPrompt", { price: 2 * (tdata.RebuyFee + tdata.RebuyPrice) }),
            ];
            app.promptEx(
                _("table.tournamentGameFinishedCaption"),
                messages,
                [_("table.rebuy"), _("table.doubleRebuy"), _("common.cancel")],
                [() => 1, () => 2, () => { /* nothing */ }])
                .then(function (value: number) {
                    if (value === 1) {
                        self.showRebuyPrompt();
                    }

                    if (value === 2) {
                        self.showDoubleRebuyPrompt();
                    }

                    result.resolve();
                }, function () {
                    result.reject();
                });
        }
    }

    /**
     * Propose buying addon
     */
    private proposeBuyAddon() {
        const self = this;
        const player = this.myPlayer();
        if (player == null) {
            // tslint:disable-next-line:no-console
            console.warn("Proposing but addon when no active player");
            return;
        }

        if (player.Money() === 0 && !this.hasPendingMoney() && this.tournament().addonCount() === 0) {
            // Display popup with two buttons.
            const result = $.Deferred<void>();
            const tdata = this.tournament().tournamentData();
            const messages = [
                _("table.tournamentGameFinishedAddon"),
                _("table.addonPrompt", { price: tdata.AddonFee + tdata.AddonPrice }),
            ];
            app.promptEx(
                _("table.tournamentGameFinishedCaption"),
                messages,
                [_("table.addon"), _("common.cancel")],
                [() => 1, () => { /* nothing */ }])
                .then(function (value: number) {
                    self.showAddonPrompt();
                    result.resolve();
                }, function () {
                    result.reject();
                });
        }
    }

    private onBetCore(playerId: number, type: number, amount: number, nextPlayerId: number) {
        this.logGameEvent("Doing bet of type " + type);
        const places = this.places();
        const myself = this.myPlayer();
        const currentPlayer = this.tablePlaces.getPlaceByPlayerId(playerId);
        if (currentPlayer === null) {
            this.logGameEvent("No player sitting on the table.");
            return;
        }

        if (type === 1) {
            // If bet is Ante, then set ante detection flag.
            this.anteDetected = true;
        }

        this.updateBetsAndMoney(currentPlayer, type, amount);

        const isMyTurn = myself !== null && nextPlayerId === myself.PlayerId();
        // Don's enable buttons until cards would be recived for players.
        if (this.cardsReceived) {
            this.actionBlock.buttonsEnabled(true);
            if (isMyTurn) {
                this.onMyTurn.dispatch(this.tableId);
            }
        }

        const forcedBets = type === 1 || type === 5;
        if (!(forcedBets && nextPlayerId === 0)) {
            this.setCurrent(nextPlayerId);

            if (isMyTurn) {
                // This will trigger reevaluation of the minimumRaiseAmount
                this.currentRaise(this.minimumRaiseAmount());
            } else {
                this.currentRaise(null);
            }
        }

        // this.refreshPlaces();

        const userActions = type === 3 || type === 4 || type === 2;
        if (userActions) {
            this.actionsCount(this.actionsCount() + 1);
        }

        const allBetsRounded = this.allBetsRounded();
        this.logGameEvent("All bets rounded", allBetsRounded);
        if (allBetsRounded) {
            this.actionBlock.buttonsEnabled(false);
            this.actionBlock.dealsAllowed(false);
        }

        if (myself !== null) {
            const requiredBet = this.maximumBet() - this.myBet();
            this.actionBlock.updateSupportDirectAmountStatus(requiredBet);
            if (nextPlayerId === myself.PlayerId()) {
                if (!allBetsRounded && userActions) {
                    this.actionBlock.performAutomaticActions();
                    this.actionBlock.resetAutomaticAction();
                }
            }

            this.actionBlock.updateAutomaticActionsText(myself.Money(), requiredBet);
            this.actionBlock.updateAdditionalButtons();
        }

        if (nextPlayerId === authManager.loginId()) {
            this.logGameEvent("Player turn approached");
            this.tablePlaces.placesRefreshTrigger();
        }

        this.logGameEvent("Action block status: MMB:.", this.actionBlock.mainButtonsBlockVisible(),
            " BEn:", this.actionBlock.buttonsEnabled(),
            " TurnEn:", this.actionBlock.turnEnabled(),
            " TTurnEn:", this.turnEnabled(),
            " CP:", this.currentPlayer(),
            " DA:", this.actionBlock.dealsAllowed(),
            " InGame:", this.actionBlock.myPlayerInGame());
        this.clearTimer();
        this.startTimer();
    }
    private startMovingChipsToPotAnimation() {
        this.logGameEvent("Moving chips to center");
        const places = this.places();
        this.places().forEach(function (value) {
            value.IsBetAnimationLocked(false);
            value.IsMovingBetToPot(true);
        });
        // this.refreshPlaces();
    }

    /**
     * Start the game
     * @param gameId Id of the player which join the table
     * @param players Players in the game
     * @param actions Actions in the game
     * @param dealerSeat Seat where dealer sitting
     */
    private onGameStartedCore(
        gameId: number,
        players: GamePlayerStartInformation[],
        actions: GameActionStartInformation[],
        dealerSeat: number) {
        this.gameFinished(false);
        this.prizesDistributed(false);
        this.currentGameId(gameId);
        this.gameId(gameId);
        this.hasPendingMoney(false);
        this.actionBlock.isRaise(true);
        this.actionBlock.expanded(false);
        this.actionBlock.showCardsEnabled(true);
        this.actionBlock.showHoleCard1Enabled(true);
        this.actionBlock.showHoleCard2Enabled(true);
        if (this.changeBetParametersNextGame()) {
            this.changeBetParametersNextGame(false);
            this.setTableBetingParameters(this.nextGameSmallBlind(), this.nextGameBigBlind(), this.nextGameAnte());
        }

        if (this.changeGameTypeNextGame()) {
            this.changeGameTypeNextGame(false);
            this.setTableGameType(this.nextGameType());
        }

        this.actionBlock.updateBounds();
        this.actionsCount(0);
        this.tableCards.clear();
        this.pots([]);
        this.logGameEvent("Game started");
        if (this.displayingRebuyAddonNotification) {
            this.clearNotification();
        }

        const combinations: string[] = [];

        if (runtimeSettings.game.clearAutoFoldOrCheckOnNewGame) {
            this.actionBlock.autoFoldOrCheck(false);
        }

        this.cardsReceived = false;
        this.combinations(combinations);
        this.gamePlayers(players.map((item) => item.PlayerId));
        this.places().forEach(function (value) {
            value.prepareForNewGame();
            players.forEach(function (pvalue) {
                if (pvalue.PlayerId === value.PlayerId()) {
                    value.initializeForNewGame(pvalue.Money);
                }
            });
            if (players.every((pvalue) => pvalue.PlayerId !== value.PlayerId())) {
                value.WasInGame(null);
            }
        });
        this.setButtons(dealerSeat);
        if (this.soundEnabled) {
            const soundManager = getSoundManager();
            soundManager.playDealCards();
        }

        this.refreshPlaces();
        this.lastRaise(this.bigBlind());

        this.actionBlock.resetAutomaticAction();
        if (players.some((player) => player.PlayerId === authManager.loginId())) {
            // Reset Wait BB status since player currently join the game.
            this.actionBlock.resetWaitBB();
        }
    }
    private startDealCards() {
        const self = this;
        this.queue.pushCallback(() => {
            self.logGameEvent("Deal cards to players");
            self.places().forEach(function (value) {
                if (value.WasInGame()) {
                    value.startDealCards();
                }
            });
        });
        this.queue.wait(this.animationSettings.dealCardsTime);
        this.queue.pushCallback(() => {
            self.places().forEach(function (value) {
                value.IsDealCards(false);
            });
            self.clearTimer();
            self.startTimer();
            this.onPlayerCardsDealed.dispatch(this.tableId);
        });
    }
    private calculateWinnerAmount(places: TablePlaceModel[], winners: GameWinnerModel[], needHightlightCards: boolean) {
        const c: string[] = [];
        for (const w in winners) {
            if (!winners.hasOwnProperty(w)) {
                continue;
            }

            const currentWinner = winners[w];
            if (c.indexOf(currentWinner.CardsDescription) === -1) {
                c.push(currentWinner.CardsDescription);
            }

            for (const p in places) {
                if (!places.hasOwnProperty(p)) {
                    continue;
                }

                const currentPlayer = places[p];
                if (needHightlightCards) {
                    currentPlayer.CardsHightlighted(true);
                }

                if (currentPlayer.PlayerId() === currentWinner.PlayerId) {
                    let winnerCards = [] as number[];
                    const tableCards = this.tableCards.tableCardsData();
                    const winnerCombination = currentPlayer.getCombination(tableCards);
                    currentPlayer.WinnerCombination(winnerCombination);
                    if (tableCards != null) {
                        winnerCards = winnerCards.concat(tableCards);
                    }

                    winnerCards = winnerCards.concat(currentPlayer.RawCards());
                    const handRepresentation: CardsRepresentation = {
                        Cards: [],
                        Suits: [],
                    };
                    winnerCards.forEach(function (card) {
                        handRepresentation.Cards.push((card % 13) + 2);
                        handRepresentation.Suits.push(1 << (card / 13));
                    });
                    if (winnerCards.length >= 7 && needHightlightCards) {
                        const rank = HoldemHand.getCardRank(handRepresentation);
                        this.highlightCards(currentPlayer, rank.WinnerCardsSet);
                    }

                    currentPlayer.Money(currentPlayer.Money() + currentWinner.Amount);
                    if (currentPlayer.WinAmount() === null) {
                        currentPlayer.WinAmount(currentWinner.Amount);
                    } else {
                        currentPlayer.WinAmount(currentPlayer.WinAmount() + currentWinner.Amount);
                    }
                }
            }
        }

        return c;
    }
    /**
     * Hightlight cards on the table
     * @param currentPlayer Current player for which cards should be highlighted.
     * @param winnerCardsSet Set of winning cards.
     */
    private highlightCards(currentPlayer: TablePlaceModel, winnerCardsSet: number[]) {
        winnerCardsSet.forEach((cardIndex) => {
            if (cardIndex === 5) {
                currentPlayer.Card1Hightlighted(true);
            }

            if (cardIndex === 6) {
                currentPlayer.Card2Hightlighted(true);
            }

            if (cardIndex === 7) {
                currentPlayer.Card3Hightlighted(true);
            }

            if (cardIndex === 8) {
                currentPlayer.Card4Hightlighted(true);
            }

            if (cardIndex === 0) {
                this.tableCards.Card1Hightlighted(true);
            }

            if (cardIndex === 1) {
                this.tableCards.Card2Hightlighted(true);
            }

            if (cardIndex === 2) {
                this.tableCards.Card3Hightlighted(true);
            }

            if (cardIndex === 3) {
                this.tableCards.Card4Hightlighted(true);
            }

            if (cardIndex === 4) {
                this.tableCards.Card5Hightlighted(true);
            }
        });
    }
    private cleanTableAfterGameFinish() {
        if (this.gameFinished()) {
            this.anteDetected = false;
            this.prizesDistributed(true);
            this.tableCards.CardsHightlighted(false);
            this.setCards([]);
            this.pots([]);
            const places = this.places();
            places.forEach(function (item) {
                item.prepareForNewGame();
            });
        }
    }
    private onPlayerStatusCore(playerId: number, status: number) {
        this.logGameEvent("onPlayerStatus", playerId, status);
        const self = this;
        const places = this.places();
        places.forEach((p) => {
            if (p.PlayerId() === playerId) {
                const saveMask = 16;
                p.Status(status | (p.Status() & saveMask));
                if (playerId === authManager.loginId()) {
                    if (p.IsSitoutStatus()) {
                        self.actionBlock.processing(false);
                    }
                }
            }
        });
        this.refreshPlaces();
        this.actionBlock.updateNeedBB();
        this.actionBlock.updateBlocks();
    }
    private onPlayerCardsCore(playerId: number, cards: number[]) {
        const self = this;
        const oldCardsReceived = this.cardsReceived;
        this.cardsReceived = true;
        const myPlayer = this.myPlayer();
        let isHoleCards = false;
        if (myPlayer != null) {
            // If this is first cards received then this is our cards
            // Allow deals only when your cards is recived.
            if (!oldCardsReceived) {
                this.actionBlock.dealsAllowed(true);
                this.gameStarted(true);
                isHoleCards = true;
                this.handHistory.onPlayerHoleCards(playerId, cards);
                this.logGameEvent("Received hole cards");
                this.updateCurrentCombination();
            }

            if (myPlayer.IsCurrent()) {
                this.currentRaise(this.actionBlock.tableSlider.minimum());
                this.actionBlock.buttonsEnabled(true);
                this.actionBlock.updateAdditionalButtons();
                this.actionBlock.performAutomaticActions();
                this.actionBlock.resetAutomaticAction();
                this.logGameEvent("Player turn on the beginning of the game.");
                this.onMyTurn.dispatch(this.tableId);
            }
        }

        this.logGameEvent("onPlayerCards", playerId, convertToCards(cards));
        const places = this.places();
        places.forEach((p) => {
            if (p.PlayerId() === playerId) {
                const myself = self.currentLogin() === p.PlayerName();
                let couldDisplayOtherCards = myself || self.combinations().length > 0;
                couldDisplayOtherCards = true;
                if (couldDisplayOtherCards) {
                    p.setCards(cards);
                    if (self.currentCombinationVisible()) {
                        p.DisplayedHandCards(p.HandCards());
                    } else {
                        p.DisplayedHandCards(getBackCardsFromGameType(self.gameType()));
                    }

                    if (!isHoleCards) {
                        p.markCardsOpened();
                    }
                }
            }
        });
        this.refreshPlaces();
        if (!isHoleCards) {
            this.handHistory.onPlayerCards(playerId, cards);
        }
    }
    private onPlayerCardOpenedCore(playerId: number, cardPosition: number, cardValue: number) {
        this.logGameEvent("onPlayerCardOpenedCore", playerId, cardPosition, cardValue);
        const places = this.places();
        places.forEach((p) => {
            if (p.PlayerId() === playerId) {
                p.openCard(cardPosition, cardValue);
            }
        });
        this.refreshPlaces();
    }
    private ensureCardsOpened(playerId: number) {
        const places = this.places();
        places.forEach((p) => {
            if (p.PlayerId() === playerId) {
                p.markCardsOpened();
                p.cardsOverlayVisible(false);
            }
        });
        this.refreshPlaces();
    }
    private updateBetsAndMoney(currentPlayer: TablePlaceModel, type: number, amount: number) {
        const playerId = currentPlayer.PlayerId();
        const myself = this.myPlayer();
        const totalBet = (currentPlayer.TotalBet() === null ? 0 : currentPlayer.TotalBet());
        const currentBet = currentPlayer.Bet();
        const maximumBet = this.maximumBet();
        const amountPlaced = amount - currentBet;
        if (type === 6) {
            currentPlayer.Money(currentPlayer.Money() + amount);
            this.handHistory.onReturnMoney(playerId, amount);
            return;
        }

        const newMoney = currentPlayer.Money() - amountPlaced;
        currentPlayer.Money(newMoney);

        // If player raise then update last raise amount.
        // We have to do that before current bet for the player is changed,
        // Since calculation depends on the amount of last bet.
        if (type === 3) {
            const raiseAmount = amount;

            // Since we have raise in this round, then we no longer could
            // do bets.
            this.actionBlock.isRaise(true);

            // The raise amount could be actually smaller then the last raise amount
            // because player goes all-in, other players should be forced to pay more
            // to do the raise.
            if (raiseAmount > this.lastRaise()) {
                this.lastRaise(raiseAmount);
            }
        }

        if (type === 4) {
            this.foldCardsForPlayer(currentPlayer, this.animationSettings.foldAnimationTimeout);
            // Mark player as not in game.
            // During the new game this flag should be set automatically.
            currentPlayer.IsInGameStatus(false);
        }

        if (type !== 4) {
            // If player folds then current bet amount should not be changed.
            currentPlayer.Bet(amount);
            if (type === 0 || type === 1 || type === 5) {
                currentPlayer.IsBetAnimationLocked(true);
            } else {
                // Lock animation place after timeout.
                this.queue.wait(this.animationSettings.betAnimationTimeout);
                this.queue.pushCallback(() => {
                    currentPlayer.IsBetAnimationLocked(true);
                });
            }
        }

        // Display action which current player executes.
        if (type === 4) {
            // Display fold action
            currentPlayer.startAction("table.actiontext.fold");
            this.handHistory.onFold(playerId);
            if (this.soundEnabled) {
                const soundManager = getSoundManager();
                soundManager.playFold();
            }
        } else if (type === 2) {
            // Display check/call action
            if (currentPlayer.Money() === 0) {
                currentPlayer.startAction("table.actiontext.allin");
                this.handHistory.onAllIn(playerId, amount);
                if (this.soundEnabled) {
                    const soundManager = getSoundManager();
                    soundManager.playAllIn();
                }
            } else {
                if (amountPlaced === 0) {
                    currentPlayer.startAction("table.actiontext.check");
                    this.handHistory.onCheck(playerId, amount);
                    if (this.soundEnabled) {
                        const soundManager = getSoundManager();
                        soundManager.playCheck();
                    }
                } else {
                    currentPlayer.startAction("table.actiontext.call");
                    this.handHistory.onCall(playerId, amount);
                    if (this.soundEnabled) {
                        const soundManager = getSoundManager();
                        soundManager.playCall();
                    }
                }
            }
        } else if (type === 3) {
            // Display bet/raise action
            if (currentPlayer.Money() === 0) {
                currentPlayer.startAction("table.actiontext.allin");
                this.handHistory.onAllIn(playerId, amount);
                if (this.soundEnabled) {
                    const soundManager = getSoundManager();
                    soundManager.playAllIn();
                }
            } else {
                if (maximumBet === 0) {
                    currentPlayer.startAction("table.actiontext.bet");
                    this.handHistory.onBet2(playerId, amount);
                    if (this.soundEnabled) {
                        const soundManager = getSoundManager();
                        soundManager.playBet();
                    }
                } else {
                    currentPlayer.startAction("table.actiontext.raise");
                    this.handHistory.onRaise(playerId, amount);
                    if (this.soundEnabled) {
                        const soundManager = getSoundManager();
                        soundManager.playRaise();
                    }
                }
            }
        }
    }
    private foldCardsForPlayer(currentPlayer: TablePlaceModel, duration: number) {
        if (currentPlayer === null) {
            // tslint:disable-next-line:no-console
            console.warn("Attempt to fold cards for the player");
            return;
        }

        const myself = this.myPlayer();

        // If player folds then cards should be hidden.
        const currentCards = currentPlayer.Cards();
        currentPlayer.startFoldAnimation();
        // Current player is not active, but it not yet folded cards.
        const activePlayersCount = this.activePlayersCount() - 1;
        const displayFoldedCards = myself !== null
            && currentPlayer.PlayerId() === myself.PlayerId();

        const modeSupportShowingFoldedCards = appConfig.game.seatMode;
        if (displayFoldedCards || modeSupportShowingFoldedCards) {
            currentPlayer.FoldedCards(currentCards);
            currentPlayer.IsCardsFolded(true);
        }

        if (appConfig.game.tablePreviewMode) {
            currentPlayer.IsCardsFolded(true);
        }

        // Inject tasks in the reverse order.
        this.queue.injectCallback(() => {
            currentPlayer.finishFoldAnimation();
        });
        this.queue.injectWait(duration);
    }
    private finishFoldAnimation() {
        // Do nothing.
    }

    private clearNotification() {
        this.hasNotification(false);
        this.displayingRebuyAddonNotification = false;
        if (this.notificationHandleTimeout != null) {
            timeService.clearTimeout(this.notificationHandleTimeout);
            this.notificationHandleTimeout = null;
        }

        if (this.notificationHandleInterval != null) {
            timeService.clearInterval(this.notificationHandleInterval);
            this.notificationHandleInterval = null;
        }
    }

    private reportApiError(status: string) {
        if (debugSettings.tableView.reportApiError) {
            alert(status);
        }
    }

    private updatePauseDescription() {
        if (this.pauseDescriptionHandle != null) {
            timeService.clearInterval(this.pauseDescriptionHandle);
            this.pauseDescriptionHandle = null;
        }

        if (this.pauseDate() != null) {
            const updateDescription = () => {
                const tournament = this.tournament();
                if (tournament) {
                    const pauseEnds = moment(this.pauseDate()).add(tournament.tournamentData().PauseTimeout, "minutes");
                    const currentMoment = moment().add(timeService.timeDiff, "ms");
                    const diff = pauseEnds.diff(currentMoment);
                    if (diff < 0) {
                        this.clearPauseMessage();
                        return;
                    }

                    const duration = moment.duration(diff);
                    this.pauseDescription(_("table.gameContinue", { startTime: duration.humanize(true) }));
                } else {
                    this.pauseDescription(_("table.waitingForSeat"));
                }
            };
            this.pauseDescriptionHandle = timeService.setInterval(updateDescription, 500);
        }
    }

    private clearPauseMessage() {
        this.paused(false);
        this.pauseDate(null);
        this.updatePauseDescription();
    }

    /**
     * Finish animation on the table
     */
    private finishAnimation(places: TablePlaceModel[]) {
        for (const p in places) {
            if (!places.hasOwnProperty(p)) {
                continue;
            }

            const currentPlayer = places[p];
            currentPlayer.Bet(null);
            if (currentPlayer.IsFoldCards()) {
                currentPlayer.finishFoldAnimation();
            }
        }
    }

    /**
     * Updates current combination based on table status.
     */
    private updateCurrentCombination() {
        this.currentCombination(this.getCurrentCombination());
    }

    /**
     * Saves last hand history
     */
    private saveHandHistory() {
        this.lastHandHistory(null);
        if (this.handHistory != null && this.handHistory.valid) {
            this.lastHandHistory(this.handHistory);
            this.handHistory = new HandHistory(this);
        }
    }

    /**
     * Initializes the hand history
     */
    private initHandHistory() {
        const self = this;
        this.handHistory = new HandHistory(this);
        this.lastHandHistory = ko.observable<HandHistory>();
        this.hasPreviousHand = ko.computed(function () {
            const lastHand = self.lastHandHistory();
            return lastHand != null
                && lastHand.id != null;
        }, this);
        this.currentHandCaption = ko.computed(function () {
            let currentGame = self.gameId();
            if (currentGame == null) {
                currentGame = self.currentGameId();
                if (currentGame == null) {
                    return _("table.currentHandEmpty");
                }

                return _("table.currentHand", { id: currentGame });
            }

            return _("table.currentHand", { id: currentGame });
        }, this);
        this.previousHandCaption = ko.computed(function () {
            const lastHand = self.lastHandHistory();
            if (lastHand == null) {
                return "";
            }

            return _("table.lastHand", { id: lastHand.id });
        }, this);
    }

    /*
     * Prompt to refresh places information.
     */
    private refreshPlaces() {
        this.logGameEvent("Refreshing places");
        this.tablePlaces.refreshPlaces();
    }

    /**
     * Get player place by login
     */
    private getPlayerByLogin(login: string) {
        const filteredPlaces = this.places().filter((place) => place.PlayerName() === login);
        if (filteredPlaces.length === 0) {
            return null;
        }

        return filteredPlaces[0];
    }

    /**
     * Performs recovery from the network error during making turns
     * @param messageCode Message to display during recovery.
     */
    private turnRecovery(messageCode: string = "table.connectionError") {
        if (app.currentPopup !== SlowInternetService.popupName) {
            SimplePopup.display(_("table.turn"), _(messageCode, { tableName: this.tableName() }));
        }

        this.actionBlock.buttonsEnabled(true);
    }

    /**
     * Record log message
     */
    private log(message: string, ...params: any[]) {
        if (!this.isLogEnabled()) {
            return;
        }

        // tslint:disable-next-line:no-console
        console.log("Table " + this.tableId + ": " + message, params);
    }

    /**
     * Record log message
     */
    private logGameEvent(message: string, ...params: any[]) {
        const tableViewSettings = debugSettings.tableView;
        if (!tableViewSettings.traceGameEvents) {
            return;
        }

        this.log(message, params);
    }

    /**
     * Checks whether logging on this table is enabled.
     */
    private isLogEnabled() {
        const tableViewSettings = debugSettings.tableView;
        if (!tableViewSettings.trace) {
            if (tableViewSettings.traceTables == null) {
                return false;
            }

            if (tableViewSettings.traceTables.indexOf(this.tableId) < 0) {
                return false;
            }
        }

        return true;
    }
}
