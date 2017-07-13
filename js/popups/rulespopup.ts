import { PopupBase } from "../ui/popupbase";
import { App } from "../app";

declare var app: App;

export class RulesPopup {

    shown(): void {
    }

    confirm() {
        app.closePopup();
    }
}