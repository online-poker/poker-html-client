/// <reference path="../../Scripts/typings/jquery/jquery.d.ts" />
/// <reference path="../typings/cordova.d.ts" />
/// <reference path="../app.ts" />
/* tslint:disable:no-string-literal */

class KeyboardActivationService {
    static keyboardShowModifier = "keyboard-shown";
    lastPage: string = null;
    lastPageBlock: string = null;
    lastPopup: string = null;

    setup() {
        var self = this;
        if (window["Keyboard"]) {
            var supported = true;
            if (window["device"]) {
                if (device.platform === "iOS") {
                    var iOS70 = device.version.indexOf("7.0") === 0;
                    var iOS6X = device.version.indexOf("6") === 0;
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

            Keyboard.onshow = function () {
                if (supported) {
                    self.applyStyles();
                }
            };
            Keyboard.onhiding = function () {
                document.body.scrollLeft = 0;
            };
            Keyboard.onhide = function () {
                timeService.setTimeout(function () {
                    self.forceHideKeyboard();
                }, 1);
            };
        } else {
            let enableKeyboardEmulationOnDesktop = false;
            if (enableKeyboardEmulationOnDesktop) {
                var selector = "input[type='text'], input[type='password'], input[type='date'], input[type='number']";
                $("body").on("focus", selector, function (event) {
                    self.applyStyles();
                });
                $("body").on("blur", selector, function (event) {
                    self.removeStyles();
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
        var activeElement = <HTMLElement>document.activeElement;
        if (activeElement !== null) {
            activeElement.blur();
        }

        this.removeStyles();
    }
}

var keyboardActivationService = new KeyboardActivationService();
