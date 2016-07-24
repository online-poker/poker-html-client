/// <reference path="../../Scripts/typings/knockout/knockout.d.ts" />
/// <reference path="../app.ts" />
/// <reference path="../ui/page.ts" />
/// <reference path="../messages.ts" />
/// <reference path="../languagemanager.ts" />
/// <reference path="../poker.commanding.api.ts" />

declare var apiHost: string;
declare var app: App;

class SettingsPage implements Page {
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
        var self = this;
    }
}
