interface CalendarEvent {
    date: string;
    end_date?: string;  // New property for long events
    event_name: string;
    is_holiday: boolean;
}

interface CalendarOptions {
    onSelect?: (date: Date) => void;
    events?: CalendarEvent[];
}

class Calendar {
    private currentDate: Date;
    private selectedDate: Date | null;
    private calendarElement: HTMLElement;
    private options: CalendarOptions;
    private events: Map<string, CalendarEvent[]>;

    constructor(elementId: string, options: CalendarOptions = {}) {
        this.currentDate = new Date();
        this.selectedDate = null;
        this.calendarElement = document.getElementById(elementId);
        this.options = options;
        this.events = new Map();

        if (options.events) {
            this.processEvents(options.events);
        }

        this.render();
    }

    private processEvents(events: CalendarEvent[]): void {
        events.forEach(event => {
            const startDate = new Date(event.date);
            const endDate = event.end_date ? new Date(event.end_date) : startDate;

            let currentDate = new Date(startDate);
            while (currentDate <= endDate) {
                const dateString = currentDate.toISOString().split('T')[0];
                if (!this.events.has(dateString)) {
                    this.events.set(dateString, []);
                }
                this.events.get(dateString).push(event);
                currentDate.setDate(currentDate.getDate() + 1);
            }
        });
    }

    private getDaysInMonth(year: number, month: number): number {
        return new Date(year, month + 1, 0).getDate();
    }

    private generateCalendarDays(): string {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const daysInMonth = this.getDaysInMonth(year, month);
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        let calendarHTML = '<div class="days-grid">';

        // Calculate the date for the first day shown on the calendar
        let currentDate = new Date(year, month, 1);
        currentDate.setDate(currentDate.getDate() - firstDayOfMonth);

        // Generate 6 weeks of calendar days
        for (let i = 1; i < 43; i++) {
            const tahun = currentDate.getFullYear();
            const bulan = String(currentDate.getMonth() + 1).padStart(2, '0');
            const tanggal = String(currentDate.getDate()).padStart(2, '0');

            const dateString = `${tahun}-${bulan}-${tanggal}`;
            const isCurrentMonth = currentDate.getMonth() === month;
            const dayEvents = this.events.get(dateString) || [];
            const isHoliday = dayEvents.some(event => event.is_holiday);

            calendarHTML += `
                <div class="day${isCurrentMonth ? '' : ' other-month'}${isHoliday ? ' holiday' : ''}" data-date="${dateString}">
                    <span class="day-number">${currentDate.getDate()}</span>
                    ${this.generateEventHTML(dayEvents, currentDate)}
                </div>
            `;

            // Move to the next day
            currentDate.setDate(currentDate.getDate() + 1);
        }

        calendarHTML += '</div>';
        return calendarHTML;
    }

    private generateEventHTML(events: CalendarEvent[], date: Date): string {
        let eventHTML = '';
        let longEvents = events.filter(event => event.end_date);
        let shortEvents = events.filter(event => !event.end_date);

        // Handle long events
        longEvents.forEach((event, index) => {
            const startDate = new Date(event.date);
            const endDate = new Date(event.end_date);
            const isStart = date.toDateString() === startDate.toDateString();
            const isEnd = date.toDateString() === endDate.toDateString();
            const isMiddle = date > startDate && date < endDate;

            let className = `event long-event long-event-${index}`;
            if (isStart) className += ' event-start';
            if (isEnd) className += ' event-end';
            if (isMiddle) className += ' event-middle';

            eventHTML += `<div class="${className}">${isStart ? event.event_name : ''}</div>`;
        });

        // Handle short events
        let remainingSpace = 3 - longEvents.length; // Assume we can show 3 events max
        shortEvents.forEach((event, index) => {
            if (index < remainingSpace) {
                let className = `event${event.is_holiday ? ' holiday-event' : ''}`;
                eventHTML += `<div class="${className}">${event.event_name}</div>`;
            } else if (index === remainingSpace) {
                eventHTML += `<div class="event more-events">+${shortEvents.length - remainingSpace} more</div>`;
            }
        });

        return eventHTML;
    }

    private changeMonth(delta: number): void {
        this.currentDate.setMonth(this.currentDate.getMonth() + delta);
        this.render();
    }

    private render(): void {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const monthYear = `${monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;

        this.calendarElement.innerHTML = `
            <div class="calendar-container">
                <div class="calendar-header">
                    <button class="nav-button" id="prevMonth">&lt;</button>
                    <h2>${monthYear}</h2>
                    <button class="nav-button" id="nextMonth">&gt;</button>
                </div>
                <div class="weekdays">
                    <div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div><div>Sun</div>
                </div>
                ${this.generateCalendarDays()}
            </div>
        `;

        document.getElementById('prevMonth').addEventListener('click', () => this.changeMonth(-1));
        document.getElementById('nextMonth').addEventListener('click', () => this.changeMonth(1));
    }
}

// Penggunaan
new Calendar('calendar', {
    onSelect: (date: Date) => {
        console.log('Selected date:', date);
    },
    events: [
        {
            "date": "2024-10-07",
            "end_date": "2024-10-09",
            "event_name": "Long Event",
            "is_holiday": false
        },
        {
            "date": "2024-10-16",
            "end_date": "2024-10-17",
            "event_name": "Event 1",
            "is_holiday": false
        },
        {
            "date": "2024-10-17",
            "event_name": "Holiday Party",
            "is_holiday": true
        },
        {
            "date": "2024-10-16",
            "event_name": "Event 2",
            "is_holiday": false
        },
        {
            "date": "2024-10-16",
            "event_name": "Event 3",
            "is_holiday": false
        },
    ]
});
