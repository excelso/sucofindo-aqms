import {Select} from "@/js/experiment/ex-box/select";
import {ExBoxInterfaces} from "@/js/experiment/ex-box/interfaces";

export class ExBox extends Select {
    constructor(element: HTMLInputElement | HTMLSelectElement, options?: ExBoxInterfaces) {
        super(element, options)

        this.options = {...this.options, ...options}
        this.bindEvent()
    }

    private bindEvent() {
        this.render()

        document.addEventListener('click', (event) => {
            const target = event.target as HTMLElement
            if (this.exBox && this.exBox.contains(target)) {
                if (this.isExBoxVisible) {
                    this.removeExBox()
                } else {
                    if (!this.element.disabled) {
                        this.renderResult()
                    }

                    const parentElm = this.getElementParent(this.element) as HTMLElement
                    if (parentElm) {
                        parentElm.addEventListener('scroll', () => this.updatePosition())
                        parentElm.addEventListener('resize', () => this.updatePosition())
                    }
                }
            } else if (this.exBoxContainerResult && !this.exBoxContainerResult.contains(target)) {
                this.removeExBox()
            }
        })
    }
}
