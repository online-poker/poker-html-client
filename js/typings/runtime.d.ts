interface Console {
    markTimeline(label?: string): void;
}

interface Navigator {
    standalone?: boolean;
}

/// Checks that given orientation currently supported
/// For now this is works in iOS.
type WorkerFunc = (intefaceOrientation: any) => boolean;
interface ScreenOrientation {
    shouldRotateToOrientation?: WorkerFunc;
}

interface Window {
    $: any;
    _: any;
    TableView: any;
    ActionBlock: any;
    app: any;
    debugSettings: any;
    baseUrl: string;
    authToken: string | null;
    allBacks: string;
    allNone: string;
    allBacksClassesFourCards: string[];
    allNoneClassesFourCards: string[];
    allBacksClassesTwoCards: string[];
    allNoneClassesTwoCards: string[];
    PokerComponents?: {[comonent: string]: string};
    cordova?: any;
    shouldRotateToOrientation?: WorkerFunc;
    ScreenOrientation: ScreenOrientation;
}

declare module "knockout.validation" {
    export = validation;
}

declare const validation: any;
