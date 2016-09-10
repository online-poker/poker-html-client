/// <reference types="knockout" />
/// <reference path="./debugsettings.ts" />

class TabBarItem {
    name: string;
    caption: string;
    cssClass: string;
    selected: KnockoutObservable<boolean>;
    disabled: KnockoutObservable<boolean>;
    notice: KnockoutObservable<boolean>;
    action: Function;
    handler() {
        if (this.action != null) {
            this.action.call(this);
        }
    }
}

class TabBar {
    items: KnockoutObservableArray<TabBarItem>;
    visible: KnockoutObservable<boolean>;

    constructor() {
        this.items = ko.observableArray(<TabBarItem[]>[]);
        this.visible = ko.observable(true);
    }
    addItem(name: string, caption: string, cssClass: string, action: Function) {
        var item = new TabBarItem();
        item.name = name;
        item.caption = caption;
        item.cssClass = cssClass;
        item.action = action;
        item.selected = ko.observable(false);
        item.disabled = ko.observable(false);
        item.notice = ko.observable(false);
        this.items.push(item);
    }
    isSelected(name: string): boolean {
        var result = false;
        this.items().forEach(function (item) {
            if (item.name === name) {
                result = item.selected();
            }
        });

        return result;
    }
    select(name: string, enable: boolean): void {
        this.log("Tabbar item '" + name + "' " + (enable ? "selected" : "deselected"));
        this.items.valueWillMutate();
        this.items().forEach(function (item) {
            if (item.name === name) {
                item.selected(enable);
            }
        });
        this.items.valueHasMutated();
    }
    enable(name: string, enable: boolean): void {
        this.log("Tabbar item '" + name + "' " + (enable ? "enabled" : "disabled"));
        this.items.valueWillMutate();
        this.items().forEach(function (item) {
            if (item.name === name) {
                item.disabled(!enable);
            }
        });
        this.items.valueHasMutated();
    }
    notice(name: string, enable: boolean): void {
        this.log("Notice for tabbar item '" + name + "' " + (enable ? "set" : "unset"));
        this.items.valueWillMutate();
        this.items().forEach(function (item) {
            if (item.name === name) {
                item.notice(enable);
            }
        });
        this.items.valueHasMutated();
    }

    private log(message: string, ...params: any[]) {
        if (debugSettings.application.debugTabbar) {
            var traceFunction = <Function>console.trace;
            traceFunction.bind(console, message, params)();
        }
    }
}
