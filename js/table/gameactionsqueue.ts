import { wait } from "../services/timedeferred";

type QueueWorker = () => Promise<any>;

export class GameActionsQueue {
    public static logging: boolean = false;
    public static waitDisabled = false;

    /**
     * List of pending tasks
     */
    private tasks: QueueWorker[];

    /**
     * Task counter
     */
    private counter: number;

    /**
     * Executing flag.
     */
    private isExecuting: boolean;

    /**
     * Initializes a new instance of the GameActionsQueue class.
     */
    constructor() {
        this.tasks = [];
        this.counter = 0;
    }

    /**
     * Gets count of outstanding tasks.
     */
    public size() {
        return this.tasks.length;
    }
    /**
     * Inject worker to the beginning of tasks stack
     * @param worker QueueWorker The function which generated promise.
     */
    public inject(worker: QueueWorker) {
        this.tasks.unshift(worker);
        this.execute();
    }

    /**
     * Push worker to the end of tasks stack
     * @param worker QueueWorker The function which generated promise.
     */
    public push(worker: QueueWorker) {
        this.tasks.push(worker);
        this.execute();
    }

    /**
     * Push waiting task in the queue
     * @param timeout Number The function which generated promise.
     */
    public wait(timeout: number) {
        if (!GameActionsQueue.waitDisabled && timeout > 0) {
            this.push(() => {
                return wait(timeout);
            });
        }
    }

    /**
     * Push waiting task in the queue
     * @param timeout Number The function which generated promise.
     */
    public waitWithInterruption(timeout: number) {
        if (!GameActionsQueue.waitDisabled && timeout > 0) {
            // Split wait interval by 100ms tasks which allow
            // inject other tasks and don't wait until everything is finished.
            for (let i = 0; i < timeout / 200; i++) {
                this.push(() => {
                    return wait(200);
                });
            }
        }
    }

    /**
     * Push waiting task in the queue
     * @param timeout Number The function which generated promise.
     */
    public injectWait(timeout: number) {
        if (!GameActionsQueue.waitDisabled && timeout > 0) {
            this.inject(() => {
                return wait(timeout);
            });
        }
    }

    /**
     * Push waiting task in the queue
     * @param timeout Number The function which generated promise.
     */
    public injectWaitWithInterruption(timeout: number) {
        if (!GameActionsQueue.waitDisabled && timeout > 0) {
            // Split wait interval by 100ms tasks which allow
            // inject other tasks and don't wait until everything is finished.
            for (let i = 0; i < timeout / 200; i++) {
                this.inject(() => {
                    return wait(200);
                });
            }
        }
    }

    /**
     * Push worker to the stack
     * @param callback Function The function which generated promise.
     */
    public injectCallback(callback: () => void) {
        this.inject(() => {
            return Promise.resolve().then(() => callback());
        });
    }

    /**
     * Push worker to the stack
     * @param callback Function The function which generated promise.
     */
    public pushCallback(callback: () => void) {
        this.push(() => {
            return Promise.resolve().then(() => callback());
        });
    }

    /**
     * Clears execution chain.
     */
    public clear() {
        this.tasks = [];
    }

    /**
     * Starts execution chain.
     */
    public async execute() {
        if (this.isExecuting) {
            this.log("Currently task is executing, task will be executed later.");
            return;
        }

        if (this.tasks.length === 0) {
            this.log("No task to execute.");
            return;
        }

        const self = this;
        const worker = this.tasks.shift();
        if (worker === null) {
            this.error("Worker is null");
        }

        this.counter++;
        this.isExecuting = true;
        const task = worker();
        if (task === null) {
            this.error("Task is null");
        }

        this.log("Executing task with id: " + this.counter.toString());
        await task;
        self.isExecuting = false;
        self.log("Finished task with id: " + self.counter.toString());
        setTimeout(function () {
            self.execute();
        }, 100);
    }

    private log(message?: any, ...optionalParams: any[]) {
        if (GameActionsQueue.logging) {
            console.log(message, optionalParams);
        }
    }

    private error(message?: any, ...optionalParams: any[]) {
        if (GameActionsQueue.logging) {
            console.error(message, optionalParams);
        }
    }
}
