export class ExDOMHelper {
    private elements: Element[]

    constructor(selector: string | Element | Element[]) {
        if (typeof selector === 'string') {
            this.elements = Array.from(document.querySelectorAll(selector))
        } else if (selector instanceof Element) {
            this.elements = [selector]
        } else if (Array.isArray(selector)) {
            this.elements = selector
        } else {
            this.elements = []
        }
    }

    // Method untuk mendapatkan elemen pertama
    first(): ExDOMHelper {
        return new ExDOMHelper(this.elements[0])
    }

    // Method untuk menambahkan event listener
    on<K extends keyof HTMLElementEventMap>(
        eventType: K,
        callback: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any
    ): this {
        this.elements.forEach(el =>
            (el as HTMLElement).addEventListener(eventType, callback)
        )
        return this
    }

    // Method untuk menghapus event listener
    off<K extends keyof HTMLElementEventMap>(
        eventType: K,
        callback?: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any
    ): this {
        if (callback) {
            this.elements.forEach(el =>
                (el as HTMLElement).removeEventListener(eventType, callback)
            );
        } else {
            this.elements.forEach(el => {
                const newElement = el.cloneNode(true) as HTMLElement;
                el.replaceWith(newElement);
                this.elements = [newElement];
            });
        }
        return this;
    }

    // Method untuk mengatur style
    css<K extends keyof CSSStyleDeclaration>(property: K, value: CSSStyleDeclaration[K]): this {
        this.elements.forEach(el => {
            (el as HTMLElement).style[property] = value;
        });
        return this;
    }

    // Method untuk menambahkan class
    addClass(className: string): this {
        this.elements.forEach(el => el.classList.add(className))
        return this
    }

    // Method untuk menghapus class
    removeClass(className: string): this {
        this.elements.forEach(el => el.classList.remove(className))
        return this
    }

    // Method untuk mengatur atau mendapatkan text
    text(content?: string): this | string | undefined {
        if (content === undefined) {
            return this.elements[0]?.textContent
        }
        this.elements.forEach(el => el.textContent = content)
        return this
    }

    // Method untuk mengatur atau mendapatkan HTML
    html(content?: string): this | string | undefined {
        if (content === undefined) {
            return this.elements[0]?.innerHTML
        }
        this.elements.forEach(el => el.innerHTML = content)
        return this
    }

    // Helper function untuk membuat instance baru
    static select(selector: string | Element | Element[]): ExDOMHelper {
        return new ExDOMHelper(selector)
    }
}
