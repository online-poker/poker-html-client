declare function testInit();

// tslint:disable-next-line:no-var-requires
require(["appInit"], function () {
    // tslint:disable-next-line:no-string-literal
    if (window["testInit"] !== undefined) {
        testInit();
    }
});
