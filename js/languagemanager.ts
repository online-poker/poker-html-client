declare var messages: any;

/** This manager is responsible for all text operations */
export class LanguageManager {
    public currentLang: string;
    constructor() {
        this.currentLang = "ru_RU";
    }
    public setLang(lang: string): void {
        this.currentLang = lang;
    }
    public getProvider() {
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

/**
 * Returns message value for current language
 * @param message name of needed message
 * @param parameters (optional) dynamic values that shoud be written in message
 */
export function _(message: string, parameters: any = null) {
    return l.getMessage(message, parameters);
}
