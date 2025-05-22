import {DateTime} from "@easepick/bundle";

export interface ExPickerInterfaces {
    element?: Element | any,
    startDate?: Date | DateTime | string | number,
    dateFormat?: string,
    locale?: string,
    firstYear?: number,
    lastYear?: number,
    autoClose?: boolean,
    minDate?: Date | DateTime | string | number,
    maxDate?: Date | DateTime | string | number,
    zIndex?: number,
    onClick?: (date: Date) => void,
    onShow?: (date: Date) => void,
}
