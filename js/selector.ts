/// <reference types="knockout" />

interface SelectorItem {
    text: string;
    value: any;
    selected: boolean;
}

class Selector {
    public caption: KnockoutObservable<string>;
    public items: KnockoutObservableArray<SelectorItem>;
    public selected: Function;
    public cancelled: Function;
    constructor() {
        this.caption = ko.observable(<string>null);
        this.items = ko.observableArray(<SelectorItem[]>[]);
    }
    public setParams(caption: string, items: SelectorItem[], success: Function, cancel: Function): void {
        this.caption(caption);
        this.items.valueWillMutate();
        this.items([]);
        this.items(items);
        this.items.valueHasMutated();
        this.selected = success;
        this.cancelled = cancel;
    }
    public select(item: SelectorItem): void {
        this.selected(item);
    }
    public back(): void {
        this.cancelled();
    }
}
