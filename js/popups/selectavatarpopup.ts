/// <reference path="../_references.ts" />
/// <reference path="../poker.commanding.api.ts" />
/// <reference path="../app.ts" />

import * as ko from "knockout";
import { PopupBase } from "../ui/popupbase";
import * as metadataManager from "../metadatamanager";
import { App } from "../app";

declare var app: App;

export class SelectAvatarPopup extends PopupBase {
    avatars = ko.observableArray<string>();
    selectedAvatar = ko.observable<string>();
    selected = new signals.Signal();

    shown() {
        super.shown();
        this.avatars(metadataManager.avatars);
    }
    confirm() {
        this.selected.dispatch(this.selectedAvatar());
    }
    selectAvatar(item) {
        this.selectedAvatar(item);
        this.close();
    }
    close() {
        super.close();
        this.confirm();
        app.registrationPopup.visible(true);
    }
}
