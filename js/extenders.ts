/// <reference path="./_references.ts" />
/// <reference path="./selector.ts" />
/* tslint:disable:no-string-literal */

import * as ko from "knockout";

export function registerExtenders() {
    ko.extenders["options"] = function (target, option: { caption: string; items: SelectorItem[]}) {
        target.options = option.items;
        target.caption = option.caption;
        target.currentValue = ko.computed(function () {
            var value = target();
            var selectedItem = option.items.filter(function (item: SelectorItem) {
                return item.value === value;
            });
            if (selectedItem.length === 0) {
                return "";
            }

            return selectedItem[0].text;
        });
        return target;
    };
}