
export type CommandHandler = (params?: any[]) => any;

export interface ICommandExecutor {
    /**
     * Executes command by name, optionally pass arguments to it.
     * @param commandName Name of the command to execute.
     * @param parameters Optional parameters to pass in the command.
     */
    executeCommand(commandName: string, parameters?: any[]): any;
}

export interface ICommandManager extends ICommandExecutor {
    /**
     * Register command with given name for execution.
     * @param commandName Name of the command to register.
     * @param handler Handler to execute by the command.
     */
    registerCommand(commandName: string, handler: CommandHandler): void;
}

/** Register and executes commands */
export class CommandManager implements ICommandManager {
    public commands: any[] = [];

    /**
     * Register command with given name for execution.
     * @param commandName Name of the command to register.
     * @param handler Handler to execute by the command.
     */
    public registerCommand(commandName: string, handler: CommandHandler): void {
        this.commands[commandName] = handler;
    }

    /**
     * Executes command by name, optionally pass arguments to it.
     * @param commandName Name of the command to execute.
     * @param parameters Optional parameters to pass in the command.
     */
    public executeCommand(commandName: string, parameters: any[]= []): any {
        const handler: CommandHandler = this.commands[commandName];
        if (handler == null) {
            // tslint:disable-next-line:no-console
            console.log("Command call " + commandName + " not executed, since no handler registered");
            return null;
        }

        return handler(parameters);
    }
}
