import * as ko from "knockout";
import { App } from "../app";
import { appConfig } from "../appconfig";
import { GameActionsQueue } from "../table/gameactionsqueue";
import { PlayerWinInformation } from "../table/handhistory";
import { TableView } from "../table/tableview";
import { PopupBase } from "../ui/popupbase";

declare const app: App;

enum HandHistoryDisplayMode {
    Short = 1,
    Detailed,
}

export class HandHistoryPopup extends PopupBase {
    public detailedOperations: ko.ObservableArray<string>;
    public shortOperations: ko.ObservableArray<string>;
    public tableView: ko.Observable<TableView>;
    public mode: ko.Observable<HandHistoryDisplayMode>;
    public cards: ko.ObservableArray<string>;
    public playersData: ko.ObservableArray<PlayerWinInformation>;
    public displayLoginSeparately: boolean;
    public showHistoryModeSelector = ko.observable(true);
    public isShortMode: ko.Computed<boolean>;
    public isDetailedMode: ko.Computed<boolean>;
    public lastHandTitle: ko.Observable<string>;
    public has2Cards: ko.Observable<boolean>;
    public has4Cards: ko.Observable<boolean>;

    constructor() {
        super();
        this.detailedOperations = ko.observableArray<string>([]);
        this.shortOperations = ko.observableArray<string>([]);
        this.tableView = ko.observable<TableView>();
        if (appConfig.game.handHistory.showPictureHistory) {
            this.mode = ko.observable<HandHistoryDisplayMode>(HandHistoryDisplayMode.Short);
        } else {
            this.mode = ko.observable<HandHistoryDisplayMode>(HandHistoryDisplayMode.Detailed);
        }

        this.isShortMode = ko.computed(() => {
            return this.mode() === HandHistoryDisplayMode.Short;
        });
        this.isDetailedMode = ko.computed(() => {
            return this.mode() === HandHistoryDisplayMode.Detailed;
        });

        this.cards = ko.observableArray<string>([]);
        this.lastHandTitle = ko.observable<string>("");
        this.playersData = ko.observableArray<PlayerWinInformation>([]);
        this.displayLoginSeparately = false;
        this.has2Cards = ko.observable<boolean>(true);
        this.has4Cards = ko.observable<boolean>(false);
    }
    public shown(): void {
        super.shown();
        const handHistoryConfig = appConfig.game.handHistory;
        this.showHistoryModeSelector(handHistoryConfig.showPictureHistory && handHistoryConfig.showTextHistory);
        const view = this.tableView();
        const lastHand = view.lastHandHistory();
        this.has2Cards = ko.observable<boolean>(lastHand.gameType() === 1 ? true : false);
        this.has4Cards = ko.observable<boolean>(lastHand.gameType() === 1 ? false : true);
        this.detailedOperations(lastHand.detailedOperations());
        this.shortOperations(lastHand.shortOperations());
        this.cards(lastHand.cards());
        this.lastHandTitle("История раздачи №" + lastHand.id);
        this.playersData(lastHand.playersData());
        GameActionsQueue.waitDisabled = true;
        app.tablesPage.tablesShown(false);
        app.popupClosed.addOnce(function (popupName: string) {
            if (popupName === "handHistory") {
                GameActionsQueue.waitDisabled = false;
                app.tablesPage.tablesShown(true);
            }
        }, this, 0);
    }
    public selectMode(mode: HandHistoryDisplayMode) {
        this.mode(mode);
    }
    public selectShortMode() {
        this.mode(HandHistoryDisplayMode.Short);
    }
    public selectDetailedMode() {
        this.mode(HandHistoryDisplayMode.Detailed);
    }
}
