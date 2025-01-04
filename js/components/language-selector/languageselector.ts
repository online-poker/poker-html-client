import * as ko from "knockout";
import { _, l, LanguageDescriptor } from "../../languagemanager";

/**
 * Parameters for the timeblock component
 */
interface LanguageSelectorParameters {
    selected?: ko.Observable<string>;

    /**
     * Optional initial slide to be presented first.
     */
    initial?: string | ko.Observable<string>;
}

export class LanguageSelectorComponent {
    private languages: LanguageDescriptor[] = [];
    constructor(params: LanguageSelectorParameters) {
        this.languages = l.getSupportedLanguages();
    }
    public setLanguage(desc: LanguageDescriptor) {
        l.setLang(desc.code);
    }
    public isSelected(desc: LanguageDescriptor) {
        return l.currentLang === desc.code;
    }
}
