interface PopupResult {
    name: string;
    result: any;
}

interface PopupResultCallback {
    (result: PopupResult): void;
}
