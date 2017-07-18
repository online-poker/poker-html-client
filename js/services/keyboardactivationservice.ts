/// <reference types="jquery" />
/// <reference path="../typings/cordova.d.ts" />
/* tslint:disable:no-string-literal */

import { App } from "../app";
import * as timeService from "../timeservice";
import { uiManager } from "./uimanager";

declare var app: App;

export class KeyboardActivationService {
    public static keyboardShowModifier = "keyboard-shown";
    private lastPage: string = null;
    private lastPageBlock: string = null;
    private lastPopup: string = null;

    public setup() {
        if (window["Keyboard"]) {
            let supported = true;
            if (window["device"]) {
                if (device.platform === "iOS") {
                    const iOS70 = device.version.indexOf("7.0") === 0;
                    const iOS6X = device.version.indexOf("6") === 0;
                    if (!iOS70 && !iOS6X) {
                        // apply only to the iOS 6.x and 7.0
                        supported = false;
                    }

                    supported = false;
                }
            }

            if (!supported) {
                console.log("Native keyboard adjust is available. Don't use our method for adjust page position");
            } else {
                console.log("Native keyboard adjust is not available. Do our best to provide better UI.");
            }

            Keyboard.onshow = () => {
                if (supported) {
                    this.applyStyles();
                }
            };
            Keyboard.onhiding = () => {
                document.body.scrollLeft = 0;
            };
            Keyboard.onhide = () => {
                timeService.setTimeout(() => {
                    this.forceHideKeyboard();
                }, 1);
            };
        } else {
            const enableKeyboardEmulationOnDesktop = false;
            if (enableKeyboardEmulationOnDesktop) {
                const selector = "input[type='text'], input[type='password'], input[type='date'], input[type='number']";
                $("body").on("focus", selector, (event) => {
                    this.applyStyles();
                });
                $("body").on("blur", selector, (event) => {
                    this.removeStyles();
                });
            }
        }
    }
    public forceHideKeyboard() {
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement !== null) {
            activeElement.blur();
        }

        this.removeStyles();
    }
    private applyStyles() {
        const showModifierClassName = KeyboardActivationService.keyboardShowModifier;
        if (app.currentPopup === null) {
            this.log("Apply kbd styles to current page");
            $("." + uiManager.currentPage + ".sub-page").addClass(showModifierClassName);
            $("." + uiManager.currentPageBlock + ".page-block").addClass(showModifierClassName);
            this.lastPage = uiManager.currentPage;
            this.lastPageBlock = uiManager.currentPageBlock;
        } else {
            this.log("Apply kbd styles to popup " + app.currentPopup);
            $("." + app.currentPopup + ".popup").addClass(showModifierClassName);
            this.lastPopup = app.currentPopup;
        }
    }
    private removeStyles() {
        if (this.lastPage !== null) {
            $("." + this.lastPage + ".sub-page").removeClass(KeyboardActivationService.keyboardShowModifier);
            this.lastPage = null;
        }

        if (this.lastPageBlock !== null) {
            $("." + this.lastPageBlock + ".page-block").removeClass(KeyboardActivationService.keyboardShowModifier);
        }

        if (this.lastPopup !== null) {
            $("." + this.lastPopup + ".popup").removeClass(KeyboardActivationService.keyboardShowModifier);
        }
    }
    private log(format: string) {
        // tslint:disable-next-line:no-console
        console.log(format);
    }
}
