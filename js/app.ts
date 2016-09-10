/// <reference types="jquery" />
/// <reference path="debugsettings.ts" />
/// <reference path="appconfig.ts" />
/// <reference path="pages/homepage.ts" />
/// <reference path="pages/settingspage.ts" />
/// <reference path="pages/lobbypageblock.ts" />
/// <reference path="pages/cashierpageblock.ts" />
/// <reference path="pages/tablespage.ts" />
/// <reference path="pages/infopageblock.ts" />
/// <reference path="pages/otherpageblock.ts" />
/// <reference path="tabbar.ts" />
/// <reference path="metadatamanager.ts" />
/// <reference path="languagemanager.ts" />
/// <reference path="table/tablemanager.ts" />
/// <reference path="selector.ts" />
/// <reference path="popups/_allpopups.ts" />

/// <reference path="services/_allservices.ts" />

/// <reference path="popups/morepopup.ts" />
/// <reference path="commandmanager.ts" />
/// <reference path="platform.d.ts" />
/// <reference path="typings/cordova.d.ts" />
/// <reference path="typings/spin.d.ts" />
/// <reference path="typings/signalr.d.ts" />

import * as timeService from "./timeService";
import * as metadataManager from "./metadatamanager";
import { SimplePopup } from "./popups/simplepopup";
import * as authManager from "./authManager";
import { settings } from "./settings";
import * as broadcastService from "./services/broadcastservice";
import {
    slowInternetService,
    keyboardActivationService,
    connectionService,
    imagePreloadService,
    deviceEvents,
    reloadManager,
    soundManager
} from "./services";
import * as tableManager from "./table/tablemanager";
import {
    HomePage,
    LobbyPageBlock,
    CashierPageBlock,
    TablesPage,
    InfoPageBlock,
    OtherPageBlock,
    SeatPage
} from "./pages";
import {
    MorePopup,
    AccountStatusPopup,
    TableMenuPopup,
    SelectAvatarPopup,
    SlowConnectionPopup,
    RegistrationPopup,
    OkCancelPopup,
    NewsPopup,
    JoinTablePopup,
    HandHistoryPopup,
    ForgetPasswordPopup,
    CustomPopup,
    ContinueForgetPasswordPopup,
    ChangePasswordPopup,
    AddMoneyPopup,
    ChatPopup,
    AuthPopup
} from "./popups";
import { uiManager, UIManager } from "./services/uimanager";
import { TabBar } from "./tabbar";
import { debugSettings } from "./debugsettings";

export class App {
    currentPopup: string = null;
    homePage: HomePage;
    lobbyPageBlock: LobbyPageBlock;
    cashierPageBlock: CashierPageBlock;
    tablesPage: TablesPage;
    seatsPage: SeatPage;
    infoPageBlock: InfoPageBlock;
    otherPageBlock: OtherPageBlock;
    authPopup: AuthPopup;
    forgetPasswordPopup: ForgetPasswordPopup;
    continueForgetPasswordPopup: ContinueForgetPasswordPopup;
    changePasswordPopup: ChangePasswordPopup;
    registrationPopup: RegistrationPopup;
    simplePopup: SimplePopup;
    okcancelPopup: OkCancelPopup;
    customPopup: CustomPopup;
    joinTablePopup: JoinTablePopup;
    tableMenuPopup: TableMenuPopup;
    addMoneyPopup: AddMoneyPopup;
    slowConnectionPopup: SlowConnectionPopup;
    tableChatPopup: ChatPopup;
    handHistoryPopup: HandHistoryPopup;
    accountStatusPopup: AccountStatusPopup;
    newsPopup = new NewsPopup();
    selectAvatarPopup = new SelectAvatarPopup();

    morePopup: MorePopup;
    tabBar: TabBar;
    mainSelector: Selector;
    spinner: any;
    progressSpinner: any;
    processing: KnockoutObservable<boolean>;
    popupClosed: Signal;
    loadPromises: JQueryPromise<void>[];
    fullyInitialized: boolean;
    disconnected: boolean;
    suppressResume: boolean;
    private stopped = false;
    private savedPopup: string = null;

    constructor() {
        var self = this;

        this.loadPromises = [];
        // register pages.
        this.homePage = new HomePage();
        this.otherPageBlock = new OtherPageBlock();
        this.infoPageBlock = new InfoPageBlock();
        this.lobbyPageBlock = new LobbyPageBlock();
        this.cashierPageBlock = new CashierPageBlock();
        this.tablesPage = new TablesPage();
        this.seatsPage = new SeatPage();

        this.authPopup = new AuthPopup();
        this.forgetPasswordPopup = new ForgetPasswordPopup();
        this.continueForgetPasswordPopup = new ContinueForgetPasswordPopup();
        this.changePasswordPopup = new ChangePasswordPopup();
        this.registrationPopup = new RegistrationPopup();
        this.simplePopup = new SimplePopup();
        this.okcancelPopup = new OkCancelPopup();
        this.customPopup = new CustomPopup();
        this.joinTablePopup = new JoinTablePopup();
        this.tableMenuPopup = new TableMenuPopup();
        this.addMoneyPopup = new AddMoneyPopup();
        this.slowConnectionPopup = new SlowConnectionPopup();
        this.tableChatPopup = new ChatPopup();
        this.handHistoryPopup = new HandHistoryPopup();
        this.accountStatusPopup = new AccountStatusPopup();

        this.morePopup = new MorePopup();

        this.processing = ko.observable(false);

        this.bindSubPage("home", self.homePage);
        this.bindSubPage("tables", self.tablesPage);
        this.bindSubPage("seats", self.seatsPage);

        this.bindPopup("auth", self.authPopup);
        this.bindPopup("forgetPassword", self.forgetPasswordPopup);
        this.bindPopup("continueForgetPassword", self.continueForgetPasswordPopup);
        this.bindPopup("changePassword", self.changePasswordPopup);
        this.bindPopup("registration", self.registrationPopup);
        this.bindPopup("simple", self.simplePopup);
        this.bindPopup("okcancel", self.okcancelPopup);
        this.bindPopup("custom", self.customPopup);
        this.bindPopup("joinTable", self.joinTablePopup);
        this.bindPopup("tableMenu", self.tableMenuPopup);
        this.bindPopup("addMoney", self.addMoneyPopup);
        this.bindPopup("slowConnection", self.slowConnectionPopup);
        this.bindPopup("tableChat", self.tableChatPopup);
        this.bindPopup("handHistory", self.handHistoryPopup);
        this.bindPopup("accountStatus", self.accountStatusPopup);
        this.bindPopup("news", self.newsPopup);
        this.bindPopup("selectAvatar", self.selectAvatarPopup);

        this.bindPageBlock("lobby", this.lobbyPageBlock);
        this.bindPageBlock("other", this.otherPageBlock);
        this.bindPageBlock("cashier", this.cashierPageBlock);
        this.bindPageBlock("info", this.infoPageBlock);

        this.bindUIElement(".more-block", this.morePopup);

        this.mainSelector = new Selector();
        if (typeof window !== "undefined") {
			var mainSelectorElement = $(".page.main .sub-page.selector")[0];
			ko.applyBindings(this.mainSelector, mainSelectorElement);
		}

        this.initializeTabbar();
        this.initializeConnection();

        // var progressBackgroundElement = $(".progress-background")[0];
        // ko.applyBindings(this, progressBackgroundElement);
		if (typeof window !== "undefined") {
			this.processing.subscribe(function (newValue) {
				if (newValue) {
					$(".progress-background").show();
				} else {
					$(".progress-background").hide();
				}
			});
		}

        // show startup page
        uiManager.showPage("initialization");

		if (typeof window !== "undefined") {
			var opts = {
				lines: 13, // The number of lines to draw
				length: 4, // The length of each line
				width: 2, // The line thickness
				radius: 6, // The radius of the inner circle
				corners: 1, // Corner roundness (0..1)
				rotate: 0, // The rotation offset
				direction: 1, // 1: clockwise, -1: counterclockwise
				color: "#fff", // #rgb or #rrggbb or array of colors
				speed: 1, // Rounds per second
				trail: 60, // Afterglow percentage
				shadow: false, // Whether to render a shadow
				hwaccel: false, // Whether to use hardware acceleration
				className: "spinner", // The CSS class to assign to the spinner
				zIndex: 2e9, // The z-index (defaults to 2000000000)
				top: "auto", // Top position relative to parent in px
				left: "auto" // Left position relative to parent in px
			};
			this.spinner = new Spinner(opts);
			var target = document.getElementById("spinner");
			this.spinner.spin(target);
			var progressTarget = document.getElementById("progress-spinner");
			this.progressSpinner = new Spinner(opts).spin(progressTarget);
		}

        this.popupClosed = new signals.Signal();
    }
    initializeTabbar() {
        this.tabBar = new TabBar();
        this.tabBar.addItem("home", _("tabbar.home"), "home", function () {
            app.executeCommand("page.home");
            app.showPageBlock("home");
        });
        this.tabBar.addItem("lobby", _("tabbar.lobby"), "lobby", function () {
            app.lobbyPageBlock.showLobby();
        });
        this.tabBar.addItem("tables", _("tabbar.tables"), "tables", function () {
            var currentTable = app.tablesPage.currentTable();
            if (currentTable === null || currentTable.model === null) {
                console.warn("No tables opened. Could not open tables page");
				SimplePopup.display(_("menu.tables"), _("tablesList.noTablesSelected"));
                return;
            }

            app.executeCommand("app.selectTable", [currentTable.model]);
            app.showSubPage("tables");
        });
        this.tabBar.addItem("cashier", _("tabbar.cashier"), "cashier", function () {
            app.executeCommand("pageblock.cashier");
            //app.executeCommand("pageblock.other");
        });
        this.tabBar.addItem("more", _("tabbar.more"), "more", function () {
            var currentTabBarItem = UIManager.getTabBarItemForPage(uiManager.currentPageBlock);
            var isMoreSelected = app.tabBar.isSelected("more");
            var isMoreOpened = $("body").hasClass("more-opened");
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
			var tabBarElement = $(".toolbar-container")[0];
			ko.applyBindings(this.tabBar, tabBarElement);
		}

        uiManager.subPageHiding.add(function (blockHiding: string) {
            var name = UIManager.getTabBarItemForPage(blockHiding);
            app.tabBar.select(name, false);
        });
        uiManager.subPageShowing.add(function (blockShowing: string) {
            var name = UIManager.getTabBarItemForPage(blockShowing);
            app.tabBar.select(name, true);
        });
        uiManager.pageBlockHiding.add(function (blockHiding: string) {
            var name = UIManager.getTabBarItemForPage(blockHiding);
            app.tabBar.select(name, false);
        });
        uiManager.pageBlockShowing.add(function (blockShowing: string) {
            var name = UIManager.getTabBarItemForPage(blockShowing);
            app.tabBar.select(name, true);
        });
        uiManager.pageBlockHidden.add(function (pageBlock: string) {
            if (app.tabBar.isSelected("more")) {
                if (pageBlock !== "more" && !app.morePopup.visible()) {
                    app.tabBar.select("more", false);
    }

                app.hideMoreBlock();
            }
        });
    }
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // "load", "deviceready", "offline", and "online".
    bindEvents() {
        document.addEventListener("deviceready", this.onDeviceReady, false);
        if (debugSettings.ios.hasMultitasking) {
            document.addEventListener("resign", this.onResign, false);
            document.addEventListener("active", this.onActive, false);
        }

        document.addEventListener("pause", this.onPause, false);
        document.addEventListener("resume", this.onResume, false);
        deviceEvents.initialize();
    }
    onResign() {
        var self = app;
        self.logEvent("Application resign active");
        // Wrap code in the timeout to prevent application from freezing.
        self.terminateConnection();
    }
    onActive() {
        var self = app;
        self.logEvent("Application active");
        // Wrap code in the timeout to prevent application from freezing.
        self.establishConnection();
    }
    onPause() {
        var self = app;
        var device: Device = window.device;
        if (platformInfo.isTablet) {
            orientationService.disableRotation = false;
        }

        if (platformInfo.reloadOnResume) {
            // Don't do anything if reloading on resume.
            if (uiManager.currentPage === "tables") {
                settings.lastPage("tables");
            } else {
                settings.lastPage("main");
            }

            settings.authToken(authToken);
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
        timeService.setTimeout(function () {
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
    onResume() {
        var self = app;
        var device: Device = window.device;
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
        var target = document.getElementById("spinner");
        self.spinner.spin(target);
        var pageBeforeClosing = uiManager.effectivePageContainer;
        var pageBlockBeforeClosing = uiManager.currentPageBlock;
        var subPageBeforeClosing = uiManager.currentPage;
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
            orientationService.disableRotation = true;
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
            slowInternetService.setRetryHandler(function () {
				self.updateMetadataOnResume(pageBeforeClosing, pageBlockBeforeClosing, subPageBeforeClosing);
			});
        }
    }
    updateMetadataOnResume(lastPage, pageBlockBeforeClosing, subPageBeforeClosing) {
        var self = this;
        if (debugSettings.initialization.stopOnResume) {
            return;
        }

        console.log("Launch intialization of metadata on resume");
        if (!this.fullyInitialized) {
            console.log("Application was never initialized, performing full initialization.");
            this.updateMetadataOnLaunch();
            return;
        }

        var failHandler = function () {
            console.log("Failed updating metadata on resume, rescheduling attempt.");
            slowInternetService.showReconnectFailedPopup();
            slowInternetService.setRetryHandler(() => {
                self.updateMetadataOnResume(lastPage, pageBlockBeforeClosing, subPageBeforeClosing);
            });
        };
        var successPath = () => {
            self.preloadTableImages();
            metadataManager.update().done(function () {
                tableManager.initialize();
                tableManager.getCurrentTablesAndTournaments().done(function () {
                    self.spinner.stop();
                    self.establishConnection().then(function (wrapper) {
                        if (wrapper.terminated) {
                            return;
                        }

                        self.logEvent("Showing last page");
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
                            self.logEvent("Activating subpage");
                            uiManager.activateSubPage(uiManager.currentPage);
                        }

                        if (self.savedPopup) {
                            self.showPopup(self.savedPopup, true);
                            self.savedPopup = null;
                        }

                        orientationService.setLastOrientation();
                        reloadManager.execute();
                    });
                }).fail(failHandler);
            }).fail(failHandler);
        };
        this.versionCheck(successPath);
    }
    updateMetadataOnLaunch() {
        var self = this;
        if (debugSettings.initialization.stopOnLaunch) {
            return;
        }

        console.log("Launch intialization of metadata first time");
        var failHandler = function () {
            console.log("Failed updating metadata for first time, rescheduling attempt.");
            slowInternetService.setRetryHandler(() => {
                self.updateMetadataOnLaunch();
            });
        };
        var successPath = () => {
            self.preloadTableImages();
            metadataManager.update().done(function () {
                self.spinner.stop();
                tableManager.initialize();
                tableManager.getCurrentTablesAndTournaments().done(function () {
                    self.establishConnection();
                    self.fullyInitialized = true;
                    metadataManager.setReady(null);
                }).fail(failHandler);
            }).fail(failHandler);
        };
        this.versionCheck(successPath);
    }
    versionCheck(successPath: () => void) {
        metadataManager.versionCheck().done(() => {
            successPath();
        }).fail((couldWork: boolean) => {
            // Display dialog which prompts for the update.
            app.promptEx(_("updater.title"), [_("updater.line1")], [_("updater.button")], [() => {
                websiteService.navigateUpdateApk();
            }]);
        });
    }
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicity call 'app.receivedEvent(...);'
    onDeviceReady() {
        var device: Device = window.device;
        if (device != null && device.available) {
            if (device.platform.toLowerCase() === "ios") {
                if (device.version.toString().indexOf("7.0") === 0) {
                    StatusBar.overlaysWebView(false);
					/* tslint:disable:no-string-literal */
                    ko.bindingHandlers["image"].options.enabled = false;
					/* tslint:enable:no-string-literal */
                    runtimeSettings.showNewsAfterLogin = false;
                }
            }
        }

        if (platformInfo.hasMenu()) {
            app.setupMenu();
        }

        // Recalculate width of the landscape mode.
        var currentWidth = $("body").width();
        if (currentWidth == 1024) {
            platformInfo.isTablet = true;
        }

        app.tablesPage.calculateLandscapeWidth();
        pushService.register();

        tableManager.maxTablesReached.add(function (continuation) {
            SimplePopup.display(_("maxtables.caption"), _("maxtables.maxtablesreached"));
        });
        tableManager.hasTurn.subscribe(function (value) {
            app.tabBar.notice("tables", value);
        });
        app.popupClosed.add(function (popupName) {
            keyboardActivationService.forceHideKeyboard();
            console.log("Popup " + popupName + " closed");
        });
        app.receivedEvent("deviceready");
    }
    setupTouchActivation() {
        // This is a fix which updates binding for the knockout value binding.
        // This is nescessary since touchstart event start handling.
        $("body").on("keyup", "input", function (event) {
            $(this).trigger("change");
        });
        $("body").on("touchstart", ".button, .actionable", function (event) {
            $(this).addClass("pressed");
        }).on("touchend", ".button, .actionable", function (event) {
                $(this).removeClass("pressed");
        }).on("touchcancel", ".button, .actionable", function (event) {
                $(this).removeClass("pressed");
            });
    }
    setupMenu() {
        var self = this;
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
        menu.optionItemClick = function (itemId) {
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
    // Update DOM on a Received Event
    receivedEvent(id) {
        var self = this;
        timeService.start();
        settings.soundEnabled.subscribe(function (value) {
            soundManager.enabled(value);
        });
        settings.loadSettings();
		settings.isGuest.subscribe(function (value) {
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
		authManager.authenticated.subscribe(function (value) {
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
        $.when(this.loadPromises).done(function () {
            keyboardActivationService.setup();
            self.setupTouchActivation();
        });
        this.setInitializationState();
        var startPage = "main";
        if (this.getParameterByName("restore") === "true") {
            var currentTime = new Date();
            var timeDiff = currentTime.valueOf() - settings.lastTime();
            if (timeDiff > 1000 * 60 * 20) {
                authToken = null;
                startPage = "main";
            } else {
                authToken = settings.authToken();
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
            orientationService.disableRotation = true;
        }

        this.setupClosePopupOnClick();
        metadataManager.setFailed(() => {
            slowInternetService.onConnectionSlow();
            slowInternetService.onDisconnected();
            self.metadataUpdateFailed();
        });
        metadataManager.setReady(function () {
            // Adjust height
            var toolpadHeight = platformInfo.hasTabBar() ? 49 : 15;
            var logoHeight = 102;
            var noLogoHeight = 57;
            var pageHeaderHeight = 58;
            if (platformInfo.hasTabBar()) {
                $(".page.main").addClass("has-toolbar");
            }

            noLogoHeight = window.innerHeight - toolpadHeight - noLogoHeight - platformInfo.statusBarHeight();
            $(".popup-container.scroll-container").css("max-height", noLogoHeight);

            var device: Device = window.device;
            var tournamentLobbyAdjustment = 57;
            var lobbyAdjustment = 0;
            if (device != null && device.available) {
                if (device.platform.toLowerCase() === "ios") {
                    tournamentLobbyAdjustment = 57;
                } else {
                    tournamentLobbyAdjustment = 81;
                    lobbyAdjustment = -30;
                    app.setupMenu();
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

            tableManager.tables.subscribe(function (newValue) {
                self.updateTabbar(authManager.authenticated(), newValue);
            });
            authManager.authenticated.subscribe(function (newValue) {
                self.updateTabbar(newValue, tableManager.tables());
                if (newValue && metadataManager.banners != null) {
                    var filteredBanners = metadataManager.banners.filter(_ => _.Id > settings.lastBannerId()).sort((a, b) => a.Id - b.Id);
                    if (filteredBanners.length > 0) {
                        var currentBanner = filteredBanners[0];
                        settings.lastBannerId(currentBanner.Id);
                        settings.saveSettings();
                        if (runtimeSettings.showNewsAfterLogin) {
                            app.newsPopup.setData(currentBanner);
                            app.showPopup("news");
                        }
                    }
                }

                console.log("Authentication changed.");
                self.terminateConnection();
                self.loadTablesAndTournaments(newValue);
            });
        });

        slowInternetService.initialize();
        var hasInternet = slowInternetService.hasInternet();
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
    loadTablesAndTournaments(authenticated: boolean) {
        var self = this;
        if (authenticated) {
            tableManager.getCurrentTablesAndTournaments().done(function () {
                self.establishConnection();
            }).fail(function () {
                    console.log("Could not get current tables!");
                    slowInternetService.showReconnectFailedPopup();
                });
        } else {
            tableManager.clear();
            self.establishConnection();
        }
    }
    setInitializationState() {
        var parentElement = document.getElementById("deviceready");
        var listeningElement = parentElement.querySelector(".listening");
        var receivedElement = parentElement.querySelector(".received");

        listeningElement.setAttribute("style", "display:none;");
        receivedElement.setAttribute("style", "display:block;");
    }
    setFailedState() {
        var parentElement = document.getElementById("deviceready");
        var listeningElement = parentElement.querySelector(".listening");
        var receivedElement = parentElement.querySelector(".received");

        receivedElement.setAttribute("style", "display:none;");
        var failedElement = parentElement.querySelector(".failed");
        failedElement.setAttribute("style", "display:block;");
    }
    metadataUpdateFailed() {
        this.setFailedState();
        console.log("Metadata retreiving failure");
    }
    setDesiredOrientation() {
        if (!PageBlock.useDoubleView) {
            orientationService.setOrientation("portrait");
        } else {
            orientationService.setOrientation("landscape");
        }
    }
    initializeConnection() {
        var self = this;
        //connectionService.initializeConnection();
        connectionService.recoverableError.add(function () {
            self.establishConnection();
        });
    }
    terminateConnection(forceDisconnect = false) {
        tableManager.stopConnectingToTables();
        connectionService.terminateConnection(forceDisconnect);
    }
    establishConnection(maxAttempts = 3) {
        var self = this;
        // This part should be moved up to the stack to remove dependency on other services 
        // in the connection management.
        connectionService.initializeConnection();
        return connectionService.establishConnection(maxAttempts).then(function (wrapper) {
            if (wrapper.terminated) {
                return wrapper;
            }

            self.logEvent("Setting up connection dependent services.");
            slowInternetService.manualDisconnect = false;
            tableManager.connectTables();
            tableManager.connectTournaments();
            var connection = wrapper.connection;
            try {
                self.logEvent("Joining lobby chat.");
                connection.Chat.server.join(0);
            } catch (error) {
                console.log(error);
                throw new Error("Could not join chat after establishingConnection");
            }

            self.logEvent("Listening lobby chat messages.");
            var chatHub = connection.createHubProxy("chat");
            chatHub.on("Message", function (...msg: any[]) {
                var messageId = msg[0];
                var tableId = msg[1];
                var type = msg[2];
                var sender = msg[3];
                var message = msg[4];
                if (tableId !== 0) {
                    return;
                }

                if (type === "B") {
                    broadcastService.displayMessage(message);
                }
            });

            return wrapper;
        });
    }
    buildStartConnection() {
        return connectionService.buildStartConnection();
    }
    updateTabbar(authenticated, tables) {
        var self = this;
        if (authenticated) {
            var tablesEnabled = tables.length > 0;
            self.tabBar.enable("tables", tablesEnabled);
        } else {
            self.tabBar.enable("tables", false);
        }
    }
    showSubPage(pageName: string) {
        this.hideMoreBlock();
        uiManager.showSubPage(pageName);
    }
    showPageBlock(pageBlockName: string) {
        uiManager.showPageBlock(pageBlockName);
    }
    static addTabBarItemMapping(tabBarItem: string, pageName: string) {
        UIManager.addTabBarItemMapping(tabBarItem, pageName);
    }
    showSelector(selectorCaption: string, options: SelectorItem[], success: Function) {
        var self = this;
        var successCallback = (item: SelectorItem) => {
            $(".page .page-block." + uiManager.currentPageBlock).css("display", "block");
            $(".page .sub-page." + uiManager.currentPage).css("display", "block");
            $(".page .sub-page.selector").css("display", "none");
            success(item);
        };
        var cancelCallback = (item: SelectorItem) => {
            $(".page .page-block." + uiManager.currentPageBlock).css("display", "block");
			$(".page .sub-page." + uiManager.currentPage).css("display", "block");
            $(".page .sub-page.selector").css("display", "none");
        };
        $(".page .page-block." + uiManager.currentPageBlock).css("display", "none");
        $(".page .sub-page." + uiManager.currentPage).css("display", "none");
        $(".page .sub-page.selector").css("display", "block");
        this.mainSelector.setParams(selectorCaption, options, successCallback, cancelCallback);
    }
    bindPageBlock(pageBlockName: string, viewModel: PageBlock) {
        var self = this;
        commandManager.registerCommand("pageblock." + pageBlockName, function () {
            var requireAuthentication = viewModel.requireAuthentication;
            if (!requireAuthentication) {
                if (!viewModel.requireGuestAuthentication) {
                    self.showPageBlock(pageBlockName);
                } else {
                    app.requireGuestAuthentication().done(function (value) {
                        if (value) {
                            self.showPageBlock(pageBlockName);
                        }
                    });
                }
            } else {
                app.requireAuthentication().done(function (value) {
                    if (value) {
                        self.showPageBlock(pageBlockName);
                    }
                });
            }
        });

        for (var i = 0; i < viewModel.loadPromises.length; i++) {
			var item = viewModel.loadPromises[i];
            this.loadPromises.push(item);
        }
    }
    bindSubPage(pageName: string, viewModel: any) {
        var self = this;
        commandManager.registerCommand("page." + pageName, function () {
            var requireAuthentication = viewModel.requireAuthentication || false;
            if (!requireAuthentication) {
                self.showSubPage(pageName);
            } else {
                app.requireAuthentication().done(function (value) {
                    if (value) {
                        self.showSubPage(pageName);
                    }
                });
            }
        });

        if (typeof window === "undefined") {
			return;
		}

        var pagejElement = $(".page .sub-page." + pageName);
        if (pagejElement.length === 0) {
            console.error("Could not bind sub page " + pageName + " since DOM element not found.");
            return;
        }

        if (pagejElement.length > 1) {
            console.warn("Page " + pageName + " has more then one element to bind.");
            return;
        }

        var pageElement = pagejElement[0];
        if (!pageElement.hasChildNodes()) {
            var templateSource: string = <any>pagejElement.data("template");
            var pageLoadPromise = $.get(templateSource, "text/html").then(function (data: string) {
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
    bindPopup(popup: string, viewModel: any): void {
        var self = this;
        commandManager.registerCommand("popup." + popup, function () {
            self.showPopup(popup);
        });
        if (typeof window === "undefined") {
			return;
		}

        var popupjElement = $(".popup." + popup);
        if (popupjElement.length === 0) {
            console.error("Could not bind popup " + popup + " since DOM element not found.");
            return;
        }

        if (popupjElement.length > 1) {
            console.warn("Popup " + popup + " has more then one element to bind.");
            return;
        }

        var popupElement = popupjElement[0];
        if (!popupElement.hasChildNodes()) {
            var templateSource : string = <any>popupjElement.data("template");
            $.get(templateSource, "text/html").then(function (data) {
                popupjElement.html(data);
                try {
                    ko.applyBindings(viewModel, popupElement);
                } catch (e) {
                    console.log("Bind popup " + popup + " failed");
                }
            });
            return;
        }

        ko.applyBindings(viewModel, popupElement);
    }
    bindUIElement(className: string, viewModel: any): void {
        var self = this;
        if (typeof window === "undefined") {
			return;
		}

        var uiElement = $(className);
        if (uiElement.length === 0) {
            console.error("Could not bind UI element with class " + className + " since DOM element not found.");
            return;
        }

        if (uiElement.length > 1) {
            console.warn("UI element with class " + className + " has more then one element.");
            return;
        }

        var domElement = uiElement[0];
        if (!domElement.hasChildNodes()) {
            var templateSource: string = <any>uiElement.data("template");
            $.get(templateSource, "text/html").then(function (data) {
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
    showPopup(popupName: string, ...args: any[]): JQueryDeferred<PopupResult> {
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
        var result = $.Deferred<PopupResult>();
        this.popupClosed.addOnce(function (name: string, dialogResults?: any) {
            if (popupName !== name) {
                console.warn("Responding to popup " + name + " instead of " + popupName);
            }

            var signalData = {
                name: name,
                result: dialogResults
            };
            result.resolve(signalData);
        }, this, 1);
        var popupObject = this[this.currentPopup + "Popup"];
        if (popupObject != null) {
            popupObject.shown(args);
        }

        if (typeof window !== "undefined") {
			var popupContainer = $(".popup." + popupName + " .popup-container");
			if (popupContainer.length > 0) {
				popupContainer[0].scrollTop = 0;
			}

			$(".popup." + popupName).css("display", "block");
			$(".popup-background").css("display", "block");
		}

        return result;
    }
    closePopup(result?: any): void {
        if (this.currentPopup) {
            console.log("Close popup " + this.currentPopup);
			if (typeof window !== "undefined") {
				$(".popup." + this.currentPopup + " .popup-container")[0].scrollTop = 0;
				$(".popup." + this.currentPopup).css("display", "none");

				$(".popup-background").css("display", "none");
			}

            var popupName = this.currentPopup;
            var popupObject = this[this.currentPopup + "Popup"];
			/* tslint:disable:no-string-literal */
            if (popupObject !== undefined && popupObject["visible"] !== undefined) {
                popupObject.visible(false);
            }

			/* tslint:enable:no-string-literal */
            this.currentPopup = null;
            this.popupClosed.dispatch(popupName, result);
        }
    }
    executeCommand(commandName: string, parameters: any[]= []) {
        if (commandName === "popup.auth.show") {
            this.showPopup("auth");
            return;
        }

        if (commandName === "popup.auth.forgetPassword") {
            this.showPopup("forgetPassword");
            return;
        }

        if (commandName === "popup.auth.registration") {
            this.showPopup("registration");
            return;
        }

        if (commandName === "popup.auth.continueForgetPassword") {
            this.showPopup("continueForgetPassword");
            return;
        }

        if (commandName === "popup.close") {
            this.closePopup();
            return;
        }

        if (commandName === "legal.eula") {
            app.closePopup();
            app.executeCommand("pageblock.info");
            app.infoPageBlock.showLicenseAgreement();
            return;
        }

        if (commandName === "popup.cancel") {
            this.closePopup("cancel");
            return;
        }

        if (commandName === "more.close") {
            this.hideMoreBlock();
            var currentTabBarItem = UIManager.getTabBarItemForPage(uiManager.currentPageBlock);
            app.tabBar.select(currentTabBarItem, true);
            return;
        }

        if (commandName === "logout") {
            authManager.logout();
            return;
        }

        if (commandName === "app.exit") {
            authManager.logout();
            this.reloadApplication();
            return;
        }

        commandManager.executeCommand(commandName, parameters);
    }
    reloadApplication() {
		/* tslint:disable:no-unused-expression no-string-literal */
        window["StatusBar"] && StatusBar.show();
		/* tslint:enable:no-unused-expression no-string-literal */
        window.location.reload();
    }
    shouldRotateToOrientation(interfaceOrientation: any) {
        /// Checks that given orientation currently supported
        /// For now this is works in iOS.
        return ScreenOrientation.shouldRotateToOrientation(interfaceOrientation);
    }
    hideMoreBlock() {
        app.morePopup.visible(false);
        $(".more-block").hide();
        $("body").removeClass("more-opened");
        app.tabBar.select("more", false);
    }
    requireAuthentication(): JQueryPromise<boolean> {
        var self = this;
        var result = $.Deferred();
        if (!authManager.authenticated()) {
            // We don't authenticated, so display authentication popup.
            this.popupClosed.addOnce(function () {
                // Resolve with current authentication status, so 
                // caller would know operation was successful or not.
                result.resolve(authManager.authenticated(), false);
            }, this, null);
            this.showPopup("auth");
        } else {
            // We already authenticated, no need to show authentication popup.
            result.resolve(true, true);
        }

        return result;
    }
    requireGuestAuthentication(): JQueryPromise<boolean> {
        var self = this;
        var result = $.Deferred();
        if (!authManager.authenticated()) {
            // We don't authenticated, so display authentication popup.
            authManager.loginAsGuest().then(function (status) {
                result.resolve(authManager.authenticated(), false);
            });
        } else {
            // We already authenticated, no need to show authentication popup.
            result.resolve(true, true);
        }

        return result;
    }
    prompt(title: string, messages: string[], buttons: string[]= null) {
        if (buttons === null) {
            buttons = [_("common.ok"), _("common.cancel")];
        }

        this.showPopup("okcancel");
        var popupObject = this.okcancelPopup;
        var deferred = popupObject.deferred;
        popupObject.title(title);
        popupObject.messages(messages);
        popupObject.buttons(buttons);
        popupObject.customStyle("");
        return deferred;
    }
    promptEx(title: string, messages: string[], buttons: string[], actions: Function[]) {
        this.showPopup("custom");
        var popupObject = this.customPopup;
        var deferred = popupObject.deferred;
        popupObject.title(title);
        popupObject.messages(messages);
        popupObject.buttons(buttons);
        popupObject.actions(actions);
        return deferred;
    }

    private setupClosePopupOnClick() {
        $(".popup-background").on("tap", () => {
            app.closePopup();
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
    private getParameterByName(name) {
        name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
        var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
            results = regex.exec(location.search);
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
