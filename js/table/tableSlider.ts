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
    public current: ko.Observable<number>;
    public currentValue: ko.Computed<string>;
    public minimum: ko.Observable<number>;
    public maximum: ko.Observable<number>;
    public position: ko.Computed<number>;
    private step: number;
    private minRelative: ko.Observable<number>;
    private maxRelative: ko.Observable<number>;
    private translator: (x: number) => number;

    constructor() {
        this.current = ko.observable<number>(null);
        this.minRelative = ko.observable<number>(null);
        this.maxRelative = ko.observable<number>(null);
        this.currentValue = ko.computed<string>({
            read: () => {
                const ivalue = this.current();
                if (ivalue === null) {
                    return "";
                }

                return ivalue.toString();
            },
            write: (value) => {
                let ivalue = parseInt(value, 10);
                if (isNaN(ivalue) || !isFinite(ivalue)) {
                    return;
                }

                if (ivalue >= this.maximum()) {
                    ivalue = this.maximum();
                }

                if (ivalue <= this.minimum()) {
                    ivalue = this.minimum();
                }

                this.current(ivalue);
            },
        });
        this.minimum = ko.observable<number>();
        this.maximum = ko.observable<number>();
        this.position = ko.computed<number>({
            read: () => {
                const pixelDistance = this.maxRelative() - this.minRelative();
                if (pixelDistance === 0) {
                    return this.maxRelative();
                }

                const delta = this.maximum() - this.minimum();
                if (delta === 0) {
                    return this.maxRelative();
                }

                const ratio = pixelDistance / delta;
                const currentRelative = Math.floor(ratio * (this.current() - this.minimum()));

                return this.minRelative() + currentRelative;
            },
            write: (value) => {
                if (value >= this.maxRelative()) {
                    this.current(this.maximum());
                    return;
                }

                if (value <= this.minRelative()) {
                    this.current(this.minimum());
                    return;
                }

                const pixelDistance = this.maxRelative() - this.minRelative();
                if (pixelDistance === 0) {
                    this.current(this.minimum());
                    return;
                }

                const delta = this.maximum() - this.minimum();
                if (delta === 0) {
                    this.current(this.minimum());
                    return;
                }

                const ratio = delta / pixelDistance;
                let currentAbsolute = Math.floor(ratio * (value - this.minRelative()));
                // Round currentAbsolute to step
                const currentAbsoluteAligned = Math.floor(currentAbsolute / this.step) * this.step;
                if ((currentAbsolute - currentAbsoluteAligned) < (currentAbsoluteAligned + this.step - currentAbsolute)) {
                    currentAbsolute = currentAbsoluteAligned;
                } else {
                    currentAbsolute = currentAbsoluteAligned + this.step;
                }

                if (currentAbsolute + this.minimum() > this.maximum()) {
                    this.current(this.maximum());
                    return;
                }

                if (currentAbsolute + this.minimum() < this.minimum()) {
                    this.current(this.minimum());
                    return;
                }

                this.current(currentAbsolute + this.minimum());
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
    public getStep() { return this.step; }
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
    public setValueSafe(value: number) {
        const current = Math.min(value, this.maximum());
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
        if (this.current() !== null && this.current() !== undefined) {
            this.currentValue(this.current().toFixed());

            timeService.setTimeout(() => {
                const c = this.current();
                this.current(0);
                this.current(c);
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
