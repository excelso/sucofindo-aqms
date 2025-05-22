import './bootstrap';
import 'flowbite'
import Alpine from 'alpinejs';
import 'metismenu/dist/metisMenu.css'
import {getDeviceConfig} from "@/js/plugins/breakpoint"
import {
    checkClassList,
    getMetaContent,
    handleFixedTd,
    handleFixedTfootTh,
    handleFixedTheadTh, tableTooltip,
    throttle
} from "@/js/plugins/functions";
import {ExPicker} from "@/js/experiment/ex-picker";
import ExBox from "@/js/experiment/ex-box";
import {StartTextAnimation} from "@/js/plugins/text-animation";
import 'croppie/croppie.css'
import '@yaireo/tagify/dist/tagify.css'
import Inputmask from "inputmask"

declare global {
    interface Window {
        Alpine: any;
    }
}

window.Alpine = Alpine;
Alpine.start();

document.addEventListener('DOMContentLoaded', function () {
    const csrfToken = getMetaContent('csrf-token')
    const url = new URL(window.location.href)

    //region Handle Metis Menu
    const menu = document.querySelector('#menu')
    if (menu !== null) {
        // @ts-ignore
        $(menu).metisMenu({
            toggle: true,
            triggerElement: '.navLink'
        })
    }
    //endregion

    StartTextAnimation([
        "PRESENT",
        "AQMS  @2025",
        "BY SUCOFINDO",
    ], 0)

    //region Setting Content Wrapper Height
    const contentWrapper = document.querySelector<HTMLElement>('.content-wrapper')
    if (contentWrapper !== null) {
        contentWrapper.style.minHeight = `${window.innerHeight}px`
        window.addEventListener('resize', function () {
            contentWrapper.style.minHeight = `${window.innerHeight}px`
        })
    }
    //endregion

    /*region Toogle Sidebar */
    const wrapper = document.querySelector('.wrapper')
    const sidebarOverlay = document.querySelector('.sidebar-overlay')
    const toogleSidebar = document.querySelector('.toggle-sidebar')
    const breakpoint = getDeviceConfig(window.innerWidth)

    if (wrapper !== null) {
        if (breakpoint === 'sm') {
            if (checkClassList(wrapper, 'sidebar-mini')) {
                wrapper.classList.remove('sidebar-mini')
                wrapper.classList.add('sidebar-close')
            }
        } else {
            wrapper.classList.add('sidebar-mini')
            wrapper.classList.remove('sidebar-close')
        }
    }

    if (toogleSidebar !== null) {
        toogleSidebar.addEventListener('click', function () {
            const bp = getDeviceConfig(window.innerWidth)
            if (bp === 'sm') {
                if (checkClassList(wrapper, 'sidebar-close')) {
                    wrapper.classList.add('sidebar-open')
                    wrapper.classList.remove('sidebar-close')
                }
            } else {
                if (wrapper.classList.contains('sidebar-mini')) {
                    wrapper.classList.remove('sidebar-mini')
                } else if (!wrapper.classList.contains('sidebar-mini')) {
                    wrapper.classList.add('sidebar-mini')
                }
            }
        })
    }

    if (sidebarOverlay !== null) {
        sidebarOverlay.addEventListener('click', function () {
            const bp = getDeviceConfig(window.innerWidth)
            if (bp === 'sm') {
                if (checkClassList(wrapper, 'sidebar-open')) {
                    wrapper.classList.remove('sidebar-open')
                    wrapper.classList.add('sidebar-close')
                }
            }
        })
    }

    window.addEventListener('resize', function () {
        throttle(function () {
            const bp = getDeviceConfig(window.innerWidth)
            if (wrapper) {
                if (bp === 'sm') {
                    if (checkClassList(wrapper, 'sidebar-mini')) {
                        wrapper.classList.remove('sidebar-mini')
                        wrapper.classList.add('sidebar-close')
                    }
                } else {
                    wrapper.classList.add('sidebar-mini')
                    wrapper.classList.remove('sidebar-close')
                }
            }
        }, 200)
    })
    /*endregion*/

    //region Handle Notifikasi
    const toggleNotif = document.querySelector('.toggle-notif')
    const rightNavNotif = document.querySelector('.right-nav-notif')
    const closeNotif = document.querySelector('.close-notif')
    const notifOverlayElement = document.querySelector<HTMLElement>('.notifbar-overlay')
    const dataNotif = document.querySelector('.data-notif')
    const dataNotifLoader = document.querySelector('.notif-loader')
    const dataNotifEmpty = document.querySelector('.data-notif-empty')
    const dataCountNotif = document.querySelector('.data-count-notif')
    const totalNotifUnread = document.querySelector('.total-notif-unread')
    const countNotif = document.querySelector('.count-notif')
    const markAllRead = document.querySelector('.mark-all-read')
    let totalNotif = 0

    const getDataNotifikasi = async (loadMore?: any) => {
        $(dataNotifLoader).show()
        $(dataNotifEmpty).hide()
        const response = await fetch(loadMore ? `/notifikasi/data-notif?loadMore=${loadMore}` : `/notifikasi/data-notif`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken
            }
        })

        const {status} = response
        const {message, totalRows, dataResponse} = await response.json()
        if (status === 200) {
            $(dataNotifLoader).hide()
            if (dataResponse.length !== 0) {
                $(dataNotifEmpty).hide()

                dataResponse.map((item: any) => {
                    const {id, nama_pengirim, title, detail, link, kategori, created_at, readed} = item

                    let notifUnRead = ''
                    if (readed === null) {
                        notifUnRead = 'notif-unread'
                    }

                    $(dataNotif).append(`
                        <div class="notif-item ${notifUnRead} btnReadNotif" data-link="${link}" data-notifikasi_id="${id}">
                            <div class="notif-item-info">
                                <i class="fa fa-info-circle mr-1"></i>
                                ${kategori} • ${created_at}
                            </div>
                            <div class="notif-item-title">${title}</div>
                            <div class="notif-item-detail truncate">${detail}</div>
                            <div class="notif-item-footer">
                                <i class="fa fa-user-circle mt-[1.3px] mr-1"></i>
                                ${nama_pengirim ?? 'System'}
                            </div>
                        </div>
                    `)
                })

                const btnReadNotif = dataNotif.querySelectorAll('.btnReadNotif');
                if (btnReadNotif !== null) {
                    btnReadNotif.forEach((el) => {
                        const dataLink = el.getAttribute('data-link')
                        const notifikasiId = el.getAttribute('data-notifikasi_id')
                        el.addEventListener('click', function () {
                            readNotifikasi(notifikasiId).then(() => {
                                $(el).removeClass('notif-unread')
                                if (dataLink !== '') {
                                    window.location.href = dataLink
                                }
                            })
                        })
                    })
                }

                totalNotif = $(btnReadNotif).length
                const handleInfiniteScroll = () => {
                    throttle(async () => {
                        if ($(dataNotif).scrollTop() + $(dataNotif).innerHeight() >= $(dataNotif)[0].scrollHeight) {
                            if (totalNotif !== totalRows) {
                                await getDataNotifikasi(totalNotif)
                            }
                        }
                    }, 1000)
                }

                dataNotif.addEventListener('scroll', handleInfiniteScroll)

            } else {
                $(dataNotifEmpty).show()
            }
        } else {
            console.log(message)
        }
    }

    const getCountNotifikasi = async () => {
        const response = await fetch('/notifikasi/count-data-notif', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken
            }
        })

        const {status} = response
        const {message, dataResponse} = await response.json()
        if (status === 200) {
            if (dataCountNotif !== null) {
                if (countNotif !== null) {
                    if (dataResponse !== 0) {
                        $(dataCountNotif).show()
                        $(countNotif).text(dataResponse > 9 ? '9+' : dataResponse)
                        $(totalNotifUnread).show()
                        $(totalNotifUnread).text(`(${dataResponse})`)
                    } else {
                        $(dataCountNotif).hide()
                        $(countNotif).text('0')
                        $(totalNotifUnread).hide()
                    }
                }
            }
        } else {
            console.log(message)
        }
    }

    const readNotifikasi = (notifikasi_id: string) => {
        return new Promise(async (resolve) => {
            const response = await fetch('/notifikasi/read-notif', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken
                },
                body: JSON.stringify({
                    notifikasi_id
                })
            })

            const {status} = response
            const {message} = await response.json()
            if (status === 200) {
                // @ts-ignore
                resolve()
            } else {
                console.log(message)
            }
        })
    }

    const markAllReadNotifikasi = async () => {
        const response = await fetch('/notifikasi/mark-all-read', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken
            }
        })

        const {status} = response
        const {message} = await response.json()
        if (status === 200) {
            const notifUnread = document.querySelectorAll('.notif-unread')
            notifUnread.forEach((el) => {
                $(el).removeClass('notif-unread')
            })

            $(dataCountNotif).hide()
            $(countNotif).text('')
            $(totalNotifUnread).hide()
        } else {
            console.log(message)
        }
    }

    if (rightNavNotif !== null) {
        getCountNotifikasi().then(null)
    }
    const handleToggleNotif = async () => {
        if (checkClassList(rightNavNotif, 'open')) {
            rightNavNotif.classList.add('close')
            rightNavNotif.classList.remove('open')
            notifOverlayElement.style.visibility = 'hidden'
            notifOverlayElement.style.opacity = '0'
        } else {
            rightNavNotif.classList.add('open')
            rightNavNotif.classList.remove('close')
            notifOverlayElement.style.visibility = 'visible'
            notifOverlayElement.style.opacity = '1'

            $(dataNotif).html(null)
            await getDataNotifikasi()
        }
    }

    if (toggleNotif !== null) {
        toggleNotif.addEventListener('click', async function () {
            await handleToggleNotif()
        })
    }

    if (closeNotif !== null) {
        closeNotif.addEventListener('click', async function () {
            await handleToggleNotif()
        })
    }

    if (notifOverlayElement !== null) {
        notifOverlayElement.addEventListener('click', async function () {
            await handleToggleNotif()
        })
    }

    if (markAllRead !== null) {
        markAllRead.addEventListener('click', async function () {
            await markAllReadNotifikasi()
        })
    }
    //endregion

    //region Handle Fixed Table
    handleFixedTheadTh()
    handleFixedTd()
    handleFixedTfootTh()
    window.addEventListener('resize', function () {
        handleFixedTheadTh()
        handleFixedTd()
        handleFixedTfootTh()
    })
    //endregion

    //region Handle Tooltip in Table
    tableTooltip()
    //endregion

    //region Handle Custom Select2
    const choiceElms = document.querySelectorAll('.select2-custom')
    choiceElms.forEach((elm: HTMLInputElement) => {
        new ExBox(elm)
    })
    //endregion

    //region Handle Sticky Header ketika Scrolling
    const contentHeader = document.querySelector(".content-header")
    if (contentHeader !== null) {
        const handleStickyHeader = () => {
            const scrolled = document.scrollingElement.scrollTop
            if (scrolled > 1) {
                contentHeader.classList.add('active')
            } else {
                contentHeader.classList.remove('active')
            }
        }

        handleStickyHeader()
        document.addEventListener('scroll', handleStickyHeader)
    }
    //endregion

    //region Handle Date Picker
    const datepickerStart = document.querySelectorAll('.datepickerStart')
    const datepickerUntil = document.querySelectorAll('.datepickerUntil')
    if (datepickerStart && datepickerUntil) {
        datepickerStart.forEach((elm: HTMLInputElement) => {
            new ExPicker(elm, {
                autoClose: true
            })
        })

        datepickerUntil.forEach((elm: HTMLInputElement) => {
            const expickerUntil = new ExPicker(elm, {
                autoClose: true,
                onShow: () => {
                    expickerUntil.setOption({
                        startDate: $(datepickerStart).val() as string,
                        minDate: $(datepickerStart).val() as string
                    })
                }
            })
        })
    }

    const datePicker = document.querySelectorAll('.datePicker')
    datePicker.forEach((elm: HTMLInputElement) => {
        new ExPicker(elm, {
            dateFormat: 'yyyy-mm-dd',
            firstYear: 1950,
        })
    })
    //endregion

    //region Handle Masking Number Format
    const number = document.querySelectorAll('.number')
    if (number !== null) {
        number.forEach((elm) => {
            ($(elm) as any).inputmask("decimal", {
                min: 0,
                radixPoint: ".",
                autoGroup: true,
                groupSeparator: ",",
                groupSize: 3,
                autoUnmask: true,
                removeMaskOnSubmit: true
            })
        })
    }

    const numberText = document.querySelectorAll('.number-text')
    if (numberText !== null) {
        numberText.forEach((elm) => {
            ($(elm) as any).inputmask({
                mask: '9{1,15}',
                placeholder: '0'
            })
        })
    }

    const npwp = document.querySelectorAll('.npwp')
    if (npwp !== null) {
        npwp.forEach((elm) => {
            ($(elm) as any).inputmask({
                mask: '99.999.999.9-999.999',
                autoUnmask: true,
                removeMaskOnSubmit: true
            })
        })
    }

    const npwpAdd = document.querySelectorAll('.npwpAdd')
    if (npwpAdd !== null) {
        npwpAdd.forEach((elm) => {
            ($(elm) as any).inputmask({
                mask: '99.999.999.9-999.999',
                autoUnmask: true,
                removeMaskOnSubmit: true
            })
        })
    }

    const noktp = document.querySelectorAll('.noktp')
    if (noktp !== null) {
        noktp.forEach((elm) => {
            ($(elm) as any).inputmask({
                mask: '9999999999999999',
                autoUnmask: true,
                removeMaskOnSubmit: true
            })
        })
    }

    const nokk = document.querySelectorAll('.nokk')
    if (nokk !== null) {
        nokk.forEach((elm) => {
            ($(elm) as any).inputmask({
                mask: '9999999999999999',
                autoUnmask: true,
                removeMaskOnSubmit: true
            })
        })
    }

    const time = document.querySelectorAll('.time')
    if (time !== null) {
        time.forEach((elm: HTMLInputElement) => {
            new Inputmask({
                alias: 'datetime',
                inputFormat: 'HH:MM',
            }).mask(elm)
        })
    }
    //endregion

    if (!url.pathname.includes('payrolls/payroll-process/create')) {
        const payrollLocalData = localStorage.getItem('payroll')
        if (payrollLocalData) {
            localStorage.removeItem('payroll')
        }
    }

})
