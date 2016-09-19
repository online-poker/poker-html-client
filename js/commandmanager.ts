
interface CommandHandler {
    (params?: any[]): any;
}

class CommandManager {
    commands: any[] = [];

    registerCommand(commandName: string, handler: CommandHandler): void {
        this.commands[commandName] = handler;
    }
    executeCommand(commandName: string, parameters: any[]= []): any {
        const handler: CommandHandler = this.commands[commandName];
        if (handler == null) {
            console.log("Command call " + commandName + " not executed, since no handler registered");
            return null;
        }

        return handler(parameters);
    }
}

let commandManager = new CommandManager();
export = commandManager;
