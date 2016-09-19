declare var apiHost: string;

import { App } from "../app";
import * as metadataManager from "../metadatamanager";
import { _ } from "../languagemanager";

declare var app: App;

export class SettingsPage implements Page {
    online: KnockoutObservable<string>;
    registered: KnockoutObservable<string>;
    captionLabel: KnockoutComputed<string>;

    constructor() {
        App.addTabBarItemMapping("more", "settings");
        this.online = metadataManager.online;
        this.registered = metadataManager.registered;
        this.captionLabel = ko.computed(function () {
            return _("header.onlinePlayers")
                .replace("#registered", this.registered())
                .replace("#online", this.online());
        }, this);
    }

    deactivate() {
        // Do nothing.
    }
    activate() {
        this.update();
    }
    update() {
    }
}
