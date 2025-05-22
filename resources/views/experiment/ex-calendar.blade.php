<style>
    .calendar-container {
        font-family: Arial, sans-serif;
        max-width: 1000px;
        margin: 0 auto;
        background: white;
        border-radius: 10px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        padding: 20px;
    }

    .calendar-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
    }

    .nav-button {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
    }

    .weekdays {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        text-align: center;
        font-weight: bold;
        margin-bottom: 10px;
    }

    .days-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 1px;
        background-color: #e0e0e0;
    }

    .day {
        background-color: white;
        min-height: 100px;
        padding: 5px;
        font-size: 14px;
        position: relative;
        overflow: visible;
    }

    .day-number {
        font-weight: bold;
    }

    .other-month {
        color: #ccc;
    }

    .event {
        background-color: #4285f4;
        color: white;
        margin-top: 2px;
        padding: 2px 4px;
        border-radius: 4px;
        font-size: 12px;
    }

    .long-event {
        position: absolute;
        left: 0;
        right: 0;
        z-index: 1;
        padding: 2px 4px;
        margin: 2px 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .long-event-0 { top: 20px; }
    .long-event-1 { top: 40px; }
    .long-event-2 { top: 60px; }

    .event-start {
        border-top-left-radius: 4px;
        border-bottom-left-radius: 4px;
        margin-left: 5px;
    }

    .event-end {
        border-top-right-radius: 4px;
        border-bottom-right-radius: 4px;
        margin-right: 5px;
    }

    .event-middle {
        border-radius: 0;
        margin-left: -1px;
        margin-right: -1px;
    }

    .holiday-event {
        background-color: #ea4335;
    }

    .more-events {
        background-color: #fbbc05;
        color: black;
    }
</style>

@vite(['resources/js/experiment/ex-calendar/index.tsx'])
<div id="calendar" class="calendar"></div>
