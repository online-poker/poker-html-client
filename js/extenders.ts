/* tslint:disable:no-string-literal */

import * as ko from "knockout";
import { SelectorItem } from "./selector";

/** Register knockoutjs extenders */
export function registerExtenders() {
    ko.extenders["options"] = (target: KnockoutObservable<any>, option: { caption: string; items: SelectorItem[]}) => {
        target.options = option.items;
        target.caption = option.caption;
        target.currentValue = ko.computed(() => {
            const value = target();
            const selectedItem = option.items.filter((item: SelectorItem) => {
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
