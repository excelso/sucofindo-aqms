import {PlatformSkeletonManager} from "@/js/main/be-sparing/dashboard/hasil-pengukuran/PlatformSkeletonManager";
import {
    getMetaContent,
    handleFixedTd,
    handleFixedTfootTh,
    handleFixedTheadTh,
    hiddenElm, showHiddenElmAndText,
    triggerTableTooltip
} from "@/js/plugins/functions";
import {closeModalDialog, showModalDialog} from "@/js/plugins/modal";
import DataCustomerLokasiModel from "@/js/main/be-sparing/master/data-customer-lokasi/model/DataCustomerLokasiModel";
import moment from "moment";
import {TabItem, Tabs} from "flowbite";

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

    const btnPencarian = document.querySelector('.btnPencarian')
    const modalPencarian = document.querySelector('.modalPencarian')
    const closeModalForm = document.querySelectorAll('.closeModalForm')

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

    new Tabs(roleExTabs, tabsElms, options)
    //endregion

    //region Handle Data Info Platform
    handleLastInfoPlatform().then((data: any) => {
        const {totalPlatform, totalPlatformOnline, totalPlatformOffline} = data
        titikPenataan.textContent = `${totalPlatform}`
        titikOnline.textContent = `${totalPlatformOnline}`
        titikOffline.textContent = `${totalPlatformOffline}`
    })

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

    const platformSkeletonManager = new PlatformSkeletonManager({
        containerSelector: '.platformContents',
        itemsPerPage: 6,
        onTableClick: (uid) => {
            showModalDialog(modalDetail, `<i class="fas fa-file-lines mr-2"></i> Detail ${uid}`, () => {
                const currentUrlParams = new URLSearchParams(window.location.search)

                renderDataDetail({
                    platformUid: uid,
                    tipeLogger: '1',
                    periodM: currentUrlParams.get('bulan') ?? moment().format('MM'),
                    periodY: currentUrlParams.get('tahun') ?? moment().format('YYYY'),
                })

                renderDataLost({
                    platformUid: uid,
                    tipeLogger: '1',
                    periodM: currentUrlParams.get('bulan') ?? moment().format('MM'),
                    periodY: currentUrlParams.get('tahun') ?? moment().format('YYYY'),
                })
            })
        },
    })

    //region Handle Close Modal
    closeModalForm.forEach((elm: Element) => {
        elm.addEventListener('click', function () {
            if (modalPencarian) {
                closeModalDialog(modalPencarian)
            }

            if (modalDetail) {
                closeModalDialog(modalDetail, () => {
                    hiddenElm(bodyDetailLoaderNotFound)
                    showHiddenElmAndText(bodyDetailLoader)
                    bodyDetail.innerHTML = null

                    hiddenElm(bodyLostLoaderNotFound)
                    showHiddenElmAndText(bodyLostLoader)
                    bodyLost.innerHTML = null
                })
            }
        })
    })
    //endregion

    //region Handle Search
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

                btnCari.addEventListener('click', function () {
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

                    const {customer_lokasi_id, status_platform} = text_result as any
                    closeModalDialog(modalPencarian, async () => {
                        history.pushState({}, null, `${url.pathname}?${text_result_url.join('&')}`)
                        await platformSkeletonManager.filter({
                            customer_lokasi_id: customer_lokasi_id,
                            status_platform: status_platform,
                        })
                    })
                })
            })
        })
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

})
