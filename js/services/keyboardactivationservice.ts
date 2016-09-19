/// <reference types="jquery" />
/// <reference path="../typings/cordova.d.ts" />
/// <reference path="../app.ts" />
/* tslint:disable:no-string-literal */

import * as timeService from "../timeService";
import { uiManager } from "./uimanager";
import { App } from "../app";

declare var app: App;

export class KeyboardActivationService {
    static keyboardShowModifier = "keyboard-shown";
    lastPage: string = null;
    lastPageBlock: string = null;
    lastPopup: string = null;

    setup() {
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
            let enableKeyboardEmulationOnDesktop = false;
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
    applyStyles() {
        if (app.currentPopup === null) {
            console.log("Apply kbd styles to current page");
            $("." + uiManager.currentPage + ".sub-page").addClass(KeyboardActivationService.keyboardShowModifier);
            $("." + uiManager.currentPageBlock + ".page-block").addClass(KeyboardActivationService.keyboardShowModifier);
            this.lastPage = uiManager.currentPage;
            this.lastPageBlock = uiManager.currentPageBlock;
        } else {
            console.log("Apply kbd styles to popup " + app.currentPopup);
            $("." + app.currentPopup + ".popup").addClass(KeyboardActivationService.keyboardShowModifier);
            this.lastPopup = app.currentPopup;
        }
    }
    removeStyles() {
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
    forceHideKeyboard() {
        const activeElement = <HTMLElement>document.activeElement;
        if (activeElement !== null) {
            activeElement.blur();
        }

        this.removeStyles();
    }
}
