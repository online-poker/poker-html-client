import { wait } from "../services/timedeferred";

interface QueueWorker {
    /**
    * Executes worker and generates deferred which executing operation
    */
    (): JQueryPromise<any>;
}

export class GameActionsQueue {
    static logging: boolean = false;
    static waitDisabled = false;

    /**
    * List of pending tasks
    */
    tasks: QueueWorker[];

    /**
    * Task counter
    */
    counter: number;

    /**
    * Executing flag.
    */
    isExecuting: boolean;

    /**
    * Initializes a new instance of the GameActionsQueue class.
    */
    constructor() {
        this.tasks = [];
        this.counter = 0;
    }
    /**
    * Inject worker to the beginning of tasks stack
    * @param worker QueueWorker The function which generated deferred.
    */
    inject(worker: QueueWorker) {
        this.tasks.unshift(worker);
        this.execute();
    }
    /**
    * Push worker to the end of tasks stack
    * @param worker QueueWorker The function which generated deferred.
    */
    push(worker: QueueWorker) {
        this.tasks.push(worker);
        this.execute();
    }

    /**
    * Push waiting task in the queue
    * @param timeout Number The function which generated deferred.
    */
    wait(timeout: number) {
        if (!GameActionsQueue.waitDisabled && timeout > 0) {
            this.push(() => {
                return wait(timeout);
            });
        }
    }

    /**
    * Push waiting task in the queue
    * @param timeout Number The function which generated deferred.
    */
    injectWait(timeout: number) {
        if (!GameActionsQueue.waitDisabled && timeout > 0) {
            this.inject(() => {
                return wait(timeout);
            });
        }
    }

    /**
    * Push worker to the stack
    * @param callback Function The function which generated deferred.
    */
    injectCallback(callback: Function) {
        this.inject(() => {
            return $.Deferred().done(function () {
                callback();
            }).resolve();
        });
    }

    /**
    * Push worker to the stack
    * @param callback Function The function which generated deferred.
    */
    pushCallback(callback: Function) {
        this.push(() => {
            return $.Deferred().done(function () {
                callback();
            }).resolve();
        });
    }

    /**
    * Clears execution chain.
    */
    clear() {
        this.tasks = [];
    }

    /**
    * Starts execution chain.
    */
    execute() {
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
        $.when(task).done(function () {
            self.isExecuting = false;
            self.log("Finished task with id: " + self.counter.toString());
            setTimeout(function () {
                self.execute();
            }, 100);
        });
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
