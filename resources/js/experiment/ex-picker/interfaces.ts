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
    useFooterAction?: boolean,
    enableTimePicker?: boolean,
    timeFormat?: '12' | '24',
    defaultHour?: number,
    defaultMinute?: number,

    // New options for button trigger functionality
    showBy?: string, // CSS selector for button trigger element
    disableInput?: boolean, // Disable click on input to open calendar

    // Callback functions
    onClick?: (date: Date, endDate?: Date) => void,
    onShow?: (date: Date) => void,
    onRangeSelect?: (startDate: Date, endDate: Date) => void,
    onCancel?: () => void,
    onApply?: (startDate: Date, endDate?: Date) => void,
}

// Type definitions for better TypeScript support
export type TriggerMode = 'input' | 'button' | 'both';

export interface ExPickerButtonConfig {
    selector: string;
    disableInput?: boolean;
    buttonClass?: string;
    activeClass?: string;
}

// Extended interface for advanced configuration
export interface ExPickerAdvancedConfig extends ExPickerInterfaces {
    triggerMode?: TriggerMode;
    buttonConfig?: ExPickerButtonConfig;
    accessibility?: {
        buttonAriaLabel?: string;
        inputAriaLabel?: string;
        calendarAriaLabel?: string;
    };
}

// Default configuration
export const DEFAULT_EXPICKER_CONFIG: Partial<ExPickerInterfaces> = {
    dateFormat: 'yyyy-mm-dd',
    locale: 'en-EN',
    firstYear: 1980,
    lastYear: new Date().getFullYear(),
    autoClose: true,
    zIndex: 9999,
    useRange: false,
    showDualMonth: false,
    useFooterAction: false,
    enableTimePicker: false,
    timeFormat: '24',
    defaultHour: 0,
    defaultMinute: 0,
    disableInput: false,
    showBy: null,
    minDate: null,
    maxDate: null,
    startDate: new Date(),
    endDate: null
};
