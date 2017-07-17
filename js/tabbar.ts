/// <reference types="knockout" />

import { debugSettings } from "./debugsettings";

class TabBarItem {
    public name: string;
    public caption: string;
    public cssClass: string;
    public selected: KnockoutObservable<boolean>;
    public disabled: KnockoutObservable<boolean>;
    public notice: KnockoutObservable<boolean>;
    public action: Function;
    public handler() {
        if (this.action != null) {
            this.action.call(this);
        }
    }
}

export class TabBar {
    public items: KnockoutObservableArray<TabBarItem>;
    public visible: KnockoutObservable<boolean>;

    constructor() {
        this.items = ko.observableArray(<TabBarItem[]>[]);
        this.visible = ko.observable(true);
    }
    public addItem(name: string, caption: string, cssClass: string, action: Function) {
        const item = new TabBarItem();
        item.name = name;
        item.caption = caption;
        item.cssClass = cssClass;
        item.action = action;
        item.selected = ko.observable(false);
        item.disabled = ko.observable(false);
        item.notice = ko.observable(false);
        this.items.push(item);
    }
    public isSelected(name: string): boolean {
        let result = false;
        this.items().forEach(function (item) {
            if (item.name === name) {
                result = item.selected();
            }
        });

        return result;
    }
    public select(name: string, enable: boolean): void {
        this.log("Tabbar item '" + name + "' " + (enable ? "selected" : "deselected"));
        this.items.valueWillMutate();
        this.items().forEach(function (item) {
            if (item.name === name) {
                item.selected(enable);
            }
        });
        this.items.valueHasMutated();
    }
    public enable(name: string, enable: boolean): void {
        this.log("Tabbar item '" + name + "' " + (enable ? "enabled" : "disabled"));
        this.items.valueWillMutate();
        this.items().forEach(function (item) {
            if (item.name === name) {
                item.disabled(!enable);
            }
        });
        this.items.valueHasMutated();
    }
    public notice(name: string, enable: boolean): void {
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
            const traceFunction = <Function>console.trace;
            traceFunction.bind(console, message, params)();
        }
    }
}
