import ko = require("knockout");
import { App } from "./app";
import { registerBindings } from "./bindings";
import { registerExtenders } from "./extenders";
import { updateDefaultMessages } from "./validationConfiguration";
import { registerComponents } from "./components/registration";
import { LanguageManager, _ } from "./languagemanager";
import { debugSettings } from "./debugsettings";
import { TableView } from "./table/tableview";
import { ActionBlock } from "./table/actionBlock";
// import { ChipItem } from "./table/chipItem";

declare const host: string;
declare const appInsights: Client;

function isStandaloneSupported() {
    return ("standalone" in window.navigator);
}

function isRunningStandalone() {
    return (window.matchMedia("(display-mode: standalone)").matches
        || ("standalone" in window.navigator && window.navigator["standalone"] === true));
}

function bootstrap() {
    if (typeof host === "undefined") {
        console.error("File environment.js is missing");
        return;
    }

    const baseUrl = host,
        apiHost = baseUrl + "/api/rest/v1",
        app = new App();

    $.connection.hub.url = baseUrl + "/signalr";
    $.connection.hub.logging = false;
    OnlinePoker.Commanding.API.logging = false;
    // GameActionsQueue.waitDisabled = true;
    const numericTextHandler: any = ko.bindingHandlers["numericText"];
    numericTextHandler.defaultPositions = 0;
    numericTextHandler.separator = ",";
    window["moment"].locale("ru");

    // This function prevents the rotation from 
    function shouldRotateToOrientation(interfaceOrientation) {
        return app.shouldRotateToOrientation(interfaceOrientation);
    }

    exposeCardsConstants();
    window["shouldRotateToOrientation"] = shouldRotateToOrientation;
    window["app"] = app;
    window["authToken"] = null;
    window["apiHost"] = apiHost;
    window["baseUrl"] = baseUrl;
    window["debugSettings"] = debugSettings;
    window["_"] = _;
    window.onerror = function (message, url, lineNumber, colno, error) {
        console.log("Error: " + message + " in " + url + " at line " + lineNumber);
        if (error != null) {
            console.log(error);
        }

        window["appInsights"].trackException(error, "window.onerror");
    };
    window.addEventListener("unhandledrejection", function (event: any) {
        window["appInsights"].trackException(event.reason, "Promise");
    });

    ko.onError = function (error) {
        window["appInsights"].trackException(error, "Knockout");
    };
    app.bindEvents();
    if (window["cordova"] === undefined) {
        app.onDeviceReady();
        if (isStandaloneSupported() && !isRunningStandalone()) {
            // Show splash screen.
            $("#install_prompt").show();
        }
    }
}

window["ko"] = ko;
window["TableView"] = TableView;
window["ActionBlock"] = ActionBlock;
registerBindings();
registerExtenders();
registerComponents();
updateDefaultMessages();
bootstrap();
