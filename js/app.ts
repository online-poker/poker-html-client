import { getAuthToken, setAuthToken } from "@poker/api-server";
import * as $ from "jquery";
import { appConfig } from "poker/appconfig";
import { authManager } from "poker/authmanager";
import { CommandManager } from "poker/commandmanager";
import { AccountManager } from "poker/services/accountManager";
import { TableView } from "poker/table/tableview";
import "signalr";
import * as signals from "signals";
import { debugSettings } from "./debugsettings";
import { _ } from "./languagemanager";
import * as metadataManager from "./metadatamanager";
import { PageBlock } from "./pageblock";
import {
    CashierPageBlock,
    HomePage,
    InfoPageBlock,
    LobbyPageBlock,
    OtherPageBlock,
    SeatPage,
    TablesPage,
} from "./pages";
import {
    AccountStatusPopup,
    AddMoneyPopup,
    AuthPopup,
    ChangePasswordPopup,
    ChatPopup,
    ContinueForgetPasswordPopup,
    CustomPopup,
    ForgetPasswordPopup,
    HandHistoryPopup,
    JoinTablePopup,
    MorePopup,
    NewsPopup,
    OkCancelPopup,
    RegistrationPopup,
    RulesPopup,
    SelectAvatarPopup,
    SettingsPopup,
    SlowConnectionPopup,
    SweepstakesRulesPopup,
    TableMenuPopup,
} from "./popups";
import { SimplePopup } from "./popups/simplepopup";
import { Selector, SelectorItem } from "./selector";
import {
    connectionService,
    deviceEvents,
    getSoundManager,
    imagePreloadService,
    keyboardActivationService,
    orientationService,
    pushService,
    reloadManager,
    slowInternetService,
    WebsiteService,
} from "./services";
import * as broadcastService from "./services/broadcastservice";
import { uiManager, UIManager } from "./services/uimanager";
import { settings } from "./settings";
import { TabBar } from "./tabbar";
import { AnimationSettings } from "./table/animationsettings";
import * as runtimeSettings from "./table/runtimesettings";
import { tableManager } from "./table/tablemanager";
import * as timeService from "./timeservice";

type PromiseOrVoid = void | Promise<void>;

export interface LoginPromptResult {
    authenticated: boolean;
    wasAuthenticated: boolean;
}

declare const host: string;

export class App {
    public currentPopup: string = null;
    public homePage: HomePage;
    public lobbyPageBlock: LobbyPageBlock;
    public cashierPageBlock: CashierPageBlock;
    public tablesPage: TablesPage;
    public seatsPage: SeatPage;
    public infoPageBlock: InfoPageBlock;
    public otherPageBlock: OtherPageBlock;
    public authPopup: AuthPopup;
    public forgetPasswordPopup: ForgetPasswordPopup;
    public continueForgetPasswordPopup: ContinueForgetPasswordPopup;
    public changePasswordPopup: ChangePasswordPopup;
    public registrationPopup: RegistrationPopup;
    public simplePopup: SimplePopup;
    public okcancelPopup: OkCancelPopup;
    public customPopup: CustomPopup;
    public joinTablePopup: JoinTablePopup;
    public tableMenuPopup: TableMenuPopup;
    public addMoneyPopup: AddMoneyPopup;
    public slowConnectionPopup: SlowConnectionPopup;
    public tableChatPopup: ChatPopup;
    public handHistoryPopup: HandHistoryPopup;
    public accountStatusPopup: AccountStatusPopup;
    public settingsPopup: SettingsPopup;
    public rulesPopup: RulesPopup;
    public sweepstakesRulesPopup: SweepstakesRulesPopup;
    public newsPopup = new NewsPopup();
    public selectAvatarPopup = new SelectAvatarPopup();

    public morePopup: MorePopup;
    public tabBar: TabBar;
    public mainSelector: Selector;
    public spinner: any;
    public progressSpinner: any;
    public processing: KnockoutObservable<boolean>;
    public popupClosed: Signal;
    public loadPromises: JQueryPromise<void>[];
    public fullyInitialized: boolean;
    public disconnected: boolean;
    public suppressResume: boolean;
    private stopped = false;
    private savedPopup: string = null;
    private commandManager = new CommandManager();

    constructor() {
        const self = this;

        this.loadPromises = [];
        // register pages.
        this.homePage = new HomePage();
        this.otherPageBlock = new OtherPageBlock(this.commandManager);
        this.infoPageBlock = new InfoPageBlock();
        this.lobbyPageBlock = new LobbyPageBlock();
        this.cashierPageBlock = new CashierPageBlock();
        this.tablesPage = new TablesPage(this.commandManager);
        this.seatsPage = new SeatPage(this.commandManager);

        this.authPopup = new AuthPopup();
        this.forgetPasswordPopup = new ForgetPasswordPopup();
        this.continueForgetPasswordPopup = new ContinueForgetPasswordPopup();
        this.changePasswordPopup = new ChangePasswordPopup();
        this.registrationPopup = new RegistrationPopup();
        this.simplePopup = new SimplePopup();
        this.okcancelPopup = new OkCancelPopup();
        this.customPopup = new CustomPopup();
        this.joinTablePopup = new JoinTablePopup();
        this.settingsPopup = new SettingsPopup();
        this.rulesPopup = new RulesPopup();
        this.sweepstakesRulesPopup = new SweepstakesRulesPopup();
        this.tableMenuPopup = new TableMenuPopup(this.tablesPage, this.commandManager, new AccountManager(), authManager);
        this.addMoneyPopup = new AddMoneyPopup();
        this.slowConnectionPopup = new SlowConnectionPopup();
        this.tableChatPopup = new ChatPopup();
        this.handHistoryPopup = new HandHistoryPopup();
        this.accountStatusPopup = new AccountStatusPopup();

        this.morePopup = new MorePopup();

        this.processing = ko.observable(false);

        this.popupClosed = new signals.Signal();
        this.registerCommands();
    }

    public bindPages() {
        this.bindSubPage("home", this.homePage);
        this.bindSubPage("tables", this.tablesPage);
        this.bindSubPage("seats", this.seatsPage);
        this.bindPopup("auth", this.authPopup);
        this.bindPopup("forgetPassword", this.forgetPasswordPopup);
        this.bindPopup("continueForgetPassword", this.continueForgetPasswordPopup);
        this.bindPopup("changePassword", this.changePasswordPopup);
        this.bindPopup("registration", this.registrationPopup);
        this.bindPopup("simple", this.simplePopup);
        this.bindPopup("okcancel", this.okcancelPopup);
        this.bindPopup("custom", this.customPopup);
        this.bindPopup("joinTable", this.joinTablePopup);
        this.bindPopup("settings", this.settingsPopup);
        this.bindPopup("rules", this.rulesPopup);
        this.bindPopup("sweepstakesRules", this.sweepstakesRulesPopup);
        this.bindPopup("tableMenu", this.tableMenuPopup);
        this.bindPopup("addMoney", this.addMoneyPopup);
        this.bindPopup("slowConnection", this.slowConnectionPopup);
        this.bindPopup("tableChat", this.tableChatPopup);
        this.bindPopup("handHistory", this.handHistoryPopup);
        this.bindPopup("accountStatus", this.accountStatusPopup);
        this.bindPopup("news", this.newsPopup);
        this.bindPopup("selectAvatar", this.selectAvatarPopup);
        this.bindPageBlock("lobby", this.lobbyPageBlock);
        this.bindPageBlock("other", this.otherPageBlock);
        this.bindPageBlock("cashier", this.cashierPageBlock);
        this.bindPageBlock("info", this.infoPageBlock);
        this.bindUIElement(".more-block", this.morePopup);
        this.mainSelector = new Selector();
        if (typeof window !== "undefined") {
            const mainSelectorElement = $(".page.main .sub-page.selector")[0];
            if (mainSelectorElement) {
                ko.applyBindings(this.mainSelector, mainSelectorElement);
            }
        }
        this.initializeTabbar();
        this.initializeConnection();
        // var progressBackgroundElement = $(".progress-background")[0];
        // ko.applyBindings(this, progressBackgroundElement);
        if (typeof window !== "undefined") {
            this.processing.subscribe(function (newValue) {
                if (newValue) {
                    $(".progress-background").show();
                }
                else {
                    $(".progress-background").hide();
                }
            });
        }
        // show startup page
        uiManager.showPage("initialization");
        if (typeof window !== "undefined") {
            const opts = {
                lines: 13,
                length: 4,
                width: 2,
                radius: 6,
                corners: 1,
                rotate: 0,
                direction: 1,
                color: "#fff",
                speed: 1,
                trail: 60,
                shadow: false,
                hwaccel: false,
                className: "spinner",
                zIndex: 2e9,
                top: "auto",
                left: "auto",
            };
            this.spinner = new Spinner(opts);
            const target = document.getElementById("spinner");
            this.spinner.spin(target);
            const progressTarget = document.getElementById("progress-spinner");
            this.progressSpinner = new Spinner(opts).spin(progressTarget);
        }
    }

    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // "load", "deviceready", "offline", and "online".
    public bindEvents() {
        deviceEvents.ready.add(this.onDeviceReady, this);
        deviceEvents.pause.add(this.onPause, this);
        deviceEvents.resume.add(this.onResume, this);
        deviceEvents.initialize();
        deviceEvents.ready.addOnce(function() {
            console.log("Device ready fired");
        });
    }
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicity call 'app.receivedEvent(...);'
    public onDeviceReady() {
        const device: Device = window.device;
        if (device != null && device.available) {
            if (device.platform.toLowerCase() === "ios") {
                if (device.version.toString().indexOf("7.0") === 0) {
                    StatusBar.overlaysWebView(false);
                    /* tslint:disable:no-string-literal */
                    ko.bindingHandlers["image"].options.enabled = false;
                    /* tslint:enable:no-string-literal */
                    runtimeSettings.setShowNewsAfterLogin(false);
                }
            }
        }

        if (platformInfo.hasMenu()) {
            app.setupMenu();
        }

        // Recalculate width of the landscape mode.
        const currentWidth = $("body").width();
        if (currentWidth === 1024) {
            platformInfo.isTablet = true;
        }

        pushService.register();

        tableManager.maxTablesReached.add(function(continuation: () => void) {
            SimplePopup.display(_("maxtables.caption"), _("maxtables.maxtablesreached"));
        });
        tableManager.hasTurn.subscribe(function(value: boolean) {
            app.tabBar.notice("tables", value);
        });
        app.popupClosed.add(function(popupName: string) {
            keyboardActivationService.forceHideKeyboard();
            console.log("Popup " + popupName + " closed");
        });
        app.receivedEvent("deviceready");
    }
    // Update DOM on a Received Event
    public async receivedEvent(id: string) {
        const self = this;
        timeService.start();
        settings.soundEnabled.subscribe(function(value) {
            const soundManager = getSoundManager();
            soundManager.enabled(value);
        });
        settings.loadSettings();
        settings.isGuest.subscribe(function(value) {
            if (authManager.authenticated() && !value) {
                app.lobbyPageBlock.lobbyPage.cashOptions.currency(1);
                app.lobbyPageBlock.lobbyPage.sngOptions.currency(1);
                app.lobbyPageBlock.lobbyPage.tournamentOptions.currency(1);
            } else {
                app.lobbyPageBlock.lobbyPage.cashOptions.currency(2);
                app.lobbyPageBlock.lobbyPage.sngOptions.currency(2);
                app.lobbyPageBlock.lobbyPage.tournamentOptions.currency(2);
            }
        });
        authManager.registerAuthenticationChangedHandler(function (value) {
            if (value && !settings.isGuest()) {
                app.lobbyPageBlock.lobbyPage.cashOptions.currency(1);
                app.lobbyPageBlock.lobbyPage.sngOptions.currency(1);
                app.lobbyPageBlock.lobbyPage.tournamentOptions.currency(1);
            } else {
                app.lobbyPageBlock.lobbyPage.cashOptions.currency(2);
                app.lobbyPageBlock.lobbyPage.sngOptions.currency(2);
                app.lobbyPageBlock.lobbyPage.tournamentOptions.currency(2);
            }
        });
        $.when(this.loadPromises).then(function() {
            keyboardActivationService.setup();
            self.setupTouchActivation();
        });
        this.setInitializationState();
        let startPage = "main";
        if (this.getParameterByName("restore") === "true") {
            const currentTime = new Date();
            const timeDiff = currentTime.valueOf() - settings.lastTime();
            if (timeDiff > 1000 * 60 * 20) {
                setAuthToken(null);
                startPage = "main";
            } else {
                setAuthToken(settings.authToken());
                startPage = settings.lastPage();
            }
        }

        this.logEvent("Received Event: " + id);
        if (window.innerWidth > 640) {
            PageBlock.useDoubleView = true;
            AnimationSettings.platform = "tablet";
        }

        this.setDesiredOrientation();

        if (platformInfo.isTablet) {
            orientationService.suppressRotation();
        }

        this.setupClosePopupOnClick();
        metadataManager.setFailed(() => {
            slowInternetService.onConnectionSlow();
            slowInternetService.onDisconnected();
            self.metadataUpdateFailed();
        });
        metadataManager.setReady(function() {
            // Adjust height
            const toolpadHeight = platformInfo.hasTabBar() ? 49 : 15;
            const logoHeight = 102;
            let noLogoHeight = 57;
            const pageHeaderHeight = 58;
            if (platformInfo.hasTabBar()) {
                $(".page.main").addClass("has-toolbar");
            }

            noLogoHeight = window.innerHeight - toolpadHeight - noLogoHeight - platformInfo.statusBarHeight();
            $(".popup-container.scroll-container").css("max-height", noLogoHeight);

            const device: Device = window.device;
            let tournamentLobbyAdjustment = 57;
            let lobbyAdjustment = 0;
            if (device != null && device.available) {
                if (device.platform.toLowerCase() === "ios") {
                    tournamentLobbyAdjustment = 57;
                } else {
                    tournamentLobbyAdjustment = 81;
                    lobbyAdjustment = -30;
                    if (platformInfo.hasMenu()) {
                        app.setupMenu();
                    }
                }
            }

            if (startPage === "main") {
                uiManager.showPage("main");
                self.showPageBlock("home");
                self.showSubPage("home");
            } else {
                app.showSubPage("tables");
                self.loadTablesAndTournaments(true);
            }

            tableManager.tables.subscribe(function(newValue: TableView[]) {
                self.updateTabbar(authManager.authenticated(), newValue);
                if (newValue && metadataManager.banners != null) {
                    const filteredBanners = metadataManager.banners
                        .filter((banner) => banner.Id > settings.lastBannerId())
                        .sort((a, b) => a.Id - b.Id);
                    if (filteredBanners.length > 0) {
                        const currentBanner = filteredBanners[0];
                        settings.lastBannerId(currentBanner.Id);
                        settings.saveSettings();
                        if (runtimeSettings.showNewsAfterLogin) {
                            app.newsPopup.setData(currentBanner);
                            app.showPopup("news");
                        }
                    }
                }
            });
            authManager.registerAuthenticationChangedHandler(function(newValue) {
                self.updateTabbar(newValue, tableManager.tables());

                // tslint:disable-next-line:no-console
                console.log("Authentication changed.");
                setTimeout(() => {
                    self.terminateConnection();
                    self.loadTablesAndTournaments(newValue);
                }, 100);
            });
        });

        slowInternetService.initialize();
        const hasInternet = slowInternetService.hasInternet();
        // tslint:disable-next-line:no-console
        console.log("Detecting internet status..." + hasInternet ? "connected" : "not connected");
        if (hasInternet) {
            slowInternetService.setRetryHandler(null);
            self.updateMetadataOnLaunch();
            self.hideSplash();
        } else {
            slowInternetService.onOffline();
            self.hideSplash();
            slowInternetService.setRetryHandler(() => self.updateMetadataOnLaunch());
        }
    }
    public setInitializationState() {
        const parentElement = document.getElementById("deviceready");
        if (parentElement) {
            const listeningElement = parentElement.querySelector(".listening");
            const receivedElement = parentElement.querySelector(".received");

            if (listeningElement) {
                listeningElement.setAttribute("style", "display:none;");
            }

            if (receivedElement) {
                receivedElement.setAttribute("style", "display:block;");
            }
        }
    }
    public buildStartConnection() {
        return connectionService.buildStartConnectionAsync();
    }
    public showSubPage(pageName: string) {
        this.hideMoreBlock();
        uiManager.showSubPage(pageName);
    }
    public showPageBlock(pageBlockName: string) {
        uiManager.showPageBlock(pageBlockName);
    }
    public showSelector(selectorCaption: string, options: SelectorItem[], success: (item: SelectorItem) => void) {
        const successCallback = (item: SelectorItem) => {
            $(".page .page-block." + uiManager.currentPageBlock).css("display", "block");
            $(".page .sub-page." + uiManager.currentPage).css("display", "block");
            $(".page .sub-page.selector").css("display", "none");
            success(item);
        };
        const cancelCallback = () => {
            $(".page .page-block." + uiManager.currentPageBlock).css("display", "block");
            $(".page .sub-page." + uiManager.currentPage).css("display", "block");
            $(".page .sub-page.selector").css("display", "none");
        };
        $(".page .page-block." + uiManager.currentPageBlock).css("display", "none");
        $(".page .sub-page." + uiManager.currentPage).css("display", "none");
        $(".page .sub-page.selector").css("display", "block");
        this.mainSelector.setParams(selectorCaption, options, successCallback, cancelCallback);
    }
    public bindPageBlock(pageBlockName: string, viewModel: PageBlock) {
        const self = this;
        this.commandManager.registerCommand("pageblock." + pageBlockName, async function showPageBlock() {
            const requireAuthentication = viewModel.requireAuthentication;
            if (!requireAuthentication) {
                if (!viewModel.requireGuestAuthentication) {
                    self.showPageBlock(pageBlockName);
                } else {
                    const value = await app.requireGuestAuthentication();
                    if (value.authenticated) {
                        self.showPageBlock(pageBlockName);
                    }
                }
            } else {
                const value = await app.requireAuthentication();
                if (value.authenticated) {
                    self.showPageBlock(pageBlockName);
                }
            }
        });

        for (let i = 0; i < viewModel.loadPromises.length; i++) {
            const item = viewModel.loadPromises[i];
            this.loadPromises.push(item);
        }
    }
    public bindSubPage(pageName: string, viewModel: any) {
        const self = this;
        this.commandManager.registerCommand("page." + pageName, async function showPage() {
            const requireAuthentication = viewModel.requireAuthentication || false;
            if (!requireAuthentication) {
                self.showSubPage(pageName);
            } else {
                const value = await app.requireAuthentication();
                if (value.authenticated) {
                    self.showSubPage(pageName);
                }
            }
        });

        if (typeof window === "undefined") {
            return;
        }

        const pagejElement = $(".page .sub-page." + pageName);
        if (pagejElement.length === 0) {
            console.error("Could not bind sub page " + pageName + " since DOM element not found.");
            return;
        }

        if (pagejElement.length > 1) {
            console.warn("Page " + pageName + " has more then one element to bind.");
            return;
        }

        const pageElement = pagejElement[0];
        if (!pageElement.hasChildNodes()) {
            const templateSource: string = pagejElement.data("template") as any;
            const pageLoadPromise = $.get(templateSource, "text/html").then(function(data: string) {
                pagejElement.html(data);
                try {
                    ko.applyBindings(viewModel, pageElement);
                } catch (e) {
                    console.log("Bind page " + pageName + " failed");
                }
            });
            this.loadPromises.push(pageLoadPromise);
            return;
        }

        ko.applyBindings(viewModel, pageElement);
    }
    public bindPopup(popup: string, viewModel: any): void {
        const self = this;
        this.commandManager.registerCommand("popup." + popup, function() {
            self.showPopup(popup);
        });
        if (typeof window === "undefined") {
            return;
        }

        const popupjElement = $(".popup." + popup);
        if (popupjElement.length === 0) {
            console.error("Could not bind popup " + popup + " since DOM element not found.");
            return;
        }

        if (popupjElement.length > 1) {
            console.warn("Popup " + popup + " has more then one element to bind.");
            return;
        }

        const popupElement = popupjElement[0];
        if (!popupElement.hasChildNodes()) {
            const templateSource: string = popupjElement.data("template") as any;
            $.get(templateSource, "text/html").then(function(data) {
                popupjElement.html(data);
                try {
                    ko.applyBindings(viewModel, popupElement);
                } catch (e) {
                    console.log("Bind popup " + popup + " failed");
                    console.log("Detailed exception: ", e);
                }
            });
            return;
        }

        ko.applyBindings(viewModel, popupElement);
    }
    public bindUIElement(className: string, viewModel: any): void {
        if (typeof window === "undefined") {
            return;
        }

        const uiElement = $(className);
        if (uiElement.length === 0) {
            console.error("Could not bind UI element with class " + className + " since DOM element not found.");
            return;
        }

        if (uiElement.length > 1) {
            console.warn("UI element with class " + className + " has more then one element.");
            return;
        }

        const domElement = uiElement[0];
        if (!domElement.hasChildNodes()) {
            const templateSource: string = uiElement.data("template") as any;
            $.get(templateSource, "text/html").then(function(data) {
                uiElement.html(data);
                try {
                    ko.applyBindings(viewModel, domElement);
                } catch (e) {
                    console.log("Bind UI element " + className + " failed");
                }
            });
            return;
        }

        ko.applyBindings(viewModel, domElement);
    }
    public async showPopup(popupName: string, ...args: any[]) {
        if (!popupName) {
            console.error("The empty popup passed");
            throw new Error("The empty popup passed");
        }

        if (this.currentPopup != null) {
            this.hideMoreBlock();
            this.closePopup();
        }

        this.currentPopup = popupName;
        console.log("Show popup " + popupName);
        const result = new Promise<PopupResult>((resolve) => {
            this.popupClosed.addOnce(function(name: string, dialogResults?: any) {
                if (popupName !== name) {
                    console.warn("Responding to popup " + name + " instead of " + popupName);
                }

                const signalData = {
                    name,
                    result: dialogResults,
                };
                resolve(signalData);
            }, this, 1);
            const popupObject = this[this.currentPopup + "Popup"];
            if (popupObject != null) {
                popupObject.shown(args);
            }

            if (typeof window !== "undefined") {
                const popupContainer = $(".popup." + popupName + " .popup-container");
                if (popupContainer.length > 0) {
                    popupContainer[0].scrollTop = 0;
                }

                $(".popup." + popupName).css("display", "block");
                $(".popup-background").css("display", "block");
            }
        });
        return result;
    }
    public closePopup(result?: any): void {
        if (this.currentPopup) {
            console.log("Close popup " + this.currentPopup);
            if (typeof window !== "undefined") {
                $(".popup." + this.currentPopup + " .popup-container")[0].scrollTop = 0;
                $(".popup." + this.currentPopup).css("display", "none");

                $(".popup-background").css("display", "none");
            }

            const popupName = this.currentPopup;
            const popupObject = this[this.currentPopup + "Popup"];
            /* tslint:disable:no-string-literal */
            if (popupObject !== undefined && popupObject["visible"] !== undefined) {
                popupObject.visible(false);
            }

            /* tslint:enable:no-string-literal */
            this.currentPopup = null;
            this.popupClosed.dispatch(popupName, result);
        }
    }
    public executeCommand(commandName: string, parameters: any[]= []) {
        this.commandManager.executeCommand(commandName, parameters);
    }
    public reloadApplication() {
        /* tslint:disable:no-unused-expression no-string-literal */
        window["StatusBar"] && StatusBar.show();
        /* tslint:enable:no-unused-expression no-string-literal */
        window.location.reload();
    }
    public shouldRotateToOrientation(interfaceOrientation: any) {
        /// Checks that given orientation currently supported
        /// For now this is works in iOS.
        type WorkerFunc = (intefaceOrientation: any) => boolean;
        const worker: WorkerFunc | undefined = ScreenOrientation["shouldRotateToOrientation"];
        if (worker) {
            return worker(interfaceOrientation);
        }

        return false;
    }
    public requireAuthentication(): Promise<LoginPromptResult> {
        if (!authManager.authenticated()) {
            return new Promise<LoginPromptResult>((resolve, reject) => {
                // We don't authenticated, so display authentication popup.
                this.popupClosed.addOnce(function() {
                    // Resolve with current authentication status, so
                    // caller would know operation was successful or not.
                    resolve({
                        authenticated: authManager.authenticated(),
                        wasAuthenticated: false,
                    });
                }, this, undefined);
                this.showPopup("auth");
            });
        } else {
            // We already authenticated, no need to show authentication popup.
            return Promise.resolve({
                authenticated: true,
                wasAuthenticated: true,
            });
        }
    }
    public async requireGuestAuthentication(): Promise<LoginPromptResult> {
        if (!authManager.authenticated()) {
            // We don't authenticated, so display authentication popup.
            const authenticate = await authManager.loginAsGuest();
            if (authenticate !== "Ok") {
                await SimplePopup.display(_("auth.guestPlay"), [_(`errors.${authenticate}`)]);
            }

            return {
                authenticated: authManager.authenticated(),
                wasAuthenticated: false,
            };
        } else {
            // We already authenticated, no need to show authentication popup.
            return {
                authenticated: true,
                wasAuthenticated: true,
            };
        }
    }
    public prompt(title: string, messages: string[], buttons: string[] | null = null) {
        if (buttons === null) {
            buttons = [_("common.ok"), _("common.cancel")];
        }

        this.showPopup("okcancel");
        const popupObject = this.okcancelPopup;
        const deferred = popupObject.deferred;
        popupObject.title(title);
        popupObject.messages(messages);
        popupObject.buttons(buttons);
        popupObject.customStyle("");
        return deferred;
    }
    public promptEx(title: string, messages: string[], buttons: string[], actions: Array<() => PromiseOrVoid>) {
        this.showPopup("custom");
        const popupObject = this.customPopup;
        const deferred = popupObject.deferred;
        popupObject.title(title);
        popupObject.messages(messages);
        popupObject.buttons(buttons);
        popupObject.actions(actions);
        return deferred;
    }

    public promptAsync(title: string, messages: string[], buttons: string[] | null = null) {
        return new Promise<boolean>((resolve, reject) => {
            this.prompt(title, messages, buttons).then(() => resolve(true), () => resolve(false));
        });
    }
    private initializeTabbar() {
        this.tabBar = new TabBar();
        this.tabBar.addItem("home", _("tabbar.home"), "home", function() {
            app.executeCommand("page.home");
            app.showPageBlock("home");
        });
        this.tabBar.addItem("lobby", _("tabbar.lobby"), "lobby", function() {
            app.lobbyPageBlock.showLobby();
        });
        this.tabBar.addItem("tables", _("tabbar.tables"), "tables", function() {
            const currentTable = app.tablesPage.currentTable();
            if (currentTable === null || currentTable.model === null) {
                console.warn("No tables opened. Could not open tables page");
                SimplePopup.display(_("menu.tables"), _("tablesList.noTablesSelected"));
                return;
            }

            if (currentTable.tableId === 0) {
                return;
            }

            app.executeCommand("app.selectTable", [currentTable.model]);
            app.showSubPage("tables");
        });
        this.tabBar.addItem("cashier", _("tabbar.cashier"), "cashier", function() {
            app.executeCommand("pageblock.cashier");
            // app.executeCommand("pageblock.other");
        });
        this.tabBar.addItem("more", _("tabbar.more"), "more", function() {
            const currentTabBarItem = UIManager.getTabBarItemForPage(uiManager.currentPageBlock);
            const isMoreSelected = app.tabBar.isSelected("more");
            const isMoreOpened = $("body").hasClass("more-opened");
            if (isMoreOpened) {
                app.tabBar.select("more", false);
                app.tabBar.select(currentTabBarItem, true);
                $(".more-block").hide();
                $("body").removeClass("more-opened");
            } else {
                app.tabBar.select(currentTabBarItem, false);
                app.tabBar.select("more", true);
                app.morePopup.update();
                $(".more-block").show();
                $("body").addClass("more-opened");
            }

            app.morePopup.visible(!app.morePopup.visible());
        });
        this.tabBar.enable("tables", false);

        if (typeof window !== "undefined") {
            const tabBarElement = $(".toolbar-container")[0];
            if (tabBarElement) {
                ko.applyBindings(this.tabBar, tabBarElement);
            }
        }

        uiManager.subPageHiding.add(function(blockHiding: string) {
            const name = UIManager.getTabBarItemForPage(blockHiding);
            app.tabBar.select(name, false);
        });
        uiManager.subPageShowing.add(function(blockShowing: string) {
            const name = UIManager.getTabBarItemForPage(blockShowing);
            app.tabBar.select(name, true);
        });
        uiManager.pageBlockHiding.add(function(blockHiding: string) {
            const name = UIManager.getTabBarItemForPage(blockHiding);
            app.tabBar.select(name, false);
        });
        uiManager.pageBlockShowing.add(function(blockShowing: string) {
            const name = UIManager.getTabBarItemForPage(blockShowing);
            app.tabBar.select(name, true);
        });
        uiManager.pageBlockHidden.add(function(pageBlock: string) {
            if (app.tabBar.isSelected("more")) {
                if (pageBlock !== "more" && !app.morePopup.visible()) {
                    app.tabBar.select("more", false);
                }

                app.hideMoreBlock();
            }
        });
    }
    private onResign() {
        const self = app;
        self.logEvent("Application resign active");
        // Wrap code in the timeout to prevent application from freezing.
        self.terminateConnection();
    }
    private onActive() {
        const self = app;
        self.logEvent("Application active");
        // Wrap code in the timeout to prevent application from freezing.
        self.establishConnection();
    }
    private onPause() {
        const self = app;
        const device: Device = window.device;
        if (platformInfo.isTablet) {
            orientationService.enableRotation();
        }

        if (platformInfo.reloadOnResume) {
            // Don't do anything if reloading on resume.
            if (uiManager.currentPage === "tables") {
                settings.lastPage("tables");
            } else {
                settings.lastPage("main");
            }

            settings.authToken(getAuthToken());
            settings.lastTime(new Date().valueOf());
            settings.saveSettings();
            return;
        }

        if (self.suppressResume) {
            return;
        }

        if (debugSettings.application.deactivateOnPause) {
            uiManager.deactivateSubPage(uiManager.currentPage);
        }

        self.logEvent("Pause application");
        // Wrap code in the timeout to prevent application from freezing.
        timeService.setTimeout(function() {
            self.logEvent("Pause application#2");
            self.showSplash();
            settings.saveSettings();
            if (self.currentPopup === "registration") {
                self.savedPopup = self.currentPopup;
            } else {
                self.savedPopup = null;
            }

            self.closePopup();
            timeService.printDebug();
        }, 0);
        timeService.stop();
        self.processing(false);
        self.spinner.stop();
        self.terminateConnection();
    }
    private onResume() {
        const self = app;
        const device: Device = window.device;
        if (platformInfo.reloadOnResume) {
            // Reload to the main page with special configuration parameter
            self.showSplash();
            location.replace(location.protocol + "//" + location.host + location.pathname + "?restore=true");
            return;
        }

        if (self.suppressResume) {
            self.suppressResume = false;

            if (self.savedPopup) {
                self.showPopup(self.savedPopup, true);
                self.savedPopup = null;
            }

            return;
        }

        self.logEvent("Resume application");
        timeService.start();
        self.showSplash();
        const target = document.getElementById("spinner");
        self.spinner.spin(target);
        let pageBeforeClosing = uiManager.effectivePageContainer;
        let pageBlockBeforeClosing = uiManager.currentPageBlock;
        let subPageBeforeClosing = uiManager.currentPage;
        if (pageBeforeClosing === "initialization" || pageBeforeClosing === null) {
            pageBeforeClosing = "main";
            pageBlockBeforeClosing = "home";
            subPageBeforeClosing = "home";
        }

        uiManager.showPage("initialization");
        settings.loadSettings();
        self.setInitializationState();
        orientationService.setLastOrientation();
        if (platformInfo.isTablet) {
            orientationService.suppressRotation();
        }

        if (slowInternetService.fatalError) {
            self.hideSplash();
            slowInternetService.showDuplicatedConnectionPopup();
            return;
        }

        if (slowInternetService.hasInternet()) {
            slowInternetService.closePopup();
            self.updateMetadataOnResume(pageBeforeClosing, pageBlockBeforeClosing, subPageBeforeClosing);
            slowInternetService.setRetryHandler(null);
            self.hideSplash();
        } else {
            slowInternetService.onOffline();
            self.hideSplash();
            slowInternetService.setRetryHandler(function() {
                self.updateMetadataOnResume(pageBeforeClosing, pageBlockBeforeClosing, subPageBeforeClosing);
            });
        }
    }
    private registerCommands() {
        this.commandManager.registerCommand("popup.auth.show", () => {
            this.showPopup("auth");
        });
        this.commandManager.registerCommand("popup.auth.forgetPassword", () => {
            this.showPopup("forgetPassword");
        });
        this.commandManager.registerCommand("popup.auth.registration", () => {
            this.showPopup("registration");
        });
        this.commandManager.registerCommand("popup.auth.continueForgetPassword", () => {
            this.showPopup("continueForgetPassword");
        });
        this.commandManager.registerCommand("popup.close", () => {
            this.closePopup();
        });
        this.commandManager.registerCommand("popup.cancel", () => {
            this.closePopup("cancel");
        });
        this.commandManager.registerCommand("more.close", () => {
            this.hideMoreBlock();
            const currentTabBarItem = UIManager.getTabBarItemForPage(uiManager.currentPageBlock);
            app.tabBar.select(currentTabBarItem, true);
        });
        this.commandManager.registerCommand("legal.eula", () => {
            app.closePopup();
            app.executeCommand("pageblock.info");
            app.infoPageBlock.showLicenseAgreement();
        });
        this.commandManager.registerCommand("logout", () => {
            authManager.logout();
        });
        this.commandManager.registerCommand("app.exit", () => {
            authManager.logout();
            this.reloadApplication();
        });
    }
    private async updateMetadataOnResume(lastPage: string, pageBlockBeforeClosing: string, subPageBeforeClosing: string) {
        const self = this;
        if (debugSettings.initialization.stopOnResume) {
            return;
        }

        console.log("Launch intialization of metadata on resume");
        if (!this.fullyInitialized) {
            console.log("Application was never initialized, performing full initialization.");
            await this.updateMetadataOnLaunch();
            return;
        }

        const failHandler = function() {
            console.log("Failed updating metadata on resume, rescheduling attempt.");
            slowInternetService.showReconnectFailedPopup();
            slowInternetService.setRetryHandler(() => {
                self.updateMetadataOnResume(lastPage, pageBlockBeforeClosing, subPageBeforeClosing);
            });
        };
        if (!await this.versionCheck()) {
            return;
        }

        this.preloadTableImages();
        try {
            await metadataManager.update();
            tableManager.initialize(this.commandManager);
            try {
                await tableManager.getCurrentTablesAndTournaments();
                this.spinner.stop();
                const wrapper = await self.establishConnection();
                if (wrapper.terminated) {
                    return;
                }

                this.logEvent("Showing last page");
                if (lastPage != null) {
                    if (!debugSettings.application.goToLobbyAfterPause) {
                        uiManager.showPage(lastPage);
                    } else {
                        uiManager.showPage("main");
                        if (lastPage === "table") {
                            uiManager.showPageBlock("lobby");
                            uiManager.showSubPage("lobby");
                        }
                    }
                } else {
                    uiManager.showPage("main");
                }

                if (debugSettings.application.deactivateOnPause) {
                    this.logEvent("Activating subpage");
                    uiManager.activateSubPage(uiManager.currentPage);
                }

                if (this.savedPopup) {
                    this.showPopup(this.savedPopup, true);
                    this.savedPopup = null;
                }

                orientationService.setLastOrientation();
                reloadManager.execute();
            } catch (e) {
                failHandler();
            }
        } catch (e) {
            failHandler();
        }
    }
    private async updateMetadataOnLaunch() {
        const self = this;
        if (debugSettings.initialization.stopOnLaunch) {
            return;
        }

        console.log("Launch intialization of metadata first time");
        const failHandler = function (e: Error) {
            if (e) {
                console.error(e);
            } else {
                console.error("Unknown error happens during updateMetadataOnLaunch. See log messages above to diagnose what happens.");
            }

            console.log("Failed updating metadata for first time, rescheduling attempt.");
            slowInternetService.setRetryHandler(() => {
                self.updateMetadataOnLaunch();
            });
        };
        if (!await this.versionCheck()) {
            return;
        }

        self.preloadTableImages();
        try {
            await metadataManager.update();
            self.spinner.stop();
            tableManager.initialize(this.commandManager);
            try {
                await self.establishConnection();
                await tableManager.getCurrentTablesAndTournaments();
                self.fullyInitialized = true;
                metadataManager.setReady(null);
            } catch (e) {
                console.log("Failed to initialize connection and get current tables and tournaments");
                failHandler(e);
            }
        } catch (e) {
            console.log("Failed to initialize tables.");
            failHandler(e);
        }
    }
    private async versionCheck() {
        try {
            await metadataManager.versionCheck();
            return true;
        } catch (e) {
            // Display dialog which prompts for the update.
            app.promptEx(_("updater.title"), [_("updater.line1")], [_("updater.button")], [() => {
                const websiteService = new WebsiteService(host);
                websiteService.navigateUpdateApk();
            }]);
            return false;
        }
    }
    private setupTouchActivation() {
        // This is a fix which updates binding for the knockout value binding.
        // This is nescessary since touchstart event start handling.
        $("body").on("keyup", "input", function(event) {
            $(this).trigger("change");
        });
        $("body").on("touchstart", ".button, .actionable", function(event) {
            $(this).addClass("pressed");
        }).on("touchend", ".button, .actionable", function(event) {
            $(this).removeClass("pressed");
        }).on("touchcancel", ".button, .actionable", function(event) {
            $(this).removeClass("pressed");
        });
    }
    private setupMenu() {
        menu.initialize([
            { id: 1, order: 1, name: _("menu.home") },
            { id: 2, order: 1, name: _("menu.lobby") },
            { id: 3, order: 1, name: _("menu.tables") },
            { id: 4, order: 1, name: _("menu.cashier") },
            { id: 5, order: 1, name: _("menu.account") },
            { id: 6, order: 1, name: _("menu.chat") },
            { id: 7, order: 1, name: _("menu.rating") },
            { id: 8, order: 1, name: _("menu.messages") },
            { id: 9, order: 1, name: _("menu.information") },
        ]);
        menu.optionItemClick = function(itemId) {
            if (itemId === 1) {
                app.executeCommand("page.home");
                app.showPageBlock("home");
            }
            if (itemId === 2) {
                app.lobbyPageBlock.showLobby();
            }
            if (itemId === 3) {
                app.executeCommand("page.tables");
            }
            if (itemId === 4) {
                app.executeCommand("pageblock.cashier");
            }
            if (itemId === 5) {
                app.executeCommand("page.account");
            }
            if (itemId === 6) {
                app.executeCommand("page.chat");
            }
            if (itemId === 7) {
                app.executeCommand("page.rating");
            }
            if (itemId === 8) {
                app.executeCommand("page.messages");
            }
            if (itemId === 9) {
                app.executeCommand("page.information");
            }
            console.log(itemId);
        };
    }
    private async loadTablesAndTournaments(authenticated: boolean) {
        const self = this;
        if (authenticated) {
            try {
                await tableManager.getCurrentTablesAndTournaments();
                self.establishConnection();
            } catch (e) {
                console.log("Could not get current tables!");
                slowInternetService.showReconnectFailedPopup();
            }
        } else {
            tableManager.clear();
            self.establishConnection();
        }
    }
    private setFailedState() {
        const parentElement = document.getElementById("deviceready");
        if (parentElement) {
            const listeningElement = parentElement.querySelector(".listening");
            const receivedElement = parentElement.querySelector(".received");

            receivedElement.setAttribute("style", "display:none;");
            const failedElement = parentElement.querySelector(".failed");
            failedElement.setAttribute("style", "display:block;");
        }
    }
    private metadataUpdateFailed() {
        this.setFailedState();
        console.log("Metadata retreiving failure");
    }
    private setDesiredOrientation() {
        if (!PageBlock.useDoubleView) {
            orientationService.setOrientation("portrait");
        } else {
            orientationService.setOrientation("landscape");
        }
    }
    private initializeConnection() {
        const self = this;
        // connectionService.initializeConnection();
        connectionService.recoverableError.add(function() {
            self.establishConnection();
        });
    }
    private terminateConnection(forceDisconnect = false) {
        tableManager.stopConnectingToTables();
        connectionService.terminateConnection(forceDisconnect);
    }
    private async establishConnection(maxAttempts = 3) {
        const self = this;
        // This part should be moved up to the stack to remove dependency on other services
        // in the connection management.
        connectionService.initializeConnection();
        const wrapper = await connectionService.establishConnectionAsync(maxAttempts);
        if (wrapper.terminated) {
            return wrapper;
        }

        self.logEvent("Setting up connection dependent services.");
        slowInternetService.manualDisconnect = false;
        tableManager.connectTables();
        tableManager.connectTournaments();
        const connection = wrapper.connection;
        try {
            self.logEvent("Joining lobby chat.");
            connection.Chat.server.join(0);
        } catch (error) {
            console.log(error);
            throw new Error("Could not join chat after establishingConnection");
        }

        self.logEvent("Listening lobby chat messages.");
        const chatHub = connection.createHubProxy("chat");
        chatHub.on("Message", function(...msg: any[]) {
            const messageId = msg[0];
            const tableId = msg[1];
            const type = msg[2];
            const sender = msg[3];
            const message = msg[4];
            if (tableId !== 0) {
                return;
            }

            if (type === "B") {
                broadcastService.displayMessage(message);
            }
        });

        return wrapper;
    }
    private hideMoreBlock() {
        app.morePopup.visible(false);
        $(".more-block").hide();
        $("body").removeClass("more-opened");
        app.tabBar.select("more", false);
    }

    private updateTabbar(authenticated: boolean, tables: TableView[]) {
        const self = this;
        if (authenticated) {
            const tablesEnabled = tables.length > 0;
            self.tabBar.enable("tables", tablesEnabled);
        } else {
            self.tabBar.enable("tables", false);
        }
    }
    private setupClosePopupOnClick() {
        $(".popup-background").on("tap", () => {
            if (app.currentPopup !== "slowConnection") {
                app.closePopup();
            }
        });
    }
    private preloadTableImages() {
        imagePreloadService.preloadResource("img/lobby/table2-empty");
        imagePreloadService.preloadResource("img/lobby/table2-s1");
        imagePreloadService.preloadResource("img/lobby/table2-s2");

        imagePreloadService.preloadResource("img/lobby/table6-empty");
        imagePreloadService.preloadResource("img/lobby/table6-s1");
        imagePreloadService.preloadResource("img/lobby/table6-s2");
        imagePreloadService.preloadResource("img/lobby/table6-s3");
        imagePreloadService.preloadResource("img/lobby/table6-s4");
        imagePreloadService.preloadResource("img/lobby/table6-s5");
        imagePreloadService.preloadResource("img/lobby/table6-s6");

        imagePreloadService.preloadResource("img/lobby/table10-empty");
        imagePreloadService.preloadResource("img/lobby/table10-s1");
        imagePreloadService.preloadResource("img/lobby/table10-s2");
        imagePreloadService.preloadResource("img/lobby/table10-s3");
        imagePreloadService.preloadResource("img/lobby/table10-s4");
        imagePreloadService.preloadResource("img/lobby/table10-s5");
        imagePreloadService.preloadResource("img/lobby/table10-s6");
        imagePreloadService.preloadResource("img/lobby/table10-s7");
        imagePreloadService.preloadResource("img/lobby/table10-s8");
        imagePreloadService.preloadResource("img/lobby/table10-s9");
        imagePreloadService.preloadResource("img/lobby/table10-s10");

        imagePreloadService.preloadDeviceSpecificResource("img/images/tableImages/poker_table");
    }
    private logEvent(message: string) {
        if (debugSettings.device.events) {
            console.log(message);
        }
    }
    private getParameterByName(name: string) {
        name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
        const regex = new RegExp("[\\?&]" + name + "=([^&#]*)");
        const results = regex.exec(location.search);
        return results == null
            ? ""
            : decodeURIComponent(results[1].replace(/\+/g, " "));
    }
    private showSplash() {
        /* tslint:disable:no-unused-expression no-string-literal */
        navigator["splashscreen"] && navigator.splashscreen.show();
        /* tslint:enable:no-unused-expression no-string-literal */
    }
    private hideSplash() {
        /* tslint:disable:no-unused-expression no-string-literal */
        navigator["splashscreen"] && navigator.splashscreen.hide();
        /* tslint:enable:no-unused-expression no-string-literal */
    }
}

declare var app: App;
