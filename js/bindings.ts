/// <reference path="./_references.ts" />
/// <reference path="./selector.ts" />
/* tslint:disable:no-string-literal */

import ko = require("knockout");
import * as moment from "moment";
import { App } from "./app";
import * as timeService from "./timeService";
import { debugSettings } from "./debugsettings";

declare var app: App;

export function registerBindings() {
// Binding set loading variable for short amount of time.
ko.bindingHandlers["loading"] = {
    update: function (element: HTMLElement, valueAccessor: () => any, allBindingsAccessor: KnockoutAllBindingsAccessor,
            viewModel: any, bindingContext: KnockoutBindingContext) {
        const value = valueAccessor();
        let observable: KnockoutObservable<boolean>;
        let duration: number;
        if (ko.isObservable(value)) {
            observable = value;
            duration = 500;
        } else {
            observable = value.option;
            duration = <number>(value.duration || 500);
        }

        observable(true);
        setTimeout(() => observable(false), duration);
    }
};
const imageBindingHandler = {
    options: {
        enabled: true
    },
    init: function (element: HTMLElement, valueAccessor: () => any, allBindingsAccessor: KnockoutAllBindingsAccessor,
            viewModel: any, bindingContext: KnockoutBindingContext) {
        if (!imageBindingHandler.options.enabled) {
            return;
        }

        const canvas = document.createElement("canvas");
        canvas.width = window.devicePixelRatio * $(element).width();
        canvas.height = window.devicePixelRatio * $(element).height();
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        element.appendChild(canvas);
        if (bindingContext["$canvas"] !== undefined) {
            console.warn("Canvas already defined for the element." + (element.id || ""));
        }

        bindingContext["$canvas"] = canvas;
        ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
            delete bindingContext["$canvas"];
        });

        const innerBindingContext = bindingContext.extend({ $canvas: canvas });
        ko.applyBindingsToDescendants(innerBindingContext, element);
        return { controlsDescendantBindings: true };
    },
    update: function (element: HTMLElement, valueAccessor: () => any, allBindingsAccessor: KnockoutAllBindingsAccessor,
            viewModel: any, bindingContext: KnockoutBindingContext) {
        if (!imageBindingHandler.options.enabled) {
            return;
        }

        const value = valueAccessor();
        const imageUrl = <string>ko.unwrap(value);
        if (imageUrl === undefined || imageUrl === null) {
            return;
        }

        const canvas = <HTMLCanvasElement>bindingContext["$canvas"];
        canvas.width = window.devicePixelRatio * $(element).width();
        canvas.height = window.devicePixelRatio * $(element).height();
        const ctx = <CanvasRenderingContext2D>canvas.getContext("2d");
        const imageLoader = new Image();
        imageLoader.onload = function () {
            ctx.drawImage(imageLoader, 0, 0, imageLoader.width, imageLoader.height);
        };
        imageLoader.src = imageUrl;
    }
};
ko.bindingHandlers["image"] = imageBindingHandler;
ko.bindingHandlers["ltext"] = {
    update: function (element, valueAccessor: () => any, allBindingsAccessor: KnockoutAllBindingsAccessor,
            viewModel: any, bindingContext: KnockoutBindingContext) {
        const parameters = ko.utils.unwrapObservable(valueAccessor());
        if (parameters === null || parameters === undefined) {
            return "";
        }

        let value: string;
        if (typeof parameters === "string") {
            value = _(parameters);
        } else if (typeof parameters === "Function") {
            value = _(parameters);
        } else {
            value = _(parameters.key, parameters.params);
        }

        ko.bindingHandlers.text.update(element, () => value, allBindingsAccessor, viewModel, bindingContext);
    }
};
ko.bindingHandlers["lattr"] = {
    update: function (element, valueAccessor: () => any, allBindingsAccessor: KnockoutAllBindingsAccessor,
        viewModel: any, bindingContext: KnockoutBindingContext) {
        const propsObject = ko.utils.unwrapObservable(valueAccessor());
        let val = {};
        for (let propName in propsObject) {
            if (propsObject.hasOwnProperty(propName)) {
                const value = _(propsObject[propName]);
                val[propName] = value;
            }
        }

        ko.bindingHandlers.attr.update(element, () => val, allBindingsAccessor, viewModel, bindingContext);
    }
};
ko.bindingHandlers["lhtml"] = {
    init: function (element, valueAccessor: () => any, allBindingsAccessor: KnockoutAllBindingsAccessor,
            viewModel: any, bindingContext: KnockoutBindingContext) {
        ko.bindingHandlers.html.init(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext);
    },
    update: function (element, valueAccessor: () => any, allBindingsAccessor: KnockoutAllBindingsAccessor,
            viewModel: any, bindingContext: KnockoutBindingContext) {
        const lockey = <string>ko.utils.unwrapObservable(valueAccessor());
        const value = _(lockey);
        ko.bindingHandlers.html.update(element, () => value, allBindingsAccessor, viewModel, bindingContext);
    }
};
ko.bindingHandlers["spinner"] = {
    init: function (element, valueAccessor: () => any, allBindingsAccessor: KnockoutAllBindingsAccessor,
            viewModel: any, bindingContext: KnockoutBindingContext) {
        const opts = {
            lines: 13, // The number of lines to draw
            length: 4, // The length of each line
            width: 2, // The line thickness
            radius: 6, // The radius of the inner circle
            corners: 1, // Corner roundness (0..1)
            rotate: 0, // The rotation offset
            direction: 1, // 1: clockwise, -1: counterclockwise
            color: "#fff", // #rgb or #rrggbb or array of colors
            speed: 1, // Rounds per second
            trail: 60, // Afterglow percentage
            shadow: false, // Whether to render a shadow
            hwaccel: false, // Whether to use hardware acceleration
            className: "spinner", // The CSS class to assign to the spinner
            zIndex: 2e9, // The z-index (defaults to 2000000000)
            top: "auto", // Top position relative to parent in px
            left: "auto" // Left position relative to parent in px
        };
        const spinner = new Spinner(opts).spin(element);
    },
    update: function (element, valueAccessor: () => any, allBindingsAccessor: KnockoutAllBindingsAccessor,
            viewModel: any, bindingContext: KnockoutBindingContext) {
        ko.bindingHandlers.visible.update(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext);
    }
};
const dateBindingHander = {
    update: function (element, valueAccessor: () => any, allBindingsAccessor: KnockoutAllBindingsAccessor,
            viewModel: any, bindingContext: KnockoutBindingContext) {
        const lockey = <string>ko.utils.unwrapObservable(valueAccessor());
        const value = _(lockey);
        ko.bindingHandlers.text.update(element, function () {
            let dateValue = moment(value);
            if (debugSettings.application.useUtcDates) {
                dateValue = dateValue.utc();
            }

            if (timeService.timeDiff !== null) {
                // dateValue.add(timeService.timeDiff, 'ms');
            }

            return dateValue.format(dateBindingHander.format);
        }, allBindingsAccessor, viewModel, bindingContext);
    },
    format: "D MMM, H:mm"
};
ko.bindingHandlers["date"] = dateBindingHander;
ko.bindingHandlers["selector"] = {
    init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
        const value = valueAccessor();
        ko.bindingHandlers.click.init(element, function () {
            return function () {
                const val = value();
                value.options.forEach(function (item: SelectorItem) {
                    item.selected = val === item.value;
                });
                app.showSelector(value.caption, value.options, (item: SelectorItem) => {
                    value(item.value);
                });
            };
        }, allBindings, viewModel, bindingContext);
    }
};
ko.bindingHandlers["command"] = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        let value = valueAccessor();
        value = ko.unwrap(value);
        let isFast = false;
        let commandTag = value;
        if (typeof value === "object") {
            isFast = value.fast || false;
            commandTag = value.command;
        }

        let wrapperValueAccessor: () => any;
        const handler = function (viewMovel, event) {
            if (typeof commandTag === "string") {
                app.executeCommand(commandTag);
            } else if (typeof commandTag === "function") {
                viewModel = bindingContext["$data"];
                const functionValue = <Function>commandTag;
                functionValue.apply(viewModel, [event]);
            } else {
                console.error("Invalid argument " + commandTag + " passed to the binding");
            }
        };
        if (platformInfo.hasTouch()) {
            wrapperValueAccessor = function (): any {
                if (isFast) {
                    return {
                        touchstart: handler
                    };
                }

                return {
                    tap: handler
                };
            };
        } else {
            wrapperValueAccessor = function () {
                return {
                    click: handler
                };
            };
        }
        ko.bindingHandlers.event.init(element, wrapperValueAccessor, allBindingsAccessor, viewModel, bindingContext);
    }
};
const numericTextHandler = {
    update: function (element, valueAccessor: () => any, allBindingsAccessor: KnockoutAllBindingsAccessor,
            viewModel: any, bindingContext: KnockoutBindingContext) {
        const value = <any>ko.utils.unwrapObservable(valueAccessor());
        const positions = <number>ko.utils.unwrapObservable(allBindingsAccessor().positions) || numericTextHandler.defaultPositions;
        let finalFormatted: string;
        if (value != null) {
            const numberValue = parseFloat(value);
            if (!isNaN(numberValue)) {
                const formattedValue = numberValue.toFixed(positions);
                finalFormatted = <string>numericTextHandler.withCommas(formattedValue);
            } else {
                finalFormatted = "-";
            }
        } else {
            finalFormatted = "";
        }
        ko.bindingHandlers.text.update(element, function () { return finalFormatted; }, allBindingsAccessor, viewModel, bindingContext);
    },

    defaultPositions: 2,
    separator: ",",

    withCommas: function (original: string) {
        original += "";
        const x = original.split(".");
        let x1 = x[0];
        const x2 = x.length > 1 ? "." + x[1] : "";
        const rgx = /(\d+)(\d{3})/;
        while (rgx.test(x1)) {
            x1 = x1.replace(rgx, "$1" + numericTextHandler.separator + "$2");
        }

        return x1 + x2;

    }
};
ko.bindingHandlers["numericText"] = numericTextHandler;
const currencySymbolBindingHandler = {
    moneySymbol: "$",
    chipsSymbol: "",
    update: function (element, valueAccessor: () => any, allBindingsAccessor: KnockoutAllBindingsAccessor,
            viewModel: any, bindingContext: KnockoutBindingContext) {
        const value = <any>ko.utils.unwrapObservable(valueAccessor());
        const positions = <number>ko.utils.unwrapObservable(allBindingsAccessor());
        let text: string;
        if (value === 1) {
            text = currencySymbolBindingHandler.moneySymbol;
        } else {
            text = currencySymbolBindingHandler.chipsSymbol;
        }

        ko.bindingHandlers.text.update(element, function () { return text; }, allBindingsAccessor, viewModel, bindingContext);
    }
};
ko.bindingHandlers["currencySymbol"] = currencySymbolBindingHandler;
interface SwipeBindingOptions {
    index: KnockoutObservable<number>;
    duration?: number;
    slideWidth?: number;
    autoFix?: boolean;
    breakDistance?: number;
    disabled?: boolean;
    updateOnSlideChange?: boolean;
}
interface SwipeKnockoutBindingContext extends KnockoutBindingContext {
    $swiper: Swipe;
    $swiperIndex?: number;
    insideUpdate: boolean;
    insideCallback: boolean;
    firstTime: boolean;
}
const swipeHandler = {
    insideUpdate: false,
    insideCallback: false,
    firstTime: true,
    logging: false,
    defaultDuration: 400,
    log: function (message, ...params) {
        if (swipeHandler.logging) {
            console.log(message, params);
        }
    },
    init: function (element: HTMLElement, valueAccessor: () => any, allBindingsAccessor: KnockoutAllBindingsAccessor,
            viewModel: any, bindingContext: SwipeKnockoutBindingContext) {
        const valObservable: SwipeBindingOptions = valueAccessor();
        const autoFix = valObservable.autoFix === undefined ? true : !!valObservable.autoFix;
        const breakDistance = valObservable.breakDistance === undefined ? null : valObservable.breakDistance;
        if (valObservable.disabled) {
            element.style.visibility = "visible";
            return;
        }

        bindingContext.firstTime = true;
        bindingContext.insideUpdate = false;
        bindingContext.insideCallback = false;
        element.onscroll = function () {
            element.scrollLeft = 0;
        };
        const updateOnSlideChange = valObservable.updateOnSlideChange === undefined
            ? true
            : valObservable.updateOnSlideChange;
        function endHandler(index, elem) {
                swipeHandler.log("Callback: index - ", index, ", value - ", valObservable.index());
                if (bindingContext.insideUpdate) {
                    swipeHandler.log("swipeHandler.insideUpdate = false");
                    bindingContext.insideUpdate = false;
                    return;
                }

                bindingContext.insideCallback = true;
                swipeHandler.log("swipeHandler.insideCallback = true");
                valObservable.index(index + 1);
                setTimeout(function () {
                    bindingContext.insideCallback = false;
            }, updateOnSlideChange ? 100 : 0);
        }

        const options: SwipeOptions = {
            startSlide: valObservable.index() - 1,
            speed: valObservable.duration || swipeHandler.defaultDuration,
            slideWidth: ko.unwrap(valObservable.slideWidth || 0),
            continuous: true,
            disableScroll: false,
            stopPropagation: false,
            breakDistance: breakDistance
        };
        if (updateOnSlideChange) {
            options.callback = endHandler;
        } else {
            // When using callback instead of transitionEnd
            // The scrolling animation feels luggish when swiping very fast.
            // Luggish appears because next translation which already started and continued, was 
            // stopped during updating valObservable, and thus probably causing the 
            // animation restart.
            options.transitionEnd = endHandler;
        }

        bindingContext.$swiper = new Swipe(element, options);
    },
    update: function (element, valueAccessor: () => any, allBindingsAccessor: KnockoutAllBindingsAccessor,
            viewModel: any, bindingContext: SwipeKnockoutBindingContext) {
        const valObservable: SwipeBindingOptions = valueAccessor();
        if (valObservable.disabled) {
            return;
        }

        swipeHandler.log("Update: value - ", valObservable.index());
        bindingContext.$swiperIndex = valObservable.index();
        if (bindingContext.firstTime) {
            bindingContext.firstTime = false;
            return;
        }

        if (bindingContext.insideCallback) {
            swipeHandler.log("swipeHandler.insideCallback = false");
            swipeHandler.insideCallback = false;
            return;
        }

        const swiper = bindingContext.$swiper;
        swipeHandler.log("swipeHandler.insideUpdate = true");
        bindingContext.insideUpdate = true;
        swiper.slide(valObservable.index() - 1, valObservable.duration || swipeHandler.defaultDuration);
    }
};
ko.bindingHandlers["swipe"] = swipeHandler;
ko.bindingHandlers["swipeForeach"] = {
    init: function (element: HTMLElement, valueAccessor: () => any, allBindingsAccessor: KnockoutAllBindingsAccessor,
            viewModel: any, bindingContext: SwipeKnockoutBindingContext) {
        swipeHandler.log("swipeForeach init ", valueAccessor()(), viewModel, bindingContext.$swiper);
        ko.bindingHandlers.foreach.init(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext);
        return { controlsDescendantBindings: true };
    },
    update: function (element, valueAccessor: () => any, allBindingsAccessor: KnockoutAllBindingsAccessor,
            viewModel: any, bindingContext: SwipeKnockoutBindingContext) {
        swipeHandler.log("swipeForeach update ", valueAccessor()(), viewModel, bindingContext.$swiper);
        ko.bindingHandlers.foreach.update(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext);
        swipeHandler.log("Preious slider position ", bindingContext.$swiperIndex);
        bindingContext.$swiper.kill();
        bindingContext.$swiper.setup();
        bindingContext.$swiper.attachEvents();
        bindingContext.$swiper.slide(bindingContext.$swiperIndex - 1, 0);
    }
};
ko.virtualElements.allowedBindings["swipeForeach"] = true;
interface ScrollBindingOptions {
    refreshTrigger: KnockoutObservable<any>;
    suppress?: boolean;
}
interface ScrollKnockoutBindingContext extends KnockoutBindingContext {
    $scroll: IScroll;
}
const scrollHandler = {
    logging: false,
    defaultDuration: 400,
    log: function (message, ...params) {
        if (scrollHandler.logging) {
            console.log(message, params);
        }
    },
    setup: function (element: HTMLElement, options: ScrollBindingOptions) {
        let scroller: IScroll;
        const scrollerOptions = {
            hScrollbar: false,
            vScrollbar: false,
            lockDirection: true,
            deceleration: 0.0001,
            bounceEasing: "quadratic"
        };
        setTimeout(() => {
            scrollHandler.log("Initializing scroller for the first time");
            scroller = new IScroll(element, scrollerOptions);
            if ($(element).css("box-sizing") === "border-box") {
                const top = parseInt($(".registration .popup-container").css("padding-top"), 10) || 0;
                const bottom = parseInt($(".registration .popup-container").css("padding-bottom"), 10) || 0;
                const adjustment = top + bottom;
                console.log(scroller.maxScrollY, top, bottom);
                if (scroller.maxScrollY > 0) {
                    scroller.maxScrollY = scroller.maxScrollY + adjustment;
                } else {
                    scroller.maxScrollY = scroller.maxScrollY - adjustment;
                }
            }

            ko.utils.domData.set(element, "iscroll", scroller);
        }, 500);
        /* We have non zero timeout here above to prevent scroll area in the lobby 
        from freezing for the first time when it is opened.*/
        ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
            // This will be called when the element is removed by Knockout or
            // if some other part of your code calls ko.removeNode(element)
            scrollHandler.log("Disposing scroller");
            const iscroller = <IScroll>ko.utils.domData.get(element, "iscroll");
            if (iscroller != null) {
                iscroller.destroy();
            }
        });
        if (options.refreshTrigger != null) {
            const left = ko.computed(function () {
                return options.refreshTrigger();
            }).extend({ rateLimit: 10 }).subscribe(function (value) {
                setTimeout(() => {
                    scrollHandler.log("Refresh trigger");
                    const iscroller = <IScroll>ko.utils.domData.get(element, "iscroll");
                    if (iscroller != null) {
                        iscroller.refresh();
                    }
                }, 0);
            });
        }
    },
    init: function (element: HTMLElement, valueAccessor: () => any, allBindingsAccessor: KnockoutAllBindingsAccessor,
            viewModel: any, bindingContext: ScrollKnockoutBindingContext) {
        const valObservable: ScrollBindingOptions = valueAccessor();
        const suppressed = valObservable.suppress || false;
        if (!suppressed) {
            scrollHandler.setup(element, valObservable);
        }
    }
};
ko.bindingHandlers["scroll"] = scrollHandler;
ko.bindingHandlers["bet"] = {
    update: function (element: HTMLElement, valueAccessor: () => any, allBindingsAccessor: KnockoutAllBindingsAccessor,
            viewModel: any, bindingContext: KnockoutBindingContext) {
        const value = ko.unwrap(valueAccessor());
        if (value === null || value === undefined || value === 0) {
            element.innerHTML = "";
        } else {
            while (element.firstChild) {
                element.removeChild(element.firstChild);
            }

            const chipItem = new ChipItem(1);
            const stackInfo = chipItem.getData(value);
            const container = document.createElement("div");
            if (stackInfo.length === 1) {
                container.setAttribute("class", "chip-container stack1");
            } else {
                container.setAttribute("class", "chip-container stack2");
            }

            for (let i = 0; i < stackInfo.length; i++) {
                const chipsInfo = stackInfo[i];
                const stack = document.createElement("div");
                stack.setAttribute("class", "chip chip-stack");
                for (let j = 0; j < chipsInfo.length; j++) {
                    const chip = document.createElement("div");
                    chip.setAttribute("class", "chip chip" + chipsInfo[j].toString());
                    stack.appendChild(chip);
                }

                container.appendChild(stack);
            }

            element.appendChild(container);
            const label = document.createElement("div");
            label.setAttribute("class", "label");
            label.innerText = value.toString();
            element.appendChild(label);
        }
    }
};
ko.bindingHandlers["forceFocus"] = {
    init: function (element, valueAccessor: () => any, allBindingsAccessor: KnockoutAllBindingsAccessor,
            viewModel: any, bindingContext: KnockoutBindingContext) {
        const handler = function (data, event: Event) {
            setTimeout(() => {
                const element = <HTMLElement>event.currentTarget;
                element.focus();
            }, 0);
        };
        ko.bindingHandlers.event.init(element, function () { return { touchstart: handler }; },
            allBindingsAccessor, viewModel, bindingContext);
    }
};
ko.bindingHandlers["slideup"] = {
    init: function (element, valueAccessor: () => any, allBindingsAccessor: KnockoutAllBindingsAccessor,
            viewModel: any, bindingContext: KnockoutBindingContext) {
        const value = valueAccessor();
        const functionValue = <Function>value;
        const hammer = Hammer(element, { dragMinDistance: 3 });
        hammer.on("dragup", function (event) {
            functionValue.apply(viewModel);
        });
    }
};

ko.bindingHandlers["slidedown"] = {
    init: function (element, valueAccessor: () => any, allBindingsAccessor: KnockoutAllBindingsAccessor,
            viewModel: any, bindingContext: KnockoutBindingContext) {
        const value = valueAccessor();
        const functionValue = <Function>value;
        const hammer = Hammer(element, { dragMinDistance: 3 });
        hammer.on("dragdown", function (event) {
            functionValue.apply(viewModel);
        });
    }
};
ko.bindingHandlers["slideleft"] = {
    init: function (element, valueAccessor: () => any, allBindingsAccessor: KnockoutAllBindingsAccessor,
            viewModel: any, bindingContext: KnockoutBindingContext) {
        const value = valueAccessor();
        const functionValue = <Function>value;
        const hammer = Hammer(element, { threshold: 10 });
        hammer.on("swipeleft", function (event) {
            functionValue.apply(viewModel);
        });
    }
};

ko.bindingHandlers["slideright"] = {
    init: function (element, valueAccessor: () => any, allBindingsAccessor: KnockoutAllBindingsAccessor,
            viewModel: any, bindingContext: KnockoutBindingContext) {
        const value = valueAccessor();
        const functionValue = <Function>value;
        const hammer = Hammer(element, { threshold: 10 });
        hammer.on("swiperight", function (event) {
            functionValue.apply(viewModel);
        });
    }
};

ko.bindingHandlers["handle"] = {
    init: function (element: HTMLElement, valueAccessor: () => any, allBindingsAccessor: KnockoutAllBindingsAccessor,
            viewModel: any, bindingContext: KnockoutBindingContext) {
        const value = valueAccessor();
        const functionValue = <Function>value;
        const hammer = Hammer(element, { drag_block_horizontal: true, drag_lock_to_axis: true });
        const parent = element.parentElement;
        hammer.on("drag", function (event) {
            const touch = event.gesture.touches[0];
            let offset = 50;
            if (PageBlock.useDoubleView) {
                offset = $(element).width() / 4;
            }

            const relativePosition = touch.pageX - $(parent).offset().left - offset;
            const currentRelativePosition = functionValue.apply(viewModel);
            if (Math.abs(currentRelativePosition - relativePosition) < $(".slider-handle").width()) {
                viewModel.setPosition(relativePosition);
            }
        });
    }
};
interface FadeTableBindingSettings {
    item: KnockoutSubscribable<any>;
    target: KnockoutObservable<boolean>;
    duration?: number;
}
interface FadeTableBindingContext extends KnockoutBindingContext {
    $timeout: number;
}
ko.bindingHandlers["fadeTable"] = {
    init: function (element, valueAccessor: () => any, allBindingsAccessor: KnockoutAllBindingsAccessor,
            viewModel: any, bindingContext: FadeTableBindingContext) {
        const value = <FadeTableBindingSettings>valueAccessor();
        const duration = value.duration || 1000;
        const subscription = value.item.subscribe(function (val) {
            if (bindingContext.$timeout != null) {
                return;
            }

            const continuation = () => {
                value.target(false);
                bindingContext.$timeout = null;
            };
            value.target(true);
            bindingContext.$timeout = setTimeout(continuation, duration);
        });
        ko.utils.domNodeDisposal.addDisposeCallback(element, () => subscription.dispose());
    }
};
}