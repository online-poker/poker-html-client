import * as ko from "knockout";

export interface SelectorItem {
    text: string;
    value: any;
    selected: boolean;
}

/** App selector */
export class Selector {
    public caption: KnockoutObservable<string>;
    public items: KnockoutObservableArray<SelectorItem>;
    public selected: (item: SelectorItem) => void;
    public cancelled: () => void;
    constructor() {
        this.caption = ko.observable<string>(null);
        this.items = ko.observableArray<SelectorItem>([]);
    }
    public setParams(caption: string, items: SelectorItem[], success: (item: SelectorItem) => void, cancel: () => void): void {
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
