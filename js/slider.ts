import * as ko from "knockout";

class SliderItem {
    public caption: string;
    public childTemplate: string;
    public action: (() => void) | null;
}

export class Slider {
    public currentIndex: ko.Observable<number>;
    public currentIndex1: ko.Computed<number>;
    public items: SliderItem[];
    public current: ko.Computed<SliderItem | null>;
    public next: ko.Computed<SliderItem | null>;
    public prev: ko.Computed<SliderItem | null>;
    public enabled = ko.observable(true);

    constructor() {
        this.items = [];
        this.currentIndex = ko.observable(0);
        this.currentIndex1 = ko.computed<number>({
            read: () => {
                return this.currentIndex() + 1;
            },
            write: (value: number) => {
                if (this.enabled()) {
                    this.currentIndex(value - 1);
                }
            },
            owner: this,
        });
        this.current = ko.computed(() => {
            const index = this.currentIndex();
            if (index < 0 || index >= this.items.length) {
                return null;
            }

            return this.items[index];
        });
        this.next = ko.computed(() => {
            let index = this.currentIndex();
            if (index < 0 || index >= this.items.length) {
                return null;
            }

            index = index + 1;
            if (index >= this.items.length) {
                index = 0;
            }

            return this.items[index];
        });
        this.prev = ko.computed(() => {
            let index = this.currentIndex();
            if (index < 0 || index >= this.items.length) {
                return null;
            }

            index = index - 1;
            if (index < 0) {
                index = this.items.length - 1;
            }

            return this.items[index];
        });
    }
    public addOption(caption: string, childTemplate: string, callback: (() => void) | null): SliderItem {
        const item = new SliderItem();
        item.caption = caption;
        item.childTemplate = childTemplate;
        item.action = callback;
        this.items.push(item);
        if (this.currentIndex.valueHasMutated) {
            this.currentIndex.valueHasMutated();
        }

        return item;
    }
    public selectNext() {
        if (!this.enabled()) {
            return;
        }

        let index = this.currentIndex();
        index = index + 1;
        if (index >= this.items.length) {
            index = 0;
        }

        this.currentIndex(index);
    }
    public selectPrev() {
        if (!this.enabled()) {
            return;
        }

        let index = this.currentIndex();
        index = index - 1;
        if (index < 0) {
            index = this.items.length - 1;
        }

        this.currentIndex(index);
    }
}
