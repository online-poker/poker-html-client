/// <reference path="../poker.commanding.api.ts" />

declare var apiHost: string;

import * as ko from "knockout";
import { _ } from "../languagemanager";
import * as runtimeSettings from "../table/runtimesettings";
import * as timeService from "../timeservice";
import { PopupBase } from "../ui/popupbase";

export class SlowConnectionPopup extends PopupBase {
    public allowRetry: KnockoutObservable<boolean>;
    public caption: KnockoutObservable<string>;
    public message: KnockoutObservable<string>;
    public index: KnockoutObservable<number>;
    public retryCaption: KnockoutObservable<string>;
    public onretry: () => void;
    public handle: number = null;

    constructor() {
        super();
        this.index = ko.observable(0);
        this.message = ko.observable(_("connection.slow"));
        this.retryCaption = ko.observable(_("connection.retry"));
        this.onretry = null;

        this.caption = ko.computed(() => {
            return _("connection.caption" + this.index().toString());
        });
        this.allowRetry = ko.observable(false);
    }
    public shown(): void {
        super.shown();
        this.startUpdatingCaption();
        this.reset();
    }
    public close(): void {
        this.stopUpdatingCaption();
        super.close();
    }
    public startUpdatingCaption() {
        if (this.handle !== null) {
            this.stopUpdatingCaption();
        }

        this.handle = timeService.setInterval(() => {
            if (runtimeSettings.updateTimer) {
                this.index((this.index() + 1) % 4);
            }
        }, 300);
    }
    public stopUpdatingCaption() {
        timeService.clearInterval(this.handle);
        this.handle = null;
    }
    public reset() {
        this.index();
        this.allowRetry(false);
        this.message(_("connection.slow"));
        // this.retryCaption(_("connection.retry"));
    }

    public reconnectFailed() {
        this.allowRetry(true);
        this.message(_("connection.reconnectfailed"));
        this.retryCaption(_("connection.retry"));
    }

    public duplicatedConnection() {
        this.allowRetry(true);
        this.message(_("connection.duplicateconnectiondetected"));
        this.retryCaption(_("connection.reestablishConnection"));
    }

    public noConnection() {
        this.allowRetry(false);
        this.message(_("connection.noconnection"));
    }

    public connectionPresent() {
        this.allowRetry(true);
        this.message(_("connection.connectionpresent"));
        this.retryCaption(_("connection.reconnect"));
    }

    public retry() {
        this.reset();
        if (this.onretry !== null) {
            this.onretry();
        }
    }
}
