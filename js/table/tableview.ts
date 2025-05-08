/* tslint:disable:no-bitwise */
import * as $ from "jquery";
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

export interface PotInformation {
    PotNumber: number;
    PotName: string;
    Amount: number;
}

export class TableView {
    public static MaxMessagesCount: number = 100;
    public tableName: ko.Observable<string>;

    /**
     * Current login which sitting on this view.
     */
    public currentLogin: ko.Observable<string>;

    /**
     * Gets name of the current seat when running in seat mode.
     */
    public currrentSeatName: ko.Computed<string>;

    /**
     * Represents the value indicating that information
     * about the table is retreiving.
     */
    public connecting: ko.Observable<boolean>;

    /**
     * Request which performs connecting to the table.
     */
    public connectingRequest: JQueryDeferred<any> | null = null;

    public smallBlind: ko.Observable<number>;
    public bigBlind: ko.Observable<number>;
    public ante: ko.Observable<number>;
    public changeBetParametersNextGame = ko.observable(false);
    public changeGameTypeNextGame = ko.observable(false);
    public nextGameSmallBlind: ko.Observable<number> = ko.observable(0);
    public nextGameBigBlind: ko.Observable<number> = ko.observable(0);
    public nextGameType: ko.Observable<number> = ko.observable(0);
    public nextGameAnte: ko.Observable<number> = ko.observable(0);
    public nextGameInformation: ko.Computed<string>;
    public nextGameTypeInformation: ko.Computed<string>;
    public currentCombinationVisible: ko.Computed<boolean>;
    public handHistoryAllowed: ko.Computed<boolean>;
    public addMoneyAvailable: ko.Computed<boolean>;
    /**
     * Minimal amount of money which currently authenticated player
     * could bring on the table if he stand up from the table lately.
     */
    public minimalPlayerBuyIn: ko.Observable<number>;
    /**
     * Minimal base amount of buy-in in BB to bring on the table.
     */
    public minimalBuyIn: ko.Observable<number>;
    public gamePlayers: ko.ObservableArray<number>;
    public places: ko.Computed<TablePlaceModel[]>;
    public pots: ko.ObservableArray<number>;
    public potsInformation: ko.Computed<PotInformation[]>;
    public tableCards: TableCardsPlace;
    public messages: ko.ObservableArray<PlayerMessage>;
    public systemMessages: ko.ObservableArray<SystemMessage>;
    public lastRaise: ko.Observable<number>;
    public timePass: ko.Observable<number>;
    public timePassGameFinished: ko.Observable<number>;
    /**
     * Count of actual actions which was performed by the players during the current game
     */
    public actionsCount: ko.Observable<number>;
    /**
     * Indicating whether authenticated player is playing in the game
     */
    public myPlayerInGame: ko.Computed<boolean>;
    /**
     * Indicating whether authenticated player was playing in the game
     */
    public myPlayerWasInGame: ko.Computed<boolean>;
    /**
     * Id of the current game on the table.
     */
    public gameId: ko.Observable<number>;
    public currentGameId: ko.Observable<number>;
    /**
     * Indicates that game finished.
     */
    public gameFinished: ko.Observable<boolean>;
    /**
     * Indicates that prizes distributed in the game.
     */
    public prizesDistributed: ko.Observable<boolean>;
    /**
     * Indicates that game started.
     */
    public gameStarted: ko.Observable<boolean>;
    /**
     * Count of active players in the game
     */
    public activePlayersCount: ko.Computed<number>;
    /**
     * Value indicating whether all bets are rounded.
     */
    public allBetsRounded: ko.Computed<boolean>;
    /**
     * Value indicating whether use cards variant up
     */
    public cardsVariantUp: ko.Observable<boolean>;
    /**
     * Value indicating whether use cards variant down
     */
    public cardsVariantDown: ko.Observable<boolean>;
    /**
     * Css rules for table-container
     */
    public containerCss: ko.Computed<any>;

    /**
     * Indicate game type
     */
    public gameType: ko.Observable<number>;
    public has2Cards: ko.Computed<boolean>;
    public has4Cards: ko.Computed<boolean>;

    public timeLeft: ko.Computed<number>;
    public timerInterval: number = 0;
    public openCardsTimeLeft: ko.Computed<number>;
    public gameFinishedTimerInterval: number = 0;
    public chipWidth: number;

    public chatMessage: ko.Observable<string>;
    public combinations: ko.ObservableArray<string>;
    public currentPlayer: ko.Computed<TablePlaceModel | null>;
    public myPlayer: ko.Computed<TablePlaceModel | null>;
    public mainButtonsEnabled: ko.Observable<boolean>;
    public playerActions: ko.Observable<any>;
    public turnEnabled: ko.Computed<boolean>;
    public isMyTurn: ko.Computed<boolean>;
    public notMyTurn: ko.Computed<boolean>;
    public isInGame: ko.Computed<boolean>;
    public checkOrCallAmount: ko.Computed<number>;

    /**
     * Bet amount for currently active player.
     */
    public currentBet: ko.Computed<number>;

    /**
     * Bet amount for player.
     */
    public myBet: ko.Computed<number>;
    public currentTotalBet: ko.Computed<number>;
    public maximumBet: ko.Computed<number>;
    public currentRaise: ko.Computed<number>;
    public minimumRaiseAmount: ko.Computed<number | null>;
    public maximumRaiseAmount: ko.Computed<number | null>;
    public amountSupported: ko.Observable<number>;
    public maxAmountOfMoneyForOtherActivePlayers: ko.Computed<number>;
    public isSitOut: ko.Computed<boolean>;
    public totalPot: ko.Computed<number>;
    public totalPotCaption: ko.Computed<string>;
    public currentCombination = ko.observable("");
    public actionBlock: ActionBlock;
    public onMyTurn: Signal;
    public onGamefinished: Signal;
    public tablePlaces: TablePlaces;
    public lastHandHistory: ko.Observable<HandHistory>;
    public hasPreviousHand: ko.Computed<boolean>;
    public tableBetsCaption: ko.Computed<string>;
    public currentHandCaption: ko.Computed<string>;
    public previousHandCaption: ko.Computed<string>;

    public roundNotification: ko.Observable<string>;
    public roundNotificationCaption: ko.Computed<string>;
    public isRoundNotificationShown: ko.Computed<boolean>;
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
    public couldAddChips: ko.Computed<boolean>;

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
        this.tableId = tableId;
        this.tableName = ko.observable(model === null ? "0" : model.TableName);
        this.connecting = ko.observable(true);
        this.gamePlayers = ko.observableArray<number>([]);
        this.pots = ko.observableArray<number>([]);
        this.potsInformation = ko.pureComputed(() => {
            const pots = this.pots();
            const potsInformation: PotInformation[] = [];
            for (let i = 0; i < pots.length; i++) {
                potsInformation.push({
                    PotNumber: i + 1,
                    PotName: i ? _("table.sidePot", { pot: i, amount: pots[i] }) : _("table.mainPot", { amount: pots[i] }),
                    Amount: pots[i],
                });
            }

            return potsInformation;
        });
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
        this.timePassGameFinished = ko.observable<number>();
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

        this.places = ko.computed(() => {
            return this.tablePlaces.places();
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

        this.myPlayer = ko.computed(() => {
            this.tablePlaces.placesRefreshTrigger();
            const p = this.places().filter((item) => {
                return item.PlayerName() === this.currentLogin();
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

        this.myPlayerInGame = ko.computed(() => {
            const gid = this.gameId();
            if (gid === null || gid === 0) {
                return false;
            }

            const myself = this.myPlayer();
            if (myself === null) {
                return false;
            }

            return (myself.Cards() !== null) && (myself.Cards().length !== 0);
        }, this);

        this.currentLogin = ko.observable(authManager.login());
        this.currrentSeatName = ko.computed(() => {
            if (appConfig.game.seatMode) {
                if (!this.currentLogin()) {
                    return "";
                }

                const seatNoMatch = this.currentLogin().match(/(\d+)/);
                if (seatNoMatch.length) {
                    const seat = seatNoMatch[0];
                    return _("table.seatName", { seat: seat });
                }
            }

            return "";
        }, this);
        authManager.registerAuthenticationChangedHandler((value) => {
            this.currentLogin(authManager.login());
        });

        this.timeLeft = ko.computed(() => {
            if (this.frozen()) {
                return -1;
            }

            let pass = this.timePass();
            pass = pass === null ? 0 : pass;
            const moveTime = appConfig.timeSettings.moveTime || runtimeSettings.game.moveTime;
            return moveTime - pass;
        });
        this.openCardsTimeLeft = ko.computed(() => {
            if (this.frozen()) {
                return -1;
            }

            const pass = this.timePassGameFinished() ?? 100;
            const moveTime = appConfig.timeSettings.openCardsTime || runtimeSettings.game.openCardsTime;
            return moveTime - pass;
        });
        this.currentRaise = ko.computed<number>({
            owner: this,
            read: () => {
                return this.actionBlock.tableSlider.current();
            },
            write: (value) => {
                this.actionBlock.tableSlider.current(value);
            },
        });
        this.currentPlayer = ko.computed(() => {
            this.tablePlaces.placesRefreshTrigger();
            const p = this.places().filter((item) => {
                return item.IsCurrent();
            });
            if (p.length > 0) {
                return p[0];
            }

            return null;
        }, this);

        this.activePlayersCount = ko.computed(() => {
            this.tablePlaces.placesRefreshTrigger();
            const activePlayersCount = this.places().reduce((prev: number, value: TablePlaceModel) => {
                const isActive = value.WasInGame() && (value.Cards() !== null);
                return prev + (isActive ? 1 : 0);
            }, 0);
            return activePlayersCount;
        }, this);

        this.myPlayerWasInGame = ko.computed(() => {
            this.tablePlaces.placesRefreshTrigger();
            const myself = this.myPlayer();
            if (myself === null) {
                return false;
            }

            return (myself.WasInGame() === true);
        }, this);

        this.turnEnabled = ko.computed(() => {
            this.tablePlaces.placesRefreshTrigger();
            const cp = this.currentPlayer();
            if (cp === null) {
                return false;
            }

            const activePlayersCount = this.places().reduce((prev: number, value: TablePlaceModel) => {
                const isActive = value.WasInGame() && (value.Cards() !== null);
                return prev + (isActive ? 1 : 0);
            }, 0);
            return (cp.PlayerName() === this.currentLogin()) && activePlayersCount > 1;
        }, this);

        this.isMyTurn = ko.computed(() => {
            this.tablePlaces.placesRefreshTrigger();
            const cp = this.myPlayer();
            if (cp === null || !cp.IsInGameStatus()) {
                return false;
            }

            if (!this.gameStarted()) {
                return false;
            }

            if (cp.IsCurrent() === null) {
                return false;
            }

            return cp.IsCurrent();
        }, this);

        this.notMyTurn = ko.computed(() => {
            this.tablePlaces.placesRefreshTrigger();
            const cp = this.myPlayer();
            if (cp === null || !cp.IsInGameStatus()) {
                return false;
            }

            if (cp.IsCurrent() === null) {
                return true;
            }

            return !cp.IsCurrent();
        }, this);

        this.isInGame = ko.computed(() => {
            this.tablePlaces.placesRefreshTrigger();
            const cp = this.myPlayer();
            if (cp === null || !cp.IsInGameStatus()) {
                return false;
            }

            return true;
        });

        this.maximumBet = ko.computed(() => {
            this.tablePlaces.placesRefreshTrigger();
            let result = 0;
            result = this.places().reduce(function (previousValue: number, currentValue: TablePlaceModel) {
                return Math.max(previousValue, currentValue.Bet());
            }, 0);
            return result;
        }, this);

        this.allBetsRounded = ko.computed(() => {
            this.tablePlaces.placesRefreshTrigger();
            const playersInGame = this.places().filter((value) => value.WasInGame()).length;
            const activePlayers = this.places().filter((value) => value.WasInGame() && (value.Cards() !== null));
            const maxBet = this.maximumBet();
            const allRounded = activePlayers.filter((player) => (player.Bet() === maxBet)
                || (player.Money() === 0)).length === activePlayers.length;
            if (allRounded && (this.actionsCount() >= playersInGame)) {
                return true;
            }

            return false;
        }, this);

        this.currentBet = ko.computed(() => {
            this.tablePlaces.placesRefreshTrigger();
            const result = this.places().reduce(function (previousValue: number, currentValue: TablePlaceModel) {
                if (currentValue.IsCurrent()) {
                    return currentValue.Bet();
                }

                return previousValue;
            }, 0);
            return result;
        }, this);

        this.myBet = ko.computed(() => {
            this.tablePlaces.placesRefreshTrigger();
            const myPlayer = this.myPlayer();
            if (myPlayer === null) {
                return 0;
            }

            return myPlayer.Bet();
        }, this);

        this.currentTotalBet = ko.computed(() => {
            this.tablePlaces.placesRefreshTrigger();
            const result = this.places().reduce(function (previousValue: number, currentValue: TablePlaceModel) {
                if (currentValue.IsCurrent()) {
                    return currentValue.TotalBet();
                }

                return previousValue;
            }, 0);
            return result;
        }, this);

        this.checkOrCallAmount = ko.computed(() => this.maximumBet() - this.currentBet(), this);

        this.minimumRaiseAmount = ko.computed(() => {
            this.tablePlaces.placesRefreshTrigger();
            const currentPlayer = this.myPlayer();
            if (currentPlayer === null) {
                return null;
            }

            const oldVersion = false;
            if (oldVersion) {
                const currentBet = this.currentBet();
                let mb = 2 * (this.lastRaise() - currentBet) - this.checkOrCallAmount();

                // No less then big blind.
                mb = Math.max(mb, this.bigBlind());

                // No more then current money
                mb = Math.min(mb, currentPlayer.Money());
                const addon = currentBet + this.checkOrCallAmount();
                let raiseAmount = mb + addon;
                const maxAmountOfMoneyForOtherActivePlayers = this.maxAmountOfMoneyForOtherActivePlayers();
                raiseAmount = Math.min(raiseAmount, maxAmountOfMoneyForOtherActivePlayers);
                return raiseAmount;
            } else {
                let basicRaise = this.maximumBet() + this.lastRaise();

                // No less then big blind.
                basicRaise = Math.max(basicRaise, this.bigBlind());

                // No more then current money
                basicRaise = Math.min(basicRaise, currentPlayer.Money() + currentPlayer.Bet());

                // No more then money which other players has.
                const maxAmountOfMoneyForOtherActivePlayers = this.maxAmountOfMoneyForOtherActivePlayers();
                const raiseAmount = Math.min(basicRaise, maxAmountOfMoneyForOtherActivePlayers);
                return raiseAmount;
            }
        }, this);

        this.isSitOut = ko.computed(() => {
            this.tablePlaces.placesRefreshTrigger();
            const currentPlayer = this.myPlayer();
            if (currentPlayer === null) {
                return false;
            }

            return (currentPlayer.Status() & 1) !== 0;
        }, this);

        this.maxAmountOfMoneyForOtherActivePlayers = ko.computed(() => {
            let result = 0;
            result = this.places().reduce((previousValue: number, currentValue: TablePlaceModel) => {
                if (currentValue.PlayerName() === this.currentLogin()) {
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

            let max = this.maxAmountOfMoneyForOtherActivePlayers();
            if (this.gameType() === 2) {
                max = Math.min(max, this.actionBlock.getPot());
            }

            const bet = currentPlayer.Bet();
            const money = currentPlayer.Money();
            return Math.min(money + bet, max) - bet;
        }, this).extend({ notify: "always" });

        this.totalPot = ko.computed(() => {
            this.tablePlaces.placesRefreshTrigger();
            const totalBetsOnTable = this.places().reduce((prev: number, item: TablePlaceModel) => {
                return prev + item.Bet();
            }, 0);
            const potsArray = this.pots();
            if (potsArray === null) {
                return totalBetsOnTable;
            }

            const pots = potsArray.reduce((prev: number, item: number) => {
                return prev + item;
            }, 0);

            return totalBetsOnTable + pots;
        }, this);

        this.totalPotCaption = ko.computed(() => {
            this.tablePlaces.placesRefreshTrigger();
            const totalPot = this.totalPot();
            if (totalPot === null || totalPot === 0) {
                return "";
            }

            return _("table.totalpot")
                .replace("#amount", withCommas(totalPot.toFixed(), ","));
        }, this);

        this.tableBetsCaption = ko.computed(() => {
            const hasAnte = this.ante() != null;
            if (hasAnte) {
                return _("table.betsWithAnte", { ante: this.ante(), bb: this.bigBlind(), sb: this.smallBlind() });
            }

            return _("table.bets", { bb: this.bigBlind(), sb: this.smallBlind() });
        }, this);

        this.couldAddChips = ko.pureComputed(() => {
            const me = this.myPlayer();
            if (me == null) {
                return false;
            }

            if (this.hasPendingMoney()) {
                return false;
            }

            if (appConfig.game.noTableMoneyLimit) {
                return true;
            }

            const totalBet = (me.TotalBet() == null ? 0 : me.TotalBet());
            const baseMinimalBuyIn = this.minimalBuyIn() * this.model.BigBlind;
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

            myPlayer.DisplayedHandCards(getBackCardsFromGameType(this.gameType()));
        });
        this.handHistoryAllowed = ko.pureComputed(() => {
            const myPlayer = this.myPlayer();
            if (!myPlayer) {
                return false;
            }

            return this.lastHandHistory() !== null;
        });
        this.addMoneyAvailable = ko.pureComputed(() => {
            return this.tournament() == null && this.opened();
        });

        this.gameFinished.subscribe((value) => {
            
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
    public getPlayerPlaceViewModel(seat: number) {
        return {
            seat,
            seatAddress: this.getEmbeddedSeatAddress(seat),
            item: this.tablePlaces.getOffsetPlace(seat),
        };
    }
    public startTimer(startTime: number = 1, playSound: boolean = true) {
        if (this.frozen()) {
            return;
        }

        this.timePass(startTime);
        this.timerInterval = timeService.setInterval(() => {
            if (runtimeSettings.updateTimer) {
                const time = this.timePass();
                this.timePass(time + 1);
                if (this.timeLeft() === 7) {
                    if (this.currentPlayer() === this.myPlayer()) {
                        if (this.soundEnabled && playSound) {
                            const soundManager = getSoundManager();
                            soundManager.playTurnReminder();
                        }
                    } else {
                        if (this.soundEnabled && playSound) {
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
    public startGameFinishedTimer() {
        if (this.frozen()) {
            return;
        }

        this.timePassGameFinished(1);
        this.gameFinishedTimerInterval = timeService.setInterval(() => {
            if (runtimeSettings.updateTimer) {
                const time = this.timePassGameFinished();
                this.timePassGameFinished(time + 1);
            }
        }, 1000);
    }
    public clearGameFinshedTimer() {
        timeService.clearInterval(this.gameFinishedTimerInterval);
        this.timePassGameFinished(null);
    }
    public clearInformation() {
        this.messages([]);
    }
    /**
     * Updates information about the table from the server.
     */
    public async updateTableInformation() {
        if (this.connectingRequest !== null && this.connectingRequest.state() === "pending") {
            // Re-schedule updating information.
            this.connectingRequest.then(null, () => {
                this.log("Rescheduling the updating information.");
                this.updateTableInformation();
            });
            this.log("Cancelling the connection request process");
            this.cancelUpdateTableInformation();
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

        let hubId = wrapper.getConnectionId();
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
                this.log(`Connection  ${hubId} appears to be terminated`);
                return;
            }

            hubId = wrapper.getConnectionId();
            this.log("Attempting to connect to table and chat over connection " + hubId);

            const joinTableRequest = this.joinTable(wrapper);
            const joinChatRequest = this.joinChat(wrapper);
            const joinRequest = $.when(joinTableRequest, joinChatRequest);
            currentLoadingRequest.progress((command: string) => {
                this.log("Receiving request to cancel all joining operations");
                joinTableRequest.notify(command);
                joinChatRequest.notify(command);
            });
            await joinRequest.then(() => {
                if (wrapper.terminated) {
                    console.log("Cancel terminated connection.");
                    currentLoadingRequest.reject("Cancelled");
                    return;
                }

                this.log("Jointing to table finished");
                currentLoadingRequest.resolve();
            }, (result1, result2) => {
                    if (wrapper.terminated) {
                        this.log("Don't use terminated connection.");
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

                    this.log(message);
                    currentLoadingRequest.reject(message);
                });
        } catch (message) {
            this.log("Table connection failed. Error: " + message);
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
        const result = $.Deferred();
        if (maxAttempts === 0 || wrapper.terminated) {
            this.log("Stop connecting to table");
            result.reject("Stop connecting to table", false);
            return result;
        }

        const hubId = connectionService.currentConnection.getConnectionId();
        const connectionInfo = "HID:" + hubId;
        this.log("Joining table on connection " + connectionInfo);
        let cancelled = false;
        let subsequentDeferred: JQueryDeferred<any> | null = null;
        const cancelOperation = () => {
            this.log("Cancelling join table request");
            result.reject("Cancelled", true);
        };

        wrapper.buildStartConnectionAsync().then(() => {
            if (wrapper.terminated) {
                cancelOperation();
                return;
            }

            this.log(`Executing Game.join on connection ${wrapper.getConnectionId()} in state ${wrapper.getConnectionState()}`);
            const operation = wrapper.joinTable(this.tableId)
                .then(function () {
                    if (wrapper.terminated) {
                        cancelOperation();
                        return;
                    }

                    result.resolve();
                }, (error: any) => {
                        if (wrapper.terminated || cancelled || error === "Cancelled") {
                            cancelOperation();
                            return;
                        }

                        const message = "" + error as string;
                        this.log("Failed to join table " + this.tableId + ", " + connectionInfo + ". Reason: " + message);
                        if (message.indexOf("Connection was disconnected before invocation result was received.") >= 0) {
                            this.log("Stopped connecting to table since underlying connection is broken");
                            slowInternetService.showReconnectFailedPopup();
                            result.reject("Stopped connecting to table since underlying connection is broken", false);
                            return;
                        } else {
                            subsequentDeferred = this.joinTable(wrapper, maxAttempts - 1);
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
        const result = $.Deferred();
        if (maxAttempts === 0 || wrapper.terminated) {
            this.log("Stop connecting to table chat");
            result.reject("Stop connecting to table chat", false);
            return result;
        }

        let cancelled = false;
        let subsequentDeferred: JQueryDeferred<any> | null = null;
        const cancelOperation = () => {
            this.log("Cancelling join table request");
            result.reject("Cancelled", true);
        };

        wrapper.buildStartConnection()().then(() => {
            if (wrapper.terminated) {
                cancelOperation();
                return;
            }

            this.log(`Executing Game.join on connection ${wrapper.getConnectionId()} in state ${wrapper.getConnectionState()}`);
            const operation = wrapper.joinChat(this.tableId)
                .then(function () {
                    if (wrapper.terminated) {
                        cancelOperation();
                        return;
                    }

                    result.resolve();
                }, (message: string) => {
                        if (wrapper.terminated || cancelled) {
                            this.log("Cancelling join table chat request");
                            result.reject("Cancelled", true);
                            return;
                        }

                        this.log("Failed to join table " + this.tableId + " chat. Reason: " + message);
                        subsequentDeferred = this.joinChat(wrapper, maxAttempts - 1);
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
            try {
                const api = this.apiProvider.getGame();
                await api.setTableParameters(this.tableId, !settings.autoHideCards());
            }
            catch {
                // Ignore failre to set table parameters.
                this.log("Cannot set table parameters. Most likely internet connection.");
            }
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
        this.clearGameFinshedTimer();
    }
    public onUnfrozen() {
        this.frozen(false);
        this.startTimer();
        this.startGameFinishedTimer();
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
            this.clearTimer();
            const playSound = this.isInGame() && !gameFinished;
            this.startTimer(timePass, playSound);
            if (gameFinished) {
                this.startGameFinishedTimer();
            }

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
        this.queue.wait(this.animationSettings.finishGamePrePause);
        if (this.pots().length === 0 && winners.length > 0) {
            this.executeMoveMoneyToPot(winners.map((winner) => winner.Amount));
        }

        if (debugSettings.game.singleSidePots) {
            this.queue.pushCallback(() => {
                this.logGameEvent("Game finished");
                this.gameFinished(true);
                this.startGameFinishedTimer();
                this.actionBlock.expanded(false);
                this.gameStarted(false);
                this.gamePlayers([]);
                const places = this.places();
                this.finishAnimation(places);

                const needHightlightCards = true;
                const activePlayersCount = this.activePlayersCount();
                this.logGameEvent("Active players count", activePlayersCount);
                if (needHightlightCards) {
                    this.tableCards.CardsHightlighted(true);
                }

                const c = this.calculateWinnerAmount(places, winners, needHightlightCards);
                if (this.soundEnabled) {
                    const soundManager = getSoundManager();
                    soundManager.playWinChips();
                }

                this.combinations(c);

                this.setButtons(0);
                this.cardsReceived = false;
                this.actionBlock.buttonsEnabled(false);
                this.actionBlock.dealsAllowed(false);
                this.setCurrent(0);
                this.pots([]);
                this.refreshPlaces();
                this.clearTimer();

                this.gameId(null);

                this.handHistory.onGameFinished(gameId, winners, rake);
                this.saveHandHistory();
                this.enableInjectPlayerCards = true;
            });
            this.queue.waitWithInterruption(this.animationSettings.cleanupTableTimeout);
        } else {
            this.queue.pushCallback(() => {
                this.logGameEvent("Game finished");
                this.gameFinished(true);
                this.startGameFinishedTimer();
                this.actionBlock.expanded(false);
                this.gameStarted(false);
                this.gamePlayers([]);
                const places = this.places();
                this.finishAnimation(places);

                const activePlayersCount = this.activePlayersCount();
                this.logGameEvent("Active players count", activePlayersCount);
                const needHightlightCards = true;
                if (needHightlightCards) {
                    this.tableCards.CardsHightlighted(true);
                }

                this.setButtons(0);
                this.actionBlock.buttonsEnabled(false);
                this.actionBlock.dealsAllowed(false);
                this.setCurrent(0);
                this.clearTimer();
                this.gameId(null);
            });
            this.queue.pushCallback(() => {
                const places = this.places();
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
                this.cardsReceived = false;
                this.pots([]);

                this.handHistory.onGameFinished(gameId, winners, rake);
                this.saveHandHistory();
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
        if (this.enableInjectPlayerCards) {
            this.queue.injectCallback(() => {
                this.onPlayerCardsCore(playerId, cards);
                this.ensureCardsOpened(playerId);
            });
        } else {
            this.queue.pushCallback(() => {
                if (!this.cardsReceived) {
                    if (playerId === authManager.loginId()) {
                        this.startDealCards();
                        this.queue.pushCallback(() => {
                            this.onPlayerCardsCore(playerId, cards);
                        });
                    } else {
                        this.onPlayerCardsCore(playerId, cards);
                    }
                } else {
                    this.onPlayerCardsCore(playerId, cards);
                }
            });
        }
    }
    public onPlayerCardOpened(playerId: number, cardPosition: number, cardValue: number) {
        if (this.enableInjectPlayerCards) {
            this.queue.injectCallback(() => {
                this.onPlayerCardOpenedCore(playerId, cardPosition, cardValue);
            });
        } else {
            this.queue.pushCallback(() => {
                this.onPlayerCardOpenedCore(playerId, cardPosition, cardValue);
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
        this.actionBlock.buttonsEnabled(false);
        this.queue.wait(this.animationSettings.movingMoneyToPotPrePause);
        this.queue.pushCallback(() => {
            this.startMovingChipsToPotAnimation();
        });
        this.queue.wait(this.animationSettings.movingMoneyToPotAnimationTimeout);
        this.queue.pushCallback(() => {
            this.logGameEvent("Updating pots");
            this.setPots(amount);

            this.logGameEvent("Clearing bets");
            const places = this.places();
            this.places().forEach(function (value) {
                value.collectBet();
            });
            this.refreshPlaces();

            this.lastRaise(0);
            this.currentRaise(this.minimumRaiseAmount());
            this.actionBlock.isRaise(false);
            this.actionBlock.buttonsEnabled(true);
        });
    }
    public onMoneyAdded(playerId: number, amount: number) {
        const places = this.places();
        places.forEach((value) => {
            if (value.PlayerId() === playerId) {
                // Add money only if player not currently eligible to be in game.
                // And when no game on the table.
                if (!value.IsInGameStatus() || this.gameId() === null) {
                    value.Money(value.Money() + amount);
                }
            }
        });
        this.refreshPlaces();
    }
    public onMoneyRemoved(playerId: number, amount: number) {
        const places = this.places();
        places.forEach((value) => {
            if (value.PlayerId() === playerId) {
                // Add money only if player not currently eligible to be in game.
                // And when no game on the table.
                if (!value.IsInGameStatus() || this.gameId() === null) {
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
        const tournamentView = this.tournament();
        const tapi = this.apiProvider.getTournament();
        try {
            const data = await tapi.rebuy(tournamentView.tournamentId, false);
            if (data.Status === "Ok") {
                this.hasPendingMoney(true);
                if (!this.hasPlayersWithoutMoney()) {
                    // this.clearNotification();
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
        const tournamentView = this.tournament();
        const tapi = this.apiProvider.getTournament();
        try {
            const data = await tapi.rebuy(tournamentView.tournamentId, true);
            if (data.Status === "Ok") {
                this.hasPendingMoney(true);
                if (!this.hasPlayersWithoutMoney()) {
                    // this.clearNotification();
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
        const tournamentView = this.tournament();
        const tapi = this.apiProvider.getTournament();
        try {
            const data = await tapi.addon(tournamentView.tournamentId);
            if (data.Status === "Ok") {
                this.hasPendingMoney(true);
                if (!this.hasPlayersWithoutMoney()) {
                    // this.clearNotification();
                }

                // this.tournament().addonCount(this.tournament().addonCount() + 1);
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
        const gameApi = this.apiProvider.getGame();
        try {
            const data = await gameApi.sit(this.tableId, seat, amount, ticketCode);
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
        const messages = [_("table.standupSuccessMessage")];
        const title = _("table.standupSuccessTitle");
        SimplePopup.display(title, messages);
    }
    public async standup() {
        const gameApi = this.apiProvider.getGame();
        const data = await gameApi.standup(this.tableId);
        // report on successfull seating.
        if (data.Status === "AuthorizationError") {
            this.reportApiError("Ошибка авторизации");
        } else if (data.Status === "Ok" && appConfig.game.seatMode) {
            this.showStandupConfirm();
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

    public displayHandHistory() {
        if (!this.handHistoryAllowed()) {
            return;
        }

        app.handHistoryPopup.tableView(this);
        app.showPopup("handHistory");
    }

    public async addMoney() {
        if (!this.couldAddChips()) {
            return;
        }

        app.addMoneyPopup.tableView(this);
        app.closePopup();
        const results: { name: string; result: any } = await app.showPopup("addMoney");
        if (results.result === "cancel") {
            app.executeCommand("popup.tableMenu");
        }
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
        this.actionBlock.buttonsEnabled(false);
        const gameApi = this.apiProvider.getGame();
        if (appConfig.game.useSignalR) {
            // TODO: We should provide notification, which will return any error from the server.
            connectionService.currentConnection.fold(this.tableId);
        } else {
            try {
                const data = await gameApi.fold(this.tableId);
                if (data.Status === "OperationNotValidAtThisTime") {
                    this.turnRecovery();
                    return;
                }

                if (data.Status === "OperationNotValidWhenTableFrozen") {
                    this.turnRecovery("table.tableFreezed");
                    return;
                }

                if (data.Status !== "Ok") {
                    this.reportApiError(data.Status);
                }
            } catch (e) {
                this.turnRecovery();
            }
        }
    }

    public async checkOrCall() {
        this.actionBlock.buttonsEnabled(false);
        const gameApi = this.apiProvider.getGame();
        if (appConfig.game.useSignalR) {
            // TODO: We should provide notification, which will return any error from the server.
            connectionService.currentConnection.checkOrCall(this.tableId);
        } else {
            try {
                const data = await gameApi.checkOrCall(this.tableId);
                if (data.Status === "OperationNotValidAtThisTime") {
                    this.turnRecovery();
                    return;
                }

                if (data.Status === "OperationNotValidWhenTableFrozen") {
                    this.turnRecovery("table.tableFreezed");
                    return;
                }

                if (data.Status !== "Ok") {
                    this.reportApiError(data.Status);
                }
            } catch (e) {
                this.turnRecovery();
            }
        }
    }

    public async betOrRaise() {
        this.actionBlock.buttonsEnabled(false);
        const gameApi = this.apiProvider.getGame();
        const amount: number = this.currentRaise() - this.currentBet();
        if (appConfig.game.useSignalR) {
            // TODO: We should provide notification, which will return any error from the server.
            connectionService.currentConnection.betOrRaise(this.tableId, amount);
        } else {
            try {
                const data = await gameApi.betOrRaise(this.tableId, amount);
                if (data.Status === "OperationNotValidAtThisTime") {
                    this.turnRecovery();
                    return;
                }

                if (data.Status === "OperationNotValidWhenTableFrozen") {
                    this.turnRecovery("table.tableFreezed");
                    return;
                }

                if (data.Status !== "Ok") {
                    this.reportApiError(data.Status);
                }
            } catch (e) {
                this.turnRecovery();
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
            } else {
                this.actionBlock.showHoleCard1Enabled(false);
                this.actionBlock.showHoleCard2Enabled(false);
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
            } else {
                if (!this.actionBlock.showHoleCard1Enabled() && !this.actionBlock.showHoleCard2Enabled()) {
                    this.actionBlock.showCardsEnabled(false);
                }
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
        this.queue.pushCallback(() => {
            this.actionsCount(0);
            const currentCardsOpened = this.tableCards.tableCards().length;
            const myPlayer = this.myPlayer();
            if (myPlayer) {
                myPlayer.cardsOverlayVisible(true);
            }

            this.tableCards.openCards(cards);
            this.handHistory.onOpenCards(cards);
            if (currentCardsOpened === 0 && cards.length === 3) {
                this.handHistory.onFlop(cards[0], cards[1], cards[2]);
                this.actionBlock.dealsAllowed(true);
                const soundManager = getSoundManager();
                soundManager.playFlopCards();
                this.onFlopDealed.dispatch(this.tableId);
            }
            if (currentCardsOpened === 3 && cards.length === 4) {
                this.handHistory.onTurn(cards[3]);
                this.actionBlock.dealsAllowed(true);
                const soundManager = getSoundManager();
                soundManager.playTurn();
                this.onTurnDealed.dispatch(this.tableId);
            }
            if (currentCardsOpened === 4 && cards.length === 5) {
                this.handHistory.onRiver(cards[4]);
                this.actionBlock.dealsAllowed(true);
                const soundManager = getSoundManager();
                soundManager.playRiver();
                this.onRiverDealed.dispatch(this.tableId);
            }
            if (currentCardsOpened === 3 && cards.length === 5) {
                this.handHistory.onTurn(cards[3]);
                this.handHistory.onRiver(cards[4]);
                // soundManager.playAllIn();
            }
            if (currentCardsOpened === 0 && cards.length === 5) {
                this.handHistory.onFlop(cards[0], cards[1], cards[2]);
                this.handHistory.onTurn(cards[3]);
                this.handHistory.onRiver(cards[4]);
                // soundManager.playAllIn();
            }
            this.actionBlock.resetAutomaticAction();
            this.actionBlock.updateAdditionalButtons();
        });
        if (this.soundEnabled) {
            const soundManager = getSoundManager();
            soundManager.playFlop();
        }

        this.queue.wait(this.animationSettings.showCardsTimeout);
        this.queue.pushCallback(() => {
            this.updateCurrentCombination();
            this.tableCards.clearAnimation();
        });
    }

    public async comeBack() {
        const gameApi = this.apiProvider.getGame();
        const data = await gameApi.comeBack(this.tableId);
        if (data.Status === "OperationNotValidAtThisTime") {
            return;
        }

        if (data.Status !== "Ok") {
            this.reportApiError(data.Status);
        }
    }

    public async sitOut() {
        const gameApi = this.apiProvider.getGame();
        const data = await gameApi.sitOut(this.tableId);
        if (data.Status === "OperationNotValidAtThisTime") {
            return;
        }

        if (data.Status !== "Ok") {
            this.reportApiError(data.Status);
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

        app.prompt(_("table.changeplace"),
            [_("table.doyouwantchangeplace")]).then(() => {
                this.tablePlaces.rotate(offset - currentOffset);
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
                this.showNotification(_(messageTemplate, { time: secondsLeft }));
                app.customPopup.title(_(popupCaption, { time: secondsLeft }));
                i++;
                if (i >= totalDuration * 2) {
                    this.clearNotification();
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
                .then((value: number) => {
                    if (value === 1) {
                        this.showRebuyPrompt();
                    }

                    if (value === 2) {
                        this.showDoubleRebuyPrompt();
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
                .then(() => {
                    this.showAddonPrompt();
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
            this.actionBlock.advancedBetUIOpened(false);
            this.actionBlock.currrentBetChips([{type: 1, amount: 1}]);
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
        this.clearGameFinshedTimer();
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
        this.queue.pushCallback(() => {
            this.logGameEvent("Deal cards to players");
            this.places().forEach(function (value) {
                if (value.WasInGame()) {
                    value.startDealCards();
                }
            });
        });
        this.queue.wait(this.animationSettings.dealCardsTime);
        this.queue.pushCallback(() => {
            this.places().forEach(function (value) {
                value.IsDealCards(false);
            });
            this.clearTimer();
            this.startTimer();
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
            this.clearGameFinshedTimer();
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
        const places = this.places();
        places.forEach((p) => {
            if (p.PlayerId() === playerId) {
                const saveMask = 16;
                p.Status(status | (p.Status() & saveMask));
                if (playerId === authManager.loginId()) {
                    if (p.IsSitoutStatus()) {
                        this.actionBlock.processing(false);
                    }
                }
            }
        });
        this.refreshPlaces();
        this.actionBlock.updateNeedBB();
        this.actionBlock.updateBlocks();
    }
    private onPlayerCardsCore(playerId: number, cards: number[]) {
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
                const myself = this.currentLogin() === p.PlayerName();
                let couldDisplayOtherCards = myself || this.combinations().length > 0;
                couldDisplayOtherCards = true;
                if (couldDisplayOtherCards) {
                    p.setCards(cards);
                    if (this.currentCombinationVisible()) {
                        p.DisplayedHandCards(p.HandCards());
                    } else {
                        p.DisplayedHandCards(getBackCardsFromGameType(this.gameType()));
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
        this.handHistory = new HandHistory(this);
        this.lastHandHistory = ko.observable<HandHistory>();
        this.hasPreviousHand = ko.computed(() => {
            const lastHand = this.lastHandHistory();
            return lastHand != null
                && lastHand.id != null;
        }, this);
        this.currentHandCaption = ko.computed(() => {
            let currentGame = this.gameId();
            if (currentGame == null) {
                currentGame = this.currentGameId();
                if (currentGame == null) {
                    return _("table.currentHandEmpty");
                }

                return _("table.currentHand", { id: currentGame });
            }

            return _("table.currentHand", { id: currentGame });
        }, this);
        this.previousHandCaption = ko.computed(() => {
            const lastHand = this.lastHandHistory();
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

    private getEmbeddedSeatAddress(seat: number) {
        if (window.location.host.indexOf("localhost") !== -1) {
            // Assume that dev environmnet setup like this
            // first port is table port
            // other 10 ports is for embedded seats.
            return "//" + window.location.hostname + ":" + (parseInt(window.location.port, 10) + seat) + "/embedded/seat";
        }

        return "//seat" + seat + "." + window.location.host + "/embedded/seat";
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
