export class CancelError extends Error {
    constructor(message?: string) {
        super(message);
        this.name = "CancelError";
    }

    toString() {
        return "Cancel" + (this.message ? ": " + this.message : "");
    }
}
