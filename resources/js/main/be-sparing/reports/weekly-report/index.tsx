import Highcharts from 'highcharts'
import "highcharts/highcharts-more"
import "highcharts/modules/exporting"
import "highcharts/modules/offline-exporting"
import {getMetaContent, hiddenElm, showHiddenElmAndText} from "@/js/plugins/functions";
import moment from "moment";
import {closeModalDialog, showModalDialog} from "@/js/plugins/modal";

interface optionPencarian {
    platformUid: string,
    tipeLogger: number,
    parameterId?: string,
    month: number,
    year: number,
    url?: string,
    search?: string,
}

document.addEventListener('DOMContentLoaded', () => {

    const csrfToken = getMetaContent('csrf-token')
    const url = new URL(window.location.href)
    const win: Window = window

    const platformUidSelected: HTMLInputElement = document.querySelector('.platformUidSelected')
    const tipeLoggerSelected: HTMLInputElement = document.querySelector('.tipeLoggerSelected')
    const bulanSelected: HTMLInputElement = document.querySelector('.bulanSelected')
    const tahunSelected: HTMLInputElement = document.querySelector('.tahunSelected')

    const cardNilaiPh: HTMLElement = document.querySelector('.cardNilaiPh')
    const cardNilaiTss: HTMLElement = document.querySelector('.cardNilaiTss')
    const cardNilaiDebit: HTMLElement = document.querySelector('.cardNilaiDebit')

    const btnExportChart: HTMLElement = document.querySelector('.btnExportChart')
    const loaderDataEntry: HTMLElement = document.querySelector('.loaderDataEntry')
    const bodyChart: HTMLElement = document.querySelector('.bodyChart')
    const btnExportChartComply: HTMLElement = document.querySelector('.btnExportChartComply')
    const loaderDataComply: HTMLElement = document.querySelector('.loaderDataComply')
    const bodyChartComply: HTMLElement = document.querySelector('.bodyChartComply')
    const btnExportPH: HTMLElement = document.querySelector('.btnExportPH')
    const loaderDataPH: HTMLElement = document.querySelector('.loaderDataPH')
    const bodyChartPH: HTMLElement = document.querySelector('.bodyChartPH')
    const btnExportTSS: HTMLElement = document.querySelector('.btnExportTSS')
    const loaderDataTSS: HTMLElement = document.querySelector('.loaderDataTSS')
    const bodyChartTSS: HTMLElement = document.querySelector('.bodyChartTSS')
    const loaderDataDebit: HTMLElement = document.querySelector('.loaderDataDebit')
    const btnExportDebit: HTMLElement = document.querySelector('.btnExportDebit')
    const bodyChartDebit: HTMLElement = document.querySelector('.bodyChartDebit')

    const btnPencarian = document.querySelector('.btnPencarian')
    const modalPencarian = document.querySelector('.modalPencarian')
    const closeModalForm = document.querySelectorAll('.closeModalForm')

    Highcharts.setOptions({
        lang: {
            decimalPoint: '.',
            thousandsSep: ','
        }
    })

    //region Handle Close Modal
    closeModalForm.forEach((elm: Element) => {
        elm.addEventListener('click', function () {
            if (modalPencarian) {
                closeModalDialog(modalPencarian)
            }
        })
    })
    //endregion

    //region Handle Pencarian
    if (btnPencarian !== null) {
        btnPencarian.addEventListener('click', function () {
            showModalDialog(modalPencarian, null, () => {
                const btnCari = document.querySelector<HTMLElement>('.btnCari')
                const btnResetPencarian = document.querySelector<HTMLElement>('.btnResetPencarian')

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

                    const {platformUid, tipeLogger, bulan, tahun} = text_result as any

                    handleDataAvgParameter({
                        platformUid: platformUid,
                        tipeLogger: tipeLogger,
                        month: bulan,
                        year: tahun,
                    }).then(null)

                    handleWeeklyDataEntryChart({
                        platformUid: platformUid,
                        tipeLogger: tipeLogger,
                        month: bulan,
                        year: tahun,
                    }).then(null)

                    handleWeeklyDataComplyChart({
                        platformUid: platformUid,
                        tipeLogger: tipeLogger,
                        month: bulan,
                        year: tahun,
                    }).then(null)

                    handleWeeklySensor(bodyChartPH, btnExportPH, loaderDataPH, {
                        platformUid: platformUid,
                        tipeLogger: tipeLogger,
                        month: bulan,
                        year: tahun,
                        parameterId: 'pH'
                    }).then(null)

                    handleWeeklySensor(bodyChartTSS, btnExportTSS, loaderDataTSS, {
                        platformUid: platformUid,
                        tipeLogger: tipeLogger,
                        month: bulan,
                        year: tahun,
                        parameterId: 'TSS'
                    }).then(null)

                    handleWeeklySensor(bodyChartDebit, btnExportDebit, loaderDataDebit, {
                        platformUid: platformUid,
                        tipeLogger: tipeLogger,
                        month: bulan,
                        year: tahun,
                        parameterId: 'Debit'
                    }).then(null)

                    closeModalDialog(modalPencarian, () => {
                        history.pushState({}, null, `${url.pathname}?${text_result_url.join('&')}`)
                    })
                })
            })
        })
    }
    //endregion

    handleDataAvgParameter({
        platformUid: platformUidSelected.value,
        tipeLogger: parseInt(tipeLoggerSelected.value),
        month: parseInt(bulanSelected.value),
        year: parseInt(tahunSelected.value),
    }).then(null)

    handleWeeklyDataEntryChart({
        platformUid: platformUidSelected.value,
        tipeLogger: parseInt(tipeLoggerSelected.value),
        month: parseInt(bulanSelected.value),
        year: parseInt(tahunSelected.value),
    }).then(null)

    handleWeeklyDataComplyChart({
        platformUid: platformUidSelected.value,
        tipeLogger: parseInt(tipeLoggerSelected.value),
        month: parseInt(bulanSelected.value),
        year: parseInt(tahunSelected.value),
    }).then(null)

    handleWeeklySensor(bodyChartPH, btnExportPH, loaderDataPH, {
        platformUid: platformUidSelected.value,
        tipeLogger: parseInt(tipeLoggerSelected.value),
        month: parseInt(bulanSelected.value),
        year: parseInt(tahunSelected.value),
        parameterId: 'pH'
    }).then(null)

    handleWeeklySensor(bodyChartTSS, btnExportTSS, loaderDataTSS, {
        platformUid: platformUidSelected.value,
        tipeLogger: parseInt(tipeLoggerSelected.value),
        month: parseInt(bulanSelected.value),
        year: parseInt(tahunSelected.value),
        parameterId: 'TSS'
    }).then(null)

    handleWeeklySensor(bodyChartDebit, btnExportDebit, loaderDataDebit, {
        platformUid: platformUidSelected.value,
        tipeLogger: parseInt(tipeLoggerSelected.value),
        month: parseInt(bulanSelected.value),
        year: parseInt(tahunSelected.value),
        parameterId: 'Debit'
    }).then(null)

    async function handleDataAvgParameter(options: optionPencarian) {
        const {
            platformUid,
            tipeLogger,
            month,
            year
        } = options

        const response = await fetch(`${url.pathname}/data-avg-parameter`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken
            },
            body: JSON.stringify({
                platformUid,
                tipeLogger,
                month,
                year,
            })
        })

        const {status} = response
        const {message, data} = await response.json()
        if (status === 200) {
            const {
                ph,
                tss,
                debit
            } = data

            const formatNumber = new Intl.NumberFormat('en-EN', {maximumFractionDigits: 2})
            cardNilaiPh.innerText = `${formatNumber.format(ph)}`
            cardNilaiTss.innerText = `${formatNumber.format(tss)}`
            cardNilaiDebit.innerText = `${formatNumber.format(debit)}`
        }
    }

    //region Handle Weekly Data Entry
    async function handleWeeklyDataEntryChart(options: optionPencarian) {
        showHiddenElmAndText(loaderDataEntry)

        const {
            platformUid,
            tipeLogger,
            month,
            year
        } = options

        const dateFormat = `${year}-${month}-01`

        const response = await fetch(`${url.pathname}/data-entry-charts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken
            },
            body: JSON.stringify({
                platformUid,
                tipeLogger,
                month,
                year,
            })
        })

        const {status} = response
        const {message, data, dataCategories} = await response.json()
        if (status === 200) {
            hiddenElm(loaderDataEntry)

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
                    text: `${platformUid}`
                },
                subtitle: {
                    text: `Periode ${moment(dateFormat, 'YYYY-MM-DD').format('MMMM YYYY')}`
                },
                yAxis: {
                    min: 0,
                    max: 100,
                    title: {
                        text: 'Persentase'
                    },
                    labels: {
                        format: '{value}%'
                    },
                    gridLineWidth: 1,
                    gridLineDashStyle: 'LongDash',
                },
                xAxis: {
                    categories: dataCategories,
                    crosshair: true,
                    accessibility: {
                        description: 'Countries'
                    }
                },
                tooltip: {
                    shared: true
                },
                scrollbar: {
                    enabled: false,
                },
                plotOptions: {
                    series: {
                        turboThreshold: 0
                    }
                },
                exporting: {
                    enabled: false
                },
                series: [{
                    name: 'Data Masuk',
                    type: 'column',
                    data: data,
                }],
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
                        filename: `Entry_${platformUid}_${moment(dateFormat, 'YYYY-MM-DD').format('MM-YYYY')}`,
                        sourceWidth: 700,
                        sourceHeight: 500,
                        fallbackToExportServer: false
                    }, {
                        title: {
                            text: `${platformUid}`
                        },
                        subtitle: {
                            text: `Periode ${moment(dateFormat, 'YYYY-MM-DD').format('MMMM YYYY')}`
                        },
                    })
                })
            }
        } else {
            hiddenElm(loaderDataEntry)
            console.log(message)
        }
    }

    //endregion

    //region Handle Weekly Data Comply
    async function handleWeeklyDataComplyChart(options: optionPencarian) {
        showHiddenElmAndText(loaderDataComply)

        const {
            platformUid,
            tipeLogger,
            month,
            year
        } = options

        const dateFormat = `${year}-${month}-01`

        const response = await fetch(`${url.pathname}/data-comply-charts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken
            },
            body: JSON.stringify({
                platformUid,
                tipeLogger,
                month,
                year,
            })
        })

        const {status} = response
        const {message, data, dataCategories} = await response.json()
        if (status === 200) {
            hiddenElm(loaderDataComply)

            const chart = Highcharts.chart({
                chart: {
                    renderTo: bodyChartComply,
                    type: 'column',
                    style: {
                        fontFamily: 'Nunito'
                    },
                },
                accessibility: {
                    enabled: false
                },
                title: {
                    text: `${platformUid}`
                },
                subtitle: {
                    text: `Periode ${moment(dateFormat, 'YYYY-MM-DD').format('MMMM YYYY')}`
                },
                yAxis: {
                    min: 0,
                    max: 100,
                    title: {
                        text: 'Persentase'
                    },labels: {
                        format: '{value}%'
                    },
                    gridLineWidth: 1,
                    gridLineDashStyle: 'LongDash',
                },
                xAxis: {
                    categories: dataCategories,
                    crosshair: true,
                    accessibility: {
                        description: 'Countries'
                    }
                },
                tooltip: {
                    shared: true
                },
                scrollbar: {
                    enabled: false,
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

            if (btnExportChartComply) {
                $(btnExportChartComply).css('cursor', 'pointer')
                $(btnExportChartComply).css('color', 'black')
                btnExportChartComply.addEventListener('click', function () {
                    chart.exportChartLocal({
                        type: 'image/png',
                        filename: `Comply_${platformUid}_${moment(dateFormat, 'YYYY-MM-DD').format('MM-YYYY')}`,
                        sourceWidth: 700,
                        sourceHeight: 500,
                        fallbackToExportServer: false
                    }, {
                        title: {
                            text: `${platformUid}`
                        },
                        subtitle: {
                            text: `Periode ${moment(dateFormat, 'YYYY-MM-DD').format('MMMM YYYY')}`
                        },
                    })
                })
            }
        } else {
            hiddenElm(loaderDataComply)
            console.log(message)
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

    //region Handle Weekly Data Sensor
    async function handleWeeklySensor(elm: HTMLElement, btnExport: HTMLElement, loader: HTMLElement, options: optionPencarian) {
        showHiddenElmAndText(loader)

        const {
            platformUid,
            tipeLogger,
            month,
            year,
            parameterId
        } = options

        const dateFormat = `${year}-${month}-01`

        const response = await fetch(`${url.pathname}/data-sensor-charts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken
            },
            body: JSON.stringify({
                platformUid,
                tipeLogger,
                month,
                year,
                parameterId
            })
        })

        const {status} = response
        const {message, dataYaxis, data} = await response.json()
        if (status === 200) {
            hiddenElm(loader)

            let tickInterval = 60 * 180 * 1000
            const chart = Highcharts.chart({
                chart: {
                    renderTo: elm,
                    type: 'column',
                    style: {
                        fontFamily: 'Nunito'
                    },
                },
                accessibility: {
                    enabled: false
                },
                title: {
                    text: `${platformUid} - Sensor ${parameterId}`,
                },
                subtitle: {
                    text: `Periode ${moment(dateFormat, 'YYYY-MM-DD').format('MMMM YYYY')}`
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
                            return safeFormatTimestamp(timestampSeconds, 'time', 'UTC', 'id-ID');
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
                        const date = new Date(this.x);
                        const timeStr = `${String(date.getUTCHours()).padStart(2, '0')}:${String(date.getUTCMinutes()).padStart(2, '0')}`;

                        return `
                            <div class="flex flex-col">
                                <div class="text-sm" style="color: ${this.color}">${this.series.name}</div>
                                <div>
                                    <table>
                                        <tr>
                                            <td class="text-sm p-0">Time</td>
                                            <td class="p-0"><b class="ml-2">: ${timeStr}</b></td>
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
                    enabled: false,
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

            if (btnExport) {
                $(btnExport).css('cursor', 'pointer')
                $(btnExport).css('color', 'black')
                btnExport.addEventListener('click', function () {
                    chart.exportChartLocal({
                        type: 'image/png',
                        filename: `${platformUid}_${parameterId}_${moment(dateFormat, 'YYYY-MM-DD').format('MM-YYYY')}`,
                        sourceWidth: 700,
                        sourceHeight: 500,
                        fallbackToExportServer: false
                    }, {
                        title: {
                            text: `${platformUid} - Sensor ${parameterId}`,
                        },
                        subtitle: {
                            text: `Periode ${moment(dateFormat, 'YYYY-MM-DD').format('MMMM YYYY')}`
                        },
                    })
                })
            }
        } else {
            hiddenElm(loader)
            console.log(message)
        }
    }
    //endregion

})
