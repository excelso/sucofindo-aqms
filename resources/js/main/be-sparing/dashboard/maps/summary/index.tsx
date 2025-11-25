import Highcharts from 'highcharts'
import "highcharts/highcharts-more"
import "highcharts/modules/exporting"
import "highcharts/modules/offline-exporting"
import {
    getMetaContent, handleFixedTd, handleFixedTheadTh,
    hiddenElm,
    compareArrays,
    renderPagination,
    showHiddenElmAndText, timeAgo, formatBytes, elapsedDate,
} from "@/js/plugins/functions";
import {failureAlert} from "@/js/plugins/sweet-alert";
import moment from "moment-timezone";
import {
    OptionsChart,
    OptionsChartLastParam,
    OptionsLastParam,
    OptionsPersentase,
    OptionsTable
} from "@/js/types/dashboard/types";
import {closeModalDialog, showModalDialog} from "@/js/plugins/modal";
import {Tabs} from "flowbite";
import type {TabItem, TabsOptions} from 'flowbite';

document.addEventListener('DOMContentLoaded', function () {

    //region Init Component
    const csrfToken = getMetaContent('csrf-token')
    const dataUrl = new URL(window.location.href)
    const titlePerusahaan: HTMLElement = document.querySelector('.titlePerusahaan')
    const titleUid: HTMLInputElement = document.querySelector('.titleUid')
    const statusOnlinePlatform: HTMLInputElement = document.querySelector('.statusOnlinePlatform')
    const statusPowerPlatform: HTMLInputElement = document.querySelector('.statusPowerPlatform')
    const userLevel: HTMLInputElement = document.querySelector('.userLevel')
    const platformUid: HTMLInputElement = document.querySelector('.platformUid')
    const platformUidSelected: HTMLInputElement = document.querySelector('.platformUidSelected')
    const tipeLoggerSelected: HTMLInputElement = document.querySelector('.tipeLoggerSelected')
    const parameterId: HTMLInputElement = document.querySelector('.parameterId')
    const parameterIdSelected: HTMLInputElement = document.querySelector('.parameterIdSelected')
    const timezone: HTMLInputElement = document.querySelector('.timezone')

    const cardLastParam: HTMLElement = document.querySelector('.cardLastParam')
    const cardColsPh: HTMLElement = document.querySelector('.cardColsPh')
    const cardPh: HTMLElement = document.querySelector('.cardPh')
    const phIntermit: HTMLElement = document.querySelector('.phIntermit')
    const cardNilaiPh: HTMLElement = document.querySelector('.cardNilaiPh')
    const cardColsDebit: HTMLElement = document.querySelector('.cardColsDebit')
    const cardDebit: HTMLElement = document.querySelector('.cardDebit')
    const debitIntermit: HTMLElement = document.querySelector('.debitIntermit')
    const cardNilaiDebit: HTMLElement = document.querySelector('.cardNilaiDebit')
    const cardColsCod: HTMLElement = document.querySelector('.cardColsCod')
    const cardCod: HTMLElement = document.querySelector('.cardCod')
    const codIntermit: HTMLElement = document.querySelector('.codIntermit')
    const cardNilaiCod: HTMLElement = document.querySelector('.cardNilaiCod')
    const cardColsTss: HTMLElement = document.querySelector('.cardColsTss')
    const cardTss: HTMLElement = document.querySelector('.cardTss')
    const tssIntermit: HTMLElement = document.querySelector('.tssIntermit')
    const cardNilaiTss: HTMLElement = document.querySelector('.cardNilaiTss')
    const cardColsNh3n: HTMLElement = document.querySelector('.cardColsNh3n')
    const cardNh3n: HTMLElement = document.querySelector('.cardNh3n')
    const nh3nIntermit: HTMLElement = document.querySelector('.nh3nIntermit')
    const cardNilaiNh3n: HTMLElement = document.querySelector('.cardNilaiNh3n')
    const btnTemperature: HTMLElement = document.querySelector('.btnTemperature')
    const nilaiTemperature: HTMLElement = document.querySelector('.nilaiTemperature')
    const closeModalForm = document.querySelectorAll('.closeModalForm')
    const modalTemperature: HTMLElement = document.querySelector('.modalTemperature')
    const modalPower: HTMLElement = document.querySelector('.modalPower')
    const btnPower: HTMLElement = document.querySelector('.btnPower')

    const progressDataMasuk: HTMLElement = document.querySelector('.progressDataMasuk')
    const dataMasuk: HTMLElement = document.querySelector('.dataMasuk')
    const progressDataMutu: HTMLElement = document.querySelector('.progressDataMutu')
    const dataMutu: HTMLElement = document.querySelector('.dataMutu')
    const progressDataTidakMutu: HTMLElement = document.querySelector('.progressDataTidakMutu')
    const dataTidakMutu: HTMLElement = document.querySelector('.dataTidakMutu')
    const bodyChart: HTMLElement = document.querySelector('.bodyChart')
    let charts = null

    const statusPlatform: HTMLInputElement = document.querySelector('.statusPlatform')
    const thPh: HTMLElement = document.querySelector('.thPh')
    const thCod: HTMLElement = document.querySelector('.thCod')
    const thTss: HTMLElement = document.querySelector('.thTss')
    const thNh3n: HTMLElement = document.querySelector('.thNh3n')
    const thDebit: HTMLElement = document.querySelector('.thDebit')
    const bodyDataTable: HTMLElement = document.querySelector('.bodyDataTable')
    const noDataTable: HTMLElement = document.querySelector('.noDataTable')
    const loaderDataTable: HTMLElement = document.querySelector('.loaderDataTable')
    const footerDataTable: HTMLElement = document.querySelector('.footerDataTable')

    const btnLihatDokumen: HTMLElement = document.querySelector('.btnLihatDokumen')
    const modalDokumen: HTMLElement = document.querySelector('.modalDokumen')
    const tBodyDokumen: Element = modalDokumen.querySelector('.tBodyDokumen')
    const noDokumen: Element = modalDokumen.querySelector('.noDokumen')
    //endregion

    //region Handle Close Modal
    closeModalForm.forEach((elm: Element) => {
        elm.addEventListener('click', function () {
            if (modalTemperature) {
                closeModalDialog(modalTemperature)
            }

            if (modalPower) {
                closeModalDialog(modalPower)
            }

            if (modalDokumen) {
                closeModalDialog(modalDokumen, () => {
                    $(tBodyDokumen).html(null)
                    $(noDokumen).show()
                })
            }
        })
    })
    //endregion

    //region Handle Panggil Fungsi
    // new Select2Platform(platformUid)
    let tipeLogger = '1'

    $(platformUid).attr('disabled', 'disabled')
    $(platformUid).on('change', function () {
        tipeLogger = $(this).find(':selected').data('tipe-logger')
        tipeLoggerSelected.value = tipeLogger
        window.history.replaceState({}, null, `/sparing/dashboard/maps/summary/detail/${$(this).val()}/${tipeLogger}`)
        $(this).attr('disabled', 'disabled')

        handlePlatformInfo({
            platformUid: $(this).val() as string,
            tipeLogger: tipeLogger,
            timezone: timezone.value
        }).then(null)

        handleLastParameterData({
            platformUid: $(this).val() as string,
            tipeLogger: tipeLogger,
            timezone: timezone.value
        }).then(null)

        handlePersentaseData({
            platformUid: $(this).val() as string,
            tipeLogger: tipeLogger,
            parameterId: parameterId.value
        }).then(null)

        handleCharts({
            platformUid: $(this).val() as string,
            tipeLogger: tipeLogger,
            parameterId: parameterIdSelected.value
        }).then(null)

        renderDataTable({
            platformUid: $(this).val() as string,
            tipeLogger: tipeLogger,
        })
    })

    handlePlatformInfo({
        platformUid: platformUidSelected.value,
        tipeLogger: tipeLoggerSelected.value
    }).then(null)

    handleLastParameterData({
        platformUid: platformUidSelected.value,
        tipeLogger: tipeLoggerSelected.value
    }).then(null)

    handlePersentaseData({
        platformUid: platformUidSelected.value,
        tipeLogger: tipeLoggerSelected.value,
        parameterId: parameterIdSelected.value
    }).then(null)

    handleCharts({
        platformUid: platformUidSelected.value,
        tipeLogger: tipeLoggerSelected.value,
        parameterId: parameterIdSelected.value
    }).then(null)

    renderDataTable({
        platformUid: platformUidSelected.value,
        tipeLogger: tipeLoggerSelected.value
    })

    if (parameterId) {
        $(parameterId).on('change', function () {
            parameterIdSelected.value = $(this).val() as string

            handleCharts({
                platformUid: platformUidSelected.value,
                tipeLogger: tipeLoggerSelected.value,
                parameterId: $(parameterId).val() as string
            }).then(null)

            handlePersentaseData({
                platformUid: platformUidSelected.value,
                tipeLogger: tipeLoggerSelected.value,
                parameterId: $(parameterId).val() as string
            }).then(null)
        })
    }

    if (statusPlatform) {
        $(statusPlatform).on('change', function () {
            renderDataTable({
                platformUid: platformUidSelected.value,
                tipeLogger: tipeLoggerSelected.value,
                statusPlatform: $(statusPlatform).val() as string
            })
        })
    }
    //endregion

    //region Handle Info Platform
    async function handlePlatformInfo(options: OptionsLastParam) {
        const {platformUid, tipeLogger} = options

        $(titlePerusahaan).html(`<div class="skeleton-box w-[175px] !h-[20px] rounded-full"></div>`)
        $(titleUid).html(`<div class="skeleton-box w-[300px] !h-[20px] rounded-full"></div>`)
        $(statusOnlinePlatform).html(`<div class="skeleton-box w-[100px] !h-[20px] rounded-full"></div>`)
        $(statusPowerPlatform).html(`<div class="skeleton-box w-[100px] !h-[20px] rounded-full"></div>`)
        $(parameterId).attr('disabled', 'disabled')

        const response = await fetch(`/sparing/dashboard/maps/summary/data-platform`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken
            },
            body: JSON.stringify({
                platformUid,
                tipeLogger
            })
        })

        const {status} = response
        const {message, data, timezone: dataTimezone} = await response.json()
        if (status === 200) {
            $(platformUid).removeAttr('disabled')
            const {uid, status_platform, last_online, has_power, tipe_logger, has_temperature, site, status_validasi} = data
            const {nama_site, customer} = site
            const {jenis_industri} = customer
            const {parameter} = jenis_industri

            let tipeLogger = 'Internal'
            if (tipe_logger === 2) {
                tipeLogger = 'KLHK'
            }

            $(titlePerusahaan).html(`${nama_site}`)
            if (userLevel.value !== 'viewer') {
                $(titleUid).html(`UID: ${uid} / ${dataTimezone} / ${tipeLogger}`)
            } else {
                $(titleUid).html(`UID: ${uid} / ${dataTimezone}`)
            }

            platformUidSelected.value = uid

            if (status_validasi === 'Active') {
                if (status_platform === 'online') {
                    $(statusOnlinePlatform).html(`
                        <div class="ds-badge ds-badge-outline ds-badge-success text-[12px]">
                            <i class="fas fa-clock mr-1"></i> Online
                        </div>
                    `)
                } else {
                    if (last_online) {
                        $(statusOnlinePlatform).html(`
                            <div class="ds-badge ds-badge-outline ds-badge-error text-[12px]">
                                <i class="fas fa-clock mr-1"></i> Offline / ${elapsedDate(last_online * 1000, dataTimezone)}
                            </div>
                        `)
                    } else {
                        $(statusOnlinePlatform).html(`
                            <div class="ds-badge ds-badge-outline ds-badge-error text-[12px]">
                                <i class="fas fa-clock mr-1"></i> Offline
                            </div>
                        `)
                    }
                }
            } else {
                $(statusOnlinePlatform).html(`
                    <div class="ds-badge ds-badge-outline ds-badge-error text-[12px]">
                        <i class="fas fa-close mr-1"></i> Belum Aktif
                    </div>
                `)
            }

            if (has_power !== null) {
                $(statusPowerPlatform).html(`
                    <div class="ds-badge ds-badge-outline ds-badge-success text-[12px]">
                        <i class="fas fa-bolt mr-1"></i> Power Status
                    </div>
                `)

                if (btnPower) {
                    $(btnPower).off('click').on('click', function () {
                        handleModalPower()
                    })
                }

            } else {
                $(statusPowerPlatform).html(null)
            }

            if (has_temperature !== null) {
                $(btnTemperature).show()
            } else {
                $(btnTemperature).hide()
            }

            const dataParameters = JSON.parse(parameter)
            const dataParams = []
            dataParameters.map((item: any) => {
                const selected = parameterIdSelected.value === item ? 'selected' : ''
                dataParams.push(`<option value="${item}" ${selected}>${item}</option>`)
            })

            // @ts-ignore
            $(parameterId).html(dataParams)
            $(parameterId).removeAttr('disabled')
        } else {
            failureAlert({
                html: message,
                confirmButtonText: 'Tutup'
            })
        }
    }

    //endregion

    //region Handle Data Card
    async function handleLastParameterData(options: OptionsLastParam) {
        const {platformUid, tipeLogger} = options
        const response = await fetch(`/sparing/dashboard/maps/summary/data-last-parameter`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken
            },
            body: JSON.stringify({
                platformUid,
                tipeLogger
            })
        })

        const {status} = response
        const {message, dataParameterLimit, parseParameter, data} = await response.json()
        if (status === 200) {
            $(platformUid).removeAttr('disabled')

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

            if (compareArrays(parseParameter, ['pH', 'TSS', 'Debit'])) {
                $(cardLastParam).css('grid-template-columns', 'repeat(3, minmax(0, 1fr))')
                $(cardColsPh).show()
                $(cardColsDebit).show()
                $(cardColsCod).hide()
                $(cardColsTss).show()
                $(cardColsNh3n).hide()
            }

            if (compareArrays(parseParameter, ['pH', 'COD', 'TSS', 'Debit'])) {
                $(cardLastParam).css('grid-template-columns', 'repeat(4, minmax(0, 1fr))')
                $(cardColsPh).show()
                $(cardColsDebit).show()
                $(cardColsCod).show()
                $(cardColsTss).show()
                $(cardColsNh3n).hide()
            }

            if (compareArrays(parseParameter, ['pH', 'COD', 'NH3N', 'Debit'])) {
                $(cardLastParam).css('grid-template-columns', 'repeat(4, minmax(0, 1fr))')
                $(cardColsPh).show()
                $(cardColsDebit).show()
                $(cardColsCod).show()
                $(cardColsTss).hide()
                $(cardColsNh3n).show()
            }

            if (compareArrays(parseParameter, ['pH', 'COD', 'TSS', 'NH3N', 'Debit'])) {
                $(cardLastParam).css('grid-template-columns', 'repeat(5, minmax(0, 1fr))')
                $(cardColsPh).show()
                $(cardColsDebit).show()
                $(cardColsCod).show()
                $(cardColsTss).show()
                $(cardColsNh3n).show()
            }

            $(phIntermit).hide()
            $(debitIntermit).hide()
            $(codIntermit).hide()
            $(tssIntermit).hide()
            $(nh3nIntermit).hide()

            if (ph_intermit === 1) {
                $(phIntermit).show()
            }

            if (debit_intermit === 1) {
                $(debitIntermit).show()
            }

            if (cod_intermit === 1) {
                $(codIntermit).show()
            }

            if (tss_intermit === 1) {
                $(tssIntermit).show()
            }

            if (nh3n_intermit === 1) {
                $(nh3nIntermit).show()
            }

            const calcDebitWarnInMinutes = debit_warn
            const calcDebitWarnMinInMinutes = debit_warn_min
            const calcDebitMutuMinInMinutes = debit_mutu_min
            const calcDebitMutuInMinutes = debit_mutu

            if (data !== null) {
                const {temp, ph, debit, cod, tss, nh3n} = data

                let statusColorPh = ''
                if ((ph > ph_mutu_min && ph <= ph_warn_min) || (ph >= ph_warn_max && ph < ph_mutu_max)) {
                    statusColorPh = 'rgb(253 224 71)'
                } else if (ph >= ph_mutu_max || (ph < ph_mutu_min && ph_intermit === 0)) {
                    statusColorPh = 'rgb(248 113 113)'
                }

                let statusColorDebit = ''
                if (debit > calcDebitWarnInMinutes && debit <= calcDebitWarnMinInMinutes || debit >= calcDebitMutuMinInMinutes && debit < calcDebitMutuInMinutes) {
                    statusColorDebit = 'rgb(253 224 71)'
                } else if (debit >= calcDebitMutuInMinutes || (debit <= calcDebitWarnInMinutes && debit_intermit === 0)) {
                    statusColorDebit = 'rgb(248 113 113)'
                }

                let statusColorCod = ''
                if (cod >= cod_warn && cod <= cod_mutu) {
                    statusColorCod = 'rgb(253 224 71)'
                } else if (cod > cod_mutu || (cod <= 0 && cod_intermit === 0)) {
                    statusColorCod = 'rgb(248 113 113)'
                }

                let statusColorTss = ''
                if (tss > tss_warn && tss <= tss_warn_min || tss >= tss_mutu_min && tss < tss_mutu) {
                    statusColorTss = 'rgb(253 224 71)'
                } else if (tss >= tss_mutu || (tss <= tss_warn && tss_intermit === 0)) {
                    statusColorTss = 'rgb(248 113 113)'
                }

                let statusColorNh3n = ''
                if (nh3n >= nh3n_warn && nh3n <= nh3n_mutu) {
                    statusColorNh3n = 'rgb(253 224 71)'
                } else if (nh3n > nh3n_mutu || (nh3n <= 0 && nh3n_intermit === 0)) {
                    statusColorNh3n = 'rgb(248 113 113)'
                }


                $(cardPh).css('background-color', statusColorPh)
                $(cardNilaiPh).html(`${ph.toFixed(2)}`)
                $(cardDebit).css('background-color', statusColorDebit)
                $(cardNilaiDebit).html(`${debit.toFixed(2)}`)
                $(cardCod).css('background-color', statusColorCod)
                $(cardNilaiCod).html(`${cod.toFixed(2)}`)
                $(cardTss).css('background-color', statusColorTss)
                $(cardNilaiTss).html(`${tss.toFixed(0)}`)
                $(cardNh3n).css('background-color', statusColorNh3n)
                $(cardNilaiNh3n).html(`${nh3n.toFixed(2)}`)

                $(nilaiTemperature).html(`${temp.toFixed(1)}`)
                const iconTemperature = $('svg.iconTemperature')
                if (temp < 38) {
                    if (iconTemperature.hasClass('text-red-400')) {
                        iconTemperature.removeClass('text-red-400')
                    }

                    iconTemperature.addClass('text-green-500')
                } else if (temp > 38) {
                    if (iconTemperature.hasClass('text-green-500')) {
                        iconTemperature.removeClass('text-green-500')
                    }

                    iconTemperature.addClass('text-red-400')
                }

                if (btnTemperature) {
                    $(btnTemperature).off('click').on('click', function () {
                        handleModalTemperature()
                    })
                }

            } else {
                $(cardPh).css('background-color', '')
                $(cardNilaiPh).html(`0`)
                $(cardDebit).css('background-color', '')
                $(cardNilaiDebit).html(`0`)
                $(cardCod).css('background-color', '')
                $(cardNilaiCod).html(`0`)
                $(cardTss).css('background-color', '')
                $(cardNilaiTss).html(`0`)
                $(cardNh3n).css('background-color', '')
                $(cardNilaiNh3n).html(`0`)

                $(nilaiTemperature).html(`0`)
            }
        } else {
            $(cardPh).css('background-color', '')
            $(cardNilaiPh).html(`0`)
            $(cardDebit).css('background-color', '')
            $(cardNilaiDebit).html(`0`)
            $(cardCod).css('background-color', '')
            $(cardNilaiCod).html(`0`)
            $(cardTss).css('background-color', '')
            $(cardNilaiTss).html(`0`)
            $(cardNh3n).css('background-color', '')
            $(cardNilaiNh3n).html(`0`)

            $(nilaiTemperature).html(`0`)
            failureAlert({
                html: message,
                confirmButtonText: 'Tutup'
            })
        }
    }

    //endregion

    //region Handle Modal Temperature
    function handleModalTemperature() {

        showModalDialog(modalTemperature, null, async () => {
            const bodyTempChart: HTMLElement = modalTemperature.querySelector('.bodyTempChart')
            const bodyTempTable = modalTemperature.querySelector('.bodyTempTable')
            const footerDataTempTable = modalTemperature.querySelector('.footerDataTempTable')

            //region Handle Chart Temperature
            const response = await fetch(`/sparing/dashboard/maps/summary/data-charts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken
                },
                body: JSON.stringify({
                    platformUid: platformUidSelected.value,
                    tipeLogger: tipeLoggerSelected.value,
                    parameterId: 'temperature',
                })
            })

            const {status} = response
            const {message, data, dataYaxis, minDate, maxDate, timezone: tz} = await response.json()
            if (status === 200) {

                let tickInterval = 60 * 180 * 1000
                Highcharts.chart({
                    chart: {
                        renderTo: bodyTempChart,
                        type: 'column',
                        style: {
                            fontFamily: 'Nunito'
                        },
                    },
                    accessibility: {
                        enabled: false
                    },
                    title: {
                        text: `Nilai Temperature`
                    },
                    subtitle: {
                        text: 'Range: 25°C - 38°C'
                    },
                    yAxis: {
                        ...dataYaxis,
                        gridLineWidth: 1,
                        gridLineDashStyle: 'LongDash',
                    },
                    time: {
                        timezone: "UTC"
                    },
                    xAxis: {
                        type: 'datetime',
                        minPadding: 0,
                        maxPadding: 0,
                        tickInterval: tickInterval,
                        labels: {
                            formatter: function () {
                                const timestampMs = this.value as number;
                                const timestampSeconds = timestampMs / 1000;
                                return safeFormatTimestamp(timestampSeconds, 'time', 'Asia/Makassar', 'id-ID');
                            },
                            style: {
                                fontSize: '10px',
                                color: '#999'
                            }
                        },
                        lineWidth: 0,
                        tickWidth: 0,
                        gridLineWidth: 1,
                        gridLineColor: '#eee',
                        gridLineDashStyle: 'Dash',
                    },
                    tooltip: {
                        formatter: function () {
                            const timestampMs = this.x;
                            const timestampSeconds = timestampMs / 1000;
                            const formattedTime = safeFormatTimestamp(timestampSeconds, 'datetime', 'Asia/Makassar', 'id-ID', true);
                            const timezoneShort = 'Makassar';

                            return `
                                <div class="flex flex-col">
                                    <div class="text-sm" style="color: ${this.color}">${this.series.name}</div>
                                    <div>
                                        <table>
                                            <tr>
                                                <td class="text-sm p-0">Time</td>
                                                <td class="p-0"><b class="ml-2">: ${formattedTime} - (${timezoneShort})</b></td>
                                            </tr>
                                            <tr>
                                                <td class="text-sm p-0">Nilai</td>
                                                <td class="p-0"><b class="ml-2">: ${Highcharts.numberFormat(this.y, 2)}</b></td>
                                            </tr>
                                        </table>
                                    </div>
                                </div>
                            `;
                        },
                        useHTML: true,
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
                        enabled: false
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
                }, () => {
                    console.log('Chart Oke')
                })
            } else {
                failureAlert({
                    html: message,
                    confirmButtonText: 'Tutup'
                })
            }
            //endregion

            //region Handle Table Temperature
            renderDataTempTable({
                platformUid: platformUidSelected.value,
                tipeLogger: tipeLoggerSelected.value,
            })

            function renderDataTempTable(options: OptionsTable, userLoader = true) {
                handleDataTable(options).then((response) => {
                    const {data} = response as any
                    renderBodyTempTable(response)
                    renderPagination(data, renderDataTempTable, footerDataTempTable)
                })
            }

            const renderBodyTempTable = (response: any) => {
                const {data} = response
                const {from, data: dataTable} = data
                const itemBodyTable = []
                // let no = from
                if (dataTable.length !== 0) {
                    dataTable.map((item: any) => {
                        const {datetime_formatted, temp} = item

                        let statusTemp = 'Low'
                        let statusTempColor = 'ds-badge-success'
                        if (temp !== 0) {
                            if (temp > 38) {
                                statusTemp = 'High'
                                statusTempColor = 'ds-badge-error'
                            }
                        }

                        itemBodyTable.push(`
                            <tr>
                                <td class="text-center !border-l-[1px]">${moment(datetime_formatted, 'YYYY-MM-DD HH:mm:ss').format('HH:mm')}</td>
                                <td class="text-right">${temp.toFixed(1)}</td>
                                <td class="text-center !border-r-[1px]">
                                    <span class="ds-badge ds-badge-outline ${statusTempColor} !text-[11px]">
                                        ${statusTemp}
                                    </span>
                                </td>
                            </tr>
                        `)
                    })

                    // @ts-ignore
                    $(bodyTempTable).html(itemBodyTable)
                    handleFixedTheadTh()
                    handleFixedTd()
                    $(noDataTable).hide()
                } else {
                    $(bodyTempTable).html('')
                    $(noDataTable).show()
                }
            }
            //endregion
        })
    }

    //endregion

    //region Handle Modal Power
    function handleModalPower() {
        showModalDialog(modalPower, null, async () => {
            const solarAmpere: HTMLElement = modalPower.querySelector('.solarAmpere')
            const solarVolt: HTMLElement = modalPower.querySelector('.solarVolt')
            const solarWattage: HTMLElement = modalPower.querySelector('.solarWattage')
            const batteryAmpere: HTMLElement = modalPower.querySelector('.batteryAmpere')
            const batteryVolt: HTMLElement = modalPower.querySelector('.batteryVolt')
            const batteryTemp: HTMLElement = modalPower.querySelector('.batteryTemp')
            const batteryCOC: HTMLElement = modalPower.querySelector('.batteryCOC')
            const outputAmpere: HTMLElement = modalPower.querySelector('.outputAmpere')
            const outputVolt: HTMLElement = modalPower.querySelector('.outputVolt')
            const outputWattage: HTMLElement = modalPower.querySelector('.outputWattage')
            const deviceTemp: HTMLElement = modalPower.querySelector('.deviceTemp')

            const bodyVoltChart: HTMLElement = modalPower.querySelector('.bodyVoltChart')
            const bodyCurrentChart: HTMLElement = modalPower.querySelector('.bodyCurrentChart')
            const bodyPowerChart: HTMLElement = modalPower.querySelector('.bodyPowerChart')

            //region Handle Tabs
            const roleExTabs: HTMLElement = modalPower.querySelector('[data-role="exTabs"]')
            const roleExTabsChilds = roleExTabs.querySelectorAll('li')
            const tabsElms: TabItem[] = []
            roleExTabsChilds.forEach((elm) => {
                const triggerLinks = elm.querySelectorAll('[data-tabs-target]')
                triggerLinks.forEach((elmTrigger: HTMLElement) => {
                    const elmTarget = elmTrigger.getAttribute('data-tabs-target')
                    if (elmTarget !== '') {
                        tabsElms.push({
                            id: elmTarget,
                            triggerEl: elmTrigger,
                            targetEl: document.querySelector(elmTarget)
                        })
                    }
                })
            })

            const options: TabsOptions = {
                defaultTabId: '#dataVoltChart',
                activeClasses: 'text-white bg-primary',
                inactiveClasses: 'hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-white',
                onShow: (x) => {
                    const {id} = x._activeTab

                    if (id === '#dataVoltChart') {
                        handlePowerStatusChart('volt', 'Voltage', bodyVoltChart).then(null)
                    } else if (id === '#dataCurrChart') {
                        handlePowerStatusChart('ampere', 'Current', bodyCurrentChart).then(null)
                    } else if (id === '#dataPowerChart') {
                        handlePowerStatusChart('wattage', 'Power', bodyPowerChart).then(null)
                    }
                }
            };

            new Tabs(roleExTabs, tabsElms, options)
            //endregion

            handleLastPowerStatus({
                platformUid: platformUidSelected.value,
                tipeLogger: tipeLoggerSelected.value,
                timezone: timezone.value,
            }).then(null)

            //region Handle Card
            async function handleLastPowerStatus(options: OptionsLastParam) {
                const {platformUid, timezone} = options
                const response = await fetch(`/sparing/dashboard/maps/summary/data-power-status`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': csrfToken
                    },
                    body: JSON.stringify({
                        platformUid,
                        timezone
                    })
                })

                const {status} = response
                const {message, data} = await response.json()
                if (status === 200) {
                    const {
                        solar_volt,
                        solar_amp,
                        solar_watt,
                        battery_volt,
                        battery_amp,
                        battery_percent,
                        output_volt,
                        output_amp,
                        output_watt,
                        battery_temp,
                        device_temp
                    } = data

                    $(solarAmpere).html(`${solar_amp}A`)
                    $(solarVolt).html(`${solar_volt}V`)
                    $(solarWattage).html(`${solar_watt}W`)
                    $(batteryAmpere).html(`${battery_amp}A`)
                    $(batteryVolt).html(`${battery_volt}V`)
                    $(batteryTemp).html(`${battery_temp}°C`)
                    $(batteryCOC).html(`${battery_percent}%`)
                    $(outputAmpere).html(`${output_amp}A`)
                    $(outputVolt).html(`${output_volt}V`)
                    $(outputWattage).html(`${output_watt}W`)
                    $(deviceTemp).html(`${device_temp}°C`)
                }
            }

            //endregion

            //region Handle Charts
            async function handlePowerStatusChart(type, title, bodyChart: HTMLElement) {
                const response = await fetch(`/sparing/dashboard/maps/summary/data-power-status-charts`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': csrfToken
                    },
                    body: JSON.stringify({
                        platformUid: platformUidSelected.value,
                        timezone: timezone.value,
                        type
                    })
                })

                const {status} = response
                const {message, data, dataYaxis, minDate, maxDate} = await response.json()
                if (status === 200) {
                    const diffDate = moment.duration(moment(maxDate).diff(moment(minDate)))
                    const diffDateDay = diffDate.asDays()
                    const diffDateHour = diffDate.asHours()
                    let tickInterval = 24 * 3600 * 1000
                    if (diffDateDay >= 1 && diffDateDay < 4) {
                        tickInterval = 3600 * (diffDateDay + 2) * 1000
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
                                tickInterval = 60 * 180 * 1000
                            }
                        }
                    }

                    Highcharts.chart(bodyChart, {
                        chart: {
                            type: 'column',
                            style: {
                                fontFamily: 'Nunito'
                            },
                        },
                        accessibility: {
                            enabled: false
                        },
                        title: {
                            text: `Realtime Curve ${title}`
                        },
                        yAxis: {
                            ...dataYaxis,
                            gridLineWidth: 1,
                            gridLineDashStyle: 'LongDash',
                        },
                        xAxis: {
                            type: 'datetime',
                            minPadding: 0,
                            maxPadding: 0,
                            startOnTick: true,
                            crosshair: true,
                            tickInterval: tickInterval,
                            labels: {
                                formatter: function () {
                                    return diffDateDay >= 4 ? Highcharts.dateFormat('%d-%m-%Y', this.value as number) : Highcharts.dateFormat('%H:%M', this.value as number)
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
                            enabled: false
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
                }
            }

            //endregion

        })
    }

    //endregion

    //region Handle Data Persentase
    async function handlePersentaseData(options: OptionsPersentase, useLoader = true) {
        const {platformUid, tipeLogger, parameterId} = options

        if (useLoader) {
            $(progressDataMasuk).html('<div class="skeleton-box w-[80px] !h-[80px] rounded-full"></div>')
            $(dataMasuk).html('<div class="skeleton-box w-[80px] !h-6 rounded"></div>')
            $(progressDataMutu).html('<div class="skeleton-box w-[80px] !h-[80px] rounded-full"></div>')
            $(dataMutu).html('<div class="skeleton-box w-[80px] !h-6 rounded"></div>')
            $(progressDataTidakMutu).html('<div class="skeleton-box w-[80px] !h-[80px] rounded-full"></div>')
            $(dataTidakMutu).html('<div class="skeleton-box w-[80px] !h-6 rounded"></div>')
        }

        const response = await fetch(`/sparing/dashboard/maps/summary/data-persentase`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken
            },
            body: JSON.stringify({
                platformUid,
                tipeLogger,
                parameterId
            })
        })

        const {status} = response
        const {message, data, dataPersentase, minDate, maxDate} = await response.json()
        if (status === 200) {
            $(platformUid).removeAttr('disabled')
            const {mutu, danger} = dataPersentase

            const diffMinutes = moment.duration(moment(maxDate).diff(moment(minDate))).asMinutes()
            const dataForEntry = diffMinutes / 2 // Total selesih menit / 2

            if (data !== 0) {
                let persentaseDataMasuk = data / dataForEntry * 100
                persentaseDataMasuk = persentaseDataMasuk > 100 ? 100 : persentaseDataMasuk
                $(progressDataMasuk).css('--progress-value', Math.round(persentaseDataMasuk))
                $(progressDataMasuk).html(`${Math.round(persentaseDataMasuk)}%`)
                $(dataMasuk).html(`${data}`)

                const totalMutu = (data - danger) < 0 ? (data - danger) + Math.abs((data - danger)) : (data - danger)
                let persentaseMutu = totalMutu !== 0 ? totalMutu / data * 100 : 0
                $(progressDataMutu).css('--progress-value', parseFloat(persentaseMutu.toFixed(1)))
                $(progressDataMutu).html(`${parseFloat(persentaseMutu.toFixed(1))}%`)
                $(dataMutu).html(`${totalMutu}`)

                let persentaseTidakMutu = danger / data * 100
                $(progressDataTidakMutu).css('--progress-value', parseFloat(persentaseTidakMutu.toFixed(1)))
                $(progressDataTidakMutu).html(`${parseFloat(persentaseTidakMutu.toFixed(1))}%`)
                $(dataTidakMutu).html(`${danger}`)
            } else {
                $(progressDataMasuk).css('--progress-value', 0)
                $(progressDataMasuk).html(`0%`)
                $(dataMasuk).html(`0`)

                $(progressDataMutu).css('--progress-value', 0)
                $(progressDataMutu).html(`0%`)
                $(dataMutu).html(`0`)

                $(progressDataTidakMutu).css('--progress-value', 0)
                $(progressDataTidakMutu).html(`0%`)
                $(dataTidakMutu).html(`0`)
            }
        } else {
            failureAlert({
                html: message,
                confirmButtonText: 'Tutup'
            })
        }
    }

    //endregion

    //region Fungsi Bantuan
    function isValidTimestamp(timestamp: number | undefined | null): boolean {
        return timestamp !== undefined &&
                timestamp !== null &&
                !isNaN(timestamp) &&
                isFinite(timestamp) &&
                timestamp > 0;
    }

    function isValidDate(date: Date | undefined | null): boolean {
        return date instanceof Date &&
                !isNaN(date.getTime()) &&
                isFinite(date.getTime());
    }

    function safeFormatTimestamp(timestamp: number | undefined | null, format: 'time' | 'datetime' = 'time', timezone: string = 'Asia/Jakarta', locale: string = 'id-ID', useSecond: boolean = false): string {
        if (!isValidTimestamp(timestamp)) {
            return format === 'time' ? '--:--' : 'Invalid Date';
        }

        try {
            const date = new Date(timestamp! * 1000);

            if (!isValidDate(date)) {
                return format === 'time' ? '--:--' : 'Invalid Date';
            }

            if (format === 'time') {
                const dateOptions: Intl.DateTimeFormatOptions = {
                    timeZone: timezone,
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                };

                if (useSecond) {
                    dateOptions.second = '2-digit';
                }

                return new Intl.DateTimeFormat(locale, dateOptions).format(date);
            } else {
                const dateOptions: Intl.DateTimeFormatOptions = {
                    timeZone: timezone,
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                };

                if (useSecond) {
                    dateOptions.second = '2-digit';
                }

                return new Intl.DateTimeFormat(locale, dateOptions).format(date);
            }
        } catch (error) {
            console.warn('Error formatting timestamp:', error);
            return format === 'time' ? '--:--' : 'Invalid Date';
        }
    }
    //endregion

    //region Handle Chart
    async function handleCharts(options: OptionsChart) {
        const {platformUid, tipeLogger, parameterId} = options

        $(bodyChart).html('<div class="skeleton-box w-[100%] !h-[400px] rounded"></div>')

        const response = await fetch(`/sparing/dashboard/maps/summary/data-charts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken
            },
            body: JSON.stringify({
                platformUid,
                tipeLogger,
                parameterId
            })
        })

        const {status} = response
        const {message, data, dataYaxis, minDate, maxDate, timezone: tz} = await response.json()
        if (status === 200) {
            $(platformUid).removeAttr('disabled')

            let tickInterval = 60 * 180 * 1000
            charts = Highcharts.chart({
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
                    text: `Parameter ${parameterId}`
                },
                yAxis: {
                    ...dataYaxis,
                    gridLineWidth: 1,
                    gridLineDashStyle: 'LongDash',
                },
                time: {
                    timezone: "UTC"
                },
                xAxis: {
                    type: 'datetime',
                    minPadding: 0,
                    maxPadding: 0,
                    tickInterval: tickInterval,
                    labels: {
                        formatter: function () {
                            const timestampMs = this.value as number;
                            const timestampSeconds = timestampMs / 1000;
                            return safeFormatTimestamp(timestampSeconds, 'time', 'Asia/Makassar', 'id-ID');
                        },
                        style: {
                            fontSize: '10px',
                            color: '#999'
                        }
                    },
                    lineWidth: 0,
                    tickWidth: 0,
                    gridLineWidth: 1,
                    gridLineColor: '#eee',
                    gridLineDashStyle: 'Dash',
                },
                tooltip: {
                    formatter: function () {
                        const timestampMs = this.x;
                        const timestampSeconds = timestampMs / 1000;
                        const formattedTime = safeFormatTimestamp(timestampSeconds, 'datetime', 'Asia/Makassar', 'id-ID', true);
                        const timezoneShort = 'Makassar';

                        return `
                            <div class="flex flex-col">
                                <div class="text-sm" style="color: ${this.color}">${this.series.name}</div>
                                <div>
                                    <table>
                                        <tr>
                                            <td class="text-sm p-0">Time</td>
                                            <td class="p-0"><b class="ml-2">: ${formattedTime} - (${timezoneShort})</b></td>
                                        </tr>
                                        <tr>
                                            <td class="text-sm p-0">Nilai</td>
                                            <td class="p-0"><b class="ml-2">: ${Highcharts.numberFormat(this.y, 2)}</b></td>
                                        </tr>
                                    </table>
                                </div>
                            </div>
                        `;
                    },
                    useHTML: true,
                },
                scrollbar: {
                    enabled: true,
                },
                plotOptions: {
                    series: {
                        turboThreshold: 0,
                        marker: {
                            enabled: false,
                            states: {
                                hover: {
                                    enabled: true,
                                    radius: 5
                                }
                            }
                        }
                    }
                },
                exporting: {
                    enabled: false
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
            }, () => {
                console.log('Chart Oke')
            })
        } else {
            failureAlert({
                html: message,
                confirmButtonText: 'Tutup'
            })
        }
    }

    //endregion

    //region Handle Chart Last Param
    async function handleChartsLastParam(options: OptionsChartLastParam) {
        const {platformUid, tipeLogger, parameterId} = options
        const response = await fetch(`/sparing/dashboard/maps/summary/data-charts-last-param`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken
            },
            body: JSON.stringify({
                platformUid,
                tipeLogger,
                parameterId
            })
        })

        const {status} = response
        const {message, data} = await response.json()
        if (status === 200) {
            if (charts !== null) {
                if (data !== null)
                    charts.series[0].addPoint(data)
            }
        } else {
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
            const {platformUid, statusPlatform, tipeLogger, url, search} = options || {}
            const qSearch = search ? `?search=${search}&platformUid=${platformUid}&statusPlatform=${statusPlatform}&tipeLogger=${tipeLogger}` : `?platformUid=${platformUid}&statusPlatform=${statusPlatform}&tipeLogger=${tipeLogger}`

            const response = await fetch(url || `/sparing/dashboard/maps/summary/data-table${qSearch}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken
                },
            })

            const {status} = response
            const {messages, data, paramAvailable, dataParameterLimit} = await response.json()
            if (status === 200) {
                resolve({data, paramAvailable, dataParameterLimit})
            } else {
                reject(messages)
            }
        })
    }

    function renderDataTable(options: OptionsTable, userLoader = true) {
        if (userLoader) {
            showHiddenElmAndText(loaderDataTable)
            $(bodyDataTable).html(null)
        }
        $(noDataTable).hide()

        handleDataTable(options).then((response) => {
            const {data} = response as any
            hiddenElm(loaderDataTable)
            renderBodyTable(response)
            renderPagination(data, renderDataTable, footerDataTable)
            $(platformUid).removeAttr('disabled')
        })
    }

    const renderBodyTable = (response: any) => {
        const {data, paramAvailable, dataParameterLimit} = response
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

        const {paramPh, paramDebit, paramCod, paramTss, paramNh3n} = paramAvailable

        const calcDebitWarnInMinutes = debit_warn
        const calcDebitWarnMinInMinutes = debit_warn_min
        const calcDebitMutuMinInMinutes = debit_mutu_min
        const calcDebitMutuInMinutes = debit_mutu

        const itemBodyTable = []
        // let no = from
        if (dataTable.length !== 0) {
            dataTable.map((item: any) => {
                const {datetime_formatted, ph, debit, cod, tss, nh3n} = item

                let statusTextColorPh: string
                let statusTextColorDebit: string
                let statusTextColorCod: string
                let statusTextColorTss: string
                let statusTextColorNh3n: string
                const dataParamStatus = []
                if (paramPh === 1) {
                    $(thPh).show()
                    if ((ph > ph_mutu_min && ph <= ph_warn_min) || (ph >= ph_warn_max && ph < ph_mutu_max)) {
                        dataParamStatus.push({val: 2})
                        statusTextColorPh = 'text-yellow-300'
                    } else if (ph >= ph_mutu_max || (ph <= ph_mutu_min && ph_intermit === 0)) {
                        dataParamStatus.push({val: 3})
                        statusTextColorPh = 'text-red-500'
                    } else {
                        dataParamStatus.push({val: 1})
                        statusTextColorPh = 'text-green-500'
                    }
                } else {
                    $(thPh).hide()
                }

                if (paramDebit === 1) {
                    $(thDebit).show()
                    if (debit > calcDebitWarnInMinutes && debit <= calcDebitWarnMinInMinutes || debit >= calcDebitMutuMinInMinutes && debit < calcDebitMutuInMinutes) {
                        dataParamStatus.push({val: 2})
                        statusTextColorDebit = 'text-yellow-300'
                    } else if (debit >= calcDebitMutuInMinutes || (debit <= calcDebitWarnInMinutes && debit_intermit === 0)) {
                        dataParamStatus.push({val: 3})
                        statusTextColorDebit = 'text-red-500'
                    } else {
                        dataParamStatus.push({val: 1})
                        statusTextColorDebit = 'text-green-500'
                    }
                } else {
                    $(thDebit).hide()
                }

                if (paramCod === 1) {
                    $(thCod).show()
                    if (cod >= cod_warn && cod <= cod_mutu) {
                        dataParamStatus.push({val: 2})
                        statusTextColorCod = 'text-yellow-300'
                    } else if (cod > cod_mutu || (cod <= 0 && cod_intermit === 0)) {
                        dataParamStatus.push({val: 3})
                        statusTextColorCod = 'text-red-500'
                    } else {
                        dataParamStatus.push({val: 1})
                        statusTextColorCod = 'text-green-500'
                    }
                } else {
                    $(thCod).hide()
                }

                if (paramTss === 1) {
                    $(thTss).show()
                    if (tss > tss_warn && tss <= tss_warn_min || tss >= tss_mutu_min && tss < tss_mutu) {
                        dataParamStatus.push({val: 2})
                        statusTextColorTss = 'text-yellow-300'
                    } else if (tss >= tss_mutu || (tss <= tss_warn && tss_intermit === 0)) {
                        dataParamStatus.push({val: 3})
                        statusTextColorTss = 'text-red-500'
                    } else {
                        dataParamStatus.push({val: 1})
                        statusTextColorTss = 'text-green-500'
                    }
                } else {
                    $(thTss).hide()
                }

                if (paramNh3n === 1) {
                    $(thNh3n).show()
                    if (nh3n >= nh3n_warn && nh3n <= nh3n_mutu) {
                        dataParamStatus.push({val: 2})
                        statusTextColorNh3n = 'text-yellow-300'
                    } else if (nh3n > nh3n_mutu || (nh3n <= 0 && nh3n_intermit === 0)) {
                        dataParamStatus.push({val: 3})
                        statusTextColorNh3n = 'text-red-500'
                    } else {
                        dataParamStatus.push({val: 1})
                        statusTextColorNh3n = 'text-green-500'
                    }
                } else {
                    $(thNh3n).hide()
                }

                let maxStatus = 0
                dataParamStatus.map((item) => {
                    const {val} = item
                    if (val > maxStatus)
                        maxStatus = val
                })

                let statusNilai = `Normal`
                let statusNilaiBadge = 'ds-badge-success'
                if (maxStatus === 2) {
                    statusNilai = `Warning`
                    statusNilaiBadge = 'ds-badge-warning'
                } else if (maxStatus === 3) {
                    statusNilai = `Danger`
                    statusNilaiBadge = 'ds-badge-error'
                }

                itemBodyTable.push(`
                    <tr>
                        <td class="text-center">${moment(datetime_formatted, 'YYYY-MM-DD HH:mm:ss').format('HH:mm')}</td>
                        <td class="text-right ${statusTextColorPh} ${paramPh !== 1 ? 'hidden' : ''}">${ph.toFixed(2)}</td>
                        <td class="text-right ${statusTextColorCod} ${paramCod !== 1 ? 'hidden' : ''}">${cod.toFixed(2)}</td>
                        <td class="text-right ${statusTextColorTss} ${paramTss !== 1 ? 'hidden' : ''}">${tss.toFixed(0)}</td>
                        <td class="text-right ${statusTextColorNh3n} ${paramNh3n !== 1 ? 'hidden' : ''}">${nh3n.toFixed(2)}</td>
                        <td class="text-right ${statusTextColorDebit} ${paramDebit !== 1 ? 'hidden' : ''}">${debit.toFixed(2)}</td>
                        <td data-sticky data-sticky-rw="0px" class="text-center">
                            <span class="ds-badge ds-badge-outline ${statusNilaiBadge} !text-[11px]">
                                ${statusNilai}
                            </span>
                        </td>
                    </tr>
                `)
            })

            // @ts-ignore
            $(bodyDataTable).html(itemBodyTable)
            handleFixedTheadTh()
            handleFixedTd()
            $(noDataTable).hide()
        } else {
            $(bodyDataTable).html('')
            $(noDataTable).show()
        }
    }
    //endregion

    //region Handle Interval
    setInterval(() => {
        handleLastParameterData({
            platformUid: platformUidSelected.value,
            tipeLogger: tipeLoggerSelected.value,
            timezone: timezone.value
        }).then(null)

        handlePersentaseData({
            platformUid: platformUidSelected.value,
            tipeLogger: tipeLoggerSelected.value,
            parameterId: parameterId.value
        }, false).then(null)

        handleChartsLastParam({
            platformUid: platformUidSelected.value,
            tipeLogger: tipeLoggerSelected.value,
            parameterId: parameterId.value
        }).then(null)

        renderDataTable({
            platformUid: platformUidSelected.value,
            tipeLogger: tipeLoggerSelected.value,
        }, false)
    }, 120000)
    //endregion

    //region Handle Dokumen
    if (btnLihatDokumen) {
        btnLihatDokumen.addEventListener('click', function () {
            showModalDialog(modalDokumen, '<i class="fas fa-file mr-2"></i> Dokumen', async () => {
                const response = await fetch(`/sparing/dashboard/maps/summary/data-dokumen`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': csrfToken
                    },
                    body: JSON.stringify({
                        platformUid: platformUid.value,
                    })
                })

                const {status} = response
                const {message, data} = await response.json()
                if (status === 200) {
                    if (data.length !== 0) {
                        let noIndex = 0
                        data.map((item: any) => {
                            const {id, nama_dokumen, lokasi_file, nama_file, tipe_file, ukuran_file} = item
                            $(noDokumen).hide()

                            noIndex++
                            $(tBodyDokumen).append(`
                                <tr class="dataDokumen">
                                    <td class="text-center indexData">${noIndex}</td>
                                    <td class="text-left">
                                        <a href="/storage/${lokasi_file}/${nama_file}" target="_blank">
                                            ${nama_dokumen}
                                        </a>
                                        <input type="hidden" class="dokumenId" value="${id}">
                                    </td>
                                    <td class="text-left">
                                        <a href="/storage/${lokasi_file}/${nama_file}" target="_blank">
                                            ${nama_file}
                                        </a>
                                    </td>
                                    <td class="text-left">
                                        ${tipe_file}
                                    </td>
                                    <td class="text-right">
                                        ${formatBytes(parseFloat(ukuran_file))}
                                    </td>
                                    <td class="text-center">
                                        <a href="/storage/${lokasi_file}/${nama_file}" target="_blank">
                                            <i class="fas fa-cloud-download"></i>
                                        </a>
                                    </td>
                                </tr>
                            `)
                        })

                    } else {
                        $(noDokumen).show()
                        $(tBodyDokumen).html(null)
                    }
                } else {
                    failureAlert({
                        html: message,
                        confirmButtonText: 'Tutup'
                    })
                }
            })
        })
    }
    //endregion

})
