
type CommandHandler = (params?: any[]) => any;

class CommandManager {
    public commands: any[] = [];

    public registerCommand(commandName: string, handler: CommandHandler): void {
        this.commands[commandName] = handler;
    }
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

const commandManager = new CommandManager();
export = commandManager;
