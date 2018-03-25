declare function testInit(): void;
declare function require(modulename: string[], callback: () => void): void;

// tslint:disable-next-line:no-var-requires
require(["appInit"], () => {
    // tslint:disable-next-line:no-string-literal
    if (window["testInit"] !== undefined) {
        testInit();
    }
});
