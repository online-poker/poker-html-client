/// <reference path="services.d.ts" />

export class PushService {
    private hub: WindowsAzure.Messaging.NotificationHubInterface;

    register() {
        /* tslint:disable:no-string-literal */
        if (window["WindowsAzure"] == null) {
            return;
        }
        /* tslint:enable:no-string-literal */

        const hub = this.getHub();
        hub.registerApplicationAsync().then(
            function (result) {
                console.log("Registration successful: " + result.registrationId);
            },
            function (error) {
                console.log("Registration failed: " + error);
            });

        hub.onPushNotificationReceived = function (msg) {
            console.log("onPushNotificationReceived: ", msg);
        };
    }
    private getHub() {
        if (this.hub != null) {
            return this.hub;
        }

        const serviceBusNamespace = "azurebus-ns";
        const notificationHubPath = "azurebus";
        const hubKey = "azurebuskey=";
        const connectionString = "Endpoint=sb://" + serviceBusNamespace + ".servicebus.windows.net/;"
            + "SharedAccessKeyName=DefaultListenSharedAccessSignature;SharedAccessKey=" + hubKey;
        this.hub = new WindowsAzure.Messaging.NotificationHub(notificationHubPath, connectionString, "375486100658");
        return this.hub;
    }
}
