import { _, l } from "../js/languagemanager";

describe("language manager", function () {
    global.messages = {
    };
    l.setProvider({
        nullkey: null,
        notnullkey: "notnull",
        bindings: {
            key1: "What is that #amount#",
            numberkey: "Total: #amount#",
        },
        nested: {
            level1: "value",
            level2: {
                v1: "value",
                v2: "another",
            },
        },
    });
    it("Passing null return empty string", function () {
        expect(_(null)).toEqual("");
    });

    it("Passing key which has null value return empty string", function () {
        expect(_("nullkey")).toEqual("nullkey");
    });
    it("Passing existing key which has not null value return value of that key", function () {
        expect(_("notnullkey")).toEqual("notnull");
    });
    it("Nested key leve1 ", function () {
        expect(_("nested.level1")).toEqual("value");
    });
    it("Nested key leve2", function () {
        expect(_("nested.level2.v1")).toEqual("value");
        expect(_("nested.level2.v2")).toEqual("another");
    });
    it("Passing not existing key return that key", function () {
        expect(_("notexistingjey")).toEqual("notexistingjey");
    });
    it("Passing not existing key return that key even when supplying parameters", function () {
        expect(_("nullkey", { key: 1 })).toEqual("nullkey");
    });
    it("Binding replace properties of param object", function () {
        expect(_("bindings.key1", { amount: "test" })).toEqual("What is that test");
    });
    it("binding to number return integer number", function () {
        expect(_("bindings.numberkey", { amount: 100 })).toEqual("Total: 100");
    });
});
