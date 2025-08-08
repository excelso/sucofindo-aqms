import {DateTime} from "@easepick/bundle";

export interface ExPickerInterfaces {
    element?: Element | any,
    startDate?: Date | DateTime | string | number,
    endDate?: Date | DateTime | string | number,
    dateFormat?: string,
    locale?: string,
    firstYear?: number,
    lastYear?: number,
    autoClose?: boolean,
    minDate?: Date | DateTime | string | number,
    maxDate?: Date | DateTime | string | number,
    zIndex?: number,
    useRange?: boolean,
    showDualMonth?: boolean,
    useFooterAction?: boolean, // New option for footer buttons
    enableTimePicker?: boolean,
    timeFormat?: '12' | '24',
    defaultHour?: number,
    defaultMinute?: number,
    onClick?: (date: Date, endDate?: Date) => void,
    onShow?: (date: Date) => void,
    onRangeSelect?: (startDate: Date, endDate: Date) => void,
    onCancel?: () => void, // New callback for cancel button
    onApply?: (startDate: Date, endDate?: Date) => void, // New callback for apply button
}
