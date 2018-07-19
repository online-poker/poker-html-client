import * as ko from "knockout";
import * as timeService from "../timeservice";

interface TapGestureEvent {
    gesture: {
        center: {
            pageX: number;
        };
    };
}

/** This is customization for tap event. */
interface TapEvent {
    originalEvent: Event & TapGestureEvent;
}

export class TableSlider {
    public current: KnockoutObservable<number>;
    public currentValue: KnockoutComputed<string>;
    public minimum: KnockoutObservable<number>;
    public maximum: KnockoutObservable<number>;
    public position: KnockoutComputed<number>;
    private step: number;
    private minRelative: KnockoutObservable<number>;
    private maxRelative: KnockoutObservable<number>;
    private translator: (x: number) => number;

    constructor() {
        const self = this;
        this.current = ko.observable<number>(null);
        this.minRelative = ko.observable<number>(null);
        this.maxRelative = ko.observable<number>(null);
        this.currentValue = ko.computed<string>({
            read() {
                const ivalue = self.current();
                if (ivalue === null) {
                    return "";
                }

                return ivalue.toString();
            },
            write(value) {
                let ivalue = parseInt(value, 10);
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
            },
        });
        this.minimum = ko.observable<number>();
        this.maximum = ko.observable<number>();
        this.position = ko.computed<number>({
            read() {
                const pixelDistance = self.maxRelative() - self.minRelative();
                if (pixelDistance === 0) {
                    return self.maxRelative();
                }

                const delta = self.maximum() - self.minimum();
                if (delta === 0) {
                    return self.maxRelative();
                }

                const ratio = pixelDistance / delta;
                const currentRelative = Math.floor(ratio * (self.current() - self.minimum()));

                return self.minRelative() + currentRelative;
            },
            write(value) {
                if (value >= self.maxRelative()) {
                    self.current(self.maximum());
                    return;
                }

                if (value <= self.minRelative()) {
                    self.current(self.minimum());
                    return;
                }

                const pixelDistance = self.maxRelative() - self.minRelative();
                if (pixelDistance === 0) {
                    self.current(self.minimum());
                    return;
                }

                const delta = self.maximum() - self.minimum();
                if (delta === 0) {
                    self.current(self.minimum());
                    return;
                }

                const ratio = delta / pixelDistance;
                let currentAbsolute = Math.floor(ratio * (value - self.minRelative()));
                // Round currentAbsolute to step
                const currentAbsoluteAligned = Math.floor(currentAbsolute / self.step) * self.step;
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
            },
        });
    }
    /**
     * Set bounds for the slider in the relative coordinates.
     * @param minRelative Number Minimum coordinate in the relative coordinates.
     * @param maxRelative Number Maximum coordinate in the relative coordinates.
     * @param translator Function Function which translate the page coordinates to the relative coordinates.
     */
    public setBounds(minRelative: number, maxRelative: number, translator: (x: number) => number) {
        this.minRelative(minRelative);
        this.maxRelative(maxRelative);
        this.translator = translator;
    }
    public setParameters(value: number, step: number, min: number, max: number) {
        this.current(value);
        this.minimum(min);
        this.maximum(max);
        this.position.notifySubscribers();
        this.step = step;
    }
    public setStep(step: number) {
        this.step = step;
    }
    public increase() {
        let current = this.current();
        current = Math.min(current + this.step, this.maximum());
        this.current(current);
        this.position.notifySubscribers();
    }
    public decrease() {
        let current = this.current();
        current = Math.max(current - this.step, this.minimum());
        this.current(current);
        this.position.notifySubscribers();
    }
    public withinRange(value: number) {
        value = Math.max(value, this.minimum());
        value = Math.min(value, this.maximum());
        return value;
    }
    public isWithinRange(value: number) {
        if (value >= this.minimum() && value <= this.maximum()) {
            return true;
        }

        return false;
    }
    public fixupValue() {
        const self = this;
        if (this.current() !== null && this.current() !== undefined) {
            this.currentValue(this.current().toFixed());

            timeService.setTimeout(function() {
                const c = self.current();
                self.current(0);
                self.current(c);
            }, 10);
        }
    }
    public selectManually(event: MouseEvent & TapEvent) {
        if (event.pageX) {
            const relativePosition = this.translator(event.pageX);
            this.setPosition(relativePosition);
            return true;
        } else {
            if (event.originalEvent.gesture) {
                const relativePosition = this.translator(event.originalEvent.gesture.center.pageX);
                this.setPosition(relativePosition);
                return true;
            } else {
                console.error("Invalid Tap event.");
                return false;
            }
        }
    }
    public setPosition(relativePosition: number) {
        relativePosition = Math.max(relativePosition, this.minRelative());
        relativePosition = Math.min(relativePosition, this.maxRelative());
        this.position(relativePosition);
    }
}
