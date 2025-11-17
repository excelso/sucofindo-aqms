import Highcharts from 'highcharts'
import "highcharts/highcharts-more"
import "highcharts/modules/exporting"
import "highcharts/modules/offline-exporting"
import {
    getMetaContent,
    hiddenElm,
    parseUrlLocation,
    renderPagination,
    showHiddenElmAndText, truncateToDecimals
} from "@/js/plugins/functions";
import moment from 'moment/moment';
import 'moment/dist/locale/id';
import {closeModalDialog, showModalDialog} from "@/js/plugins/modal";
import {failureAlert} from "@/js/plugins/sweet-alert";
import DataPlatformsIndustriModel from "@/js/main/be-sparing/master/data-platforms/DataPlatformsIndustriModel";

interface optionPencarian {
    platformUid: string,
    tipeLogger: number,
    parameterId: string,
    minDate: string,
    maxDate: string,
    url?: string,
    search?: string,
}

// HighchartsExport(HighchartsStock)
// HighchartsExportOffline(HighchartsStock)

document.addEventListener('DOMContentLoaded', function () {

    //region Handle Init Component
    const csrfToken = getMetaContent('csrf-token')
    const url = new URL(window.location.href)
    const win: Window = window

    const btnExportChart: HTMLElement = document.querySelector('.btnExportChart')
    const btnExportTable: HTMLElement = document.querySelector('.btnExportTable')
    const userLevel: HTMLInputElement = document.querySelector('.userLevel')
    const titleCardChart: HTMLElement = document.querySelector('.titleCardChart')
    const titlePeriodeCardChart: HTMLElement = document.querySelector('.titlePeriodeCardChart')
    const titleTipeLoggerCardChart: HTMLElement = document.querySelector('.titleTipeLoggerCardChart')
    const platformUidSelected: HTMLInputElement = document.querySelector('.platformUidSelected')
    const tipeLoggerSelected: HTMLInputElement = document.querySelector('.tipeLoggerSelected')
    const parameterIdSelected: HTMLInputElement = document.querySelector('.parameterIdSelected')
    const minDateSelected: HTMLInputElement = document.querySelector('.minDateSelected')
    const maxDateSelected: HTMLInputElement = document.querySelector('.maxDateSelected')
    const bodyChart: HTMLElement = document.querySelector('.bodyChart')
    const loaderDataMasuk: HTMLElement = document.querySelector('.loaderDataMasuk')
    const progressDataMasuk: HTMLElement = document.querySelector('.progressDataMasuk')
    const loaderDataTidakMasuk: HTMLElement = document.querySelector('.loaderDataTidakMasuk')
    const progressDataTidakMasuk: HTMLElement = document.querySelector('.progressDataTidakMasuk')
    const loaderDataMutu: HTMLElement = document.querySelector('.loaderDataMutu')
    const progressDataMutu: HTMLElement = document.querySelector('.progressDataMutu')
    const loaderDataTidakMutu: HTMLElement = document.querySelector('.loaderDataTidakMutu')
    const progressDataTidakMutu: HTMLElement = document.querySelector('.progressDataTidakMutu')
    const namaParamTable: HTMLElement = document.querySelector('.namaParamTable')
    const bodyDataTable: HTMLElement = document.querySelector('.bodyDataTable')
    const loaderDataTable: HTMLElement = document.querySelector('.loaderDataTable')
    const footerDataTable: HTMLElement = document.querySelector('.footerDataTable')
    const btnPencarian = document.querySelector('.btnPencarian')
    const modalPencarian = document.querySelector('.modalPencarian')
    const closeModalForm = document.querySelectorAll('.closeModalForm')
    //endregion

    //region Handle Close Modal
    closeModalForm.forEach((elm: Element) => {
        elm.addEventListener('click', function () {
            if (modalPencarian) {
                closeModalDialog(modalPencarian)
            }
        })
    })
    //endregion

    Highcharts.setOptions({
        lang: {
            decimalPoint: '.',
            thousandsSep: ','
        }
    })

    //region Panggil fungsi HandleChart
    handleCharts({
        platformUid: platformUidSelected.value,
        tipeLogger: parseInt(tipeLoggerSelected.value),
        parameterId: parameterIdSelected.value,
        minDate: minDateSelected.value,
        maxDate: maxDateSelected.value
    }).then(null)

    handlePersentaseData({
        platformUid: platformUidSelected.value,
        tipeLogger: parseInt(tipeLoggerSelected.value),
        parameterId: parameterIdSelected.value,
        minDate: minDateSelected.value,
        maxDate: maxDateSelected.value
    }).then(null)

    renderDataTable({
        platformUid: platformUidSelected.value,
        tipeLogger: parseInt(tipeLoggerSelected.value),
        parameterId: parameterIdSelected.value,
        minDate: minDateSelected.value,
        maxDate: maxDateSelected.value
    })
    //endregion

    //region Handle Pencarian
    if (btnPencarian !== null) {
        btnPencarian.addEventListener('click', function () {
            showModalDialog(modalPencarian, null, () => {
                const btnCari = document.querySelector<HTMLElement>('.btnCari')
                const platformUid: HTMLSelectElement = document.querySelector('.platformUid')
                const parameterId: HTMLSelectElement = document.querySelector('.parameterId')
                const btnResetPencarian = document.querySelector<HTMLElement>('.btnResetPencarian')

                new DataPlatformsIndustriModel(platformUid, parameterId, {
                    useDefaultOption: false
                })

                modalPencarian.addEventListener('keyup', function (ev: KeyboardEvent) {
                    if (ev.key === 'Enter') {
                        $(btnCari).trigger('click');
                    }
                })

                btnResetPencarian.addEventListener('click', function () {
                    win.location = `${url.pathname}`
                })

                $(btnCari).off('click').on('click', function () {
                    const elmPencarian = modalPencarian.querySelectorAll('[name]')
                    const text_result = {}
                    const text_result_url = []
                    elmPencarian.forEach((elm: HTMLInputElement) => {
                        const elmNames = elm.getAttribute('name')
                        if (elmNames === 'platformUid') {
                            text_result[elmNames] = elm.value
                            text_result['tipeLogger'] = $(elm).find(':selected').data('tipe-logger')
                            text_result_url.push(`${elmNames}=${elm.value}&tipeLogger=${$(elm).find(':selected').data('tipe-logger')}`)
                        } else {
                            if (elm.value !== '') {
                                text_result[elmNames] = elm.value
                                text_result_url.push(`${elmNames}=${elm.value}`)
                            }
                        }
                    })

                    const {platformUid, tipeLogger, parameterId: paramId, minDate, maxDate} = text_result as any
                    $(parameterId).attr('data-selected', paramId)
                    handleCharts({
                        platformUid,
                        tipeLogger: tipeLogger,
                        parameterId: paramId,
                        minDate,
                        maxDate
                    }).then(null)

                    handlePersentaseData({
                        platformUid,
                        tipeLogger: tipeLogger,
                        parameterId: paramId,
                        minDate,
                        maxDate
                    }).then(null)

                    renderDataTable({
                        platformUid,
                        tipeLogger: tipeLogger,
                        parameterId: paramId,
                        minDate,
                        maxDate
                    })

                    closeModalDialog(modalPencarian, () => {
                        history.pushState({}, null, `${url.pathname}?${text_result_url.join('&')}`)
                    })
                })
            })
        })
    }
    //endregion

    //region Handle Chart
    async function handleCharts(options: optionPencarian) {
        const {
            platformUid,
            tipeLogger,
            parameterId,
            minDate,
            maxDate
        } = options

        $(btnExportChart).css('cursor', 'not-allowed')
        $(btnExportChart).css('color', '#cccccc')
        $(bodyChart).html('<div class="skeleton-box w-[100%] !h-[400px] rounded"></div>')
        $(titleCardChart).html('<div class="skeleton-box w-[20%] !h-[13px] rounded"></div>')
        $(titlePeriodeCardChart).html('<div class="skeleton-box w-[40%] !h-[13px] rounded"></div>')

        const diffDate = moment.duration(moment(maxDate).diff(moment(minDate)))
        const diffDateDay = diffDate.asDays()
        const diffDateHour = diffDate.asHours()
        let tickInterval = 24 * 3600 * 1000

        if (diffDateDay >= 1 && diffDateDay < 4) {
            tickInterval = 3600 * 24 * 1000
        } else if (diffDateDay > 4) {
            tickInterval = 3600 * 48 * 1000
        } else {
            if (diffDateHour < 1) {
                // Jika kurang dari 1 Jam
                tickInterval = 60 * 5 * 1000 // Interval per 5 menit
            } else {
                if (diffDateHour >= 1 && diffDateHour < 2) {
                    tickInterval = 60 * 10 * 1000
                } else if (diffDateHour >= 2 && diffDateHour < 6) {
                    tickInterval = 60 * 30 * 1000
                } else if (diffDateHour > 6) {
                    tickInterval = 60 * 120 * 1000
                }
            }
        }

        let titlePeriode = moment(minDate).format('DD MMM YYYY HH:mm')
        let filenameExport = `Chart-${platformUid}-${parameterId}-${moment(minDate).format('YYYYMMDDHHmm')}`
        if (minDate !== maxDate) {
            titlePeriode = `${moment(minDate).format('DD MMM YYYY HH:mm')} s/d ${moment(maxDate).format('DD MMM YYYY HH:mm')}`
            filenameExport = `Chart-${platformUid}-${parameterId}-${moment(minDate).format('YYYYMMDDHHmm')}_${moment(maxDate).format('YYYYMMDDHHmm')}`
        }

        const response = await fetch(`${url.pathname}/data-charts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken
            },
            body: JSON.stringify({
                platformUid,
                tipeLogger,
                parameterId,
                minDate,
                maxDate,
            })
        })

        const {status} = response
        const {message, data, dataYaxis, timezone: tz} = await response.json()
        if (status === 200) {
            $(titleCardChart).html(`${platformUid} - Sensor ${parameterId}`)
            $(titlePeriodeCardChart).html(`Periode ${titlePeriode}`)

            let tipeLoggerLabel = ``
            if (userLevel.value !== 'viewer') {
                $(titleTipeLoggerCardChart).show()
                $(titleTipeLoggerCardChart).html(`${tipeLogger === 1 ? 'Internal' : 'KLHK'}`)

                tipeLoggerLabel = `<br> ${tipeLogger === 1 ? 'Internal' : 'KLHK'}`
            } else {
                $(titleTipeLoggerCardChart).hide()
            }

            const chart = Highcharts.chart({
                chart: {
                    renderTo: bodyChart,
                    type: 'column',
                    style: {
                        fontFamily: 'Nunito'
                    },
                },
                accessibility: {
                    enabled: false
                },
                title: {
                    text: `${platformUid} - Sensor ${parameterId}`
                },
                subtitle: {
                    text: `Periode ${titlePeriode} ${tipeLoggerLabel}`
                },
                yAxis: {
                    ...dataYaxis,
                    gridLineWidth: 1,
                    gridLineDashStyle: 'LongDash',
                },
                time: {
                    timezone: tz
                },
                xAxis: {
                    type: 'datetime',
                    minPadding: 0,
                    maxPadding: 0,
                    // startOnTick: true,
                    crosshair: true,
                    tickInterval: tickInterval,
                    labels: {
                        formatter: function () {
                            return diffDateDay >= 4 ? moment(new Date(this.value)).format('DD-MM-YYYY') : moment(new Date(this.value)).format('HH:mm')
                        },
                    }
                },
                tooltip: {
                    shared: true
                },
                scrollbar: {
                    enabled: true,
                },
                plotOptions: {
                    series: {
                        turboThreshold: 0
                    }
                },
                exporting: {
                    enabled: true
                },
                series: data,
                credits: {
                    text: 'PT. SUCOFINDO',
                    href: ''
                },
                responsive: {
                    rules: [{
                        condition: {
                            maxWidth: 500
                        },
                        chartOptions: {
                            legend: {
                                layout: 'horizontal',
                                align: 'center',
                                verticalAlign: 'bottom'
                            }
                        }
                    }]
                }
            })

            if (btnExportChart) {
                $(btnExportChart).css('cursor', 'pointer')
                $(btnExportChart).css('color', 'black')
                btnExportChart.addEventListener('click', function () {
                    chart.exportChartLocal({
                        type: 'image/png',
                        filename: filenameExport,
                        sourceWidth: 1500,
                        sourceHeight: 500,
                        fallbackToExportServer: false
                    }, {
                        title: {
                            text: `${platformUid} - Sensor ${parameterId}`
                        },
                        subtitle: {
                            text: `Periode ${titlePeriode}`
                        }
                    })
                })
            }
        } else {
            failureAlert({
                html: message,
                confirmButtonText: 'Tutup'
            })
        }
    }

    //endregion

    //region Handle Data Persentase
    async function handlePersentaseData(options: optionPencarian) {
        const {platformUid, tipeLogger, parameterId, minDate, maxDate} = options
        const diffMinutes = moment.duration(moment(maxDate).diff(moment(minDate))).asMinutes()
        const dataForEntry = diffMinutes / 2 // Total selesih menit / 2

        $(loaderDataMasuk).show()
        $(progressDataMasuk).hide()
        $(loaderDataTidakMasuk).show()
        $(progressDataTidakMasuk).hide()
        $(loaderDataMutu).show()
        $(progressDataMutu).hide()
        $(loaderDataTidakMutu).show()
        $(progressDataTidakMutu).hide()

        const response = await fetch(`${url.pathname}/data-persentase`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken
            },
            body: JSON.stringify({
                platformUid,
                tipeLogger,
                parameterId,
                minDate,
                maxDate,
            })
        })

        const {status} = response
        const {message, data, dataPersentase} = await response.json()
        if (status === 200) {
            const {mutu, danger} = dataPersentase

            if (data !== 0) {
                const persentaseDataMasuk = data / dataForEntry * 100
                $(loaderDataMasuk).hide()
                $(progressDataMasuk).show()
                $(progressDataMasuk).find('div').css('width', `${Math.round(persentaseDataMasuk)}%`)
                $(progressDataMasuk).find('div').html(`${Math.round(persentaseDataMasuk)}%`)

                const persentaseDataTidakMasuk = Math.abs((dataForEntry - data)) / dataForEntry * 100
                $(loaderDataTidakMasuk).hide()
                $(progressDataTidakMasuk).show()
                $(progressDataTidakMasuk).find('div').css('width', `${Math.round(persentaseDataTidakMasuk)}%`)
                $(progressDataTidakMasuk).find('div').html(`${Math.round(persentaseDataTidakMasuk)}%`)

                const totalMutu = (data - danger) < 0 ? (data - danger) + Math.abs((data - danger)) : (data - danger)
                let persentaseMutu = totalMutu !== 0 ? totalMutu / data * 100 : 0
                $(loaderDataMutu).hide()
                $(progressDataMutu).show()
                $(progressDataMutu).find('div').css('width', `${Math.floor(persentaseMutu)}%`)
                $(progressDataMutu).find('div').html(`${Math.floor(persentaseMutu)}%`)

                const persentaseTidakMutu = danger / data * 100
                $(loaderDataTidakMutu).hide()
                $(progressDataTidakMutu).show()
                $(progressDataTidakMutu).find('div').css('width', `${Math.ceil(persentaseTidakMutu)}%`)
                $(progressDataTidakMutu).find('div').html(`${Math.ceil(persentaseTidakMutu)}%`)
            } else {
                $(loaderDataMasuk).hide()
                $(progressDataMasuk).show()
                $(loaderDataTidakMasuk).hide()
                $(progressDataTidakMasuk).show()
                $(loaderDataMutu).hide()
                $(progressDataMutu).show()
                $(loaderDataTidakMutu).hide()
                $(progressDataTidakMutu).show()
            }
        } else {
            $(loaderDataMasuk).hide()
            $(progressDataMasuk).show()
            $(loaderDataTidakMasuk).hide()
            $(progressDataTidakMasuk).show()
            $(loaderDataMutu).hide()
            $(progressDataMutu).show()
            $(loaderDataTidakMutu).hide()
            $(progressDataTidakMutu).show()

            failureAlert({
                html: message,
                confirmButtonText: 'Tutup'
            })
        }
    }

    //endregion

    //region Handle Data Table
    async function handleDataTable(options: any) {
        return new Promise(async (resolve, reject) => {
            const {platformUid, tipeLogger, parameterId, minDate, maxDate, url, search} = options || {}
            const qSearch = search ? `?search=${search}&platformUid=${platformUid}&tipeLogger=${tipeLogger}&parameterId=${parameterId}&minDate=${minDate}&maxDate=${maxDate}` : `?platformUid=${platformUid}&tipeLogger=${tipeLogger}&parameterId=${parameterId}&minDate=${minDate}&maxDate=${maxDate}`
            showHiddenElmAndText(loaderDataTable)
            const response = await fetch(url || `/sparing/reports/water-quality/data-table${qSearch}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken
                },
            })

            const {status} = response
            const {messages, data, dataParameter, dataParameterLimit} = await response.json()
            if (status === 200) {

                if (btnExportTable) {
                    btnExportTable.addEventListener('click', function () {
                        const {search: hrefSearch} = parseUrlLocation(window.location.href)
                        const exportSearch = hrefSearch !== '' ? hrefSearch : qSearch
                        window.open(`/sparing/reports/water-quality/export-excel${exportSearch}`, '_blank').focus()
                    })
                }

                hiddenElm(loaderDataTable)
                resolve({data, dataParameter, dataParameterLimit})
            } else {
                reject(messages)
            }
        })
    }

    function renderDataTable(options: optionPencarian) {
        handleDataTable(options).then((response) => {
            const {data} = response as any
            $(namaParamTable).text(options.parameterId)
            renderBodyTable(response)
            renderPagination(data, renderDataTable, footerDataTable)
        })
    }

    const renderBodyTable = (response: any) => {
        const {data, dataParameter, dataParameterLimit} = response
        const {from, data: dataTable} = data
        const {
            ph_mutu_min,
            ph_mutu_max,
            ph_warn_min,
            ph_warn_max,
            ph_intermit,
            cod_warn,
            cod_mutu,
            cod_intermit,
            tss_warn,
            tss_warn_min,
            tss_mutu_min,
            tss_mutu,
            tss_intermit,
            nh3n_warn,
            nh3n_mutu,
            nh3n_intermit,
            debit_warn,
            debit_warn_min,
            debit_mutu_min,
            debit_mutu,
            debit_intermit
        } = dataParameterLimit

        const calcDebitWarnInMinutes = debit_warn
        const calcDebitWarnMinInMinutes = debit_warn_min
        const calcDebitMutuMinInMinutes = debit_mutu_min
        const calcDebitMutuInMinutes = debit_mutu

        const itemBodyTable = []
        let no = from
        dataTable.map((item: any) => {
            const {datetime_formatted, ph, debit, cod, tss, nh3n} = item

            let nilai = '0'
            let statusNilai = 'Normal'
            if (dataParameter === 'pH') {
                nilai = truncateToDecimals(ph, 2)
                if ((ph > ph_mutu_min && ph <= ph_warn_min) || (ph >= ph_warn_max && ph < ph_mutu_max)) {
                    statusNilai = `<span class="ds-badge ds-badge-outline ds-badge-warning normal-case !text-[13px]">Warning</span>`
                } else if (ph >= ph_mutu_max || (ph <= ph_mutu_min && ph_intermit === 0)) {
                    statusNilai = `<span class="ds-badge ds-badge-outline ds-badge-error normal-case !text-[13px]">Danger</span>`
                } else {
                    statusNilai = `<span class="ds-badge ds-badge-outline ds-badge-success normal-case !text-[13px]">Normal</span>`
                }
            } else if (dataParameter === 'Debit') {
                nilai = truncateToDecimals(debit, 2)
                if (debit > calcDebitWarnInMinutes && debit <= calcDebitWarnMinInMinutes || debit >= calcDebitMutuMinInMinutes && debit < calcDebitMutuInMinutes) {
                    statusNilai = `<span class="ds-badge ds-badge-outline ds-badge-warning normal-case !text-[13px]">Warning</span>`
                } else if (debit >= calcDebitMutuInMinutes || (debit <= calcDebitWarnInMinutes && debit_intermit === 0)) {
                    statusNilai = `<span class="ds-badge ds-badge-outline ds-badge-error normal-case !text-[13px]">Danger</span>`
                } else {
                    statusNilai = `<span class="ds-badge ds-badge-outline ds-badge-success normal-case !text-[13px]">Normal</span>`
                }
            } else if (dataParameter === 'COD') {
                nilai = truncateToDecimals(cod, 2)
                if (cod >= cod_warn && cod <= cod_mutu) {
                    statusNilai = `<span class="ds-badge ds-badge-outline ds-badge-warning normal-case !text-[13px]">Warning</span>`
                } else if (cod > cod_mutu || (cod <= 0 && cod_intermit === 0)) {
                    statusNilai = `<span class="ds-badge ds-badge-outline ds-badge-error normal-case !text-[13px]">Danger</span>`
                } else {
                    statusNilai = `<span class="ds-badge ds-badge-outline ds-badge-success normal-case !text-[13px]">Normal</span>`
                }
            } else if (dataParameter === 'TSS') {
                nilai = truncateToDecimals(tss, 2)
                if (tss > tss_warn && tss <= tss_warn_min || tss >= tss_mutu_min && tss < tss_mutu) {
                    statusNilai = `<span class="ds-badge ds-badge-outline ds-badge-warning normal-case !text-[13px]">Warning</span>`
                } else if (tss >= tss_mutu || (tss <= tss_warn && tss_intermit === 0)) {
                    statusNilai = `<span class="ds-badge ds-badge-outline ds-badge-error normal-case !text-[13px]">Danger</span>`
                } else {
                    statusNilai = `<span class="ds-badge ds-badge-outline ds-badge-success normal-case !text-[13px]">Normal</span>`
                }
            } else if (dataParameter === 'NH3N') {
                nilai = truncateToDecimals(nh3n, 2)
                if (nh3n >= nh3n_warn && nh3n <= nh3n_mutu) {
                    statusNilai = `<span class="ds-badge ds-badge-outline ds-badge-warning normal-case !text-[13px]">Warning</span>`
                } else if (nh3n > nh3n_mutu || (nh3n <= 0 && nh3n_intermit === 0)) {
                    statusNilai = `<span class="ds-badge ds-badge-outline ds-badge-error normal-case !text-[13px]">Danger</span>`
                } else {
                    statusNilai = `<span class="ds-badge ds-badge-outline ds-badge-success normal-case !!text-[13px]">Normal</span>`
                }
            }

            itemBodyTable.push(`
                <tr>
                    <td class="text-center">${no}</td>
                    <td class="text-center">${datetime_formatted}</td>
                    <td class="text-right">${nilai}</td>
                    <td class="text-left">${statusNilai}</td>
                </tr>
            `)

            no++
        })

        // @ts-ignore
        $(bodyDataTable).html(itemBodyTable)
    }
    //endregion

})
