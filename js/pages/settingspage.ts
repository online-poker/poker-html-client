import { App } from "../app";
import { _ } from "../languagemanager";
import * as metadataManager from "../metadatamanager";

declare var app: App;

export class SettingsPage implements Page {
    public online: KnockoutObservable<string>;
    public registered: KnockoutObservable<string>;
    public captionLabel: KnockoutComputed<string>;

    constructor() {
        App.addTabBarItemMapping("more", "settings");
        this.online = metadataManager.online;
        this.registered = metadataManager.registered;
        this.captionLabel = ko.computed(function() {
            return _("header.onlinePlayers")
                .replace("#registered", this.registered())
                .replace("#online", this.online());
        }, this);
    }

    public deactivate() {
        // Do nothing.
    }
    public activate() {
        this.update();
    }
    public update() {
        // Do nothing.
    }
}
