/// <reference path="../poker.commanding.api.ts" />

declare var apiHost: string;

import * as ko from "knockout";
import * as timeService from "../timeservice";
import { PopupBase } from "../ui/popupbase";
import * as runtimeSettings from "../table/runtimesettings";
import { _ } from "../languagemanager";

export class SlowConnectionPopup extends PopupBase {
    allowRetry: KnockoutObservable<boolean>;
    caption: KnockoutObservable<string>;
    message: KnockoutObservable<string>;
    index: KnockoutObservable<number>;
    retryCaption: KnockoutObservable<string>;
    onretry: () => void;
    handle: number = null;

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
    shown(): void {
        super.shown();
        this.startUpdatingCaption();
        this.reset();
    }
    close(): void {
        this.stopUpdatingCaption();
        super.close();
    }
    startUpdatingCaption() {
        if (this.handle !== null) {
            this.stopUpdatingCaption();
        }

        this.handle = timeService.setInterval(() => {
            if (runtimeSettings.updateTimer) {
                this.index((this.index() + 1) % 4);
            }
        }, 300);
    }
    stopUpdatingCaption() {
        timeService.clearInterval(this.handle);
        this.handle = null;
    }
    reset() {
        this.index();
        this.allowRetry(false);
        this.message(_("connection.slow"));
        // this.retryCaption(_("connection.retry"));
    }

    reconnectFailed() {
        this.allowRetry(true);
        this.message(_("connection.reconnectfailed"));
        this.retryCaption(_("connection.retry"));
    }

    duplicatedConnection() {
        this.allowRetry(true);
        this.message(_("connection.duplicateconnectiondetected"));
        this.retryCaption(_("connection.reestablishConnection"));
    }

    noConnection() {
        this.allowRetry(false);
        this.message(_("connection.noconnection"));
    }

    connectionPresent() {
        this.allowRetry(true);
        this.message(_("connection.connectionpresent"));
        this.retryCaption(_("connection.reconnect"));
    }

    retry() {
        this.reset();
        if (this.onretry !== null) {
            this.onretry();
        }
    }
}
