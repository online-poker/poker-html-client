import * as ko from "knockout";

export interface ChipStack {
    type: number;
    amount: number;
}

interface ChipStackCalcIntermediate {
    difference: number;
    count: number;
    index: number;
}

export class ChipItem {
    public baseAmount: ko.Observable<number>;

    constructor(base: number, private maxStackCount: number = 2, private maxStackSize: number = 5) {
        this.baseAmount = ko.observable(base);
    }

    public getData(amount: number | { amount: number; stack: ChipStack[] }) {
        const list = [1, 5, 10, 50, 100, 500].map((item) => (item * this.baseAmount()));
        const stack = typeof amount === "number"
            ? this.calculateStackSimple(amount, list)
            : amount.stack;
        return (typeof amount === "number" || this.maxStackCount > 1) ? this.transform(stack) : this.transformSimple(stack);
    }

    public transform(stack: ChipStack[]) {
        const result = [] as number[][];
        for (let i = 0; i < stack.length; i++) {
            const item = [] as number[];
            for (let j = 0; j < stack[i].amount; j++) {
                item.push(stack[i].type);
            }

            result.push(item);
        }

        return result;
    }

    public transformSimple(stack: ChipStack[]) {
        const result = [] as number[][];
        const item = [] as number[];
        for (let i = 0; i < stack.length; i++) {
            for (let j = 0; j < stack[i].amount; j++) {
                if (item.length == this.maxStackSize) {
                    break;
                }

                item.push(stack[i].type);
            }
        }

        if (stack.length > 0) {
            result.push(item);
        }

        return result;
    }

    public calculateStack(amount: number, chipAmounts: number[]) {
        let stack = this.calculateStackInternal(amount, chipAmounts);
        if (stack.length > this.maxStackSize) {
            stack = this.calculateStackInternal(amount, chipAmounts.slice(0, stack.length - 1));
            if (stack.length > this.maxStackSize) {
                stack = this.calculateStackInternal(amount, chipAmounts.slice(0, stack.length - 1));
                if (stack.length > this.maxStackSize) {
                    stack = this.calculateStackInternal(amount, chipAmounts.slice(0, stack.length - 1));
                    if (stack.length > this.maxStackSize) {
                        stack = this.calculateStackInternal(amount, chipAmounts.slice(0, stack.length - 1));
                        if (stack.length > this.maxStackSize) {
                            stack = this.calculateStackInternal(amount, chipAmounts.slice(0, stack.length - 1));
                            if (stack.length > this.maxStackSize) {
                                stack = this.calculateStackInternal(amount, chipAmounts.slice(0, stack.length - 1));
                                if (stack.length > this.maxStackSize) {
                                    throw new Error("Could not divide stack for amount " + amount);
                                }
                            }
                        }
                    }
                }
            }
        }

        return stack;
    }

    public calculateStackSimple(amount: number, chipAmounts: number[]): ChipStack[] {
        if (amount === 0) {
            return [] as ChipStack[];
        }

        const item1 = this.calculateStackSimpleInternal(amount, chipAmounts, this.maxStackCount == 1);
        if (item1.difference > 0 && this.maxStackCount > 1) {
            const item2 = this.calculateStackSimpleInternal(item1.difference, chipAmounts, true);
            if (item2.count === 0) {
                return [{
                    amount: Math.max(item1.count, 1),
                    type: item1.index,
                }];
            }

            if (item1.count === 0) {
                return [{
                    amount: Math.max(item2.count, 1),
                    type: item2.index,
                }];
            }

            if (this.maxStackCount === 1) {
                [{
                    amount: Math.min(Math.max(item1.count + item2.count, 1), this.maxStackSize),
                    type: item1.index,
                }];
            }

            return [{
                amount: Math.max(item1.count, 1),
                type: item1.index,
            }, {
                amount: Math.max(item2.count, 1),
                type: item2.index,
            }];
        }

        return [{
            amount: Math.max(item1.count, 1),
            type: item1.index,
        }];
    }

    private calculateStackSimpleInternal(amount: number, chipAmounts: number[], allowOveradd: boolean): ChipStackCalcIntermediate {
        const minimumAmount = chipAmounts[0];
        let intermediate = chipAmounts.filter((ca) => amount >= ca);
        let upperBound: number;
        if (intermediate.length === 0) {
            upperBound = minimumAmount;
        } else {
            upperBound = intermediate.reduce((prev, current) => Math.max(prev, current), Number.MIN_VALUE);
        }

        if (allowOveradd) {
            intermediate = chipAmounts.filter((ca) => amount <= ca);
            if (intermediate.length === 0) {
                upperBound = minimumAmount;
            } else {
                upperBound = intermediate.reduce((prev, current) => Math.min(prev, current), Number.MAX_VALUE);
            }
        }

        const effectiveChipsAmount = chipAmounts.filter((ca) => ca <= upperBound);
        let target: {
            amount: number;
            chipsAmount: number;
            difference: number;
        }[];
        if (allowOveradd) {
            target = effectiveChipsAmount.map((item) => ({
                amount: item,
                chipsAmount: Math.min(Math.floor((amount + item - 1) / item), this.maxStackSize),
                difference: 0,
            }));
            target = target.concat(effectiveChipsAmount.map((item) => ({
                amount: item,
                chipsAmount: Math.min(Math.floor(amount / item), this.maxStackSize),
                difference: 0,
            })));
        } else {
            target = effectiveChipsAmount.map((item) => ({
                amount: item,
                chipsAmount: Math.min(Math.floor(amount / item), this.maxStackSize),
                difference: 0,
            }));
        }

        target = target.filter((item) => item.chipsAmount <= this.maxStackSize)
            .map(function(item) {
                return {
                    amount: item.amount,
                    chipsAmount: item.chipsAmount,
                    difference: amount - (item.amount * item.chipsAmount),
                };
            });
        const difference = target
            .map((item) => Math.abs(item.difference))
            .reduce((prev, curr) => Math.min(prev, curr), Number.MAX_VALUE);
        const minimalSlice = target.filter((item) => Math.abs(item.difference) === difference)[0];
        return {
            difference: minimalSlice.difference,
            count: minimalSlice.chipsAmount,
            index: chipAmounts.filter((item) => item <= minimalSlice.amount).length,
        };
    }

    private calculateStackInternal(amount: number, chipAmounts: number[]): ChipStack[] {
        const result = [];
        let amountLeft = amount;
        for (let i = 0; i < chipAmounts.length; i++) {
            const chipAmount = chipAmounts[i];
            const chipsQty = Math.floor(amountLeft / chipAmount);
            if (chipsQty === 0) {
                continue;
            }

            result.push({ type: i + 1, amount: chipsQty });
            amountLeft -= chipsQty * chipAmount;
        }

        if (amountLeft > 0 && result.length === 0) {
            result.push({ type: 1, amount: 1 });
        }

        return result;
    }
}
