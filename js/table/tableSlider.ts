/// <reference path="../_references.ts" />

import * as ko from "knockout";
import * as timeService from "../timeService";
import { TablePlaceModel } from "./tabpleplacemodel";

export class TableSlider {
    public current: KnockoutObservable<number>;
    public currentValue: KnockoutComputed<string>;
    public minimum: KnockoutObservable<number>;
    public maximum: KnockoutObservable<number>;
    public position: KnockoutComputed<number>;
    private step: number;
    private minRelative: number;
    private maxRelative: number;
    private translator: (number) => number;

    constructor() {
        var self = this;
        this.current = ko.observable<number>(null);
        this.currentValue = ko.computed<string>({
            read: function () {
                var ivalue = self.current();
                if (ivalue === null) {
                    return null;
                }

                return ivalue.toString();
            },
            write: function (value) {
                var ivalue = parseInt(value, 10);
                if (isNaN(ivalue) || !isFinite(ivalue)) {
                    return;
                }

                if (ivalue >= self.maximum()) {
                    ivalue = self.maximum();
                }

                if (ivalue <= self.minimum()) {
                    ivalue = self.minimum();
                }

                self.current(ivalue);
            }
        });
        this.minimum = ko.observable<number>();
        this.maximum = ko.observable<number>();
        this.position = ko.computed<number>({
            read: function () {
                var pixelDistance = self.maxRelative - self.minRelative;
                if (pixelDistance === 0) {
                    return self.maxRelative;
                }

                var delta = self.maximum() - self.minimum();
                if (delta === 0) {
                    return self.maxRelative;
                }

                var ratio = pixelDistance / delta;
                var currentRelative = Math.floor(ratio * (self.current() - self.minimum()));

                return self.minRelative + currentRelative;
            },
            write: function (value) {
                if (value >= self.maxRelative) {
                    self.current(self.maximum());
                    return;
                }

                if (value <= self.minRelative) {
                    self.current(self.minimum());
                    return;
                }

                var pixelDistance = self.maxRelative - self.minRelative;
                if (pixelDistance === 0) {
                    self.current(self.minimum());
                    return;
                }

                var delta = self.maximum() - self.minimum();
                if (delta === 0) {
                    self.current(self.minimum());
                    return;
                }

                var ratio = delta / pixelDistance;
                var currentAbsolute = Math.floor(ratio * (value - self.minRelative));
                // Round currentAbsolute to step
                var currentAbsoluteAligned = Math.floor(currentAbsolute / self.step) * self.step;
                if ((currentAbsolute - currentAbsoluteAligned) < (currentAbsoluteAligned + self.step - currentAbsolute)) {
                    currentAbsolute = currentAbsoluteAligned;
                } else {
                    currentAbsolute = currentAbsoluteAligned + self.step;
                }

                if (currentAbsolute + self.minimum() > self.maximum()) {
                    self.current(self.maximum());
                    return;
                }

                if (currentAbsolute + self.minimum() < self.minimum()) {
                    self.current(self.minimum());
                    return;
                }

                self.current(currentAbsolute + self.minimum());
            }
        });
    }
    /**
    * Set bounds for the slider in the relative coordinates.
    * @param minRelative Number Minimum coordinate in the relative coordinates.
    * @param maxRelative Number Maximum coordinate in the relative coordinates.
    * @param translator Function Function which translate the page coordinates to the relative coordinates.
    */
    setBounds(minRelative: number, maxRelative: number, translator: (number) => number) {
        this.minRelative = minRelative;
        this.maxRelative = maxRelative;
        this.translator = translator;
    }
    setParameters(value, step, min, max) {
        this.current(value);
        this.minimum(min);
        this.maximum(max);
        this.position.notifySubscribers();
        this.step = step;
    }
    setStep(step: number) {
        this.step = step;
    }
    increase() {
        var current = this.current();
        current = Math.min(current + this.step, this.maximum());
        this.current(current);
        this.position.notifySubscribers();
    }
    decrease() {
        var current = this.current();
        current = Math.max(current - this.step, this.minimum());
        this.current(current);
        this.position.notifySubscribers();
    }
    withinRange(value: number) {
        value = Math.max(value, this.minimum());
        value = Math.min(value, this.maximum());
        return value;
    }
    isWithinRange(value: number) {
        if (value >= this.minimum() && value <= this.maximum()) {
            return true;
        }

        return false;
    }
    fixupValue() {
        var self = this;
        this.currentValue(this.current().toFixed());
        timeService.setTimeout(function () {
            var c = self.current();
            self.current(0);
            self.current(c);
        }, 10);
    }
    selectManually(event: MouseEvent) {
        var relativePosition = this.translator(event.pageX);
        this.setPosition(relativePosition);
    }
    setPosition(relativePosition: number) {
        relativePosition = Math.max(relativePosition, this.minRelative);
        relativePosition = Math.min(relativePosition, this.maxRelative);
        this.position(relativePosition);
    }
}
