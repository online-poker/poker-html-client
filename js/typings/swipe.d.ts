
interface SwipeOptions {
    startSlide?: number;
    speed?: number;
    auto?: number;
    continuous?: boolean;
    disableScroll?: boolean;
    stopPropagation?: boolean;
    callback?: (index: number, elem: any) => void;
    transitionEnd?: (index: number, elem: any) => void;
    slideWidth?: number;
    breakDistance?: number;
}

declare class Swipe {
    constructor(container: HTMLElement, options: SwipeOptions);
    prev(): void;
    next(): void;
    getPos(): number;
    getNumSlides(): number;
    kill(): void;
    attachEvents(): void;
    setup(): void;
    slide(index: number, duration: number): void;
}
