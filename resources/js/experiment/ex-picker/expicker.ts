import {ExPickerInterfaces} from "@/js/experiment/ex-picker/interfaces";
import {Calendar} from "@/js/experiment/ex-picker/calendar";

export class ExPicker extends Calendar {
    protected options: ExPickerInterfaces
    protected triggerButton: HTMLElement | null = null

    constructor(element: HTMLElement | HTMLInputElement, options?: ExPickerInterfaces) {
        super(element, options)

        this.options = {...this.options, ...options}
        this.initializeTriggerButton()
        this.bindEvent()
    }

    private initializeTriggerButton() {
        if (this.options.showBy) {
            // Find trigger button by selector
            this.triggerButton = document.querySelector(this.options.showBy) as HTMLElement

            if (!this.triggerButton) {
                console.warn(`ExPicker: Button with selector "${this.options.showBy}" not found`)
            }
        }
    }

    private bindEvent() {
        // Bind input click event only if not disabled
        if (!this.options.disableInput) {
            this.element.addEventListener('click', (evt) => {
                evt.stopPropagation()
                this.handleCalendarOpen()
            })
        } else {
            // If input is disabled, prevent default behavior and show readonly state
            this.element.addEventListener('click', (evt) => {
                evt.preventDefault()
                evt.stopPropagation()
            })

            // Add readonly attribute if it's an input
            if ("readOnly" in this.element) {
                this.element.readOnly = true
            }
        }

        // Bind button click event if trigger button exists
        if (this.triggerButton) {
            this.triggerButton.addEventListener('click', (evt) => {
                evt.preventDefault()
                evt.stopPropagation()
                this.handleCalendarOpen()
            })
        }

        // Close calendar when clicking outside
        document.addEventListener('click', (event) => {
            const target = event.target as HTMLElement
            if (!target.classList.contains('day-item') &&
                this.calendarContainer &&
                !this.calendarContainer.contains(target) &&
                !this.element.contains(target) &&
                (!this.triggerButton || !this.triggerButton.contains(target))) {
                this.removeCalendar()
            }
        })

        // Handle input value changes (only if input is not disabled)
        if (!this.options.disableInput) {
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

    private handleCalendarOpen() {
        this.render()

        const parentElm = this.getElementParent(this.element) as HTMLElement
        if (parentElm) {
            parentElm.addEventListener('scroll', () => this.updatePosition())
            parentElm.addEventListener('resize', () => this.updatePosition())
        }
    }

    // Method to update trigger button reference (useful if DOM changes)
    public updateTriggerButton(selector?: string) {
        if (selector) {
            this.options.showBy = selector
        }

        if (this.options.showBy) {
            // Remove old event listener if exists
            if (this.triggerButton) {
                this.triggerButton.removeEventListener('click', this.handleCalendarOpen)
            }

            // Find new trigger button
            this.triggerButton = document.querySelector(this.options.showBy) as HTMLElement

            if (this.triggerButton) {
                this.triggerButton.addEventListener('click', (evt) => {
                    evt.preventDefault()
                    evt.stopPropagation()
                    this.handleCalendarOpen()
                })
            } else {
                console.warn(`ExPicker: Button with selector "${this.options.showBy}" not found`)
            }
        }
    }

    // Method to enable/disable input
    public toggleInputAccess(disable: boolean) {
        this.options.disableInput = disable

        if ("readOnly" in this.element) {
            this.element.readOnly = disable
        }

        // Rebind events
        this.bindEvent()
    }
}
