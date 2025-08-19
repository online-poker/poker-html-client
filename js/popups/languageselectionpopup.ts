import { Computed, pureComputed } from "knockout";
import { PopupBase } from "../ui/popupbase";
import { l } from "poker/languagemanager";

export class LanguageSelectionPopup extends PopupBase {
    public language: Computed<string>;

    constructor() {
        super();
        this.language = pureComputed({
            read: () => l.currentLang(),
            write: (value) => l.currentLang(value),
        });
    }

    public selectRussian() {
        this.language("ru");
    }

    public selectEnglish() {
        this.language("en");
    }
}
