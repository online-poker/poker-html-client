/** Cancel Error */
export class CancelError extends Error {
    constructor(message?: string) {
        super(message);
        this.name = "CancelError";
    }

    public toString() {
        return "Cancel" + (this.message ? ": " + this.message : "");
    }
}
