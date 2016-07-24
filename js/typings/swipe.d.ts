
interface SwipeOptions {
    startSlide?: number;
    speed?: number;
    auto?: number;
    continuous?: boolean;
    disableScroll?: boolean;
    stopPropagation?: boolean;
    callback?: (index, elem) => void;
    transitionEnd?: (index, elem) => void;
    slideWidth?: number;
    breakDistance?: number;
}

declare class Swipe {
    constructor(container: HTMLElement, options: SwipeOptions);
    prev();
    next();
    getPos();
    getNumSlides();
    kill();
    attachEvents();
    setup();
    slide(index: number, duration: number);
}
