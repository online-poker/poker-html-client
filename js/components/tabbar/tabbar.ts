import * as ko from "knockout";
import { debugSettings } from "../../debugsettings";

class TabBarItem {
    public name: string;
    public caption: string;
    public cssClass: string;
    public selected: ko.Observable<boolean>;
    public disabled: ko.Observable<boolean>;
    public notice: ko.Observable<boolean>;
    public action: () => void;
    public handler() {
        if (this.action != null) {
            this.action.call(this);
        }
    }
}

class TabBar {
    public items: ko.ObservableArray<TabBarItem>;
    public visible: ko.Observable<boolean>;

    constructor() {
        this.items = ko.observableArray<TabBarItem>([]);
        this.visible = ko.observable(true);
    }
    public addItem(name: string, caption: string, cssClass: string, action: () => void) {
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
        if (this.items.valueWillMutate) {
            this.items.valueWillMutate();
        }

        this.items().forEach(function (item) {
            if (item.name === name) {
                item.selected(enable);
            }
        });
        if (this.items.valueWillMutate) {
            this.items.valueWillMutate();
        }
    }
    public enable(name: string, enable: boolean): void {
        this.log("Tabbar item '" + name + "' " + (enable ? "enabled" : "disabled"));
        if (this.items.valueWillMutate) {
            this.items.valueWillMutate();
        }

        this.items().forEach(function (item) {
            if (item.name === name) {
                item.disabled(!enable);
            }
        });
        if (this.items.valueWillMutate) {
            this.items.valueWillMutate();
        }
    }
    public notice(name: string, enable: boolean): void {
        this.log("Notice for tabbar item '" + name + "' " + (enable ? "set" : "unset"));
        if (this.items.valueWillMutate) {
            this.items.valueWillMutate();
        }

        this.items().forEach(function (item) {
            if (item.name === name) {
                item.notice(enable);
            }
        });
        if (this.items.valueWillMutate) {
            this.items.valueWillMutate();
        }
    }

    private log(message: string, ...params: any[]) {
        if (debugSettings.application.debugTabbar) {
            const traceFunction = console.trace as (message: string, ...args: any[]) => void;
            traceFunction.bind(console, message, params)();
        }
    }
}

export = TabBar;
