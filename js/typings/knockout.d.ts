/// <reference types="knockout.validation" />
//ExtendersOptions
//export * from "knockout";

declare module 'knockout' {

    export interface Observable<T> {
        setError(error: string): void;
        isValid(): boolean;
    }

    //export interface KnockoutStatic {
        export function validatedObservable<T>(target: T): Observable<T>;
    //}

    export var validation: KnockoutValidationStatic;

    export interface ObservableExtenderOptions {
        required?: boolean;
        validatable?: boolean;
        email?: boolean;
        maxLength?: number;
        minLength?: number;
        equal?: Observable<any>;
    }
}