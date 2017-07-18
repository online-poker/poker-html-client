import ko = require("knockout");
import { App } from "./app";
import { registerBindings } from "./bindings";
import { registerComponents } from "./components/registration";
import { debugSettings } from "./debugsettings";
import { registerExtenders } from "./extenders";
import { _ } from "./languagemanager";
import { ActionBlock } from "./table/actionBlock";
import { TableView } from "./table/tableview";
import { updateDefaultMessages } from "./validationConfiguration";
// import { ChipItem } from "./table/chipItem";

declare const host: string;
declare const appInsights: Client;

function isStandaloneSupported() {
    return ("standalone" in window.navigator);
}

function isRunningStandalone() {
    return (window.matchMedia("(display-mode: standalone)").matches
        // tslint:disable-next-line:no-string-literal
        || ("standalone" in window.navigator && window.navigator["standalone"] === true));
}

function bootstrap() {
    if (typeof host === "undefined") {
        // tslint:disable-next-line:no-console
        console.error("File environment.js is missing");
        return;
    }

    const baseUrl = host;
    const apiHost = baseUrl + "/api/rest/v1";
    const app = new App();

    $.connection.hub.url = baseUrl + "/signalr";
    $.connection.hub.logging = false;
    OnlinePoker.Commanding.API.logging = false;
    // GameActionsQueue.waitDisabled = true;
    // tslint:disable-next-line:no-string-literal
    const numericTextHandler: any = ko.bindingHandlers["numericText"];
    numericTextHandler.defaultPositions = 0;
    numericTextHandler.separator = ",";
    // tslint:disable-next-line:no-string-literal
    window["moment"].locale("ru");

    // This function prevents the rotation from
    function shouldRotateToOrientation(interfaceOrientation) {
        return app.shouldRotateToOrientation(interfaceOrientation);
    }

    exposeCardsConstants();
    // tslint:disable:no-string-literal
    window["shouldRotateToOrientation"] = shouldRotateToOrientation;
    window["app"] = app;
    window["authToken"] = null;
    window["apiHost"] = apiHost;
    window["baseUrl"] = baseUrl;
    window["debugSettings"] = debugSettings;
    window["_"] = _;
    // tslint:enable:no-string-literal
    window.onerror = function (message, url, lineNumber, colno, error) {
        console.log("Error: " + message + " in " + url + " at line " + lineNumber);
        if (error != null) {
            console.log(error);
        }

        // tslint:disable-next-line:no-string-literal
        window["appInsights"].trackException(error, "window.onerror");
    };
    window.addEventListener("unhandledrejection", function (event: any) {
        // tslint:disable-next-line:no-string-literal
        window["appInsights"].trackException(event.reason, "Promise");
    });

    ko.onError = function (error) {
        // tslint:disable-next-line:no-string-literal
        window["appInsights"].trackException(error, "Knockout");
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

// tslint:disable:no-string-literal
window["ko"] = ko;
window["TableView"] = TableView;
window["ActionBlock"] = ActionBlock;
// tslint:enable:no-string-literal
registerBindings();
registerExtenders();
registerComponents();
updateDefaultMessages();
bootstrap();
