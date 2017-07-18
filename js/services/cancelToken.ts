import { CancelError } from "./cancelError";

type CancelAction = (reason?: string) => void;

export class CancelToken {
    /**
     * Returns an object that contains a new `CancelToken` and a function that, when called,
     * cancels the `CancelToken`.
     */
    public static source() {
        let cancel: CancelAction;
        const token = new CancelToken(function executor(c) {
            cancel = c;
        });
        return {
            cancel,
            token,
        };
    }

    private _cancelReason: CancelError;
    private _promise: Promise<CancelError>;

    constructor(executor: (func: CancelAction) => void) {
        this._promise = new Promise<CancelError>((resolve) => {
            executor((reason) => {
                if (this._cancelReason) {
                    // Cancellation has already been requested
                    return;
                }

                this._cancelReason = new CancelError(reason);
                resolve(this._cancelReason);
            });
        });
    }

    get requested() {
        return Boolean(this._cancelReason);
    }

    get promise() {
        return this._promise;
    }

    /**
     * Throws a `Cancel` if cancellation has been requested.
     */
    public throwIfRequested() {
        if (this._cancelReason) {
            throw this._cancelReason;
        }
    }
}
