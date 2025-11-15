import Highcharts from 'highcharts'
import HighchartsStock from "highcharts/highstock"
import {OptionsChart, OptionsChartLastParam, OptionsLastParam, OptionsPersentase} from "@/js/types/dashboard/types"
import moment from "moment-timezone";
import {failureAlert} from "@/js/plugins/sweet-alert";
import {
    elapsedDate, elapsedHours,
    getMetaContent,
    handleFixedTd, handleFixedTfootTh,
    handleFixedTheadTh,
    hiddenElm, renderPagination,
    showHiddenElmAndText, triggerTableTooltip
} from "@/js/plugins/functions";
import {closeModalDialog, showModalDialog} from "@/js/plugins/modal";
import tzLookup from "tz-lookup";
import {TabItem, Tabs} from "flowbite";
import DataCustomerLokasiModel from "@/js/main/be-sparing/master/data-customer-lokasi/model/DataCustomerLokasiModel";

interface DataDetailOptions {
    platformUid: string;
    tipeLogger: string;
    periodM: string;
    periodY: string;
    url?: string;
}

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

    const titikPenataan = document.querySelector('.titikPenataan')
    const titikOnline = document.querySelector('.titikOnline')
    const titikOffline = document.querySelector('.titikOffline')

    const modalDetail = document.querySelector('.modalDetail')
    const phBmal = modalDetail.querySelector('.phBmal')
    const tssBmal = modalDetail.querySelector('.tssBmal')
    const debitBmal = modalDetail.querySelector('.debitBmal')
    const bodyDetail = modalDetail.querySelector('.bodyDetail')
    const bodyDetailLoader = modalDetail.querySelector('.bodyDetailLoader')
    const bodyDetailLoaderNotFound = modalDetail.querySelector('.bodyDetailLoaderNotFound')
    const bodyDetailLoaderNotFoundMessage = modalDetail.querySelector('.bodyDetailLoaderNotFoundMessage')

    const bodyLost = modalDetail.querySelector('.bodyLost')
    const bodyLostLoader = modalDetail.querySelector('.bodyLostLoader')
    const bodyLostLoaderNotFound = modalDetail.querySelector('.bodyLostLoaderNotFound')
    const bodyLostLoaderNotFoundMessage = modalDetail.querySelector('.bodyLostLoaderNotFoundMessage')

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

            closeModalDialog(modalDetail, () => {
                hiddenElm(bodyDetailLoaderNotFound)
                showHiddenElmAndText(bodyDetailLoader)
                bodyDetail.innerHTML = null

                hiddenElm(bodyLostLoaderNotFound)
                showHiddenElmAndText(bodyLostLoader)
                bodyLost.innerHTML = null
            })
        })
    })
    //endregion

    //region Handle Pencarian
    if (btnPencarian !== null) {
        btnPencarian.addEventListener('click', function () {
            showModalDialog(modalPencarian, null, () => {
                const btnCari = document.querySelector<HTMLElement>('.btnCari')
                const lookCustomerId: HTMLInputElement = modalPencarian.querySelector('.lookCustomerId')
                const lookCustomerLokasiId: HTMLSelectElement = modalPencarian.querySelector('.lookCustomerLokasiId')
                const lookCustomerLokasiIdTemp: HTMLInputElement = modalPencarian.querySelector('.lookCustomerLokasiIdTemp')

                lookCustomerLokasiId.setAttribute('data-selected', lookCustomerLokasiIdTemp.value)

                new DataCustomerLokasiModel(lookCustomerId, lookCustomerLokasiId)
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
                        window.location.href = `/sparing/dashboard/hasil-pengukuran?${text_result_url.join('&')}`
                        // history.pushState({}, null, `/dashboard/hasil-pengukuran?${text_result_url.join('&')}`)
                    })
                })
            })
        })
    }

    //endregion

    //region Handle Tabs
    const roleExTabs: HTMLElement = document.querySelector('[data-role="exTabs"]')
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

    const options = {
        defaultTabId: '#summary',
        activeClasses: 'border-b-2 border-blue-700 text-blue-700',
        inactiveClasses: 'hover:text-gray-900 hover:bg-gray-100 text-gray-400',
        onShow: (x: any) => {
            const {id} = x._activeTab
        }
    }

    const tab = new Tabs(roleExTabs, tabsElms, options)
    //endregion

    handleLastInfoPlatform().then((data: any) => {
        const {totalPlatform, totalPlatformOnline, totalPlatformOffline} = data
        titikPenataan.textContent = `${totalPlatform}`
        titikOnline.textContent = `${totalPlatformOnline}`
        titikOffline.textContent = `${totalPlatformOffline}`
    })

    //region Handle Data Info Platform
    function handleLastInfoPlatform() {
        return new Promise(async (resolve, reject) => {
            const response = await fetch(`${url.pathname}/data-info-platform`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken
                },
            })

            const {status} = response
            const {message, data} = await response.json()
            if (status === 200) {
                resolve(data)
            } else {
                reject(message)
            }
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
        tipe_logger: urlParams.get('tipe_logger') ?? '',
        bulan: urlParams.get('bulan') ?? moment().format('MM'),
        tahun: urlParams.get('tahun') ?? moment().format('YYYY'),
        status_platform: urlParams.get('status_platform') ?? '',
    })

    //region Handle LoadMore
    function handleCreateElement(platform?: any, userLevel?: any) {
        const cols = document.createElement('div')
        cols.className = 'col-span-1 platforms'

        const {
            uid,
            tipe_logger,
            status_platform,
            last_online,
            logger_source,
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
        cols.setAttribute('data-tipeLogger', tipe_logger)

        let loggerSourceIcon = '<i class="fas fa-circle-dot mr-1"></i>'
        if (logger_source === 'scifi') {
            loggerSourceIcon = '<i class="fas fa-check-circle mr-1"></i>'
        }

        let statusPlatform = `
            <span class="ds-badge ds-badge-outline ds-badge-success !text-[12px]">
                ${loggerSourceIcon} Online
            </span>
        `
        if (status_platform === 'offline') {
            statusPlatform = `
                <span class="ds-badge ds-badge-outline ds-badge-error !text-[12px]">
                    Offline / Since ${elapsedHours(last_online, 'Asia/Makassar')}
                </span>
            `
        }

        let tipeLogger = ''
        if (userLevel !== 'viewer') {
            if (tipe_logger === 1) {
                tipeLogger = ' / Internal'
            } else {
                tipeLogger = ' / KLHK'
            }
        }

        cols.innerHTML = `
            <div class="card !mb-0">
                <div class="card-header border-b">
                    <div class="w-[50%]">
                        <div class="font-bold text-[18px]">
                            <div>${uid}</div>
                            <div class="font-normal text-[14px]">${nama_perusahaan} / ${nama_lokasi} ${tipeLogger}</div>
                            <div>${statusPlatform}</div>
                        </div>
                    </div>
                    <div class="flex items-center">
                        <div class="flex items-center cursor-pointer mr-2 btnDetail">
                            <i class="fas fa-table-list !text-[20px]"></i>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <div class="grid grid-cols-3 gap-4 mt-5 mb-10">
                        <div class="col-span-1">
                            <div class="flex items-center justify-center gap-4">
                                <div>
                                    <div class="font-bold text-[14px]">pH</div>
                                    <div class="font-bold text-gray-500 text-[20px] dataPh">
                                        0
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-span-1">
                            <div class="flex items-center justify-center gap-4">
                                <div>
                                    <div class="font-bold text-[14px]">TSS</div>
                                    <div class="font-bold text-gray-500 text-[20px] dataTss">
                                        0 mg/L
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-span-1">
                            <div class="flex items-center justify-center gap-4">
                                <div>
                                    <div class="font-bold text-[14px]">Debit</div>
                                    <div class="font-bold text-gray-500 text-[20px] dataDebit">
                                        0 m<sup>3</sup>/Menit
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
                searchOptionParams += `&customer_lokasi_id=${options.customer_lokasi_id}`
            }

            if (options.tipe_logger && options.tipe_logger !== '') {
                searchOptionParams += `&tipe_logger=${options.tipe_logger}`
            }

            if (options.status_platform && options.status_platform !== '') {
                searchOptionParams += `&status_platform=${options.status_platform}`
            }
        }

        const response = await fetch(`${url.pathname}/data-platforms?page=${page}${searchOptionParams}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken
            }
        })

        const {status} = response
        const {message, userLevel, platforms, data} = await response.json()
        if (status === 200) {
            platforms.forEach((platform: any) => {
                const dataCols = handleCreateElement(platform, userLevel)
                platformContents.appendChild(dataCols)
            })

            initializeCharts({
                bulan: options.bulan,
                tahun: options.tahun
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
    async function initializeCharts(options?: { date?: string, bulan?: string, tahun?: string }) {
        timeoutIds.forEach((timeoutId) => clearTimeout(timeoutId))
        timeoutIds.clear()

        const platforms = document.querySelectorAll('.platforms')
        const promises = Array.from(platforms).map(async (elm) => {
            try {
                const btnDetail = elm.querySelector('.btnDetail')
                const uid = elm.getAttribute('data-uid')
                const tipeLogger = elm.getAttribute('data-tipeLogger')
                const dataPh: HTMLElement = elm.querySelector('.dataPh')
                const dataTss: HTMLElement = elm.querySelector('.dataTss')
                const dataDebit: HTMLElement = elm.querySelector('.dataDebit')
                const bodyChart: HTMLElement = elm.querySelector('.bodyChart')

                const charts = await handleCharts({
                    platformUid: uid,
                    tipeLogger: tipeLogger,
                    bodyChart: bodyChart,
                    startDate: options?.date
                })

                await handleLastParameterData({
                    platformUid: uid,
                    tipeLogger: tipeLogger,
                    dataElementPh: dataPh,
                    dataElementTss: dataTss,
                    dataElementDebit: dataDebit,
                    startDate: options?.date
                })

                if (isToday(options?.date)) {
                    await handleLastParameterData({
                        platformUid: uid,
                        tipeLogger: tipeLogger,
                        dataElementPh: dataPh,
                        dataElementTss: dataTss,
                        dataElementDebit: dataDebit,
                        startDate: options?.date
                    })

                    await updateChartPeriodically(uid, tipeLogger, options?.date, charts)
                }

                if (btnDetail) {
                    btnDetail.addEventListener('click', function () {
                        showModalDialog(modalDetail, `<i class="fas fa-file-lines mr-2"></i> Detail ${uid}`, () => {
                            renderDataDetail({
                                platformUid: uid,
                                tipeLogger: tipeLogger,
                                periodM: options?.bulan,
                                periodY: options?.tahun
                            })

                            renderDataLost({
                                platformUid: uid,
                                tipeLogger: tipeLogger,
                                periodM: options?.bulan,
                                periodY: options?.tahun
                            })
                        })
                    })
                }
            } catch (error) {
                console.error(`Error processing element:`, error)
            }
        });

        await Promise.all(promises);
    }

    //endregion

    //region Handle Table Data Detail
    function renderDataDetail(options?: DataDetailOptions) {

        hiddenElm(bodyDetailLoaderNotFound)
        showHiddenElmAndText(bodyDetailLoader)

        lookupDataDetail(options).then(response => {
            renderBodyDetail(response)
        }).catch(error => {
            showHiddenElmAndText(bodyDetailLoaderNotFound)
            bodyDetailLoaderNotFoundMessage.textContent = error
            hiddenElm(bodyDetailLoader)
        })
    }

    function lookupDataDetail(options: DataDetailOptions) {
        return new Promise(async (resolve, reject) => {
            const {url: dataLinks} = options || {}
            const dataUrl = dataLinks ?? `${url.pathname}/data-detail-platform?uid=${options.platformUid}&tipeLogger=${options.tipeLogger}&period_m=${options.periodM}&period_y=${options.periodY}`
            const response = await fetch(dataUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken
                },
            })

            const {status} = response
            const {message, dataLimit, data} = await response.json()
            if (status === 200) {
                resolve({
                    dataLimit,
                    data
                })
            } else {
                reject(message)
            }
        })
    }

    function renderBodyDetail(response: any) {

        const {
            dataLimit,
            data
        } = response

        const {
            ph_mutu_min,
            ph_mutu_max,
            tss_warn,
            tss_mutu,
            debit_warn,
            debit_mutu
        } = dataLimit

        phBmal.textContent = `${ph_mutu_min} - ${ph_mutu_max}`
        tssBmal.textContent = `${tss_warn} - ${tss_mutu}`
        debitBmal.textContent = `${(debit_warn * 1440).toFixed(2)} - ${(debit_mutu * 1440).toFixed(2)}`

        const itemBodies = []
        if (data.length !== 0) {
            let no = 0
            data.map((item: any) => {
                const {
                    datetime_format,
                    nilai_ph,
                    nilai_tss,
                    nilai_debit,
                    total_masuk,
                } = item

                const totalLost = 720 - total_masuk;
                const totalLostPercent = (totalLost / 720) * 100

                itemBodies.push(`
                    <tr class="dataDetail">
                        <td class="text-center">${moment(datetime_format).format('DD MMMM YYYY')}</td>
                        <td class="text-right">${nilai_ph.toFixed(2)}</td>
                        <td class="text-right">${nilai_tss.toFixed(0)}</td>
                        <td class="text-right">${nilai_debit.toFixed(2)}</td>
                        <td class="text-right">${total_masuk}</td>
                        <td class="text-right">${Math.round(totalLostPercent)}%</td>
                    </tr>
                `)

                no++
            })

            hiddenElm(bodyDetailLoaderNotFound)
            hiddenElm(bodyDetailLoader)

            bodyDetail.innerHTML = itemBodies.join('')

            handleFixedTheadTh()
            handleFixedTd()
            handleFixedTfootTh()
            triggerTableTooltip()
        } else {
            showHiddenElmAndText(bodyDetailLoaderNotFound)
            hiddenElm(bodyDetailLoader)
        }
    }

    //endregion

    //region Handle Table Data Lost
    function renderDataLost(options?: DataDetailOptions) {

        hiddenElm(bodyLostLoaderNotFound)
        showHiddenElmAndText(bodyLostLoader)

        lookupDataLost(options).then(response => {
            renderBodyLost(response)
        }).catch(error => {
            showHiddenElmAndText(bodyLostLoaderNotFound)
            bodyLostLoaderNotFoundMessage.textContent = error
            hiddenElm(bodyLostLoader)
        })
    }

    function lookupDataLost(options: DataDetailOptions) {
        return new Promise(async (resolve, reject) => {
            const {url: dataLinks} = options || {}
            const dataUrl = dataLinks ?? `${url.pathname}/data-lost-platform?uid=${options.platformUid}&tipeLogger=${options.tipeLogger}&period_m=${options.periodM}&period_y=${options.periodY}`
            const response = await fetch(dataUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken
                },
            })

            const {status} = response
            const {message, dataGap} = await response.json()
            if (status === 200) {
                resolve({
                    dataGap
                })
            } else {
                reject(message)
            }
        })
    }

    function renderBodyLost(response: any) {

        const {
            dataGap
        } = response

        const itemBodies = []
        if (dataGap.length !== 0) {
            let no = 0
            dataGap.map((item: any) => {
                const {
                    datetime_format,
                } = item

                itemBodies.push(`
                    <tr class="dataLost">
                        <td class="text-center">${moment(datetime_format).format('DD MMM YYYY HH:mm')}</td>
                        <td class="text-right">-</td>
                        <td class="text-right">-</td>
                        <td class="text-right">-</td>
                    </tr>
                `)

                no++
            })

            hiddenElm(bodyLostLoaderNotFound)
            hiddenElm(bodyLostLoader)

            bodyLost.innerHTML = itemBodies.join('')

            handleFixedTheadTh()
            handleFixedTd()
            handleFixedTfootTh()
            triggerTableTooltip()
        } else {
            showHiddenElmAndText(bodyLostLoaderNotFound)
            hiddenElm(bodyLostLoader)
        }
    }

    //endregion

    //region Handle Data Last Parameter
    async function handleLastParameterData(options: OptionsLastParam) {
        const {platformUid, tipeLogger, startDate} = options
        const response = await fetch('/sparing/dashboard/maps/summary/data-last-parameter', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken
            },
            body: JSON.stringify({
                platformUid,
                tipeLogger,
                startDate
            })
        })

        const {status} = response
        const {message, data} = await response.json()
        if (status === 200) {
            console.log(data)
            if (data !== null) {
                const {temp, ph, debit, cod, tss, nh3n} = data

                options.dataElementPh.textContent = `${ph.toFixed(2)}`
                options.dataElementTss.textContent = `${tss.toFixed(0)} mg/L`
                options.dataElementDebit.innerHTML = `${debit.toFixed(2)} m<sup>3</sup>/Menit`
            } else {

            }
        } else {

            failureAlert({
                html: message,
                confirmButtonText: 'Tutup'
            })
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

    async function updateChartPeriodically(uid: string, tipeLogger: string, date: string, charts: any) {
        try {
            if (!isToday(date)) {
                console.log('Interval tidak dijalankan')
                return
            }

            await handleChartsLastParam({
                platformUid: uid,
                tipeLogger: tipeLogger,
                startDate: date,
                charts,
            })

            handleLastInfoPlatform().then((data: any) => {
                const {totalPlatform, totalPlatformOnline, totalPlatformOffline} = data
                titikPenataan.textContent = `${totalPlatform}`
                titikOnline.textContent = `${totalPlatformOnline}`
                titikOffline.textContent = `${totalPlatformOffline}`
            })

            const timeoutId = setTimeout(() => updateChartPeriodically(uid, tipeLogger, date, charts), 120000)
            timeoutIds.set(`chart-${uid}`, timeoutId)
        } catch (error) {
            console.error(`Error updating chart for UID ${uid}:`, error)
        }
    }

    //endregion
})
