import * as ko from "knockout";
import { App } from "../app";
import { PageBlock } from "../pageblock";
import { orientationService, reloadManager } from "../services";
import { AccountManager } from "../services/accountManager";
import { PageBase } from "../ui/pagebase";

declare var app: App;

export class OperationsHistoryPage extends PageBase implements KnockoutValidationGroup {
    public from: KnockoutObservable<string>;
    public to: KnockoutObservable<string>;
    public errors: KnockoutValidationErrors;
    public operations: KnockoutObservableArray<OperationData>;
    public loading: KnockoutObservable<boolean>;
    public isValid: () => boolean;

    constructor() {
        super();
        App.addTabBarItemMapping("cashier", "operationsHistory");
        this.loading = ko.observable(false);
        this.operations = ko.observableArray<OperationData>([]);
        this.from = ko.observable<string>();
        this.to = ko.observable<string>();
        this.errors = ko.validation.group(this);
    }
    public activate(): void {
        super.activate();
        this.applyFilter(false);
        if (!PageBlock.useDoubleView) {
            app.tabBar.visible(false);
            orientationService.setOrientation("landscape");
            /* tslint:disable:no-string-literal no-unused-expression */
            window["StatusBar"] && StatusBar.hide();
            /* tslint:enable:no-string-literal no-unused-expression */
        }

        reloadManager.setReloadCallback(() => this.applyFilter(true));
    }
    public deactivate(): void {
        super.deactivate();
        if (!PageBlock.useDoubleView) {
            app.tabBar.visible(true);
            orientationService.setOrientation("portrait");
            /* tslint:disable:no-string-literal no-unused-expression */
            window["StatusBar"] && StatusBar.show();
            /* tslint:enable:no-string-literal no-unused-expression */
        }
    }
    public back(): void {
        if (!PageBlock.useDoubleView) {
            app.cashierPageBlock.showPrimary();
        } else {
            app.lobbyPageBlock.showLobby();
        }
    }
    public async applyFilter(force: boolean) {
        if (this.loading() && !force) {
            return;
        }

        this.loading(true);
        const api = new AccountManager();
        const data = await api.getAccountHistory(this.from(), this.to(), null, null, null);
        this.loading(false);
        if (!this.visible()) {
            return;
        }

        if (data.Status === "Ok") {
            this.operations(data.Data);
        }
    }
}
