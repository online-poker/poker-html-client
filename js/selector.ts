/// <reference path="../Scripts/typings/knockout/knockout.d.ts" />

interface SelectorItem {
    text: string;
    value: any;
    selected: boolean;
}

class Selector {
    caption: KnockoutObservable<string>;
    items: KnockoutObservableArray<SelectorItem>;
    selected: Function;
    cancelled: Function;
    constructor() {
        this.caption = ko.observable(<string>null);
        this.items = ko.observableArray(<SelectorItem[]>[]);
    }
    setParams(caption: string, items: SelectorItem[], success: Function, cancel: Function): void {
        this.caption(caption);
        this.items.valueWillMutate();
        this.items([]);
        this.items(items);
        this.items.valueHasMutated();
        this.selected = success;
        this.cancelled = cancel;
    }
    select(item: SelectorItem): void {
        this.selected(item);
    }
    back(): void {
        this.cancelled();
    }
}
