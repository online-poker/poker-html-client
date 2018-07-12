import * as $ from "jquery";
import ko = require("knockout");
import * as moment from "moment";
import { AnimationSettings } from "poker/table/animationsettings";
import { App } from "./app";
import { AppConfig, appConfig, overrideConfiguration } from "./appconfig";
import { registerBindings } from "./bindings";
import { registerComponents } from "./components/registration";
import { debugSettings } from "./debugsettings";
import { registerExtenders } from "./extenders";
import { _ } from "./languagemanager";
import { ActionBlock } from "./table/actionBlock";
import { exposeCardsConstants } from "./table/cardsHelper";
import { TableView } from "./table/tableview";
import { updateDefaultMessages } from "./validationConfiguration";

declare const host: string;

function isStandaloneSupported() {
    return ("standalone" in window.navigator);
}

function isRunningStandalone() {
    return (window.matchMedia("(display-mode: standalone)").matches
        // tslint:disable-next-line:no-string-literal
        || ("standalone" in window.navigator && window.navigator["standalone"] === true));
}

function configureBindings() {
    // tslint:disable:no-string-literal
    if (appConfig.ui.realMoneyCurrencySymbol) {
        ko.bindingHandlers["currencySymbol"].moneySymbol = appConfig.ui.realMoneyCurrencySymbol;
    }

    if (appConfig.ui.gameMoneySymbol) {
        ko.bindingHandlers["currencySymbol"].chipsSymbol = appConfig.ui.gameMoneySymbol;
    }

    const betHandler = ko.bindingHandlers["bet"];
    if (appConfig.ui.useShortMoneyRepresentationForBets) {
        betHandler.useShortMoneyRepresentationForBets = true;
    }

    if (appConfig.ui.minConvertibleToSIBetValue) {
        betHandler.minConvertibleValue = appConfig.ui.minConvertibleToSIBetValue;
    }

    if (appConfig.ui.moneyFractionalSeparator) {
        betHandler.moneyFractionalSeparator = appConfig.ui.moneyFractionalSeparator;
    }

    if (appConfig.ui.moneySeparator) {
        betHandler.moneySeparator = appConfig.ui.moneySeparator;
    }

    if (appConfig.ui.fractionalDigitsCount) {
        betHandler.fractionalDigitsCount = appConfig.ui.fractionalDigitsCount;
    }

    const numericTextHandler: any = ko.bindingHandlers["numericText"];
    numericTextHandler.defaultPositions = 0;
    if (appConfig.ui.moneySeparator) {
        numericTextHandler.separator = appConfig.ui.moneySeparator;
    }
}

function registerTableView() {
    window["TableView"] = TableView;
    window["ActionBlock"] = ActionBlock;
}

function bootstrap(localConfiguration?: Partial<AppConfig>, animationSettingsOverride?: Partial<AnimationSettings>) {
    overrideConfiguration(localConfiguration || {});
    AnimationSettings.setOverride(animationSettingsOverride || {});

    // tslint:disable:no-string-literal
    window["ko"] = ko;
    // tslint:enable:no-string-literal

    // Enable hammer events on whole document
    Hammer(document);

    registerBindings();
    configureBindings();
    registerExtenders();
    registerComponents();
    updateDefaultMessages();

    if (typeof host === "undefined") {
        // tslint:disable-next-line:no-console
        console.error("File environment.js is missing");
        return;
    }

    const baseUrl = host;
    const app = new App();
    app.bindPages();

    $.connection.hub.url = baseUrl + "/signalr";
    $.connection.hub.logging = false;
    // GameActionsQueue.waitDisabled = true;
    moment.locale("ru");

    // This function prevents the rotation from
    function shouldRotateToOrientation(interfaceOrientation: any) {
        return app.shouldRotateToOrientation(interfaceOrientation);
    }

    exposeCardsConstants();
    // tslint:disable:no-string-literal
    window["shouldRotateToOrientation"] = shouldRotateToOrientation;
    window["app"] = app;
    window["authToken"] = null;
    window["baseUrl"] = baseUrl;
    window["debugSettings"] = debugSettings;
    window["_"] = _;
    window["moment"] = moment;
    // tslint:enable:no-string-literal
    window.onerror = function (message, url, lineNumber, colno, error) {
        const errorMessage = "Error: " + message + " in " + url + " at line " + lineNumber;
        console.log(errorMessage);
        if (error != null) {
            console.log(error);
        }

        if (window.location.search.indexOf("debug") !== -1) {
            alert(errorMessage);
        }

        // tslint:disable-next-line:no-string-literal
        window["appInsights"].trackException(error, "window.onerror");
    };
    window.addEventListener("unhandledrejection", function (event: any) {
        console.log("Unhandled promise rejection");
        if (event) {
            console.error(event);
            // tslint:disable-next-line:no-string-literal
            window["appInsights"].trackException(event.reason, "Promise");
        } else {
            console.log("No promise rejection reason specified.");
        }
    });

    ko.onError = function (error) {
        console.log("Unhandled KO exception");
        if (error) {
            console.error(error);
            // tslint:disable-next-line:no-string-literal
            window["appInsights"].trackException(error, "Knockout");
        } else {
            console.log("No KO error specified.");
        }
    };
    app.bindEvents();
    // tslint:disable-next-line:no-string-literal
    if (window["cordova"] === undefined) {
        app.onDeviceReady();
        if (isStandaloneSupported() && !isRunningStandalone()) {
            // Show splash screen.
            $("#install_prompt").show();
        }
    }
}

export = {
    bootstrap,
    overrideConfiguration,
    configureBindings,
    registerTableView,
    registerBindings,
    registerComponents,
    registerExtenders,
};
