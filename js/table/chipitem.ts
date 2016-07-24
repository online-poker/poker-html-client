/// <reference path="../_references.ts" />

interface ChipStack {
    type: number;
    amount: number;
}

interface ChipStackCalcIntermediate {
    difference: number;
    count: number;
    index: number;
}

class ChipItem {
    baseAmount: KnockoutObservable<number>;
    maxStackCount = 5;

    constructor(base: number) {
        this.baseAmount = ko.observable(base);
    }

    public getData(amount: number) {
        var self = this;
        var list = [1, 5, 10, 50, 100, 500].map((item) => (item * self.baseAmount()));
        var stack = this.calculateStackSimple(amount, list);
        return this.transform(stack);
    }

    public transform(stack: ChipStack[]) {
        var result = <number[][]>[];
        for (var i = 0; i < stack.length; i++) {
            var item = <number[]>[];
            for (var j = 0; j < stack[i].amount; j++) {
                item.push(stack[i].type);
            }

            result.push(item);
        }

        return result;
    }

    public calculateStack(amount: number, chipAmounts: number[]) {
        var stack = this.calculateStackInternal(amount, chipAmounts);
        if (stack.length > this.maxStackCount) {
            stack = this.calculateStackInternal(amount, chipAmounts.slice(0, stack.length - 1));
            if (stack.length > this.maxStackCount) {
                stack = this.calculateStackInternal(amount, chipAmounts.slice(0, stack.length - 1));
                if (stack.length > this.maxStackCount) {
                    stack = this.calculateStackInternal(amount, chipAmounts.slice(0, stack.length - 1));
                    if (stack.length > this.maxStackCount) {
                        stack = this.calculateStackInternal(amount, chipAmounts.slice(0, stack.length - 1));
                        if (stack.length > this.maxStackCount) {
                            stack = this.calculateStackInternal(amount, chipAmounts.slice(0, stack.length - 1));
                            if (stack.length > this.maxStackCount) {
                                stack = this.calculateStackInternal(amount, chipAmounts.slice(0, stack.length - 1));
                                if (stack.length > this.maxStackCount) {
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
            return <ChipStack[]>[];
        }

        var item1 = this.calculateStackSimpleInternal(amount, chipAmounts, false);
        if (item1.difference > 0) {
            var item2 = this.calculateStackSimpleInternal(item1.difference, chipAmounts, true);
            if (item2.count === 0) {
                return [{
                    amount: Math.max(item1.count, 1),
                    type: item1.index
                }];
            }

            if (item1.count === 0) {
                return [{
                    amount: Math.max(item2.count, 1),
                    type: item2.index
                }];
            }

            return [{
                amount: Math.max(item1.count, 1),
                type: item1.index
            }, {
                amount: Math.max(item2.count, 1),
                type: item2.index
            }];
        }

        return [{
            amount: Math.max(item1.count, 1),
            type: item1.index
        }];
    }

    private calculateStackSimpleInternal(amount: number, chipAmounts: number[], allowOveradd: boolean): ChipStackCalcIntermediate {
        var self = this;
        var minimumAmount = chipAmounts[0];
        var intermediate = chipAmounts.filter(ca => amount >= ca);
        var upperBound: number;
        if (intermediate.length === 0) {
            upperBound = minimumAmount;
        } else {
            upperBound = intermediate.reduce((prev, current) => Math.max(prev, current), Number.MIN_VALUE);
        }

        if (allowOveradd) {
            intermediate = chipAmounts.filter(ca => amount <= ca);
            if (intermediate.length === 0) {
                upperBound = minimumAmount;
            } else {
                upperBound = intermediate.reduce((prev, current) => Math.min(prev, current), Number.MAX_VALUE);
            }
        }

        var effectiveChipsAmount = chipAmounts.filter(ca => ca <= upperBound);
        var target: {
            amount: number;
            chipsAmount: number;
            difference: number
        }[];
        if (allowOveradd) {
            target = effectiveChipsAmount.map(function (item) {
                return {
                    amount: item,
                    chipsAmount: Math.min(Math.floor((amount + item - 1) / item), self.maxStackCount),
                    difference: 0
                };
            });
            target = target.concat(effectiveChipsAmount.map(function (item) {
                return {
                    amount: item,
                    chipsAmount: Math.min(Math.floor(amount / item), self.maxStackCount),
                    difference: 0
                };
            }));
        } else {
            target = effectiveChipsAmount.map(function (item) {
                return {
                    amount: item,
                    chipsAmount: Math.min(Math.floor(amount / item), self.maxStackCount),
                    difference: 0
                };
            });
        }

        target = target.filter(item => item.chipsAmount <= self.maxStackCount)
            .map(function (item) {
                return {
                    amount: item.amount,
                    chipsAmount: item.chipsAmount,
                    difference: amount - (item.amount * item.chipsAmount)
                };
            });
        var difference = target.map(item => Math.abs(item.difference)).reduce((prev, curr) => Math.min(prev, curr), Number.MAX_VALUE);
        var minimalSlice = target.filter(item => Math.abs(item.difference) === difference)[0];
        return {
            difference: minimalSlice.difference,
            count: minimalSlice.chipsAmount,
            index: chipAmounts.filter((item) => item <= minimalSlice.amount).length
        };
    }

    private calculateStackInternal(amount: number, chipAmounts: number[]): ChipStack[]{
        var result = [];
        var amountLeft = amount;
        for (var i = 0; i < chipAmounts.length; i++) {
            var chipAmount = chipAmounts[i];
            var chipsQty = Math.floor(amountLeft / chipAmount);
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
