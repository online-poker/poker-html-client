/// <reference types="knockout" />

class SliderItem {
    caption: string;
    childTemplate: string;
    action: Function;
}

class Slider {
    currentIndex: KnockoutObservable<number>;
    currentIndex1: KnockoutComputed<number>;
    items: SliderItem[];
    current: KnockoutComputed<SliderItem>;
    next: KnockoutComputed<SliderItem>;
    prev: KnockoutComputed<SliderItem>;
    enabled = ko.observable(true);

    constructor() {
        var self = this;
        this.items = [];
        this.currentIndex = ko.observable(0);
        this.currentIndex1 = ko.computed<number>({
            read: function () {
                return self.currentIndex() + 1;
            },
            write: function (value) {
                if (this.enabled()) {
                    self.currentIndex(value - 1);
                }
            },
            owner: this
        });
        this.current = ko.computed(function () {
            var index = this.currentIndex();
            if (index < 0 || index >= this.items.length) {
                return null;
            }

            return self.items[index];
        }, this);
        this.next = ko.computed(function () {
            var index = this.currentIndex();
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
            var index = this.currentIndex();
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
    addOption(caption: string, childTemplate: string, callback: Function): SliderItem {
        var item = new SliderItem();
        item.caption = caption;
        item.childTemplate = childTemplate;
        item.action = callback;
        this.items.push(item);
        this.currentIndex.valueHasMutated();
        return item;
    }
    selectNext() {
        if (!this.enabled()) {
            return;
        }

        var index = this.currentIndex();
        index = index + 1;
        if (index >= this.items.length) {
            index = 0;
        }

        this.currentIndex(index);
    }
    selectPrev() {
        if (!this.enabled()) {
            return;
        }

        var index = this.currentIndex();
        index = index - 1;
        if (index < 0) {
            index = this.items.length - 1;
        }

        this.currentIndex(index);
    }
}
