import {ExPickerInterfaces} from "@/js/experiment/ex-picker/interfaces";
import {Calendar} from "@/js/experiment/ex-picker/calendar";

export class ExPicker extends Calendar {
    protected options: ExPickerInterfaces

    constructor(element: HTMLElement | HTMLInputElement, options?: ExPickerInterfaces) {
        super(element, options)

        this.options = {...this.options, ...options}
        this.bindEvent()
    }

    private bindEvent() {
        this.element.addEventListener('click', (evt) => {
            evt.stopPropagation()
            this.render()

            const parentElm = this.getElementParent(this.element) as HTMLElement
            if (parentElm) {
                parentElm.addEventListener('scroll', () => this.updatePosition())
                parentElm.addEventListener('resize', () => this.updatePosition())
            }
        })

        document.addEventListener('click', (event) => {
            const target = event.target as HTMLElement
            if (!target.classList.contains('day-item') && this.calendarContainer && !this.calendarContainer.contains(target) && !this.element.contains(target)) {
                this.removeCalendar()
            }
        })

        this.element.addEventListener('keyup', (event) => {
            const target = event.target as HTMLInputElement
            const parsedDate = this.parseDateString(target.value)
            if (parsedDate) {
                this.currDate = new Date(parsedDate.year, parsedDate.month - 1, parsedDate.day)
                this.createDays(parsedDate.month, parsedDate.year)
                this.changeMonthSelected(parsedDate.month)
                this.changeYearSelected(parsedDate.year)
            }
        })
    }
}
