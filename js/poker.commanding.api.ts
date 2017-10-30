/* tslint:disable:quotemark */
declare var authToken: string;
const beforeSendHandler = (xhr) => {
    xhr.withCredentials = true;
    if (authToken != null) {
        xhr.setRequestHeader("X-Auth-Token", authToken);
    }
};

type JQueryTypedCallback<T> = (data: T, textStatus: string, xhr: JQueryXHR) => void;

enum TournamentStatus {
    Pending,
    RegistrationStarted,
    RegistrationCancelled,
    SettingUp,
    WaitingTournamentStart,
    Started,
    Completed,
    Cancelled,
    LateRegistration,
}

namespace OnlinePoker {
    export namespace Commanding {
        // tslint:disable-next-line:no-namespace
        export namespace API {
            export enum MoneyType {
                Tenge = 1,
                GameChips = 2,
            }
            export let logging: boolean = false;
            export let version = 1;
            export class WebApiProxy {
                public baseUrl: string;
                public server: string;
                public timeout = 5000;

                constructor(public host: string, public baseName: string) {
                    this.baseUrl = host + '/' + baseName + '/';
                    // tslint:disable-next-line:no-string-literal
                    this.server = window["host"];
                }
                public Call(methodName: string, parameters: any, successCallback: JQueryTypedCallback<any>): JQueryXHR {
                    const self = this;
                    let parametersString = "null";
                    if (parameters != null) {
                        parametersString = JSON.stringify(parameters);
                    }

                    this.Log(this.baseName, "Method " + methodName + " called. Parameters: " + parametersString);
                    const url = this.baseUrl + methodName;
                    return $.ajax({
                        type: 'POST',
                        url,
                        data: JSON.stringify(parameters),
                        success: (data, textStatus, jqXHR) => {
                            const dataString = data != null ? JSON.stringify(data) : "NULL";

                            const logMessage = "Method " + methodName + " finished. Status: " + (textStatus || "NULL") + ". Results: " + dataString;
                            self.Log(self.baseName, logMessage);
                            if (successCallback != null) {
                                successCallback(data, textStatus, jqXHR);
                            }
                        },
                        timeout: this.timeout,
                        crossDomain: true,
                        async: true,
                        contentType: 'application/json',
                        beforeSend: beforeSendHandler,
                        dataType: 'json',
                    });
                }
                public async CallAsync<T>(methodName: string, parameters: any) {
                    return new Promise<T>((resolve, reject) => {
                        this.Call(methodName, parameters, null).then(resolve, reject);
                    });
                }
                public Log(api, msg) {
                    if (API.logging === false) {
                        return;
                    }

                    if (typeof (window.console) === "undefined") {
                        return;
                    }

                    const m = "[" + new Date().toTimeString() + "] OnlinePoker API(" + this.baseName + "): " + msg;
                    if (window.console.debug) {
                        window.console.debug(m);
                    } else if (window.console.log) {
                        window.console.log(m);
                    }
                }
            }
        }
    }
}
