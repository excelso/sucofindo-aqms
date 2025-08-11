import {ExPickerInterfaces} from "@/js/experiment/ex-picker/interfaces";
import {Configs} from "@/js/experiment/ex-picker/configs";

export class Calendar extends Configs {

    protected element: HTMLInputElement | HTMLElement
    protected calendarContainer: HTMLElement
    protected isCalendarVisible: boolean
    protected static openCalendar: Calendar | null = null
    protected currDate: Date
    protected currEndDate: Date | null = null
    private activeDay: HTMLElement | null = null
    private activeEndDay: HTMLElement | null = null
    private isSelectingRange: boolean = false
    private rangeStartDate: Date | null = null
    private rangeEndDate: Date | null = null

    // New time picker properties
    protected currHour: number = 0
    protected currMinute: number = 0
    protected currEndHour: number = 0
    protected currEndMinute: number = 0

    protected options: ExPickerInterfaces = {
        startDate: new Date(),
        endDate: null,
        dateFormat: 'yyyy-mm-dd',
        locale: 'en-EN',
        firstYear: 1980,
        lastYear: new Date().getFullYear(),
        minDate: null,
        maxDate: null,
        autoClose: true,
        zIndex: 9999,
        useRange: false,
        showDualMonth: false,
        useFooterAction: false,
        enableTimePicker: false,
        timeFormat: '24',
        defaultHour: 0,
        defaultMinute: 0,
        onClick: null,
        onShow: null,
        onRangeSelect: null,
        onCancel: null,
        onApply: null
    }

    constructor(element: HTMLInputElement | HTMLElement, options: ExPickerInterfaces) {
        super()

        this.element = element
        this.options = {
            ...this.options,
            ...options
        }

        this.currDate = new Date(this.options.startDate)
        this.currHour = this.options.defaultHour ?? 0
        this.currMinute = this.options.defaultMinute ?? 0

        if (this.options.endDate) {
            this.currEndDate = new Date(this.options.endDate)
        }
    }

    //region Handle Render Calendar
    protected render() {
        if (Calendar.openCalendar && Calendar.openCalendar !== this) {
            Calendar.openCalendar.removeCalendar();
        }

        if (!this.isCalendarVisible) {
            this.getCurrentSelectedDate()

            // Auto-enable dual month for range selection
            if (this.options.useRange && !this.options.showDualMonth) {
                this.options.showDualMonth = true
            }

            this.createCalendar()
            this.createWeekDayName()

            if (this.options.onShow) {
                this.options.onShow(this.currDate)
                if ("value" in this.element && this.element.value === '') {
                    if (this.options.startDate === '') {
                        this.currDate = new Date()
                    } else {
                        this.currDate = new Date(this.options.startDate)
                    }
                }
            }

            this.setupCalendarNavigation()
            this.createMonthViews()

            // Create time picker if enabled
            if (this.options.enableTimePicker) {
                this.createTimePicker()
            }

            // Create footer if enabled
            if (this.options.useFooterAction) {
                this.createFooter()
            }

            setTimeout(() => {
                this.updatePosition()
            }, 10)

            this.isCalendarVisible = true
            Calendar.openCalendar = this;
        }
    }
    //endregion

    //region Handle Create Calendar
    protected createCalendar() {
        this.calendarContainer = document.createElement('div')
        this.calendarContainer.classList.add('ex-picker')
        this.calendarContainer.style.position = 'absolute'

        const calendarContainerMain = document.createElement('div')
        calendarContainerMain.classList.add('calendar-main')

        const calendarWrapper = document.createElement('div')
        calendarWrapper.classList.add('calendar-wrapper')

        if (this.options.enableTimePicker) {
            calendarWrapper.classList.add('with-time-picker')
        }

        if (this.options.useFooterAction) {
            calendarWrapper.classList.add('with-footer')
        }

        const calendarContainerMonths = document.createElement('div')
        calendarContainerMonths.classList.add('calendar-months')

        if (this.options.showDualMonth || this.options.useRange) {
            calendarContainerMonths.classList.add('dual-month')
        }

        calendarWrapper.appendChild(calendarContainerMonths)

        // Create time picker container if enabled (only for single date, not range)
        if (this.options.enableTimePicker && !this.options.useRange) {
            const timePickerContainer = document.createElement('div')
            timePickerContainer.classList.add('time-picker-container')
            calendarWrapper.appendChild(timePickerContainer)
        }

        // Create footer container if enabled
        if (this.options.useFooterAction) {
            const footerContainer = document.createElement('div')
            footerContainer.classList.add('footer-container')
            calendarWrapper.appendChild(footerContainer)
        }

        calendarContainerMain.appendChild(calendarWrapper)
        this.calendarContainer.appendChild(calendarContainerMain)
        document.body.appendChild(this.calendarContainer)
    }
    //endregion

    //region Create Footer
    protected createFooter() {
        const footerContainer = this.calendarContainer.querySelector('.footer-container')
        if (!footerContainer) return

        footerContainer.innerHTML = ''

        const footerContent = document.createElement('div')
        footerContent.classList.add('footer-content')

        // Cancel button
        const cancelButton = document.createElement('button')
        cancelButton.classList.add('footer-button', 'footer-cancel')
        cancelButton.textContent = 'Cancel'
        cancelButton.type = 'button'

        // Apply button
        const applyButton = document.createElement('button')
        applyButton.classList.add('footer-button', 'footer-apply')
        applyButton.textContent = 'Apply'
        applyButton.type = 'button'

        footerContent.appendChild(cancelButton)
        footerContent.appendChild(applyButton)
        footerContainer.appendChild(footerContent)

        // Add event listeners
        this.handleFooterButtons()
    }
    //endregion

    //region Handle Footer Buttons
    protected handleFooterButtons() {
        const cancelButton = this.calendarContainer.querySelector('.footer-cancel')
        const applyButton = this.calendarContainer.querySelector('.footer-apply')

        if (cancelButton) {
            cancelButton.addEventListener('click', (event) => {
                event.preventDefault()
                event.stopPropagation()

                // Reset to original values if needed
                this.clearRangeSelection()

                if (this.options.onCancel) {
                    this.options.onCancel()
                }

                this.removeCalendar()
            })
        }

        if (applyButton) {
            applyButton.addEventListener('click', (event) => {
                event.preventDefault()
                event.stopPropagation()

                if (this.options.useRange) {
                    if (this.rangeStartDate && this.rangeEndDate) {
                        // Update element value
                        if ("value" in this.element) {
                            if (this.options.enableTimePicker) {
                                const startDateTime = new Date(this.rangeStartDate.getTime())
                                startDateTime.setHours(this.currHour, this.currMinute, 0, 0)

                                const endDateTime = new Date(this.rangeEndDate.getTime())
                                endDateTime.setHours(this.currEndHour, this.currEndMinute, 0, 0)

                                const startDateStr = this.formatDateWithTime(startDateTime)
                                const endDateStr = this.formatDateWithTime(endDateTime)
                                this.element.value = `${startDateStr} - ${endDateStr}`
                            } else {
                                const startDateStr = this.formatDate(this.rangeStartDate, this.options.locale, this.options?.dateFormat ?? 'yyyy-mm-dd')
                                const endDateStr = this.formatDate(this.rangeEndDate, this.options.locale, this.options?.dateFormat ?? 'yyyy-mm-dd')
                                this.element.value = `${startDateStr} - ${endDateStr}`
                            }
                        }

                        if (this.options.onApply) {
                            const finalStartDate = this.options.enableTimePicker ?
                                new Date(this.rangeStartDate.getFullYear(), this.rangeStartDate.getMonth(), this.rangeStartDate.getDate(), this.currHour, this.currMinute) :
                                this.rangeStartDate
                            const finalEndDate = this.options.enableTimePicker ?
                                new Date(this.rangeEndDate.getFullYear(), this.rangeEndDate.getMonth(), this.rangeEndDate.getDate(), this.currEndHour, this.currEndMinute) :
                                this.rangeEndDate
                            this.options.onApply(finalStartDate, finalEndDate)
                        }

                        if (this.options.onRangeSelect) {
                            const finalStartDate = this.options.enableTimePicker ?
                                new Date(this.rangeStartDate.getFullYear(), this.rangeStartDate.getMonth(), this.rangeStartDate.getDate(), this.currHour, this.currMinute) :
                                this.rangeStartDate
                            const finalEndDate = this.options.enableTimePicker ?
                                new Date(this.rangeEndDate.getFullYear(), this.rangeEndDate.getMonth(), this.rangeEndDate.getDate(), this.currEndHour, this.currEndMinute) :
                                this.rangeEndDate
                            this.options.onRangeSelect(finalStartDate, finalEndDate)
                        }
                    }
                } else {
                    // Single date selection
                    if ("value" in this.element) {
                        if (this.options.enableTimePicker) {
                            const dateTime = new Date(this.currDate.getTime())
                            dateTime.setHours(this.currHour, this.currMinute, 0, 0)
                            this.element.value = this.formatDateWithTime(dateTime)
                        } else {
                            this.element.value = this.formatDate(this.currDate, this.options.locale, this.options?.dateFormat ?? 'yyyy-mm-dd')
                        }
                    }

                    if (this.options.onApply) {
                        const finalDate = this.options.enableTimePicker ?
                            new Date(this.currDate.getFullYear(), this.currDate.getMonth(), this.currDate.getDate(), this.currHour, this.currMinute) :
                            this.currDate
                        this.options.onApply(finalDate)
                    }

                    if (this.options.onClick) {
                        const finalDate = this.options.enableTimePicker ?
                            new Date(this.currDate.getFullYear(), this.currDate.getMonth(), this.currDate.getDate(), this.currHour, this.currMinute) :
                            this.currDate
                        this.options.onClick(finalDate)
                    }
                }

                this.removeCalendar()
            })
        }
    }
    //endregion

    //region Create Time Picker (Modified)
    protected createTimePicker() {
        if (this.options.useRange) {
            // For range selection, create time picker in each month
            const monthsToShow = 2 // Always 2 for range
            for (let i = 0; i < monthsToShow; i++) {
                this.createTimePickerForMonth(i)
            }

            // Add event listeners for time selection in each month
            this.handleTimeChangeForMonths()
            this.handleQuickTimeSelectionForMonths()
        } else {
            // Original implementation for single date
            const timePickerContainer = this.calendarContainer.querySelector('.time-picker-container')
            if (!timePickerContainer) return

            timePickerContainer.innerHTML = ''

            // Time picker header
            const timePickerHeader = document.createElement('div')
            timePickerHeader.classList.add('time-picker-header')
            timePickerHeader.innerHTML = '<h4>Select Time</h4>'

            // Time picker content
            const timePickerContent = document.createElement('div')
            timePickerContent.classList.add('time-picker-content')

            // Quick time selection grid (00:00 - 23:00)
            this.createQuickTimeSelection(timePickerContent)

            // Detailed time controls (moved to bottom)
            this.createDetailedTimeControls(timePickerContent)

            timePickerContainer.appendChild(timePickerHeader)
            timePickerContainer.appendChild(timePickerContent)

            // Add event listeners for time selection
            this.handleTimeChange()
            this.handleQuickTimeSelection()
        }
    }
    //endregion

    //region Create Time Picker for Range (in each month)
    protected createTimePickerForMonth(monthIndex: number) {
        const monthContainer = this.calendarContainer.querySelector(`[data-month-index="${monthIndex}"]`)
        if (!monthContainer) return

        // Remove existing time picker in this month if any
        const existingTimePicker = monthContainer.querySelector('.month-time-picker')
        if (existingTimePicker) {
            existingTimePicker.remove()
        }

        // Create time picker container for this month
        const timePickerContainer = document.createElement('div')
        timePickerContainer.classList.add('month-time-picker')
        timePickerContainer.setAttribute('data-month-index', monthIndex.toString())

        // Time picker header
        const timePickerHeader = document.createElement('div')
        timePickerHeader.classList.add('month-time-picker-header')

        const headerText = monthIndex === 0 ? 'Start Time' : 'End Time'
        timePickerHeader.innerHTML = `<h5>${headerText}</h5>`

        // Time picker content
        const timePickerContent = document.createElement('div')
        timePickerContent.classList.add('month-time-picker-content')

        // Quick time selection for this month
        this.createQuickTimeSelectionForMonth(timePickerContent, monthIndex)

        // Detailed time controls for this month
        this.createDetailedTimeControlsForMonth(timePickerContent, monthIndex)

        timePickerContainer.appendChild(timePickerHeader)
        timePickerContainer.appendChild(timePickerContent)

        // Insert time picker after month-item-days
        const monthItemDays = monthContainer.querySelector('.month-item-days')
        if (monthItemDays) {
            monthItemDays.parentNode.insertBefore(timePickerContainer, monthItemDays.nextSibling)
        }
    }
    //endregion

    //region Create Quick Time Selection for Specific Month
    protected createQuickTimeSelectionForMonth(parentContainer: Element, monthIndex: number) {
        const quickTimeSection = document.createElement('div')
        quickTimeSection.classList.add('quick-time-section')

        const quickTimeGrid = document.createElement('div')
        quickTimeGrid.classList.add('quick-time-grid')
        quickTimeGrid.setAttribute('data-month-index', monthIndex.toString())
        quickTimeGrid.setAttribute('data-type', monthIndex === 0 ? 'start' : 'end')

        // Create time buttons (00:00 - 23:00)
        for (let hour = 0; hour < 24; hour++) {
            const timeButton = document.createElement('button')
            timeButton.classList.add('quick-time-button')
            timeButton.setAttribute('data-hour', hour.toString())
            timeButton.setAttribute('data-minute', '0')
            timeButton.setAttribute('data-type', monthIndex === 0 ? 'start' : 'end')
            timeButton.setAttribute('data-month-index', monthIndex.toString())
            timeButton.textContent = `${hour.toString().padStart(2, '0')}:00`

            // Mark as selected if matches current time
            const currentHour = monthIndex === 0 ? this.currHour : this.currEndHour
            const currentMinute = monthIndex === 0 ? this.currMinute : this.currEndMinute

            if (hour === currentHour && currentMinute === 0) {
                timeButton.classList.add('selected')
            }

            quickTimeGrid.appendChild(timeButton)
        }

        quickTimeSection.appendChild(quickTimeGrid)
        parentContainer.appendChild(quickTimeSection)
    }
    //endregion

    //region Create Detailed Time Controls for Specific Month
    protected createDetailedTimeControlsForMonth(parentContainer: Element, monthIndex: number) {
        const detailedTimeSection = document.createElement('div')
        detailedTimeSection.classList.add('detailed-time-section')

        const detailedTimeContainer = document.createElement('div')
        detailedTimeContainer.classList.add('detailed-time-container')

        const timeControls = document.createElement('div')
        timeControls.classList.add('time-controls')

        const isStart = monthIndex === 0
        const currentHour = isStart ? this.currHour : this.currEndHour
        const currentMinute = isStart ? this.currMinute : this.currEndMinute

        // Hour input
        const hourInput = document.createElement('input')
        hourInput.type = 'number'
        hourInput.classList.add('time-hour-input')
        hourInput.setAttribute('data-type', isStart ? 'start' : 'end')
        hourInput.setAttribute('data-month-index', monthIndex.toString())
        hourInput.min = '0'
        hourInput.max = this.options.timeFormat === '12' ? '12' : '23'
        hourInput.value = this.options.timeFormat === '12' ?
            (currentHour === 0 ? '12' : currentHour > 12 ? (currentHour - 12).toString() : currentHour.toString()) :
            currentHour.toString().padStart(2, '0')
        hourInput.placeholder = 'HH'

        // Minute input
        const minuteInput = document.createElement('input')
        minuteInput.type = 'number'
        minuteInput.classList.add('time-minute-input')
        minuteInput.setAttribute('data-type', isStart ? 'start' : 'end')
        minuteInput.setAttribute('data-month-index', monthIndex.toString())
        minuteInput.min = '0'
        minuteInput.max = '59'
        minuteInput.value = currentMinute.toString().padStart(2, '0')
        minuteInput.placeholder = 'MM'

        // Create separator
        const separator = document.createElement('span')
        separator.classList.add('time-separator')
        separator.textContent = ':'

        timeControls.appendChild(hourInput)
        timeControls.appendChild(separator)
        timeControls.appendChild(minuteInput)

        // AM/PM selector for 12-hour format
        if (this.options.timeFormat === '12') {
            const ampmToggle = document.createElement('div')
            ampmToggle.classList.add('time-ampm-toggle')
            ampmToggle.setAttribute('data-type', isStart ? 'start' : 'end')
            ampmToggle.setAttribute('data-month-index', monthIndex.toString())

            const amButton = document.createElement('button')
            amButton.classList.add('ampm-button')
            amButton.textContent = 'AM'
            amButton.setAttribute('data-value', 'AM')
            if (currentHour < 12) amButton.classList.add('active')

            const pmButton = document.createElement('button')
            pmButton.classList.add('ampm-button')
            pmButton.textContent = 'PM'
            pmButton.setAttribute('data-value', 'PM')
            if (currentHour >= 12) pmButton.classList.add('active')

            ampmToggle.appendChild(amButton)
            ampmToggle.appendChild(pmButton)
            timeControls.appendChild(ampmToggle)
        }

        detailedTimeContainer.appendChild(timeControls)
        detailedTimeSection.appendChild(detailedTimeContainer)
        parentContainer.appendChild(detailedTimeSection)
    }
    //endregion

    //region Handle Quick Time Selection for Months
    protected handleQuickTimeSelectionForMonths() {
        const quickTimeButtons = this.calendarContainer.querySelectorAll('.month-time-picker .quick-time-button')
        quickTimeButtons.forEach((button: HTMLButtonElement) => {
            button.addEventListener('click', (event) => {
                event.preventDefault()
                event.stopPropagation()

                const hour = parseInt(button.getAttribute('data-hour'))
                const minute = parseInt(button.getAttribute('data-minute'))
                const type = button.getAttribute('data-type')
                const monthIndex = parseInt(button.getAttribute('data-month-index'))

                // Remove selected class from siblings in the same month
                const parentGrid = button.parentElement
                parentGrid.querySelectorAll('.quick-time-button').forEach(btn => {
                    btn.classList.remove('selected')
                })

                // Add selected class to clicked button
                button.classList.add('selected')

                // Update time values
                if (type === 'start') {
                    this.currHour = hour
                    this.currMinute = minute
                } else {
                    this.currEndHour = hour
                    this.currEndMinute = minute
                }

                // Update detailed time controls to reflect quick selection
                this.updateDetailedTimeControlsForMonth(monthIndex, hour, minute)

                // Update element value
                this.updateElementValue()
            })
        })
    }
    //endregion

    //region Handle Time Change for Months
    protected handleTimeChangeForMonths() {
        // Hour input handlers
        const hourInputs = this.calendarContainer.querySelectorAll('.month-time-picker .time-hour-input')
        hourInputs.forEach((input: HTMLInputElement) => {
            // Format on blur
            input.addEventListener('blur', (event) => {
                const target = event.target as HTMLInputElement
                const type = target.getAttribute('data-type')
                const monthIndex = parseInt(target.getAttribute('data-month-index'))
                let value = parseInt(target.value) || 0

                if (this.options.timeFormat === '12') {
                    if (value < 1) value = 1
                    if (value > 12) value = 12
                } else {
                    if (value < 0) value = 0
                    if (value > 23) value = 23
                }

                target.value = this.options.timeFormat === '24' ?
                    value.toString().padStart(2, '0') :
                    value.toString()

                // Convert to 24-hour format for storage
                if (this.options.timeFormat === '12') {
                    const ampmToggle = this.calendarContainer.querySelector(`[data-type="${type}"][data-month-index="${monthIndex}"].time-ampm-toggle`)
                    const isPM = ampmToggle?.querySelector('.ampm-button.active')?.getAttribute('data-value') === 'PM'

                    if (value === 12 && !isPM) value = 0
                    else if (value !== 12 && isPM) value += 12
                }

                if (type === 'start') {
                    this.currHour = value
                } else {
                    this.currEndHour = value
                }

                this.updateElementValue()
            })

            // Allow only numbers
            input.addEventListener('input', (event) => {
                const target = event.target as HTMLInputElement
                target.value = target.value.replace(/[^0-9]/g, '')

                // Limit to max 2 digits
                if (target.value.length > 2) {
                    target.value = target.value.slice(0, 2)
                }
            })
        })

        // Minute input handlers
        const minuteInputs = this.calendarContainer.querySelectorAll('.month-time-picker .time-minute-input')
        minuteInputs.forEach((input: HTMLInputElement) => {
            // Format on blur
            input.addEventListener('blur', (event) => {
                const target = event.target as HTMLInputElement
                const type = target.getAttribute('data-type')
                let value = parseInt(target.value) || 0

                if (value < 0) value = 0
                if (value > 59) value = 59

                target.value = value.toString().padStart(2, '0')

                if (type === 'start') {
                    this.currMinute = value
                } else {
                    this.currEndMinute = value
                }

                this.updateElementValue()
            })

            // Allow only numbers
            input.addEventListener('input', (event) => {
                const target = event.target as HTMLInputElement
                target.value = target.value.replace(/[^0-9]/g, '')

                // Limit to max 2 digits
                if (target.value.length > 2) {
                    target.value = target.value.slice(0, 2)
                }
            })
        })

        // AM/PM toggle handlers (for 12-hour format)
        const ampmToggles = this.calendarContainer.querySelectorAll('.month-time-picker .time-ampm-toggle')
        ampmToggles.forEach((toggle: HTMLElement) => {
            const buttons = toggle.querySelectorAll('.ampm-button')
            buttons.forEach((button: HTMLButtonElement) => {
                button.addEventListener('click', (event) => {
                    event.preventDefault()
                    event.stopPropagation()

                    // Remove active from siblings
                    buttons.forEach(btn => btn.classList.remove('active'))
                    button.classList.add('active')

                    const type = toggle.getAttribute('data-type')
                    const monthIndex = parseInt(toggle.getAttribute('data-month-index'))
                    const isStart = type === 'start'
                    const hourInput = this.calendarContainer.querySelector(`[data-type="${type}"][data-month-index="${monthIndex}"].time-hour-input`) as HTMLInputElement
                    let hour = parseInt(hourInput.value) || 12

                    if (button.getAttribute('data-value') === 'AM') {
                        if (hour === 12) hour = 0
                    } else {
                        if (hour !== 12) hour += 12
                    }

                    if (isStart) {
                        this.currHour = hour
                    } else {
                        this.currEndHour = hour
                    }

                    this.updateElementValue()
                })
            })
        })
    }
    //endregion

    //region Update Detailed Time Controls for Specific Month
    protected updateDetailedTimeControlsForMonth(monthIndex: number, hour: number, minute: number) {
        const type = monthIndex === 0 ? 'start' : 'end'
        const hourInput = this.calendarContainer.querySelector(`[data-type="${type}"][data-month-index="${monthIndex}"].time-hour-input`) as HTMLInputElement
        const minuteInput = this.calendarContainer.querySelector(`[data-type="${type}"][data-month-index="${monthIndex}"].time-minute-input`) as HTMLInputElement

        if (hourInput) {
            if (this.options.timeFormat === '12') {
                hourInput.value = hour === 0 ? '12' : hour > 12 ? (hour - 12).toString() : hour.toString()
            } else {
                hourInput.value = hour.toString().padStart(2, '0')
            }
        }

        if (minuteInput) {
            minuteInput.value = minute.toString().padStart(2, '0')
        }

        // Update AM/PM if 12-hour format
        if (this.options.timeFormat === '12') {
            const ampmToggle = this.calendarContainer.querySelector(`[data-type="${type}"][data-month-index="${monthIndex}"].time-ampm-toggle`)
            if (ampmToggle) {
                const buttons = ampmToggle.querySelectorAll('.ampm-button')
                buttons.forEach(btn => btn.classList.remove('active'))
                if (hour < 12) {
                    ampmToggle.querySelector('[data-value="AM"]').classList.add('active')
                } else {
                    ampmToggle.querySelector('[data-value="PM"]').classList.add('active')
                }
            }
        }
    }
    //endregion

    //region Create Quick Time Selection (Original for single date)
    protected createQuickTimeSelection(parentContainer: Element) {
        const quickTimeSection = document.createElement('div')
        quickTimeSection.classList.add('quick-time-section')

        // Start time quick selection (always show)
        const startQuickTimeContainer = document.createElement('div')
        startQuickTimeContainer.classList.add('quick-time-container')

        if (this.options.useRange) {
            const startQuickLabel = document.createElement('div')
            startQuickLabel.classList.add('quick-time-label')
            startQuickLabel.innerHTML = 'Start Time'
            startQuickTimeContainer.appendChild(startQuickLabel)
        }

        const startQuickTimeGrid = document.createElement('div')
        startQuickTimeGrid.classList.add('quick-time-grid')
        startQuickTimeGrid.setAttribute('data-type', 'start')

        // Create time buttons (00:00 - 23:00)
        for (let hour = 0; hour < 24; hour++) {
            const timeButton = document.createElement('button')
            timeButton.classList.add('quick-time-button')
            timeButton.setAttribute('data-hour', hour.toString())
            timeButton.setAttribute('data-minute', '0')
            timeButton.setAttribute('data-type', 'start')
            timeButton.textContent = `${hour.toString().padStart(2, '0')}:00`

            // Mark as selected if matches current time
            if (hour === this.currHour && this.currMinute === 0) {
                timeButton.classList.add('selected')
            }

            startQuickTimeGrid.appendChild(timeButton)
        }

        startQuickTimeContainer.appendChild(startQuickTimeGrid)
        quickTimeSection.appendChild(startQuickTimeContainer)

        // End time quick selection (only for range)
        if (this.options.useRange) {
            const endQuickTimeContainer = document.createElement('div')
            endQuickTimeContainer.classList.add('quick-time-container')

            const endQuickLabel = document.createElement('div')
            endQuickLabel.classList.add('quick-time-label')
            endQuickLabel.innerHTML = 'End Time'
            endQuickTimeContainer.appendChild(endQuickLabel)

            const endQuickTimeGrid = document.createElement('div')
            endQuickTimeGrid.classList.add('quick-time-grid')
            endQuickTimeGrid.setAttribute('data-type', 'end')

            // Create time buttons (00:00 - 23:00) for end time
            for (let hour = 0; hour < 24; hour++) {
                const timeButton = document.createElement('button')
                timeButton.classList.add('quick-time-button')
                timeButton.setAttribute('data-hour', hour.toString())
                timeButton.setAttribute('data-minute', '0')
                timeButton.setAttribute('data-type', 'end')
                timeButton.textContent = `${hour.toString().padStart(2, '0')}:00`

                // Mark as selected if matches current end time
                if (hour === this.currEndHour && this.currEndMinute === 0) {
                    timeButton.classList.add('selected')
                }

                endQuickTimeGrid.appendChild(timeButton)
            }

            endQuickTimeContainer.appendChild(endQuickTimeGrid)
            quickTimeSection.appendChild(endQuickTimeContainer)
        }

        parentContainer.appendChild(quickTimeSection)
    }
    //endregion

    //region Create Detailed Time Controls (Original for single date)
    protected createDetailedTimeControls(parentContainer: Element) {
        const detailedTimeSection = document.createElement('div')
        detailedTimeSection.classList.add('detailed-time-section')

        // Section header
        const detailedHeader = document.createElement('div')
        detailedHeader.classList.add('detailed-time-header')
        detailedHeader.innerHTML = 'Custom Time'
        detailedTimeSection.appendChild(detailedHeader)

        // Start time detailed controls
        const startDetailedContainer = document.createElement('div')
        startDetailedContainer.classList.add('detailed-time-container')

        if (this.options.useRange) {
            const startDetailedLabel = document.createElement('div')
            startDetailedLabel.classList.add('time-label')
            startDetailedLabel.innerHTML = 'Start Time'
            startDetailedContainer.appendChild(startDetailedLabel)
        }

        const startTimeControls = document.createElement('div')
        startTimeControls.classList.add('time-controls')

        // Hour input
        const hourInput = document.createElement('input')
        hourInput.type = 'number'
        hourInput.classList.add('time-hour-input')
        hourInput.setAttribute('data-type', 'start')
        hourInput.min = '0'
        hourInput.max = this.options.timeFormat === '12' ? '12' : '23'
        hourInput.value = this.options.timeFormat === '12' ?
            (this.currHour === 0 ? '12' : this.currHour > 12 ? (this.currHour - 12).toString() : this.currHour.toString()) :
            this.currHour.toString().padStart(2, '0')
        hourInput.placeholder = 'HH'

        // Minute input
        const minuteInput = document.createElement('input')
        minuteInput.type = 'number'
        minuteInput.classList.add('time-minute-input')
        minuteInput.setAttribute('data-type', 'start')
        minuteInput.min = '0'
        minuteInput.max = '59'
        minuteInput.value = this.currMinute.toString().padStart(2, '0')
        minuteInput.placeholder = 'MM'

        // Create separator
        const separator = document.createElement('span')
        separator.classList.add('time-separator')
        separator.textContent = ':'

        startTimeControls.appendChild(hourInput)
        startTimeControls.appendChild(separator)
        startTimeControls.appendChild(minuteInput)

        // AM/PM selector for 12-hour format
        if (this.options.timeFormat === '12') {
            const ampmToggle = document.createElement('div')
            ampmToggle.classList.add('time-ampm-toggle')
            ampmToggle.setAttribute('data-type', 'start')

            const amButton = document.createElement('button')
            amButton.classList.add('ampm-button')
            amButton.textContent = 'AM'
            amButton.setAttribute('data-value', 'AM')
            if (this.currHour < 12) amButton.classList.add('active')

            const pmButton = document.createElement('button')
            pmButton.classList.add('ampm-button')
            pmButton.textContent = 'PM'
            pmButton.setAttribute('data-value', 'PM')
            if (this.currHour >= 12) pmButton.classList.add('active')

            ampmToggle.appendChild(amButton)
            ampmToggle.appendChild(pmButton)
            startTimeControls.appendChild(ampmToggle)
        }

        startDetailedContainer.appendChild(startTimeControls)
        detailedTimeSection.appendChild(startDetailedContainer)

        // End time detailed controls (only for range selection)
        if (this.options.useRange) {
            const endDetailedContainer = document.createElement('div')
            endDetailedContainer.classList.add('detailed-time-container')

            const endDetailedLabel = document.createElement('div')
            endDetailedLabel.classList.add('time-label')
            endDetailedLabel.innerHTML = 'End Time'
            endDetailedContainer.appendChild(endDetailedLabel)

            const endTimeControls = document.createElement('div')
            endTimeControls.classList.add('time-controls')

            // End Hour input
            const endHourInput = document.createElement('input')
            endHourInput.type = 'number'
            endHourInput.classList.add('time-hour-input')
            endHourInput.setAttribute('data-type', 'end')
            endHourInput.min = '0'
            endHourInput.max = this.options.timeFormat === '12' ? '12' : '23'
            endHourInput.value = this.options.timeFormat === '12' ?
                (this.currEndHour === 0 ? '12' : this.currEndHour > 12 ? (this.currEndHour - 12).toString() : this.currEndHour.toString()) :
                this.currEndHour.toString().padStart(2, '0')
            endHourInput.placeholder = 'HH'

            // End Minute input
            const endMinuteInput = document.createElement('input')
            endMinuteInput.type = 'number'
            endMinuteInput.classList.add('time-minute-input')
            endMinuteInput.setAttribute('data-type', 'end')
            endMinuteInput.min = '0'
            endMinuteInput.max = '59'
            endMinuteInput.value = this.currEndMinute.toString().padStart(2, '0')
            endMinuteInput.placeholder = 'MM'

            // Create separator
            const endSeparator = document.createElement('span')
            endSeparator.classList.add('time-separator')
            endSeparator.textContent = ':'

            endTimeControls.appendChild(endHourInput)
            endTimeControls.appendChild(endSeparator)
            endTimeControls.appendChild(endMinuteInput)

            // End AM/PM toggle for 12-hour format
            if (this.options.timeFormat === '12') {
                const endAmpmToggle = document.createElement('div')
                endAmpmToggle.classList.add('time-ampm-toggle')
                endAmpmToggle.setAttribute('data-type', 'end')

                const endAmButton = document.createElement('button')
                endAmButton.classList.add('ampm-button')
                endAmButton.textContent = 'AM'
                endAmButton.setAttribute('data-value', 'AM')
                if (this.currEndHour < 12) endAmButton.classList.add('active')

                const endPmButton = document.createElement('button')
                endPmButton.classList.add('ampm-button')
                endPmButton.textContent = 'PM'
                endPmButton.setAttribute('data-value', 'PM')
                if (this.currEndHour >= 12) endPmButton.classList.add('active')

                endAmpmToggle.appendChild(endAmButton)
                endAmpmToggle.appendChild(endPmButton)
                endTimeControls.appendChild(endAmpmToggle)
            }

            endDetailedContainer.appendChild(endTimeControls)
            detailedTimeSection.appendChild(endDetailedContainer)
        }

        parentContainer.appendChild(detailedTimeSection)
    }
    //endregion

    //region Handle Quick Time Selection (Original for single date)
    protected handleQuickTimeSelection() {
        const quickTimeButtons = this.calendarContainer.querySelectorAll('.quick-time-button')
        quickTimeButtons.forEach((button: HTMLButtonElement) => {
            button.addEventListener('click', (event) => {
                event.preventDefault()
                event.stopPropagation()

                const hour = parseInt(button.getAttribute('data-hour'))
                const minute = parseInt(button.getAttribute('data-minute'))
                const type = button.getAttribute('data-type')

                // Remove selected class from siblings
                const parentGrid = button.parentElement
                parentGrid.querySelectorAll('.quick-time-button').forEach(btn => {
                    btn.classList.remove('selected')
                })

                // Add selected class to clicked button
                button.classList.add('selected')

                // Update time values
                if (type === 'start') {
                    this.currHour = hour
                    this.currMinute = minute
                } else {
                    this.currEndHour = hour
                    this.currEndMinute = minute
                }

                // Update detailed time controls to reflect quick selection
                this.updateDetailedTimeControls(type, hour, minute)

                // Update element value
                this.updateElementValue()
            })
        })
    }
    //endregion

    //region Update Detailed Time Controls (Original for single date)
    protected updateDetailedTimeControls(type: string, hour: number, minute: number) {
        const hourInput = this.calendarContainer.querySelector(`[data-type="${type}"].time-hour-input`) as HTMLInputElement
        const minuteInput = this.calendarContainer.querySelector(`[data-type="${type}"].time-minute-input`) as HTMLInputElement

        if (hourInput) {
            if (this.options.timeFormat === '12') {
                hourInput.value = hour === 0 ? '12' : hour > 12 ? (hour - 12).toString() : hour.toString()
            } else {
                hourInput.value = hour.toString().padStart(2, '0')
            }
        }

        if (minuteInput) {
            minuteInput.value = minute.toString().padStart(2, '0')
        }

        // Update AM/PM if 12-hour format
        if (this.options.timeFormat === '12') {
            const ampmToggle = this.calendarContainer.querySelector(`[data-type="${type}"].time-ampm-toggle`)
            if (ampmToggle) {
                const buttons = ampmToggle.querySelectorAll('.ampm-button')
                buttons.forEach(btn => btn.classList.remove('active'))
                if (hour < 12) {
                    ampmToggle.querySelector('[data-value="AM"]').classList.add('active')
                } else {
                    ampmToggle.querySelector('[data-value="PM"]').classList.add('active')
                }
            }
        }
    }
    //endregion

    //region Handle Time Change (Original for single date)
    protected handleTimeChange() {
        // Hour input handlers
        const hourInputs = this.calendarContainer.querySelectorAll('.time-hour-input')
        hourInputs.forEach((input: HTMLInputElement) => {
            // Format on blur
            input.addEventListener('blur', (event) => {
                const target = event.target as HTMLInputElement
                const type = target.getAttribute('data-type')
                let value = parseInt(target.value) || 0

                if (this.options.timeFormat === '12') {
                    if (value < 1) value = 1
                    if (value > 12) value = 12
                } else {
                    if (value < 0) value = 0
                    if (value > 23) value = 23
                }

                target.value = this.options.timeFormat === '24' ?
                    value.toString().padStart(2, '0') :
                    value.toString()

                // Convert to 24-hour format for storage
                if (this.options.timeFormat === '12') {
                    const ampmToggle = this.calendarContainer.querySelector(`[data-type="${type}"].time-ampm-toggle`)
                    const isPM = ampmToggle?.querySelector('.ampm-button.active')?.getAttribute('data-value') === 'PM'

                    if (value === 12 && !isPM) value = 0
                    else if (value !== 12 && isPM) value += 12
                }

                if (type === 'start') {
                    this.currHour = value
                } else {
                    this.currEndHour = value
                }

                this.updateElementValue()
            })

            // Allow only numbers
            input.addEventListener('input', (event) => {
                const target = event.target as HTMLInputElement
                target.value = target.value.replace(/[^0-9]/g, '')

                // Limit to max 2 digits
                if (target.value.length > 2) {
                    target.value = target.value.slice(0, 2)
                }
            })
        })

        // Minute input handlers
        const minuteInputs = this.calendarContainer.querySelectorAll('.time-minute-input')
        minuteInputs.forEach((input: HTMLInputElement) => {
            // Format on blur
            input.addEventListener('blur', (event) => {
                const target = event.target as HTMLInputElement
                const type = target.getAttribute('data-type')
                let value = parseInt(target.value) || 0

                if (value < 0) value = 0
                if (value > 59) value = 59

                target.value = value.toString().padStart(2, '0')

                if (type === 'start') {
                    this.currMinute = value
                } else {
                    this.currEndMinute = value
                }

                this.updateElementValue()
            })

            // Allow only numbers
            input.addEventListener('input', (event) => {
                const target = event.target as HTMLInputElement
                target.value = target.value.replace(/[^0-9]/g, '')

                // Limit to max 2 digits
                if (target.value.length > 2) {
                    target.value = target.value.slice(0, 2)
                }
            })
        })

        // AM/PM toggle handlers (for 12-hour format)
        const ampmToggles = this.calendarContainer.querySelectorAll('.time-ampm-toggle')
        ampmToggles.forEach((toggle: HTMLElement) => {
            const buttons = toggle.querySelectorAll('.ampm-button')
            buttons.forEach((button: HTMLButtonElement) => {
                button.addEventListener('click', (event) => {
                    event.preventDefault()
                    event.stopPropagation()

                    // Remove active from siblings
                    buttons.forEach(btn => btn.classList.remove('active'))
                    button.classList.add('active')

                    const type = toggle.getAttribute('data-type')
                    const isStart = type === 'start'
                    const hourInput = this.calendarContainer.querySelector(`[data-type="${type}"].time-hour-input`) as HTMLInputElement
                    let hour = parseInt(hourInput.value) || 12

                    if (button.getAttribute('data-value') === 'AM') {
                        if (hour === 12) hour = 0
                    } else {
                        if (hour !== 12) hour += 12
                    }

                    if (isStart) {
                        this.currHour = hour
                    } else {
                        this.currEndHour = hour
                    }

                    this.updateElementValue()
                })
            })
        })
    }
    //endregion

    //region Update Element Value
    protected updateElementValue() {
        if ("value" in this.element) {
            if (this.options.useRange && this.rangeStartDate && this.rangeEndDate) {
                const startDateTime = new Date(this.rangeStartDate.getTime())
                startDateTime.setHours(this.currHour, this.currMinute, 0, 0)

                const endDateTime = new Date(this.rangeEndDate.getTime())
                endDateTime.setHours(this.currEndHour, this.currEndMinute, 0, 0)

                const startDateStr = this.formatDateWithTime(startDateTime)
                const endDateStr = this.formatDateWithTime(endDateTime)
                this.element.value = `${startDateStr} - ${endDateStr}`
            } else {
                const dateTime = new Date(this.currDate.getTime())
                dateTime.setHours(this.currHour, this.currMinute, 0, 0)
                this.element.value = this.formatDateWithTime(dateTime)
            }
        }
    }
    //endregion

    //region Format Date With Time
    protected formatDateWithTime(date: Date): string {
        let format = this.options.dateFormat
        if (this.options.enableTimePicker) {
            if (this.options.timeFormat === '12') {
                format += ' hh:mm aa'
            } else {
                format += ' HH:MM'
            }
        }
        return this.formatDate(date, this.options.locale, format)
    }
    //endregion

    //region Setup Calendar Navigation
    protected setupCalendarNavigation() {
        // Determine number of months to show - force 2 months for range selection
        const monthsToShow = (this.options.showDualMonth || this.options.useRange) ? 2 : 1
        const calendarContainerMonths = this.calendarContainer.querySelector('.calendar-months')

        // Clear existing content
        calendarContainerMonths.innerHTML = ''

        for (let i = 0; i < monthsToShow; i++) {
            const monthDate = new Date(this.currDate.getFullYear(), this.currDate.getMonth() + i, 1)
            this.createMonthContainer(monthDate, i, calendarContainerMonths)
        }
    }
    //endregion

    //region Create Month Container
    protected createMonthContainer(monthDate: Date, index: number, parentContainer: Element) {
        const calendarContainerMonthsItem = document.createElement('div')
        calendarContainerMonthsItem.classList.add('calendar-months-item')
        calendarContainerMonthsItem.setAttribute('data-month-index', index.toString())

        const monthItem = document.createElement('div')
        monthItem.classList.add('month-item')

        const monthItemNav = document.createElement('div')
        monthItemNav.classList.add('month-item-nav')

        const monthItemNavControl = document.createElement('div')
        monthItemNavControl.classList.add('month-item-nav-control')

        const monthItemNavTitle = document.createElement('div')
        monthItemNavTitle.classList.add('month-item-nav-title')

        const navMonth = document.createElement('div')
        navMonth.classList.add('nav-month')

        const navTitleMonth = document.createElement('span')
        navTitleMonth.classList.add('nav-title-month')
        navTitleMonth.textContent = `${monthDate.toLocaleString(this.options.locale, {month: 'long'})}`

        const navMonthSelect = document.createElement('select')
        navMonthSelect.classList.add('nav-select-month')
        navMonthSelect.setAttribute('data-month-index', index.toString())

        navMonth.appendChild(navTitleMonth)
        navMonth.appendChild(navMonthSelect)

        const navYear = document.createElement('div')
        navYear.classList.add('nav-year')

        const navTitleYear = document.createElement('span')
        navTitleYear.classList.add('nav-title-year')
        navTitleYear.textContent = `${monthDate.getFullYear()}`

        const navYearSelect = document.createElement('select')
        navYearSelect.classList.add('nav-select-year')
        navYearSelect.setAttribute('data-month-index', index.toString())

        navYear.appendChild(navTitleYear)
        navYear.appendChild(navYearSelect)

        monthItemNavTitle.appendChild(navMonth)
        monthItemNavTitle.appendChild(navYear)

        const isDualMonth = this.options.showDualMonth || this.options.useRange

        if (!isDualMonth) {
            // Single month view - show all navigation controls
            const btnToday = document.createElement('div')
            btnToday.classList.add('btn-today')
            btnToday.innerHTML = 'Today'

            const btnPrevMonth = document.createElement('div')
            btnPrevMonth.classList.add('btn-prev-month')
            btnPrevMonth.innerHTML = '<i class="fas fa-chevron-left"></i>'

            const btnNextMonth = document.createElement('div')
            btnNextMonth.classList.add('btn-next-month')
            btnNextMonth.innerHTML = '<i class="fas fa-chevron-right"></i>'

            monthItemNavControl.appendChild(btnToday)
            monthItemNavControl.appendChild(btnPrevMonth)
            monthItemNavControl.appendChild(btnNextMonth)
        } else {
            // Dual month view
            if (index === 0) {
                // First month - show Today and Previous arrow
                const monthItemNavControlPrev = document.createElement('div')
                monthItemNavControlPrev.classList.add('month-item-nav-control')

                const btnToday = document.createElement('div')
                btnToday.classList.add('btn-today')
                btnToday.innerHTML = 'Today'

                const btnPrevMonth = document.createElement('div')
                btnPrevMonth.classList.add('btn-prev-month')
                btnPrevMonth.innerHTML = '<i class="fas fa-chevron-left"></i>'

                monthItemNav.appendChild(monthItemNavControlPrev)
                monthItemNavControlPrev.appendChild(btnPrevMonth)
                monthItemNavControl.appendChild(btnToday)
            } else if (index === 1) {
                // Second month - show Next arrow
                const btnNextMonth = document.createElement('div')
                btnNextMonth.classList.add('btn-next-month')
                btnNextMonth.innerHTML = '<i class="fas fa-chevron-right"></i>'

                monthItemNavControl.appendChild(btnNextMonth)
            }
        }

        monthItemNav.appendChild(monthItemNavTitle)
        monthItemNav.appendChild(monthItemNavControl)

        const monthItemWeekdaysRow = document.createElement('div')
        monthItemWeekdaysRow.classList.add('month-item-weekdays-row')
        monthItemWeekdaysRow.setAttribute('data-month-index', index.toString())

        const monthItemDays = document.createElement('div')
        monthItemDays.classList.add('month-item-days')
        monthItemDays.setAttribute('data-month-index', index.toString())

        monthItem.appendChild(monthItemNav)
        monthItem.appendChild(monthItemWeekdaysRow)
        monthItem.appendChild(monthItemDays)
        calendarContainerMonthsItem.appendChild(monthItem)
        parentContainer.appendChild(calendarContainerMonthsItem)
    }
    //endregion

    //region Create Month Views
    protected createMonthViews() {
        const monthsToShow = (this.options.showDualMonth || this.options.useRange) ? 2 : 1

        for (let i = 0; i < monthsToShow; i++) {
            const monthDate = new Date(this.currDate.getFullYear(), this.currDate.getMonth() + i, 1)
            this.createSelectMonthName(i, monthDate)
            this.createSelectYear(i, monthDate)
            this.createWeekDayNameForMonth(i, monthDate)
            this.createDays(monthDate.getMonth() + 1, monthDate.getFullYear(), i)
        }

        this.handleToday()
        this.handleChangeMonth()
    }
    //endregion

    //region Handle Create Week Day Name for specific month
    protected createWeekDayNameForMonth(monthIndex: number, monthDate: Date) {
        const monthItemWeekdaysRow = this.calendarContainer.querySelector(`[data-month-index="${monthIndex}"].month-item-weekdays-row`)
        monthItemWeekdaysRow.innerHTML = ''

        for (let i = 0; i < 7; i++) {
            const weekDayItem = document.createElement('div')
            let date = new Date(monthDate.getFullYear(), 0, i + 1)
            while (date.getDay() !== i) {
                date.setDate(date.getDate() + 1)
            }
            let dayName = date.toLocaleString(this.options.locale, {weekday: 'short'})
            weekDayItem.innerHTML = `${dayName}`
            monthItemWeekdaysRow.appendChild(weekDayItem)
        }
    }
    //endregion

    //region Handle Create Week Day Name (legacy - for single month)
    protected createWeekDayName() {
        // This method is kept for backward compatibility but will be handled by createWeekDayNameForMonth
    }
    //endregion

    //region Handle Create Days
    protected createDays(month: number, year: number, monthIndex: number = 0) {
        const monthItemDays = this.calendarContainer.querySelector(`[data-month-index="${monthIndex}"].month-item-days`)
        monthItemDays.innerHTML = ''

        let firstDay = new Date(year, month - 1).getDay()
        let numberOfDays = new Date(year, month, 0).getDate()
        let prevMonthNumberOfDays = new Date(year, month - 1, 0).getDate()
        let index: number = 0

        const rows: number = 7
        const cols: number = 6
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                index++

                const dayItem = document.createElement('div')
                const date = index - firstDay - 1
                let _date: number
                if (date < 0) {
                    _date = prevMonthNumberOfDays + date + 1
                } else {
                    _date = date % numberOfDays + 1
                }

                dayItem.classList.add('day-item')
                if (date < 0) {
                    dayItem.classList.add('prev-month')
                } else {
                    if (date >= numberOfDays) {
                        dayItem.classList.add('next-month')
                    }
                }

                // Timestamp calculations
                const currTimestamp = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).getTime()
                let timestamp = new Date(year, month - 1, _date).getTime()
                if (date < 0) {
                    timestamp = new Date(year, month - 2, _date).getTime()
                } else if (date >= numberOfDays) {
                    timestamp = new Date(year, month, _date).getTime()
                }

                if (currTimestamp === timestamp) {
                    dayItem.classList.add('today')
                }

                // Handle range selection styling
                if (this.options.useRange && this.rangeStartDate && this.rangeEndDate) {
                    const startTimestamp = this.rangeStartDate.getTime()
                    const endTimestamp = this.rangeEndDate.getTime()

                    if (timestamp === startTimestamp) {
                        dayItem.classList.add('range-start')
                        dayItem.classList.add('active')
                    } else if (timestamp === endTimestamp) {
                        dayItem.classList.add('range-end')
                        dayItem.classList.add('active')
                    } else if (timestamp > startTimestamp && timestamp < endTimestamp) {
                        dayItem.classList.add('in-range')
                    }
                } else {
                    // Single date selection
                    const currSelTimestamp = new Date(this.currDate.getFullYear(), this.currDate.getMonth(), this.currDate.getDate()).getTime()
                    if (this.currDate && currSelTimestamp == timestamp) {
                        dayItem.classList.add('active')
                        this.activeDay = dayItem
                    } else if (!this.currDate && currTimestamp === timestamp) {
                        dayItem.classList.add('active')
                        this.activeDay = dayItem
                    }
                }

                dayItem.setAttribute('data-time', `${timestamp}`)
                dayItem.innerHTML = `${_date}`

                // Check if date should be disabled based on min/max dates
                let isDisabled = false

                // Check minDate
                if (this.options.minDate && this.options.minDate !== '') {
                    const parseMinDate = this.parseDateString(this.options.minDate as string)
                    if (parseMinDate) {
                        const minDate = new Date(parseMinDate.year, parseMinDate.month - 1, parseMinDate.day).getTime()
                        if (timestamp < minDate) {
                            isDisabled = true
                        }
                    }
                }

                // Check maxDate (independent of minDate)
                if (this.options.maxDate && this.options.maxDate !== '') {
                    const parseMaxDate = this.parseDateString(this.options.maxDate as string)
                    if (parseMaxDate) {
                        const maxDate = new Date(parseMaxDate.year, parseMaxDate.month - 1, parseMaxDate.day).getTime()
                        if (timestamp > maxDate) {
                            isDisabled = true
                        }
                    }
                }

                // Apply disabled state and click handlers
                if (isDisabled) {
                    dayItem.classList.add('disabled')
                    dayItem.setAttribute('data-disabled', 'true')
                } else {
                    dayItem.addEventListener('click', (evt) => this.handleDayClick(evt))
                }

                monthItemDays.appendChild(dayItem)
            }
        }
    }
    //endregion

    //region Handle Click Day
    protected handleDayClick(event: Event) {
        event.preventDefault()
        event.stopPropagation()

        const clickedDay = event.currentTarget as HTMLElement
        const timestamp = parseInt(clickedDay.getAttribute('data-time'))
        const selectedDate = new Date(timestamp)

        if (this.options.useRange) {
            this.handleRangeSelection(clickedDay, selectedDate)
        } else {
            this.handleSingleDateSelection(clickedDay, selectedDate)
        }
    }
    //endregion

    //region Handle Single Date Selection
    protected handleSingleDateSelection(clickedDay: HTMLElement, selectedDate: Date) {
        if (this.activeDay) {
            this.activeDay.classList.remove('active')
        }

        clickedDay.classList.add('active')
        this.activeDay = clickedDay

        this.currDate = selectedDate
        this.refreshAllMonths()

        if ("value" in this.element && !this.options.useFooterAction) {
            if (this.options.enableTimePicker) {
                const dateTime = new Date(selectedDate.getTime())
                dateTime.setHours(this.currHour, this.currMinute, 0, 0)
                this.element.value = this.formatDateWithTime(dateTime)
            } else {
                this.element.value = this.formatDate(selectedDate, this.options.locale, this.options?.dateFormat ?? 'yyyy-mm-dd')
            }
        }

        if (this.options.onClick && !this.options.useFooterAction) {
            const finalDate = this.options.enableTimePicker ?
                new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), this.currHour, this.currMinute) :
                selectedDate
            this.options.onClick(finalDate)
        }

        if (this.options?.autoClose && !this.options.enableTimePicker && !this.options.useFooterAction) {
            this.removeCalendar()
        }
    }
    //endregion

    //region Handle Range Selection
    protected handleRangeSelection(clickedDay: HTMLElement, selectedDate: Date) {
        if (!this.isSelectingRange || !this.rangeStartDate) {
            // Start new range selection
            this.clearRangeSelection()
            this.rangeStartDate = new Date(selectedDate.getTime())
            this.isSelectingRange = true
            clickedDay.classList.add('range-start', 'active')
        } else {
            // Complete range selection
            let startDate = new Date(this.rangeStartDate.getTime())
            let endDate = new Date(selectedDate.getTime())

            if (endDate.getTime() < startDate.getTime()) {
                // If end date is before start date, swap them
                this.rangeStartDate = endDate
                this.rangeEndDate = startDate
            } else {
                this.rangeEndDate = endDate
            }

            this.isSelectingRange = false
            this.refreshAllMonths()

            if ("value" in this.element && !this.options.useFooterAction) {
                if (this.options.enableTimePicker) {
                    const startDateTime = new Date(this.rangeStartDate.getTime())
                    startDateTime.setHours(this.currHour, this.currMinute, 0, 0)

                    const endDateTime = new Date(this.rangeEndDate.getTime())
                    endDateTime.setHours(this.currEndHour, this.currEndMinute, 0, 0)

                    const startDateStr = this.formatDateWithTime(startDateTime)
                    const endDateStr = this.formatDateWithTime(endDateTime)
                    this.element.value = `${startDateStr} - ${endDateStr}`
                } else {
                    const startDateStr = this.formatDate(this.rangeStartDate, this.options.locale, this.options?.dateFormat ?? 'yyyy-mm-dd')
                    const endDateStr = this.formatDate(this.rangeEndDate, this.options.locale, this.options?.dateFormat ?? 'yyyy-mm-dd')
                    this.element.value = `${startDateStr} - ${endDateStr}`
                }
            }

            if (this.options.onRangeSelect && !this.options.useFooterAction) {
                const finalStartDate = this.options.enableTimePicker ?
                    new Date(this.rangeStartDate.getFullYear(), this.rangeStartDate.getMonth(), this.rangeStartDate.getDate(), this.currHour, this.currMinute) :
                    this.rangeStartDate
                const finalEndDate = this.options.enableTimePicker ?
                    new Date(this.rangeEndDate.getFullYear(), this.rangeEndDate.getMonth(), this.rangeEndDate.getDate(), this.currEndHour, this.currEndMinute) :
                    this.rangeEndDate
                this.options.onRangeSelect(finalStartDate, finalEndDate)
            }

            if (this.options?.autoClose && !this.options.enableTimePicker && !this.options.useFooterAction) {
                this.removeCalendar()
            }
        }
    }
    //endregion

    //region Clear Range Selection
    protected clearRangeSelection() {
        if (!this.calendarContainer) {
            // Reset range state even if calendar container is not available
            this.rangeStartDate = null
            this.rangeEndDate = null
            this.isSelectingRange = false
            return
        }

        const allDays = this.calendarContainer.querySelectorAll('.day-item')
        allDays.forEach(day => {
            day.classList.remove('range-start', 'range-end', 'in-range', 'active')
        })
        this.rangeStartDate = null
        this.rangeEndDate = null
        this.isSelectingRange = false
    }
    //endregion

    //region Refresh All Months (Modified to recreate time pickers)
    protected refreshAllMonths() {
        const monthsToShow = (this.options.showDualMonth || this.options.useRange) ? 2 : 1

        // Clear and recreate all months
        const calendarContainerMonths = this.calendarContainer.querySelector('.calendar-months')
        calendarContainerMonths.innerHTML = ''

        for (let i = 0; i < monthsToShow; i++) {
            const monthDate = new Date(this.currDate.getFullYear(), this.currDate.getMonth() + i, 1)
            this.createMonthContainer(monthDate, i, calendarContainerMonths)
        }

        // Reinitialize the month views
        for (let i = 0; i < monthsToShow; i++) {
            const monthDate = new Date(this.currDate.getFullYear(), this.currDate.getMonth() + i, 1)
            this.createSelectMonthName(i, monthDate)
            this.createSelectYear(i, monthDate)
            this.createWeekDayNameForMonth(i, monthDate)
            this.createDays(monthDate.getMonth() + 1, monthDate.getFullYear(), i)
        }

        // Reinitialize event handlers
        this.handleToday()
        this.handleChangeMonth()

        // Recreate time picker if enabled
        if (this.options.enableTimePicker) {
            this.createTimePicker()
        }

        // Recreate footer if enabled
        if (this.options.useFooterAction) {
            this.createFooter()
        }
    }
    //endregion

    //region Update Month Navigation
    protected updateMonthNavigation(monthIndex: number, monthDate: Date) {
        const monthContainer = this.calendarContainer.querySelector(`[data-month-index="${monthIndex}"]`)

        if (monthContainer) {
            const titleMonth = monthContainer.querySelector('.nav-title-month')
            const titleYear = monthContainer.querySelector('.nav-title-year')
            const selectMonth = monthContainer.querySelector('.nav-select-month') as HTMLSelectElement
            const selectYear = monthContainer.querySelector('.nav-select-year') as HTMLSelectElement

            if (titleMonth) titleMonth.textContent = monthDate.toLocaleString(this.options.locale, {month: 'long'})
            if (titleYear) titleYear.textContent = monthDate.getFullYear().toString()
            if (selectMonth) selectMonth.value = (monthDate.getMonth() + 1).toString()
            if (selectYear) selectYear.value = monthDate.getFullYear().toString()
        }
    }
    //endregion

    //region Handle Today
    protected handleToday() {
        const btnToday = this.calendarContainer.querySelector('.btn-today')
        if (btnToday) {
            btnToday.addEventListener('click', (event) => {
                event.preventDefault()
                event.stopPropagation()

                this.currDate = new Date()

                // Set current time when "Today" is clicked and time picker is enabled
                if (this.options.enableTimePicker) {
                    const now = new Date()
                    this.currHour = now.getHours()
                    this.currMinute = now.getMinutes()
                }

                this.refreshAllMonths()

                // Refresh time picker if enabled
                if (this.options.enableTimePicker) {
                    this.createTimePicker()
                }
            })
        }
    }
    //endregion

    //region Handle Create Select Month Name
    protected createSelectMonthName(monthIndex: number = 0, monthDate: Date) {
        const navSelectMonth = this.calendarContainer.querySelector(`[data-month-index="${monthIndex}"].nav-select-month`)
        if (!navSelectMonth) return

        navSelectMonth.innerHTML = ''

        let indexMonth = 0
        for (let i = 0; i < 12; i++) {
            indexMonth++

            const monthOption = document.createElement('option')
            let date = new Date(monthDate.getFullYear(), i, 1)
            let monthName = date.toLocaleString(this.options.locale, {month: 'long'})
            monthOption.value = `${indexMonth}`
            monthOption.text = monthName
            monthOption.selected = monthDate.getMonth() == i
            navSelectMonth.appendChild(monthOption)
        }

        navSelectMonth.addEventListener('change', (event) => {
            event.preventDefault()
            event.stopPropagation()

            const target = event.target as HTMLInputElement
            const newMonth = parseInt(target.value) - 1
            this.currDate = new Date(this.currDate.getFullYear(), newMonth, this.currDate.getDate())
            this.refreshAllMonths()
        })
    }
    //endregion

    //region Handle Change Month (Prev / Next)
    protected handleChangeMonth() {
        // Handle navigation buttons for both single and dual month
        const btnPrevMonth = this.calendarContainer.querySelector('.btn-prev-month')
        if (btnPrevMonth) {
            btnPrevMonth.addEventListener('click', (event) => {
                event.preventDefault()
                event.stopPropagation()

                this.currDate = new Date(this.currDate.getFullYear(), this.currDate.getMonth() - 1, this.currDate.getDate())
                this.refreshAllMonths()
            })
        }

        const btnNextMonth = this.calendarContainer.querySelector('.btn-next-month')
        if (btnNextMonth) {
            btnNextMonth.addEventListener('click', (event) => {
                event.preventDefault()
                event.stopPropagation()

                this.currDate = new Date(this.currDate.getFullYear(), this.currDate.getMonth() + 1, this.currDate.getDate())
                this.refreshAllMonths()
            })
        }
    }
    //endregion

    //region Handle Change Month Selected
    protected changeMonthSelected(month: number) {
        const navSelectMonth: HTMLInputElement = this.calendarContainer.querySelector('.nav-select-month')
        if (navSelectMonth) {
            navSelectMonth.value = `${month}`
            this.reRenderTitleMonth()
        }
    }
    //endregion

    //region Handle Create Select Year
    protected createSelectYear(monthIndex: number = 0, monthDate: Date) {
        const navSelectYear = this.calendarContainer.querySelector(`[data-month-index="${monthIndex}"].nav-select-year`)
        if (!navSelectYear) return

        navSelectYear.innerHTML = ''

        const firstYear = this.options.firstYear
        const lastYear = this.options.lastYear + 5
        for (let i = lastYear; i >= firstYear; i--) {
            const yearOption = document.createElement('option')
            yearOption.value = `${i}`
            yearOption.text = `${i}`
            yearOption.selected = monthDate.getFullYear() == i
            navSelectYear.appendChild(yearOption)
        }

        navSelectYear.addEventListener('change', (event) => {
            event.preventDefault()
            event.stopPropagation()

            const target = event.target as HTMLInputElement
            const newYear = parseInt(target.value)
            this.currDate = new Date(newYear, this.currDate.getMonth(), this.currDate.getDate())
            this.refreshAllMonths()
        })
    }
    //endregion

    //region Handle Year Selected
    protected changeYearSelected(year: number) {
        const navSelectYear: HTMLInputElement = this.calendarContainer.querySelector('.nav-select-year')
        if (navSelectYear) {
            navSelectYear.value = `${year}`
            this.reRenderTitleYear()
        }
    }
    //endregion

    //region Handle Re Render Navigation Month
    protected reRenderTitleMonth() {
        const navTitleMonth = this.calendarContainer.querySelector('.nav-title-month')
        if (navTitleMonth) {
            navTitleMonth.textContent = this.currDate.toLocaleString(this.options.locale, {month: 'long'})
        }
    }
    //endregion

    //region Handle Re Render Navigation Year
    protected reRenderTitleYear(year?: number) {
        const navTitleYear = this.calendarContainer.querySelector('.nav-title-year')
        if (navTitleYear) {
            navTitleYear.textContent = `${year ?? this.currDate.getFullYear()}`
        }
    }
    //endregion

    //region Handle Get Current Selected Date From Element Input
    protected getCurrentSelectedDate() {
        if ("value" in this.element && this.element.value !== '') {
            if (this.options.useRange && this.element.value.includes(' - ')) {
                // Parse range format: "2024-01-01 10:30 - 2024-01-15 15:45" or "2024-01-01 - 2024-01-15"
                const [startStr, endStr] = this.element.value.split(' - ')
                const parsedStartDateTime = this.parseDateTimeString(startStr.trim())
                const parsedEndDateTime = this.parseDateTimeString(endStr.trim())

                if (parsedStartDateTime) {
                    this.currDate = new Date(parsedStartDateTime.year, parsedStartDateTime.month - 1, parsedStartDateTime.day)
                    this.rangeStartDate = this.currDate
                    if (parsedStartDateTime.hour !== null && parsedStartDateTime.minute !== null) {
                        this.currHour = parsedStartDateTime.hour
                        this.currMinute = parsedStartDateTime.minute
                    }
                }
                if (parsedEndDateTime) {
                    this.currEndDate = new Date(parsedEndDateTime.year, parsedEndDateTime.month - 1, parsedEndDateTime.day)
                    this.rangeEndDate = this.currEndDate
                    if (parsedEndDateTime.hour !== null && parsedEndDateTime.minute !== null) {
                        this.currEndHour = parsedEndDateTime.hour
                        this.currEndMinute = parsedEndDateTime.minute
                    }
                }
            } else {
                // Parse single date with optional time
                const parsedDateTime = this.parseDateTimeString(this.element.value)
                if (parsedDateTime) {
                    this.currDate = new Date(parsedDateTime.year, parsedDateTime.month - 1, parsedDateTime.day)
                    if (parsedDateTime.hour !== null && parsedDateTime.minute !== null) {
                        this.currHour = parsedDateTime.hour
                        this.currMinute = parsedDateTime.minute
                    }
                }
            }
        }
    }
    //endregion

    //region Parse Date Time String
    protected parseDateTimeString(dateTimeString: string): { year: number, month: number, day: number, hour: number | null, minute: number | null } | null {
        // First try to extract time information
        let hour: number | null = null
        let minute: number | null = null
        let dateString = dateTimeString

        // Look for time patterns: HH:MM or H:MM (24-hour) or HH:MM AM/PM (12-hour)
        const timePattern = /(\d{1,2}):(\d{2})(?:\s?(AM|PM))?/i
        const timeMatch = dateTimeString.match(timePattern)

        if (timeMatch) {
            hour = parseInt(timeMatch[1])
            minute = parseInt(timeMatch[2])
            const ampm = timeMatch[3]?.toUpperCase()

            // Handle 12-hour format
            if (ampm) {
                if (ampm === 'AM' && hour === 12) {
                    hour = 0
                } else if (ampm === 'PM' && hour !== 12) {
                    hour += 12
                }
            }

            // Remove time part from date string
            dateString = dateTimeString.replace(timePattern, '').replace(/\s+/g, ' ').trim()
        }

        // Parse the date part
        const parsedDate = this.parseDateString(dateString)
        if (!parsedDate) {
            return null
        }

        return {
            year: parsedDate.year,
            month: parsedDate.month,
            day: parsedDate.day,
            hour,
            minute
        }
    }
    //endregion

    //region Handle Update Position
    protected updatePosition() {
        // Use trigger button position if available, otherwise use element position
        const referenceElement = (this as any).triggerButton || this.element
        const inputPosition = referenceElement.getBoundingClientRect()
        const scrollY = window.scrollY
        const windowHeight = window.innerHeight
        const windowWidth = window.innerWidth

        if (this.calendarContainer) {
            // Calculate calendar width based on dual month or single month
            const isDualMonth = this.options.showDualMonth
            const singleMonthWidth = 301 // 43 * 7 = 301
            let calendarWidth = isDualMonth ?
                (singleMonthWidth * 2) + 60 : // No extra space needed for inner nav
                singleMonthWidth + 30

            // Add extra width for time picker (only for single date, not range)
            if (this.options.enableTimePicker && !this.options.useRange) {
                calendarWidth += 200 // Additional width for time picker
            }

            // If using button trigger, position relative to the actual input, not button
            let positionReference = this.element.getBoundingClientRect()
            if ((this as any).triggerButton && (this as any).options.showBy) {
                // Use input position for calendar placement even when triggered by button
                positionReference = this.element.getBoundingClientRect()
            }

            // Initial positioning - position below input
            let topPosition = positionReference.bottom + scrollY + 10
            let leftPosition = positionReference.left

            // Check if calendar goes beyond right edge of viewport
            if (leftPosition + calendarWidth > windowWidth - 20) {
                // Align calendar to right edge of input or viewport, whichever fits better
                leftPosition = Math.max(20, windowWidth - calendarWidth - 20)
            }

            // Ensure calendar doesn't go beyond left edge
            if (leftPosition < 20) {
                leftPosition = 20
            }

            // Set initial position
            this.calendarContainer.style.top = `${topPosition}px`
            this.calendarContainer.style.left = `${leftPosition}px`
            this.calendarContainer.style.zIndex = `${this.options.zIndex}`

            // Check if calendar goes below viewport after positioning
            const calendarRect = this.calendarContainer.getBoundingClientRect()
            if (calendarRect.bottom > windowHeight - 20) {
                // Position above input instead
                topPosition = positionReference.top + scrollY - calendarRect.height - 10

                // Ensure it doesn't go above viewport
                if (topPosition < scrollY + 20) {
                    topPosition = scrollY + 20
                }

                this.calendarContainer.style.top = `${topPosition}px`
            }
        }
    }
    //endregion

    //region Handle Remove Calendar
    protected removeCalendar() {
        if (this.calendarContainer) {
            this.calendarContainer.remove();
            this.calendarContainer = null;
            this.isCalendarVisible = false;
            this.clearRangeSelection();
        }
    }
    //endregion
}
