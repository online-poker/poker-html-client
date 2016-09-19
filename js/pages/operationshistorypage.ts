/// <reference path="../_references.ts" />
/// <reference path="../poker.commanding.api.ts" />

import * as ko from "knockout";
import { App } from "../app";
import { PageBase } from "../ui/pagebase";
import { reloadManager, orientationService } from "../services";

declare var apiHost: string;
declare var app: App;

export class OperationsHistoryPage extends PageBase implements KnockoutValidationGroup {
    from: KnockoutObservable<string>;
    to: KnockoutObservable<string>;
    errors: KnockoutValidationErrors;
    operations: KnockoutObservableArray<OperationData>;
    loading: KnockoutObservable<boolean>;
    isValid: () => boolean;

    constructor() {
        super();
        App.addTabBarItemMapping("cashier", "operationsHistory");
        this.loading = ko.observable(false);
        this.operations = ko.observableArray<OperationData>([]);
        this.from = ko.observable<string>();
        this.to = ko.observable<string>();
        this.errors = ko.validation.group(this);
    }
    activate(): void {
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
    deactivate(): void {
        super.deactivate();
        if (!PageBlock.useDoubleView) {
            app.tabBar.visible(true);
            orientationService.setOrientation("portrait");
            /* tslint:disable:no-string-literal no-unused-expression */
            window["StatusBar"] && StatusBar.show();
            /* tslint:enable:no-string-literal no-unused-expression */
        }
    }
    back(): void {
        if (!PageBlock.useDoubleView) {
            app.cashierPageBlock.showPrimary();
        } else {
            app.lobbyPageBlock.showLobby();
        }
    }
    applyFilter(force: boolean) {
        if (this.loading() && !force) {
            return;
        }

        this.loading(true);
        const api = new OnlinePoker.Commanding.API.Account(apiHost);
        api.GetPlayerAccountHistory(this.from(), this.to(), null, null, null, (data: BaseRequest<OperationData[]>) => {
            this.loading(false);
            if (!this.visible()) {
                return;
            }

            if (data.Status === "Ok") {
                this.operations(data.Data);
            }
        });
    }
}
