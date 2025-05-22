interface ScrollToElementOptions {
    behavior?: ScrollBehavior;
    offset?: number;
    highlighted?: boolean;
    highlightColor?: string;
    highlightDuration?: number;
}

export class SmoothScroll {
    private defaultOptions: ScrollToElementOptions = {
        behavior: 'smooth',
        offset: 250,
        highlighted: false,
        highlightColor: '#ff5757',
        highlightDuration: 2000
    };

    /**
     * Scroll ke element yang ditentukan
     * @param element - Element HTML atau selector string
     * @param options - Konfigurasi scroll
     */
    public scrollToElement(
        element: HTMLElement | string,
        options: ScrollToElementOptions = {}
    ): void {
        const mergedOptions = {...this.defaultOptions, ...options};
        const targetElement = typeof element === 'string'
            ? document.querySelector(element)
            : element;

        if (!targetElement) {
            console.warn('Element tidak ditemukan');
            return;
        }

        // Scroll ke element
        const elementPosition = targetElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - mergedOptions.offset!;

        window.scrollTo({
            top: offsetPosition,
            behavior: mergedOptions.behavior
        });

        // Highlight element jika diperlukan
        if (mergedOptions.highlighted) {
            this.highlightElement(targetElement as HTMLElement, mergedOptions);
        }
    }

    /**
     * Validasi form dan scroll ke element yang error
     * @param formElement - Form element yang akan divalidasi
     * @param options - Konfigurasi scroll
     */
    public validateFormAndScroll(
        formElement: HTMLFormElement,
        options: ScrollToElementOptions = {}
    ): boolean {
        const invalidElements = Array.from(formElement.elements).filter((element) => {
            const input = element as HTMLInputElement | HTMLSelectElement;
            return input.checkValidity && !input.checkValidity();
        });

        if (invalidElements.length > 0) {
            this.scrollToElement(invalidElements[0] as HTMLElement, options);
            return false;
        }

        return true;
    }

    private highlightElement(
        element: HTMLElement,
        options: ScrollToElementOptions
    ): void {
        const originalBackground = element.style.backgroundColor;
        const originalTransition = element.style.transition;

        element.style.backgroundColor = options.highlightColor!;
        element.style.transition = 'background-color 0.5s ease';

        setTimeout(() => {
            element.style.backgroundColor = originalBackground;
            element.style.transition = originalTransition;
        }, options.highlightDuration);
    }
}
