﻿interface Device {
    available: boolean;
}

interface Window {
    device: Device;
}

interface PhoneGapApplication {
    exitApp(): void;
}

interface Navigator {
    app: PhoneGapApplication;
}

interface CordovaMenuItem {
    id: number;
    order: number;
    name: string;
}

interface CordovaMenu {
    initialize(items: CordovaMenuItem[]): void;
    optionItemClick: (optionId: number) => void;
}

interface CordovaScreenOrientation {
    setOrientation(orientation: string);
    lock();
    unlock();
    shouldRotateToOrientation(orientation: any);
}

declare var menu: CordovaMenu;
declare var ScreenOrientation: CordovaScreenOrientation;

declare module WindowsAzure {
    export module Messaging {
        interface RegistrationInformation {
            registrationId: string;
        }

        interface Promise {
            then(success: (result: RegistrationInformation) => void, failure: (error: string) => void): void;
        }

        interface NotificationHubInterface {
            (hub, connectionString, options): void;
            registerApplicationAsync: () => Promise;
            onPushNotificationReceived: (message: any) => void;
        }

        var NotificationHub: NotificationHubInterface;
    }
}
