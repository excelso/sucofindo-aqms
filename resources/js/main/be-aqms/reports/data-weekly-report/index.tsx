import {getMetaContent, hiddenElm, showHiddenElmAndText} from "@/js/plugins/functions";
import Highcharts from 'highcharts'
import "highcharts/highcharts-more"
import "highcharts/modules/exporting"
import "highcharts/modules/offline-exporting"
import moment, {locale} from "moment/moment";
import {closeModalDialog, showModalDialog} from "@/js/plugins/modal";

interface optionPencarian {
    uid: string,
    parameterId?: string,
    parameterTitle?: string,
    month: number,
    year: number,
    url?: string,
    search?: string,
}

document.addEventListener("DOMContentLoaded", () => {
    const csrfToken = getMetaContent('csrf-token')
    const url = new URL(window.location.href)
    const win: Window = window

    const btnSearch: HTMLElement = document.querySelector('.btnSearch')
    const modalPencarian = document.querySelector('.modalPencarian')
    const closeModalForm: NodeListOf<HTMLElement> = document.querySelectorAll('.closeModalForm')
    const uidSelected: HTMLInputElement = document.querySelector('.uidSelected')
    const bulanSelected: HTMLInputElement = document.querySelector('.bulanSelected')
    const tahunSelected: HTMLInputElement = document.querySelector('.tahunSelected')

    const cardNilaiPm25 = document.querySelector('.cardNilaiPm25')
    const cardNilaiPm10 = document.querySelector('.cardNilaiPm10')
    const cardNilaiTsp = document.querySelector('.cardNilaiTsp')
    const cardNilaiNoise = document.querySelector('.cardNilaiNoise')

    const btnExportChart: HTMLElement = document.querySelector('.btnExportChart')
    const loaderDataEntry: HTMLElement = document.querySelector('.loaderDataEntry')
    const bodyChart: HTMLElement = document.querySelector('.bodyChart')
    const dataEntryMonthly: HTMLElement = document.querySelector('.dataEntryMonthly')

    const btnExportChartConnect: HTMLElement = document.querySelector('.btnExportChartConnect')
    const loaderDataConnect: HTMLElement = document.querySelector('.loaderDataConnect')
    const bodyChartConnect: HTMLElement = document.querySelector('.bodyChartConnect')
    const dataConnectMonthly: HTMLElement = document.querySelector('.dataConnectMonthly')

    const btnExportPm25: HTMLElement = document.querySelector('.btnExportPm25')
    const loaderDataPm25: HTMLElement = document.querySelector('.loaderDataPm25')
    const bodyChartPm25: HTMLElement = document.querySelector('.bodyChartPm25')

    const btnExportPm10: HTMLElement = document.querySelector('.btnExportPm10')
    const loaderDataPm10: HTMLElement = document.querySelector('.loaderDataPm10')
    const bodyChartPm10: HTMLElement = document.querySelector('.bodyChartPm10')

    const btnExportTsp: HTMLElement = document.querySelector('.btnExportTsp')
    const loaderDataTsp: HTMLElement = document.querySelector('.loaderDataTsp')
    const bodyChartTsp: HTMLElement = document.querySelector('.bodyChartTsp')

    const btnExportNoise: HTMLElement = document.querySelector('.btnExportNoise')
    const loaderDataNoise: HTMLElement = document.querySelector('.loaderDataNoise')
    const bodyChartNoise: HTMLElement = document.querySelector('.bodyChartNoise')

    handleAvgLogger({
        uid: uidSelected.value,
        month: parseInt(bulanSelected.value),
        year: parseInt(tahunSelected.value),
    }).catch((error) => {
        console.error(error)
    })

    handleWeeklyDataEntryChart({
        uid: uidSelected.value,
        month: parseInt(bulanSelected.value),
        year: parseInt(tahunSelected.value),
    }).catch((error) => {
        console.error(error)
    })

    handleWeeklyDataConnectChart({
        uid: uidSelected.value,
        month: parseInt(bulanSelected.value),
        year: parseInt(tahunSelected.value),
    }).catch((error) => {
        console.error(error)
    })

    handleWeeklySensor(bodyChartPm25, btnExportPm25, loaderDataPm25, {
        uid: uidSelected.value,
        month: parseInt(bulanSelected.value),
        year: parseInt(tahunSelected.value),
        parameterId: 'pm_25',
        parameterTitle: 'PM 2.5'
    }).then(null)

    handleWeeklySensor(bodyChartPm10, btnExportPm10, loaderDataPm10, {
        uid: uidSelected.value,
        month: parseInt(bulanSelected.value),
        year: parseInt(tahunSelected.value),
        parameterId: 'pm_10',
        parameterTitle: 'PM 10'
    }).then(null)

    handleWeeklySensor(bodyChartTsp, btnExportTsp, loaderDataTsp, {
        uid: uidSelected.value,
        month: parseInt(bulanSelected.value),
        year: parseInt(tahunSelected.value),
        parameterId: 'tsp',
        parameterTitle: 'TSP'
    }).then(null)

    handleWeeklySensor(bodyChartNoise, btnExportNoise, loaderDataNoise, {
        uid: uidSelected.value,
        month: parseInt(bulanSelected.value),
        year: parseInt(tahunSelected.value),
        parameterId: 'noise',
        parameterTitle: 'Noise'
    }).then(null)

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
    if (btnSearch !== null) {
        btnSearch.addEventListener('click', function () {
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
                        if (elm.value !== '') {
                            text_result[elmNames] = elm.value
                            text_result_url.push(`${elmNames}=${elm.value}`)
                        }
                    })

                    const {platformUid, bulan, tahun} = text_result as any

                    handleAvgLogger({
                        uid: platformUid,
                        month: bulan,
                        year: tahun,
                    }).catch((error) => {
                        console.error(error)
                    })

                    handleWeeklyDataEntryChart({
                        uid: platformUid,
                        month: bulan,
                        year: tahun,
                    }).catch((error) => {
                        console.error(error)
                    })

                    handleWeeklyDataConnectChart({
                        uid: platformUid,
                        month: bulan,
                        year: tahun,
                    }).catch((error) => {
                        console.error(error)
                    })

                    handleWeeklySensor(bodyChartPm25, btnExportPm25, loaderDataPm25, {
                        uid: platformUid,
                        month: bulan,
                        year: tahun,
                        parameterId: 'pm_25',
                        parameterTitle: 'PM 2.5'
                    }).then(null)

                    handleWeeklySensor(bodyChartPm10, btnExportPm10, loaderDataPm10, {
                        uid: platformUid,
                        month: bulan,
                        year: tahun,
                        parameterId: 'pm_10',
                        parameterTitle: 'PM 10'
                    }).then(null)

                    handleWeeklySensor(bodyChartTsp, btnExportTsp, loaderDataTsp, {
                        uid: platformUid,
                        month: bulan,
                        year: tahun,
                        parameterId: 'tsp',
                        parameterTitle: 'TSP'
                    }).then(null)

                    handleWeeklySensor(bodyChartNoise, btnExportNoise, loaderDataNoise, {
                        uid: platformUid,
                        month: bulan,
                        year: tahun,
                        parameterId: 'noise',
                        parameterTitle: 'Noise'
                    }).then(null)

                    closeModalDialog(modalPencarian, () => {
                        history.pushState({}, null, `${url.pathname}?${text_result_url.join('&')}`)
                    })
                })
            })
        })
    }
    //endregion

    //region Handle Data Average Logger
    async function handleAvgLogger(options: optionPencarian) {

        cardNilaiPm25.innerHTML = `<div class="skeleton-box w-[130px] !h-6 rounded-md"></div>`
        cardNilaiPm10.innerHTML = `<div class="skeleton-box w-[130px] !h-6 rounded-md"></div>`
        cardNilaiTsp.innerHTML = `<div class="skeleton-box w-[130px] !h-6 rounded-md"></div>`
        cardNilaiNoise.innerHTML = `<div class="skeleton-box w-[130px] !h-6 rounded-md"></div>`

        const {uid, month, year} = options
        const response = await fetch(`${url.pathname}/data-avg?uid=${uid}&month=${month}&year=${year}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken
            },
        })

        const {status} = response
        const {message, data} = await response.json()
        if (status === 200) {
            const {
                pm_25,
                pm_10,
                tsp,
                noise,
            } = data

            cardNilaiPm25.innerHTML = `${pm_25 ?? '0'} µg/m³`
            cardNilaiPm10.innerHTML = `${pm_10 ?? '0'} µg/m³`
            cardNilaiTsp.innerHTML = `${tsp ?? '0'} µg/m³`
            cardNilaiNoise.innerHTML = `${noise ?? '0'} dBA`
        } else {
            throw new Error(message)
        }
    }

    //endregion

    //region Handle Chart Data Entry
    async function handleWeeklyDataEntryChart(options: optionPencarian) {
        showHiddenElmAndText(loaderDataEntry)

        const {
            uid,
            month,
            year
        } = options

        const dateFormat = `${year}-${month}-01`
        const response = await fetch(`${url.pathname}/data-entry-charts?uid=${uid}&month=${month}&year=${year}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken
            },
        })

        const {status} = response
        const {message, data, dataCategories, dataMonthly} = await response.json()
        if (status === 200) {
            hiddenElm(loaderDataEntry)

            dataEntryMonthly.textContent = `${dataMonthly}%`

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
                    text: `${uid}`
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
                    shared: true,
                    useHTML: true,
                    formatter: function () {
                        const point = this.points[0] as any
                        const weekDetail = point.weekDetail

                        return `
                            ${this.points[0].key}<br/>
                            ${this.points[0].series.name}: <b>${this.y}%</b><br/>
                            Periode: ${moment(weekDetail.startDate).format('DD MMM YYYY')} - ${moment(weekDetail.untilDate).format('DD MMM YYYY')}<br/>
                        `
                    }
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
                    name: 'Data Entries',
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
                btnExportChart.className = 'cursor-pointer text-black'
                btnExportChart.addEventListener('click', function () {
                    chart.exportChartLocal({
                        type: 'image/png',
                        filename: `Entry_${uid}_${moment(dateFormat, 'YYYY-MM-DD').format('MM-YYYY')}`,
                        sourceWidth: 700,
                        sourceHeight: 500,
                        fallbackToExportServer: false
                    }, {
                        title: {
                            text: `${uid}`
                        },
                        subtitle: {
                            text: `Periode ${moment(dateFormat, 'YYYY-MM-DD').format('MMMM YYYY')}`
                        },
                    })
                })
            }
        } else {
            hiddenElm(loaderDataEntry)
            throw new Error(message)
        }
    }

    //endregion

    //region Handle Chart Data Connectivity
    async function handleWeeklyDataConnectChart(options: optionPencarian) {
        showHiddenElmAndText(loaderDataConnect)

        const {
            uid,
            month,
            year
        } = options

        const dateFormat = `${year}-${month}-01`
        const response = await fetch(`${url.pathname}/data-connect-charts?uid=${uid}&month=${month}&year=${year}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken
            },
        })

        const {status} = response
        const {message, data, dataCategories, dataMonthly} = await response.json()
        if (status === 200) {
            hiddenElm(loaderDataConnect)

            dataConnectMonthly.textContent = `${dataMonthly}%`

            const chart = Highcharts.chart({
                chart: {
                    renderTo: bodyChartConnect,
                    type: 'column',
                    style: {
                        fontFamily: 'Nunito'
                    },
                },
                accessibility: {
                    enabled: false
                },
                title: {
                    text: `${uid}`
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
                    name: 'Data Connectivity',
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

            if (btnExportChartConnect) {
                btnExportChartConnect.className = 'cursor-pointer text-black'
                btnExportChartConnect.addEventListener('click', function () {
                    chart.exportChartLocal({
                        type: 'image/png',
                        filename: `Connect_${uid}_${moment(dateFormat, 'YYYY-MM-DD').format('MM-YYYY')}`,
                        sourceWidth: 700,
                        sourceHeight: 500,
                        fallbackToExportServer: false
                    }, {
                        title: {
                            text: `${uid}`
                        },
                        subtitle: {
                            text: `Periode ${moment(dateFormat, 'YYYY-MM-DD').format('MMMM YYYY')}`
                        },
                    })
                })
            }
        } else {
            hiddenElm(loaderDataConnect)
            throw new Error(message)
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
            uid,
            month,
            year,
            parameterId,
            parameterTitle
        } = options

        const dateFormat = `${year}-${month}-01`

        const response = await fetch(`${url.pathname}/data-sensor-charts?uid=${uid}&month=${month}&year=${year}&parameterId=${parameterId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken
            },
        })

        const {message, dataYaxis, data} = await response.json()

        if (!response.ok) {
            hiddenElm(loader)
            throw new Error(message || `HTTP error! status: ${response.status}`)
        }

        hiddenElm(loader)

        let tickInterval = 60 * 120 * 1000; // ✅ 2 jam untuk lebih jelas

        // ✅ Set range 00:00 - 23:59 (timestamp dalam UTC yang merepresentasikan waktu lokal)
        const minTime = Date.UTC(2025, 0, 1, 0, 0, 0); // 2025-01-01 00:00:00 UTC
        const maxTime = Date.UTC(2025, 0, 1, 23, 59, 59); // 2025-01-01 23:59:59 UTC

        const xValues = data.map((point) => {
            return point.data[0] ? point.data[0].x : 0
        });

        const chart = Highcharts.chart({
            chart: {
                renderTo: elm,
                type: 'line',
                style: {
                    fontFamily: 'Nunito'
                },
            },
            accessibility: {
                enabled: false
            },
            title: {
                text: `${uid} - Sensor ${parameterTitle}`,
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
                timezone: 'UTC',
            },
            xAxis: {
                type: 'datetime',
                minPadding: 0,
                maxPadding: 0,
                // min: 1735689600000,
                // max: 1735775400000,
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
        })

        if (btnExport) {
            btnExport.className = 'cursor-pointer text-black'
            btnExport.addEventListener('click', function () {
                chart.exportChartLocal({
                    type: 'image/png',
                    filename: `${uid}_${parameterId}_${moment(dateFormat, 'YYYY-MM-DD').format('MM-YYYY')}`,
                    sourceWidth: 700,
                    sourceHeight: 500,
                    fallbackToExportServer: false
                }, {
                    title: {
                        text: `${uid} - Sensor ${parameterId}`,
                    },
                    subtitle: {
                        text: `Periode ${moment(dateFormat, 'YYYY-MM-DD').format('MMMM YYYY')}`
                    },
                })
            })
        }
    }

    //endregion

});
