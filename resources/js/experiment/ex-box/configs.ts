import {EventEmitter} from "events";

export class Configs extends EventEmitter {

    constructor() {
        super()
    }

    protected randomId() {
        return (Math.random() + 1).toString(36).substring(7)
    }

    protected getElementParent(element: HTMLElement) {
        if (!element) {
            return null;
        }

        const isOverflowX = (el: HTMLElement) => {
            const style = window.getComputedStyle(el);
            const overflowX = style.getPropertyValue('overflow-y');
            return (overflowX === 'auto' || overflowX === 'scroll');
        };

        if (isOverflowX(element)) {
            return element;
        }

        return this.getElementParent(element.parentElement);
    }
}
