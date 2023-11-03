///// <reference types="knockout.validation" />
// import { Observable } from "knockout";
export * from "knockout";

declare module "knockout" {

    export interface Observable<T = any> {
        setError(error: string): void;
        isValid(): boolean;
    }

    export function validatedObservable<T>(initialValue?: T): Observable<T>;

    export interface ValidationErrors {
        showAllMessages(all: boolean): void;
    }

    export interface ValidationGroup {}

    type KnockoutValidationMessageFunction = (params: any, observable: any) => string;

    interface KnockoutValidationRule {
        rule: string;
        params: any;
        message?: string | KnockoutValidationMessageFunction | undefined;
        condition?: (() => boolean) | undefined;
    }

    interface KnockoutValidationRuleBase {
        message: string | KnockoutValidationMessageFunction;
    }

    interface KnockoutValidationRuleDefinition extends KnockoutValidationRuleBase {
        validator(value: any, params: any): boolean;
    }

    interface KnockoutValidationAsyncCallbackArgs {
        isValid: boolean;
        message: string;
    }

    interface KnockoutValidationAsyncCallback {
        (result: boolean): void;
        (result: KnockoutValidationAsyncCallbackArgs): void;
    }

    interface KnockoutValidationAsyncRuleDefinition extends KnockoutValidationRuleBase {
        async: boolean;
        validator(value: any, params: any, callback: KnockoutValidationAsyncCallback): void;
    }

    interface KnockoutValidationRuleDefinitions {
        date: KnockoutValidationRuleDefinition;
        dateISO: KnockoutValidationRuleDefinition;
        digit: KnockoutValidationRuleDefinition;
        email: KnockoutValidationRuleDefinition;
        equal: KnockoutValidationRuleDefinition;
        max: KnockoutValidationRuleDefinition;
        maxLength: KnockoutValidationRuleDefinition;
        min: KnockoutValidationRuleDefinition;
        minLength: KnockoutValidationRuleDefinition;
        notEqual: KnockoutValidationRuleDefinition;
        number: KnockoutValidationRuleDefinition;
        pattern: KnockoutValidationRuleDefinition;
        phoneUS: KnockoutValidationRuleDefinition;
        required: KnockoutValidationRuleDefinition;
        step: KnockoutValidationRuleDefinition;
        unique: KnockoutValidationRuleDefinition;
        [ruleName: string]:
            | KnockoutValidationRuleDefinition
            | KnockoutValidationAsyncRuleDefinition;
    }

    interface KnockoutValidationStatic {
        rules: KnockoutValidationRuleDefinitions;
        group(viewModel: any): ValidationErrors;
    }

    export const validation: KnockoutValidationStatic;

    export interface ItemDefinition {
        text: string;
        value: number;
    }

    export interface ObservableExtenderOptions {
        required?: boolean;
        validatable?: boolean;
        email?: boolean;
        maxLength?: number;
        minLength?: number;
        equal?: Observable<any>;
        options?: {
            caption: string;
            items: ItemDefinition[];
        };
    }
}

