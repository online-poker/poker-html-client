import { Computed, Observable, observable } from "knockout";
import { TablesPage } from "../../../pages/tablespage";
import { App } from "poker/app";
import ko = require("knockout");

declare const app: App;

export class QuickTableMenuComponent {
    private page: TablesPage;
    private visible: Observable<boolean> = observable(false);
    public couldDeposit: Computed<boolean>;
    public depositVisible: Computed<boolean>;
    public handHistoryEnabled : Computed<boolean>;
    public handHistoryVisible: Computed<boolean>;

    constructor(params: { data: TablesPage }) {
        this.page = params.data;
        this.couldDeposit = ko.pureComputed(() => this.page.currentTable().couldAddChips());
        this.depositVisible = ko.pureComputed(() => this.page.currentTable().addMoneyAvailable() && this.page.currentTable().myPlayer() != null);
        this.handHistoryEnabled = ko.pureComputed(() => this.page.currentTable().handHistoryAllowed());
        this.handHistoryVisible = ko.pureComputed(() => this.page.currentTable().myPlayer() != null);
    }

    public toggleMenu() {
        this.visible(!this.visible());
        if (this.visible()) {
            app.showPopup("tableMenu");
        } else {
            if (app.currentPopup === "tableMenu") {
                app.closePopup();
            }
        }
    }

    public bool depositEnabled
}
