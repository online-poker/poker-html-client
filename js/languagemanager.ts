import { observable, Observable } from "knockout";

declare let messages: any;

export interface LanguageDescriptor {
    code: string;
    name: string;    
}

export class LanguageManager {
    public currentLang: Observable<string> = observable("ru");

    constructor() {
        const lang = localStorage.getItem("lang") || "ru";
        this.currentLang(lang);
    }

    public setLang(lang: string): void {
        this.currentLang(lang);
        localStorage.setItem("lang", lang);
    }
    public getSupportedLanguages(): LanguageDescriptor[] {
        return [
            { code:"ru", name:"Русский" },
            { code:"en", name:"English" },
        ]
    }
    public getProvider() {
        if (messages[this.currentLang()]) {
            return messages[this.currentLang()];
        }

        return messages;
    }
    public setProvider(provider: any) {
        messages = provider;
    }
    public getMessage(message: string, parameters: object | null = null): string {
        if (message == null) {
            return "";
        }

        const parts: string[] = message.split(".");
        let currentProvider = this.getProvider();
        for (let i = 0; i < parts.length; i++) {
            const propertyName = parts[i];

            currentProvider = currentProvider[propertyName];
            if (currentProvider == null) {
                break;
            }
        }

        if (currentProvider == null) {
            return this.bind(message, parameters);
        }

        return this.bind(currentProvider, parameters);
    }
    private bind(template: string, parameters: any) {
        if (parameters == null) {
            return template;
        }

        let result = template;
        for (const propName in parameters) {
            if (parameters.hasOwnProperty(propName)) {
                let value = parameters[propName];
                if (value === null || value === undefined) {
                    value = "";
                } else {
                    value = value.toString();
                }

                result = result.replace("#" + propName + "#", value);

                // Bind using old syntax.
                result = result.replace("#" + propName, value);
            }
        }

        return result;
    }
}

export const l = new LanguageManager();
export function _(message: string, parameters: any = null) {
    return l.getMessage(message, parameters);
}
