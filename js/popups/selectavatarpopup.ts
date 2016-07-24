/// <reference path="../_references.ts" />
/// <reference path="../poker.commanding.api.ts" />
/// <reference path="../app.ts" />

class SelectAvatarPopup extends PopupBase {
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
