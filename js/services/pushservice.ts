/// <reference path="../_references.ts" />
/// <reference path="services.d.ts" />

/**
* External configuration for the Push notifications.
*/
var pushSettings: any;

class PushService {
    private hub: WindowsAzure.Messaging.NotificationHubInterface;

    register() {
		/* tslint:disable:no-string-literal */
        if (window["WindowsAzure"] == null) {
            return;
        }
		/* tslint:enable:no-string-literal */

        var hub = this.getHub();
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

        var serviceBusNamespace = "azurebus-ns";
        var notificationHubPath = "azurebus";
        var hubKey = "azurebuskey=";
        var connectionString = "Endpoint=sb://" + serviceBusNamespace + ".servicebus.windows.net/;"
			+ "SharedAccessKeyName=DefaultListenSharedAccessSignature;SharedAccessKey=" + hubKey;
		console.log(pushSettings);
        this.hub = new WindowsAzure.Messaging.NotificationHub(notificationHubPath, connectionString, "375486100658");
        return this.hub;
    }
}

var pushService = new PushService();
