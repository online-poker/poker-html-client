import { _ } from "../languagemanager";
import * as metadataManager from "../metadatamanager";

export class SettingsPage implements Page {
    public online: KnockoutObservable<string>;
    public registered: KnockoutObservable<string>;
    public captionLabel: KnockoutComputed<string>;

    constructor() {
        this.online = metadataManager.online;
        this.registered = metadataManager.registered;
        this.captionLabel = ko.computed(() => {
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
