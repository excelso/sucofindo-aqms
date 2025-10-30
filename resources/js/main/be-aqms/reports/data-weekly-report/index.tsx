import {getMetaContent, hiddenElm, showHiddenElmAndText} from "@/js/plugins/functions";
import Highcharts from 'highcharts'
import "highcharts/highcharts-more"
import "highcharts/modules/exporting"
import "highcharts/modules/offline-exporting"
import moment from "moment/moment";

interface optionPencarian {
    uid: string,
    parameterId?: string,
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

    const btnExportChartConnect: HTMLElement = document.querySelector('.btnExportChartConnect')
    const loaderDataConnect: HTMLElement = document.querySelector('.loaderDataConnect')
    const bodyChartConnect: HTMLElement = document.querySelector('.bodyChartConnect')

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

    if (btnSearch) {
        btnSearch.addEventListener('click', () => {
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
        })
    }

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

            cardNilaiPm25.innerHTML = `${pm_25} µg/m³`
            cardNilaiPm10.innerHTML = `${pm_10} µg/m³`
            cardNilaiTsp.innerHTML = `${tsp} µg/m³`
            cardNilaiNoise.innerHTML = `${noise} dBA`
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
        const {message, data, dataCategories} = await response.json()
        if (status === 200) {
            hiddenElm(loaderDataConnect)

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

});
