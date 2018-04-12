import * as ko from "knockout";
import * as signals from "signals";
import { App } from "../app";
import * as metadataManager from "../metadatamanager";
import { PopupBase } from "../ui/popupbase";

declare var app: App;

/** Select Avatar Popup */
export class SelectAvatarPopup extends PopupBase {
    public avatars = ko.observableArray<string>();
    public selectedAvatar = ko.observable<string>();
    public selected = new signals.Signal();

    public shown() {
        super.shown();
        this.avatars(metadataManager.avatars);
    }
    public confirm() {
        this.selected.dispatch(this.selectedAvatar());
    }
    public selectAvatar(item: string) {
        this.selectedAvatar(item);
        this.close();
    }
    public close() {
        super.close();
        this.confirm();
        app.registrationPopup.visible(true);
    }
}
