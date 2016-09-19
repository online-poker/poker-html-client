declare var messages: any;

class LanguageManager {
    currentLang: string;
    constructor() {
        this.currentLang = "ru_RU";
    }
    setLang(lang: string): void {
        this.currentLang = lang;
    }
    getProvider() {
        return messages;
    }
    setProvider(provider: any) {
        messages = provider;
    }
    getMessage(message: string, parameters = null): string {
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
        for (let propName in parameters) {
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

var l = new LanguageManager();
function _(message: string, parameters = null) {
    return l.getMessage(message, parameters);
}
