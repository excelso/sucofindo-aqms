export interface OptionsChart {
    platformUid: string,
    tipeLogger: string,
    parameterId?: string,
    timezone?: string,
    startDate?: string,
    untilDate?: string,
    bodyChart?: HTMLElement,
}

export interface OptionsChartLastParam {
    platformUid: string,
    tipeLogger: string,
    parameterId?: string,
    startDate?: string,
    untilDate?: string,
    timezone?: string,
    charts?: any
}

export interface OptionsPersentase {
    platformUid: string,
    tipeLogger: string,
    parameterId: string,
    timezone?: string,
    startDate?: string,
    untilDate?: string,
    progressDataMasuk?: HTMLElement,
    dataMasuk?: HTMLElement,
    progressDataMutu?: HTMLElement,
    dataMutu?: HTMLElement,
    progressDataTidakMutu?: HTMLElement,
    dataTidakMutu?: HTMLElement,
}

export interface OptionsLastParam {
    platformUid: string,
    tipeLogger: string,
    timezone?: string,
    startDate?: string,
    untilDate?: string,
    dataElementPh?: HTMLElement,
    dataElementTss?: HTMLElement,
    dataElementDebit?: HTMLElement,
}

export interface OptionsTable {
    platformUid: string,
    tipeLogger: string,
    parameterId?: string|number,
    timezone?: string,
    statusPlatform?: string,
    url?: string,
    search?: string
}
