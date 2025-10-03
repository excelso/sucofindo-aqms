import Highcharts from 'highcharts'
import HighchartsStock from "highcharts/highstock"
import {OptionsChart, OptionsChartLastParam, OptionsPersentase} from "@/js/types/dashboard/types"
import moment from "moment-timezone";
import {failureAlert} from "@/js/plugins/sweet-alert";
import {getMetaContent, hiddenElm, showHiddenElmAndText} from "@/js/plugins/functions";
import {closeModalDialog, showModalDialog} from "@/js/plugins/modal";
import Lokasi from "@/js/main/master/data-customer-lokasi/data-model";

document.addEventListener('DOMContentLoaded', () => {
    const csrfToken = getMetaContent('csrf-token')
    const url = new URL(window.location.href)
    const urlParams = new URLSearchParams(window.location.search)
    const timeoutIds = new Map()

    const btnPencarian = document.querySelector('.btnPencarian')
    const modalPencarian = document.querySelector('.modalPencarian')
    const closeModalForm = document.querySelectorAll('.closeModalForm')
    const platformContents: HTMLElement = document.querySelector('.platformContents')
    const loadingElement = document.querySelector('.loading')

    let loadingData: boolean = false
    let hasMoreData: boolean = true
    let isHandleSearch: boolean = false
    let page: number = 1

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
                const lookCustomerId: HTMLInputElement = modalPencarian.querySelector('.lookCustomerId')
                const lookCustomerLokasiId: HTMLInputElement = modalPencarian.querySelector('.lookCustomerLokasiId')
                const lookCustomerLokasiIdTemp: HTMLInputElement = modalPencarian.querySelector('.lookCustomerLokasiIdTemp')

                lookCustomerLokasiId.setAttribute('data-selected', lookCustomerLokasiIdTemp.value)

                new Lokasi(lookCustomerId, lookCustomerLokasiId)
                modalPencarian.addEventListener('keyup', function (ev: KeyboardEvent) {
                    if (ev.key === 'Enter') {
                        $(btnCari).trigger('click');
                    }
                })

                $(btnCari).off('click').on('click', function () {
                    lookCustomerLokasiIdTemp.value = lookCustomerLokasiId.value

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

                    const {parameterId: paramId, date, customer_lokasi_id} = text_result as any

                    // timeoutIds.forEach((timeoutId) => clearTimeout(timeoutId))
                    // timeoutIds.clear()
                    //
                    // initializeCharts({
                    //     parameterId: paramId,
                    //     date: date,
                    // }).then(null)

                    // loadingData = false
                    // hasMoreData = true
                    // isHandleSearch = true
                    // page = 1
                    //
                    // handleLoadPlatform({
                    //     customer_lokasi_id: customer_lokasi_id,
                    //     parameterId: paramId,
                    //     date: date,
                    // }).then(null)

                    closeModalDialog(modalPencarian, () => {
                        window.location.href = `/dashboard/hasil-pengukuran?${text_result_url.join('&')}`
                        // history.pushState({}, null, `/dashboard/hasil-pengukuran?${text_result_url.join('&')}`)
                    })
                })
            })
        })
    }

    //endregion

    function isToday(dateStr: string | null): boolean {
        if (!dateStr) return true; // Jika tidak ada tanggal, anggap hari ini
        const today = moment().format('YYYY-MM-DD')
        return moment(dateStr).format('YYYY-MM-DD') === today
    }

    initInfiniteScroll({
        customer_lokasi_id: urlParams.get('customer_lokasi_id') ?? '',
        parameterId: urlParams.get('parameterId') ?? 'pH',
        date: urlParams.get('date')
    })

    //region Handle LoadMore
    function handleCreateElement(platform?: any) {
        const cols = document.createElement('div')
        cols.className = 'col-span-1 platforms'

        const {
            uid,
            site,
        } = platform

        const {
            customer_lokasi
        } = site

        const {
            customer,
            nama_lokasi
        } = customer_lokasi

        const {
            nama_perusahaan
        } = customer

        cols.setAttribute('data-uid', uid)

        cols.innerHTML = `
            <div class="card !mb-0">
                <div class="card-header border-b">
                    <div class="w-[50%]">
                        <div class="font-bold text-[18px]">
                            <div>${uid}</div>
                            <div class="font-normal text-[14px]">${nama_perusahaan} / ${nama_lokasi}</div>
                        </div>
                    </div>
                    <div class="flex items-center" style="display: none;">
                        <div class="flex items-center cursor-pointer mr-2 btnTemperature">
                            <div class="leading-[10px] text-[14px]">Temp:
                                <span class="nilaiTemperature">0</span>°C
                            </div>
                            <i class="fas fa-temperature-half !text-[20px] iconTemperature ml-2"></i>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <div class="grid grid-cols-3 gap-4 mt-5 mb-10">
                        <div class="col-span-1">
                            <div class="flex items-center justify-center">
                                <div class="radial-progress primary !w-[75px] !h-[75px] text-[12px] progressDataMasuk">
                                    <div class="skeleton-box w-[75px] !h-[75px] rounded-full"></div>
                                </div>
                                <div class="ml-2">
                                    <div class="text-[12px]">Total Masuk</div>
                                    <div class="font-bold text-gray-500 text-[26px] leading-[25px] dataMasuk">
                                        <div class="skeleton-box w-[80px] !h-6 rounded"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-span-1">
                            <div class="flex items-center justify-center">
                                <div class="radial-progress success !w-[75px] !h-[75px] text-[12px] progressDataMutu">
                                    <div class="skeleton-box w-[75px] !h-[75px] rounded-full"></div>
                                </div>
                                <div class="ml-2">
                                    <div class="text-[12px]">Data Sesuai</div>
                                    <div class="font-bold text-gray-500 text-[26px] leading-[25px] dataMutu">
                                        <div class="skeleton-box w-[80px] !h-6 rounded"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-span-1">
                            <div class="flex items-center justify-center">
                                <div class="radial-progress danger !w-[75px] !h-[75px] text-[12px] progressDataTidakMutu">
                                    <div class="skeleton-box w-[75px] !h-[75px] rounded-full"></div>
                                </div>
                                <div class="ml-2">
                                    <div class="text-[12px]">Tidak Sesuai</div>
                                    <div class="font-bold text-gray-500 text-[26px] leading-[25px] dataTidakMutu">
                                        <div class="skeleton-box w-[80px] !h-6 rounded"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="bodyChart !h-[425px]"></div>
                </div>
            </div>
        `
        return cols
    }

    async function handleLoadPlatform(options?: any) {
        if (loadingData || !hasMoreData) return;

        loadingData = true
        if (isHandleSearch) {
            showHiddenElmAndText(loadingElement)
            platformContents.innerHTML = null
        }

        await new Promise(resolve => setTimeout(resolve, 1000))

        let searchOptionParams = ''
        if (options) {
            if (options.customer_lokasi_id && options.customer_lokasi_id !== '') {
                searchOptionParams = `&customer_lokasi_id=${options.customer_lokasi_id}`
            }
        }

        const response = await fetch(`/dashboard/hasil-pengukuran/data-platforms?page=${page}${searchOptionParams}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken
            }
        })

        const {status} = response
        const {message, platforms, data} = await response.json()
        if (status === 200) {
            platforms.forEach((platform: any) => {
                const dataCols = handleCreateElement(platform)
                platformContents.appendChild(dataCols)
            })

            initializeCharts({
                parameterId: options.parameterId,
                date: options.date
            }).then(null)

            const {
                hasMore,
            } = data

            loadingData = false
            isHandleSearch = false

            hasMoreData = hasMore
            if (!hasMoreData) {
                hiddenElm(loadingElement)
            } else {
                page++
            }
        } else {
            hiddenElm(loadingElement)
            console.error(message)
        }
    }

    function initInfiniteScroll(options?: any) {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMoreData && !loadingData) {
                    handleLoadPlatform(options).then(null)
                }
            },
            {
                root: null,
                rootMargin: '0px',
                threshold: 0.5
            }
        )

        observer.observe(loadingElement)

        // Hentikan observer jika tidak ada lagi data yang bisa dimuat
        if (!hasMoreData) {
            observer.unobserve(loadingElement)
        }
    }

    //endregion

    //region Handle Init Charts
    async function initializeCharts(options?: { parameterId: string, date?: string }) {
        timeoutIds.forEach((timeoutId) => clearTimeout(timeoutId))
        timeoutIds.clear()

        const platforms = document.querySelectorAll('.platforms')
        const promises = Array.from(platforms).map(async (elm) => {
            try {
                const uid = elm.getAttribute('data-uid');
                const progressDataMasuk: HTMLElement = elm.querySelector('.progressDataMasuk');
                const dataMasuk: HTMLElement = elm.querySelector('.dataMasuk');
                const progressDataMutu: HTMLElement = elm.querySelector('.progressDataMutu');
                const dataMutu: HTMLElement = elm.querySelector('.dataMutu');
                const progressDataTidakMutu: HTMLElement = elm.querySelector('.progressDataTidakMutu');
                const dataTidakMutu: HTMLElement = elm.querySelector('.dataTidakMutu');
                const bodyChart: HTMLElement = elm.querySelector('.bodyChart');

                await handlePersentaseData({
                    platformUid: uid,
                    tipeLogger: '2',
                    parameterId: options?.parameterId,
                    startDate: options?.date,
                    progressDataMasuk,
                    dataMasuk,
                    progressDataMutu,
                    dataMutu,
                    progressDataTidakMutu,
                    dataTidakMutu,
                })

                const charts = await handleCharts({
                    platformUid: uid,
                    tipeLogger: '2',
                    parameterId: options?.parameterId,
                    bodyChart: bodyChart,
                    startDate: options?.date
                })

                if (isToday(options?.date)) {
                    await updatePersentaseDataPeriodically(uid, options?.parameterId, options?.date)
                    await updateChartPeriodically(uid, options?.parameterId, options?.date, charts)
                }
            } catch (error) {
                console.error(`Error processing element:`, error)
            }
        });

        await Promise.all(promises);
    }

    //endregion

    //region Handle Persentase Data
    async function handlePersentaseData(options: OptionsPersentase, useLoader = true) {
        const {platformUid, tipeLogger, parameterId, startDate} = options

        if (useLoader) {
            $(options.progressDataMasuk).html('<div class="skeleton-box w-[80px] !h-[80px] rounded-full"></div>')
            $(options.dataMasuk).html('<div class="skeleton-box w-[80px] !h-6 rounded"></div>')
            $(options.progressDataMutu).html('<div class="skeleton-box w-[80px] !h-[80px] rounded-full"></div>')
            $(options.dataMutu).html('<div class="skeleton-box w-[80px] !h-6 rounded"></div>')
            $(options.progressDataTidakMutu).html('<div class="skeleton-box w-[80px] !h-[80px] rounded-full"></div>')
            $(options.dataTidakMutu).html('<div class="skeleton-box w-[80px] !h-6 rounded"></div>')
        }

        const response = await fetch('/dashboard/maps/summary/data-persentase', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken
            },
            body: JSON.stringify({
                platformUid,
                tipeLogger,
                parameterId,
                startDate
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
                $(options.progressDataMasuk).css('--progress-value', Math.round(persentaseDataMasuk))
                $(options.progressDataMasuk).html(`${Math.round(persentaseDataMasuk)}%`)
                $(options.dataMasuk).html(`${data}`)

                const totalMutu = (data - danger) < 0 ? (data - danger) + Math.abs((data - danger)) : (data - danger)
                let persentaseMutu = totalMutu !== 0 ? totalMutu / data * 100 : 0
                $(options.progressDataMutu).css('--progress-value', parseFloat(persentaseMutu.toFixed(1)))
                $(options.progressDataMutu).html(`${parseFloat(persentaseMutu.toFixed(1))}%`)
                $(options.dataMutu).html(`${totalMutu}`)

                let persentaseTidakMutu = danger / data * 100
                $(options.progressDataTidakMutu).css('--progress-value', parseFloat(persentaseTidakMutu.toFixed(1)))
                $(options.progressDataTidakMutu).html(`${parseFloat(persentaseTidakMutu.toFixed(1))}%`)
                $(options.dataTidakMutu).html(`${danger}`)
            } else {
                $(options.progressDataMasuk).css('--progress-value', 0)
                $(options.progressDataMasuk).html(`0%`)
                $(options.dataMasuk).html(`0`)

                $(options.progressDataMutu).css('--progress-value', 0)
                $(options.progressDataMutu).html(`0%`)
                $(options.dataMutu).html(`0`)

                $(options.progressDataTidakMutu).css('--progress-value', 0)
                $(options.progressDataTidakMutu).html(`0%`)
                $(options.dataTidakMutu).html(`0`)
            }
        } else {
            failureAlert({
                html: message,
                confirmButtonText: 'Tutup'
            })
        }
    }

    async function updatePersentaseDataPeriodically(uid: string, parameterId: string, date: string) {
        try {
            if (!isToday(date)) {
                console.log('Interval tidak dijalankan')
                return
            }

            const platform = document.querySelector(`[data-uid="${uid}"]`)
            if (!platform) return

            await handlePersentaseData({
                platformUid: uid,
                tipeLogger: '2',
                parameterId: parameterId,
                startDate: date,
                progressDataMasuk: platform.querySelector('.progressDataMasuk'),
                dataMasuk: platform.querySelector('.dataMasuk'),
                progressDataMutu: platform.querySelector('.progressDataMutu'),
                dataMutu: platform.querySelector('.dataMutu'),
                progressDataTidakMutu: platform.querySelector('.progressDataTidakMutu'),
                dataTidakMutu: platform.querySelector('.dataTidakMutu')
            }, false)

            const timeoutId = setTimeout(() => updatePersentaseDataPeriodically(uid, parameterId, date), 120000)
            timeoutIds.set(`persentase-${uid}`, timeoutId)
        } catch (error) {
            console.error(`Error updating percentage data for UID ${uid}:`, error)
        }
    }

    //endregion

    //region Handle Charts
    async function handleCharts(options: OptionsChart) {
        const {platformUid, tipeLogger, parameterId, startDate} = options

        $(options.bodyChart).html('<div class="skeleton-box w-[100%] !h-[400px] rounded"></div>')

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
                startDate
            })
        })

        const {status} = response
        const {message, data, minDate, maxDate} = await response.json()
        if (status === 200) {
            $(platformUid).removeAttr('disabled')

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
                    if (diffDateHour > 1 && diffDateHour <= 2) {
                        tickInterval = 60 * 5 * 1000
                    } else if (diffDateHour > 2 && diffDateHour <= 6) {
                        tickInterval = 60 * 30 * 1000
                    } else if (diffDateHour > 6) {
                        tickInterval = 60 * 180 * 1000
                    }
                }
            }

            let subtitle = moment().format('DD MMM YYYY')
            if (startDate) {
                subtitle = moment(startDate, 'YYYY-MM-DD').format('DD MMM YYYY')
            }

            return HighchartsStock.chart({
                chart: {
                    renderTo: options.bodyChart,
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
                    text: `Periode Tanggal: ${subtitle}`,
                },
                yAxis: {
                    gridLineWidth: 1,
                    gridLineDashStyle: 'LongDash',
                },
                xAxis: {
                    type: 'datetime',
                    minPadding: 0,
                    maxPadding: 0,
                    gridLineWidth: 1,
                    startOnTick: true,
                    crosshair: true,
                    tickInterval: tickInterval,
                    labels: {
                        formatter: function () {
                            // @ts-ignore
                            return diffDateDay >= 4 ? moment(new Date(this.value)).format('DD-MM-YYYY') : Highcharts.dateFormat('%H:%M', new Date(this.value + (8 * 60 * 60 * 1000)))
                        },
                        align: 'center'
                    }
                },
                tooltip: {
                    shared: true,
                    xDateFormat: '%d %B %Y - %H:%M',
                },
                time: {
                    timezoneOffset: -8 * 60
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
            }, () => {
                console.log('Chart Oke')
            })
        } else {
            failureAlert({
                html: message,
                confirmButtonText: 'Tutup'
            })

            return null
        }
    }

    //endregion

    //region Handle Last Chart
    async function handleChartsLastParam(options: OptionsChartLastParam) {
        const {platformUid, tipeLogger, parameterId, startDate} = options
        const response = await fetch(`${url.pathname}/data-charts-last-param`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken
            },
            body: JSON.stringify({
                platformUid,
                tipeLogger,
                parameterId,
                startDate
            })
        })

        const {status} = response
        const {message, data} = await response.json()
        if (status === 200) {
            if (options.charts !== null) {
                if (data !== null) {
                    data.forEach((item: any) => {
                        const {
                            name,
                            data: dataChart
                        } = item

                        const series = options.charts.series.find((s: any) => s.name === name)
                        if (series) {
                            series.addPoint(dataChart)
                        }
                    })
                }
            }
        } else {
            failureAlert({
                html: message,
                confirmButtonText: 'Tutup'
            })
        }
    }

    async function updateChartPeriodically(uid: string, parameterId: string, date: string, charts: any) {
        try {
            if (!isToday(date)) {
                console.log('Interval tidak dijalankan')
                return
            }

            await handleChartsLastParam({
                platformUid: uid,
                tipeLogger: '2',
                parameterId: parameterId,
                startDate: date,
                charts,
            })

            const timeoutId = setTimeout(() => updateChartPeriodically(uid, parameterId, date, charts), 120000)
            timeoutIds.set(`chart-${uid}`, timeoutId)
        } catch (error) {
            console.error(`Error updating chart for UID ${uid}:`, error)
        }
    }

    //endregion
})
