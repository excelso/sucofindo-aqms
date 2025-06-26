import {DateTime} from "@easepick/bundle";

export interface ExBoxInterfaces {
    autoWidth?: boolean,
    placeholder?: string,
    ajax?: ExBoxAjaxConfig,
    maxWidth?: number | string,
    dropdownAutoPosition?: boolean
}

export interface ExBoxAjaxConfig {
    url: string,
    method?: 'GET' | 'POST',
    headers?: Record<string, string>,
    data?: Record<string, any> | ((searchTerm: string) => Record<string, any>),
    delay?: number,
    minimumInputLength?: number,
    processResults?: (data: any) => ExBoxOptionData[],
    cache?: boolean
}

export interface ExBoxOptionData {
    value: string,
    label: string,
    additional?: any,
    infos?: any,
}
