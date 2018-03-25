interface Console {
    timeStamp(label?: string): void;
    markTimeline(label?: string): void;
    trace(): void;
    count(label?: string): void;
}
