import * as ko from "knockout";
import * as signals from "signals";

export class Keypad {
    public onKeyPressed = new signals.Signal();
    public onKeyCancel = new signals.Signal();

    constructor(private textValue: ko.Observable<string>, private maxLength?: number) {
    }

    public typeValue(value: string) {
        this.onKeyPressed.dispatch();
        if (this.textValue() === null) {
            this.textValue(value);
            return;
        }

        if (this.textValue().length < (this.maxLength || 100)) {
            this.textValue(this.textValue() + value);
        }
    }

    public deleteLastSign() {
        this.onKeyCancel.dispatch();
        this.textValue(this.textValue().substring(0, this.textValue().length - 1));
    }

    public deleteLastDigit() {
        this.onKeyCancel.dispatch();
        this.textValue(this.textValue().substring(0, this.textValue().length - 1));
    }
}
