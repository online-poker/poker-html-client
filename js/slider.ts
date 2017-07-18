/// <reference types="knockout" />

class SliderItem {
    public caption: string;
    public childTemplate: string;
    public action: () => void;
}

class Slider {
    public currentIndex: KnockoutObservable<number>;
    public currentIndex1: KnockoutComputed<number>;
    public items: SliderItem[];
    public current: KnockoutComputed<SliderItem>;
    public next: KnockoutComputed<SliderItem>;
    public prev: KnockoutComputed<SliderItem>;
    public enabled = ko.observable(true);

    constructor() {
        const self = this;
        this.items = [];
        this.currentIndex = ko.observable(0);
        this.currentIndex1 = ko.computed<number>({
            read () {
                return self.currentIndex() + 1;
            },
            write (value) {
                if (this.enabled()) {
                    self.currentIndex(value - 1);
                }
            },
            owner: this,
        });
        this.current = ko.computed(function () {
            const index = this.currentIndex();
            if (index < 0 || index >= this.items.length) {
                return null;
            }

            return self.items[index];
        }, this);
        this.next = ko.computed(function () {
            let index = this.currentIndex();
            if (index < 0 || index >= this.items.length) {
                return null;
            }

            index = index + 1;
            if (index >= this.items.length) {
                index = 0;
            }

            return self.items[index];
        }, this);
        this.prev = ko.computed(function () {
            let index = this.currentIndex();
            if (index < 0 || index >= this.items.length) {
                return null;
            }

            index = index - 1;
            if (index < 0) {
                index = this.items.length - 1;
            }

            return self.items[index];
        }, this);
    }
    public addOption(caption: string, childTemplate: string, callback: () => void): SliderItem {
        const item = new SliderItem();
        item.caption = caption;
        item.childTemplate = childTemplate;
        item.action = callback;
        this.items.push(item);
        this.currentIndex.valueHasMutated();
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
