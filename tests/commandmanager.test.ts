import { CommandManager } from "poker/commandmanager";

describe("Command manager", function () {
    it("Unknown command return null", function () {
        const commandManager = new CommandManager();
        const result = commandManager.executeCommand("unknowncmd");
        expect(result).toBeNull();
    });
    it("registered command executed", function () {
        const commandManager = new CommandManager();
        commandManager.registerCommand("test", function () {
            return 182;
        });
        const result = commandManager.executeCommand("test");
        expect(result).toEqual(182);
    });
    it("parameters to command passed", function () {
        const commandManager = new CommandManager();
        commandManager.registerCommand("testWithArgs", function (params: any[]) {
            return params[0] + 100;
        });
        const result = commandManager.executeCommand("testWithArgs", [22]);
        expect(result).toEqual(122);
    });
});
