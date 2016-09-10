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
        var value = valueAccessor();
		var observable: KnockoutObservable<boolean>;
		var duration: number;
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
var imageBindingHandler = {
    options: {
        enabled: true
    },
    init: function (element: HTMLElement, valueAccessor: () => any, allBindingsAccessor: KnockoutAllBindingsAccessor,
			viewModel: any, bindingContext: KnockoutBindingContext) {
        if (!imageBindingHandler.options.enabled) {
            return;
        }

        var canvas = document.createElement("canvas");
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

        var innerBindingContext = bindingContext.extend({ $canvas: canvas });
        ko.applyBindingsToDescendants(innerBindingContext, element);
        return { controlsDescendantBindings: true };
    },
    update: function (element: HTMLElement, valueAccessor: () => any, allBindingsAccessor: KnockoutAllBindingsAccessor,
			viewModel: any, bindingContext: KnockoutBindingContext) {
        if (!imageBindingHandler.options.enabled) {
            return;
        }

        var value = valueAccessor();
        var imageUrl = <string>ko.unwrap(value);
        if (imageUrl === undefined || imageUrl === null) {
            return;
        }

        var canvas = <HTMLCanvasElement>bindingContext["$canvas"];
        canvas.width = window.devicePixelRatio * $(element).width();
        canvas.height = window.devicePixelRatio * $(element).height();
        var ctx = <CanvasRenderingContext2D>canvas.getContext("2d");
        var imageLoader = new Image();
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
            return '';
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
		var propsObject = ko.utils.unwrapObservable(valueAccessor());
		var val = {};
		for (var propName in propsObject) {
			if (propsObject.hasOwnProperty(propName)) {
				var value = _(propsObject[propName]);
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
        var lockey = <string>ko.utils.unwrapObservable(valueAccessor());
        var value = _(lockey);
        ko.bindingHandlers.html.update(element, () => value, allBindingsAccessor, viewModel, bindingContext);
    }
};
ko.bindingHandlers["spinner"] = {
    init: function (element, valueAccessor: () => any, allBindingsAccessor: KnockoutAllBindingsAccessor,
			viewModel: any, bindingContext: KnockoutBindingContext) {
        var opts = {
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
        var spinner = new Spinner(opts).spin(element);
    },
    update: function (element, valueAccessor: () => any, allBindingsAccessor: KnockoutAllBindingsAccessor,
			viewModel: any, bindingContext: KnockoutBindingContext) {
        ko.bindingHandlers.visible.update(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext);
    }
};
var dateBindingHander = {
    update: function (element, valueAccessor: () => any, allBindingsAccessor: KnockoutAllBindingsAccessor,
			viewModel: any, bindingContext: KnockoutBindingContext) {
        var lockey = <string>ko.utils.unwrapObservable(valueAccessor());
        var value = _(lockey);
        ko.bindingHandlers.text.update(element, function () {
            var dateValue = moment(value);
            if (debugSettings.application.useUtcDates) {
                dateValue = dateValue.utc();
            }

            if (timeService.timeDiff !== null) {
                //dateValue.add(timeService.timeDiff, 'ms');
            }

            return dateValue.format(dateBindingHander.format);
        }, allBindingsAccessor, viewModel, bindingContext);
    },
    format: "D MMM, H:mm"
};
ko.bindingHandlers["date"] = dateBindingHander;
ko.bindingHandlers["selector"] = {
    init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
        var value = valueAccessor();
        ko.bindingHandlers.click.init(element, function () {
            return function () {
                var val = value();
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
        var value = valueAccessor();
        value = ko.unwrap(value);
        var isFast = false;
        var commandTag = value;
        if (typeof value === "object") {
            isFast = value.fast || false;
            commandTag = value.command;
        }

        var wrapperValueAccessor: () => any;
        var handler = function (viewMovel, event) {
            if (typeof commandTag === "string") {
                app.executeCommand(commandTag);
            } else if (typeof commandTag === "function") {
                viewModel = bindingContext["$data"];
                var functionValue = <Function>commandTag;
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
var numericTextHandler = {
    update: function (element, valueAccessor: () => any, allBindingsAccessor: KnockoutAllBindingsAccessor,
			viewModel: any, bindingContext: KnockoutBindingContext) {
        var value = <any>ko.utils.unwrapObservable(valueAccessor());
        var positions = <number>ko.utils.unwrapObservable(allBindingsAccessor().positions) || numericTextHandler.defaultPositions;
		var finalFormatted: string;
        if (value != null) {
            var numberValue = parseFloat(value);
            if (!isNaN(numberValue)) {
                var formattedValue = numberValue.toFixed(positions);
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
        var x = original.split(".");
        var x1 = x[0];
        var x2 = x.length > 1 ? "." + x[1] : "";
        var rgx = /(\d+)(\d{3})/;
        while (rgx.test(x1)) {
            x1 = x1.replace(rgx, "$1" + numericTextHandler.separator + "$2");
        }

        return x1 + x2;

    }
};
ko.bindingHandlers["numericText"] = numericTextHandler;
var currencySymbolBindingHandler = {
	moneySymbol: "$",
	chipsSymbol: "",
	update: function (element, valueAccessor: () => any, allBindingsAccessor: KnockoutAllBindingsAccessor,
			viewModel: any, bindingContext: KnockoutBindingContext) {
        var value = <any>ko.utils.unwrapObservable(valueAccessor());
        var positions = <number>ko.utils.unwrapObservable(allBindingsAccessor());
		var text: string;
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
    disabled?: boolean,
    updateOnSlideChange?: boolean;
}
interface SwipeKnockoutBindingContext extends KnockoutBindingContext {
    $swiper: Swipe;
    $swiperIndex?: number;
    insideUpdate: boolean;
    insideCallback: boolean;
    firstTime: boolean;
}
var swipeHandler = {
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
        var valObservable: SwipeBindingOptions = valueAccessor();
        var autoFix = valObservable.autoFix === undefined ? true : !!valObservable.autoFix;
        var breakDistance = valObservable.breakDistance === undefined ? null : valObservable.breakDistance;
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
        var updateOnSlideChange = valObservable.updateOnSlideChange === undefined
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

        var options : SwipeOptions = {
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
        var valObservable: SwipeBindingOptions = valueAccessor();
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

        var swiper = bindingContext.$swiper;
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
var scrollHandler = {
    logging: false,
    defaultDuration: 400,
    log: function (message, ...params) {
        if (scrollHandler.logging) {
            console.log(message, params);
        }
    },
    setup: function (element: HTMLElement, options: ScrollBindingOptions) {
        var scroller: IScroll;
        var scrollerOptions = {
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
                var top = parseInt($(".registration .popup-container").css("padding-top"), 10) || 0;
                var bottom = parseInt($(".registration .popup-container").css("padding-bottom"), 10) || 0;
                var adjustment = top + bottom;
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
            var iscroller = <IScroll>ko.utils.domData.get(element, "iscroll");
            if (iscroller != null) {
                iscroller.destroy();
            }
        });
        if (options.refreshTrigger != null) {
            var left = ko.computed(function () {
                return options.refreshTrigger();
            }).extend({ rateLimit: 10 }).subscribe(function (value) {
                setTimeout(() => {
                    scrollHandler.log("Refresh trigger");
                    var iscroller = <IScroll>ko.utils.domData.get(element, "iscroll");
                    if (iscroller != null) {
                        iscroller.refresh();
                    }
                }, 0);
            });
        }
    },
    init: function (element: HTMLElement, valueAccessor: () => any, allBindingsAccessor: KnockoutAllBindingsAccessor,
			viewModel: any, bindingContext: ScrollKnockoutBindingContext) {
        var valObservable: ScrollBindingOptions = valueAccessor();
        var suppressed = valObservable.suppress || false;
        if (!suppressed) {
            scrollHandler.setup(element, valObservable);
        }
    }
};
ko.bindingHandlers["scroll"] = scrollHandler;
ko.bindingHandlers["bet"] = {
    update: function (element: HTMLElement, valueAccessor: () => any, allBindingsAccessor: KnockoutAllBindingsAccessor,
			viewModel: any, bindingContext: KnockoutBindingContext) {
        var value = ko.unwrap(valueAccessor());
        if (value === null || value === undefined || value === 0) {
            element.innerHTML = "";
        } else {
            while (element.firstChild) {
                element.removeChild(element.firstChild);
            }

            var chipItem = new ChipItem(1);
            var stackInfo = chipItem.getData(value);
            var container = document.createElement("div");
            if (stackInfo.length === 1) {
                container.setAttribute("class", "chip-container stack1");
            } else {
                container.setAttribute("class", "chip-container stack2");
            }

            for (var i = 0; i < stackInfo.length; i++) {
                var chipsInfo = stackInfo[i];
                var stack = document.createElement("div");
                stack.setAttribute("class", "chip chip-stack");
                for (var j = 0; j < chipsInfo.length; j++) {
                    var chip = document.createElement("div");
                    chip.setAttribute("class", "chip chip" + chipsInfo[j].toString());
                    stack.appendChild(chip);
                }

                container.appendChild(stack);
            }

            element.appendChild(container);
            var label = document.createElement("div");
            label.setAttribute("class", "label");
            label.innerText = value.toString();
            element.appendChild(label);
        }
    }
};
ko.bindingHandlers["forceFocus"] = {
    init: function (element, valueAccessor: () => any, allBindingsAccessor: KnockoutAllBindingsAccessor,
			viewModel: any, bindingContext: KnockoutBindingContext) {
        var handler = function (data, event: Event) {
            setTimeout(() => {
                var element = <HTMLElement>event.currentTarget;
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
        var value = valueAccessor();
        var functionValue = <Function>value;
        var hammer = Hammer(element, { dragMinDistance: 3 });
        hammer.on("dragup", function (event) {
            functionValue.apply(viewModel);
        });
    }
};

ko.bindingHandlers["slidedown"] = {
    init: function (element, valueAccessor: () => any, allBindingsAccessor: KnockoutAllBindingsAccessor,
			viewModel: any, bindingContext: KnockoutBindingContext) {
        var value = valueAccessor();
        var functionValue = <Function>value;
        var hammer = Hammer(element, { dragMinDistance: 3 });
        hammer.on("dragdown", function (event) {
            functionValue.apply(viewModel);
        });
    }
};
ko.bindingHandlers["slideleft"] = {
    init: function (element, valueAccessor: () => any, allBindingsAccessor: KnockoutAllBindingsAccessor,
			viewModel: any, bindingContext: KnockoutBindingContext) {
        var value = valueAccessor();
        var functionValue = <Function>value;
        var hammer = Hammer(element, { threshold: 10 });
        hammer.on("swipeleft", function (event) {
            functionValue.apply(viewModel);
        });
    }
};

ko.bindingHandlers["slideright"] = {
    init: function (element, valueAccessor: () => any, allBindingsAccessor: KnockoutAllBindingsAccessor,
			viewModel: any, bindingContext: KnockoutBindingContext) {
        var value = valueAccessor();
        var functionValue = <Function>value;
        var hammer = Hammer(element, { threshold: 10 });
        hammer.on("swiperight", function (event) {
            functionValue.apply(viewModel);
        });
    }
};

ko.bindingHandlers["handle"] = {
    init: function (element: HTMLElement, valueAccessor: () => any, allBindingsAccessor: KnockoutAllBindingsAccessor,
			viewModel: any, bindingContext: KnockoutBindingContext) {
        var value = valueAccessor();
        var functionValue = <Function>value;
        var hammer = Hammer(element, { drag_block_horizontal: true, drag_lock_to_axis: true });
        var parent = element.parentElement;
        hammer.on("drag", function (event) {
            var touch = event.gesture.touches[0];
            var offset = 50;
            if (PageBlock.useDoubleView) {
                offset = $(element).width() / 4;
            }

            var relativePosition = touch.pageX - $(parent).offset().left - offset;
            var currentRelativePosition = functionValue.apply(viewModel);
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
        var value = <FadeTableBindingSettings>valueAccessor();
        var duration = value.duration || 1000;
        var subscription = value.item.subscribe(function (val) {
            if (bindingContext.$timeout != null) {
                return;
            }

            var continuation = () => {
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