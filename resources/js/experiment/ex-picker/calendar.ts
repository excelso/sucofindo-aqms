import {ExPickerInterfaces} from "@/js/experiment/ex-picker/interfaces";
import {Configs} from "@/js/experiment/ex-picker/configs";

export class Calendar extends Configs {

    protected element: HTMLInputElement | HTMLElement
    protected calendarContainer: HTMLElement
    protected isCalendarVisible: boolean
    protected static openCalendar: Calendar | null = null
    protected currDate: Date
    private activeDay: HTMLElement | null = null

    protected options: ExPickerInterfaces = {
        startDate: new Date(),
        dateFormat: 'yyyy-mm-dd',
        locale: 'en-EN',
        firstYear: 1980,
        lastYear: new Date().getFullYear(),
        minDate: null,
        maxDate: null,
        autoClose: true,
        zIndex: 9999,
        onClick: null,
        onShow: null
    }

    constructor(element: HTMLInputElement | HTMLElement, options: ExPickerInterfaces) {
        super()

        this.element = element
        this.options = {
            ...this.options,
            ...options
        }

        this.currDate = new Date(this.options.startDate)
    }

    //region Handle Render Calendar
    protected render() {
        if (Calendar.openCalendar && Calendar.openCalendar !== this) {
            Calendar.openCalendar.removeCalendar();
        }

        if (!this.isCalendarVisible) {
            this.getCurrentSelectedDate()
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

                this.createSelectMonthName()
                this.reRenderTitleMonth()
                this.createSelectYear()
                this.reRenderTitleYear()
                this.handleToday()
                this.handleChangeMonth()
                this.createDays(this.currDate.getMonth() + 1, this.currDate.getFullYear())
            } else {
                this.createSelectMonthName()
                this.reRenderTitleMonth()
                this.createSelectYear()
                this.reRenderTitleYear()
                this.handleToday()
                this.handleChangeMonth()
                this.createDays(this.currDate.getMonth() + 1, this.currDate.getFullYear())
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

        const calendarContainerMonths = document.createElement('div')
        calendarContainerMonths.classList.add('calendar-months')

        const calendarContainerMonthsItem = document.createElement('div')
        calendarContainerMonthsItem.classList.add('calendar-months-item')

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
        navTitleMonth.textContent = `${this.currDate.toLocaleString(this.options.locale, {month: 'long'})}`

        const navMonthSelect = document.createElement('select')
        navMonthSelect.classList.add('nav-select-month')

        navMonth.appendChild(navTitleMonth)
        navMonth.appendChild(navMonthSelect)

        const navYear = document.createElement('div')
        navYear.classList.add('nav-year')

        const navTitleYear = document.createElement('span')
        navTitleYear.classList.add('nav-title-year')
        navTitleYear.textContent = `${this.currDate.getFullYear()}`

        const navYearSelect = document.createElement('select')
        navYearSelect.classList.add('nav-select-year')
        navYear.appendChild(navTitleYear)
        navYear.appendChild(navYearSelect)

        monthItemNavTitle.appendChild(navMonth)
        monthItemNavTitle.appendChild(navYear)

        const btnToday = document.createElement('div')
        btnToday.classList.add('btn-today')
        btnToday.innerHTML = 'Today'

        const btnPrevMonth = document.createElement('div')
        btnPrevMonth.classList.add('btn-prev-month')
        btnPrevMonth.innerHTML = '<i class="fas fa-chevron-left"></i>'

        const btnNextMonth = document.createElement('div')
        btnNextMonth.classList.add('btn-next-month')
        btnNextMonth.innerHTML = '<i class="fas fa-chevron-right"></i>'

        monthItemNav.appendChild(monthItemNavTitle)
        monthItemNavControl.appendChild(btnToday)
        monthItemNavControl.appendChild(btnPrevMonth)
        monthItemNavControl.appendChild(btnNextMonth)
        monthItemNav.appendChild(monthItemNavControl)

        const monthItemWeekdaysRow = document.createElement('div')
        monthItemWeekdaysRow.classList.add('month-item-weekdays-row')

        const monthItemDays = document.createElement('div')
        monthItemDays.classList.add('month-item-days')

        monthItem.appendChild(monthItemNav)
        monthItem.appendChild(monthItemWeekdaysRow)
        monthItem.appendChild(monthItemDays)
        calendarContainerMonthsItem.appendChild(monthItem)
        calendarContainerMonths.appendChild(calendarContainerMonthsItem)
        calendarContainerMain.appendChild(calendarContainerMonths)

        this.calendarContainer.appendChild(calendarContainerMain)
        document.body.appendChild(this.calendarContainer)
    }

    //endregion

    //region Handle Update Position
    protected updatePosition() {
        const inputPosition = this.element.getBoundingClientRect()
        const scrollY = window.scrollY
        const windowHeight = window.innerHeight
        const windowWidth = window.innerWidth

        if (this.calendarContainer) {
            this.calendarContainer.style.top = `${inputPosition.bottom + scrollY + 10}px`
            this.calendarContainer.style.left = `${inputPosition.left}px`
            this.calendarContainer.style.zIndex = `${this.options.zIndex}`

            const exPickerResultPosition = this.calendarContainer.getBoundingClientRect()

            if (Math.ceil(exPickerResultPosition.bottom) + 2 > windowHeight) {
                this.calendarContainer.style.top = `${inputPosition.top - exPickerResultPosition.height - 10 + scrollY}px`
                this.calendarContainer.style.left = `${inputPosition.left}px`

                const inputParent = this.getElementParent(this.element) as HTMLElement
                if (inputParent) {
                    this.calendarContainer.style.top = `${inputPosition.bottom - inputParent.offsetHeight + scrollY}px`
                    this.calendarContainer.style.left = `${inputPosition.left}px`
                    this.calendarContainer.style.zIndex = `${this.options.zIndex}`
                }

                // console.log(inputParent.offsetWidth)
            }

            if (exPickerResultPosition.right > windowWidth) {
                // Jika melebihi Screen Width
                this.calendarContainer.style.left = `${inputPosition.left - (exPickerResultPosition.width - 130)}px`
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
        }
    }

    //endregion

    //region Handle Create Week Day Name
    protected createWeekDayName() {
        const monthItemWeekdaysRow = document.querySelector('.month-item-weekdays-row')
        // Start with Sunday (0) through Saturday (6)
        for (let i = 0; i < 7; i++) {
            const weekDayItem = document.createElement('div')
            // Create date starting from Sunday
            let date = new Date(this.currDate.getFullYear(), 0, i + 1)
            while (date.getDay() !== i) {
                date.setDate(date.getDate() + 1)
            }
            let dayName = date.toLocaleString(this.options.locale, {weekday: 'short'})
            weekDayItem.innerHTML = `${dayName}`
            monthItemWeekdaysRow.appendChild(weekDayItem)
        }
    }

    //endregion

    //region Handle Create Days
    protected createDays(month: number, year: number) {
        const monthItemDays = document.querySelector('.month-item-days')
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

                // Timestamp Hari ini
                const currTimestamp = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).getTime()
                // Timestamp Hari Bulan ini
                let timestamp = new Date(year, month - 1, _date).getTime()
                if (date < 0) {
                    // Timestamp Hari Bulan lalu
                    timestamp = new Date(year, month - 2, _date).getTime()
                } else if (date >= numberOfDays) {
                    // Timestamp Hari Bulan depan
                    timestamp = new Date(year, month, _date).getTime()
                }

                if (currTimestamp === timestamp) {
                    dayItem.classList.add('today')
                }

                const currSelTimestamp = new Date(this.currDate.getFullYear(), this.currDate.getMonth(), this.currDate.getDate()).getTime()
                if (this.currDate && currSelTimestamp == timestamp) {
                    dayItem.classList.add('active')
                    this.activeDay = dayItem
                } else if (!this.currDate && currTimestamp === timestamp) {
                    dayItem.classList.add('active')
                    this.activeDay = dayItem
                }

                dayItem.setAttribute('data-time', `${timestamp}`)
                dayItem.innerHTML = `${_date}`


                if (this.options.minDate && this.options.minDate != '') {
                    const parseMinDate = this.parseDateString(this.options.minDate as string)
                    if (parseMinDate) {
                        const minDate = new Date(parseMinDate.year, parseMinDate.month - 1, parseMinDate.day).getTime()
                        if (timestamp < minDate) {
                            dayItem.classList.add('disabled')
                            dayItem.setAttribute('data-disabled', 'true')
                        } else {
                            dayItem.addEventListener('click', (evt) => this.handleDayClick(evt))
                        }
                    }
                } else if (this.options.maxDate && this.options.maxDate != '') {
                    const parseMaxDate = this.parseDateString(this.options.maxDate as string)
                    if (parseMaxDate) {
                        const maxDate = new Date(parseMaxDate.year, parseMaxDate.month - 1, parseMaxDate.day).getTime()
                        if (timestamp > maxDate) {
                            dayItem.classList.add('disabled')
                            dayItem.setAttribute('data-disabled', 'true')
                        } else {
                            dayItem.addEventListener('click', (evt) => this.handleDayClick(evt))
                        }
                    }
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
        const clickedDay = event.currentTarget as HTMLElement

        if (this.activeDay) {
            this.activeDay.classList.remove('active')
        }

        clickedDay.classList.add('active')
        this.activeDay = clickedDay

        this.currDate = new Date(parseInt(clickedDay.getAttribute('data-time')))
        const selectedDate = new Date(this.currDate.getFullYear(), this.currDate.getMonth() + 1, parseInt(clickedDay.textContent || '1'))
        this.createDays(this.currDate.getMonth() + 1, this.currDate.getFullYear())
        this.changeMonthSelected(this.currDate.getMonth() + 1)
        this.changeYearSelected(this.currDate.getFullYear())
        if ("value" in this.element) {
            this.element.value = this.formatDate(selectedDate, this.options.locale, this.options?.dateFormat ?? 'yyyy-mm-dd')
        }

        if (this.options.onClick) this.options?.onClick(this.currDate)
        if (this.options?.autoClose) this.removeCalendar()
    }

    //endregion

    //region Handle Today
    protected handleToday() {
        const btnToday = document.querySelector('.btn-today')
        if (btnToday) {
            btnToday.addEventListener('click', () => {
                this.currDate = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())
                this.changeMonthSelected(this.currDate.getMonth() + 1)
                this.changeYearSelected(this.currDate.getFullYear())
                this.createDays(this.currDate.getMonth() + 1, this.currDate.getFullYear())
            })
        }
    }

    //endregion

    //region Handle Create Select Month Name
    protected createSelectMonthName() {
        const navSelectMonth = document.querySelector('.nav-select-month')
        navSelectMonth.innerHTML = ''

        let indexMonth = 0
        for (let i = 0; i < 12; i++) {
            indexMonth++

            const monthOption = document.createElement('option')
            let date = new Date(this.currDate.getFullYear(), i, 1)
            let monthName = date.toLocaleString(this.options.locale, {month: 'long'})
            monthOption.value = `${indexMonth}`
            monthOption.text = monthName
            monthOption.selected = this.currDate.getMonth() == i
            navSelectMonth.appendChild(monthOption)
        }

        navSelectMonth.addEventListener('change', (event) => {
            const target = event.target as HTMLInputElement
            this.currDate = new Date(this.currDate.getFullYear(), parseInt(target.value) - 1, this.currDate.getDate())
            this.reRenderTitleMonth()
            this.createDays(this.currDate.getMonth() + 1, this.currDate.getFullYear())
        })
    }

    //endregion

    //region Handle Change Month (Prev / Next)
    protected handleChangeMonth() {
        const btnPrevMonth = document.querySelector('.btn-prev-month')
        if (btnPrevMonth) {
            btnPrevMonth.addEventListener('click', () => {
                const newDate = new Date(this.currDate.getFullYear(), this.currDate.getMonth(), this.currDate.getDate())
                newDate.setMonth(this.currDate.getMonth() + (-1))
                this.currDate = newDate
                this.changeMonthSelected(this.currDate.getMonth() + 1)
                this.changeYearSelected(this.currDate.getFullYear())
                this.createDays(this.currDate.getMonth() + 1, this.currDate.getFullYear())
            })
        }

        const btnNextMonth = document.querySelector('.btn-next-month')
        if (btnNextMonth) {
            btnNextMonth.addEventListener('click', () => {
                const newDate = new Date(this.currDate.getFullYear(), this.currDate.getMonth(), this.currDate.getDate())
                newDate.setMonth(this.currDate.getMonth() + (1))
                this.currDate = newDate
                this.changeMonthSelected(this.currDate.getMonth() + 1)
                this.changeYearSelected(this.currDate.getFullYear())
                this.createDays(this.currDate.getMonth() + 1, this.currDate.getFullYear())
            })
        }
    }

    //endregion

    //region Handle Change Month Selected
    protected changeMonthSelected(month: number) {
        const navSelectMonth: HTMLInputElement = document.querySelector('.nav-select-month')
        navSelectMonth.value = `${month}`
        this.reRenderTitleMonth()
    }

    //endregion

    //region Handle Create Select Year
    protected createSelectYear() {
        const navSelectYear = document.querySelector('.nav-select-year')
        navSelectYear.innerHTML = ''

        const firstYear = this.options.firstYear
        const lastYear = this.options.lastYear + 5
        for (let i = lastYear; i >= firstYear; i--) {
            const yearOption = document.createElement('option')
            yearOption.value = `${i}`
            yearOption.text = `${i}`
            yearOption.selected = this.currDate.getFullYear() == i
            navSelectYear.appendChild(yearOption)
        }

        navSelectYear.addEventListener('change', (event) => {
            const target = event.target as HTMLInputElement
            this.currDate = new Date(parseInt(target.value), this.currDate.getMonth(), this.currDate.getDate())
            this.reRenderTitleYear()
            this.createDays(this.currDate.getMonth() + 1, this.currDate.getFullYear())
        })
    }

    //endregion

    //region Handle Year Selected
    protected changeYearSelected(year: number) {
        const navSelectYear: HTMLInputElement = document.querySelector('.nav-select-year')
        navSelectYear.value = `${year}`
        this.reRenderTitleYear()
    }

    //endregion

    //region Handle Re Render Navigation Month
    protected reRenderTitleMonth() {
        const navTitleMonth = document.querySelector('.nav-title-month')
        navTitleMonth.textContent = this.currDate.toLocaleString(this.options.locale, {month: 'long'})
    }

    //endregion

    //region Handle Re Render Navigation Year
    protected reRenderTitleYear(year?: number) {
        const navTitleYear = document.querySelector('.nav-title-year')
        navTitleYear.textContent = `${year ?? this.currDate.getFullYear()}`
    }

    //endregion

    //region Handle Get Current Selected Date From Element Input
    protected getCurrentSelectedDate() {
        if ("value" in this.element && this.element.value !== '') {
            const parsedDate = this.parseDateString(this.element.value)
            if (parsedDate) {
                this.currDate = new Date(parsedDate.year, parsedDate.month - 1, parsedDate.day)
            }
        }
    }

    //endregion

}
