interface Console {
    timeStamp(label?: string): void;
    markTimeline(label?: string): void;
    trace(): void;
    count(label?: string): void;
}

interface Navigator {
    standalone?: boolean;
}

declare module "knockout.validation" {
    export = validation;
}

declare var validation: any;
