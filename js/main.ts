declare function testInit();

require(["appInit"], function () {
    if (window["testInit"] !== undefined) {
        testInit();
    }
});
