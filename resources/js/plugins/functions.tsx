import {getDeviceConfig} from "@/js/plugins/breakpoint";
import {Dropdown, Popover} from 'flowbite';
import $ from "jquery";
import moment from "moment";

let throttleTimer: boolean;

export const checkClassList = (elm: Element, searchClassName: string) => {
    if (elm) {
        return elm.classList.contains(searchClassName)
    }

    return
}

export const showHiddenElmAndText = (elm: Element, elmText?: Element, text?: any) => {
    if (checkClassList(elm, '!hidden')) {
        elm.classList.remove('!hidden')
        if (typeof elmText !== 'undefined') {
            if (typeof text !== 'undefined') {
                elmText.innerHTML = text
            }
        }
    } else if (checkClassList(elm, 'hidden')) {
        elm.classList.remove('hidden')
        if (typeof elmText !== 'undefined') {
            if (typeof text !== 'undefined') {
                elmText.innerHTML = text
            }
        }
    }
}

export const showHiddenElm = (elm: Element) => {
    if (checkClassList(elm, '!hidden')) {
        elm.classList.remove('!hidden')
    } else if (checkClassList(elm, 'hidden')) {
        elm.classList.remove('hidden')
    }
}

export function insertAfter(referenceNode, newNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

export const hiddenElm = (elm) => {
    if (!checkClassList(elm, '!hidden'))
        elm.classList.add('!hidden')
}

export const removeElmClass = (elm: HTMLElement | Element, searchClassName: string) => {
    elm.classList.remove(searchClassName)
}

export function hide(element: HTMLElement | Element) {
    if (element) {
        if ("style" in element) {
            element.style.display = 'none';
        }
    }
}

export function show(element: HTMLElement | Element): void {
    if (element) {
        if ("style" in element) {
            element.style.display = '';
        }
    }
}

export const getMetaContent = (metaName: string) => {
    const metas = document.getElementsByTagName('meta');
    for (let i = 0; i < metas.length; i++) {
        if (metas[i].getAttribute('name') === metaName)
            return metas[i].getAttribute('content')
    }
    return undefined
}

export const setMetaContent = (metaName: string, content: string) => {
    const metas = document.getElementsByTagName('meta');
    for (let i = 0; i < metas.length; i++) {
        if (metas[i].getAttribute('name') === metaName)
            return metas[i].setAttribute('content', content)
    }
    return undefined
}

export const throttle = (callback: () => void, time: number) => {
    if (throttleTimer) return;
    throttleTimer = true;
    setTimeout(() => {
        callback();
        throttleTimer = false;
    }, time);
}

export const stringToHTML = function (str: string) {
    const parser = new DOMParser()
    const doc = parser.parseFromString(str, 'text/html')
    console.log(doc)
    return doc.body;
};

export const clearNumberFormat = (i: string) => {
    return parseFloat(i.replace(/,/g, ''))
}

export const mailValidation = (email: string) => {
    return email.match(
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
}

export const formatter = new Intl.NumberFormat('en-EN')

export const numberFormat = (options?: Intl.NumberFormatOptions) => {
    return new Intl.NumberFormat('en-EN', options)
}

export function formatBytes(bytes: number, decimals = 2) {
    if (!+bytes) return '0 Bytes'

    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']

    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

export function delay(callback: () => void, ms: number) {
    let timer: any = 0;
    return function () {
        const context = this, args = arguments;
        clearTimeout(timer);
        timer = setTimeout(function () {
            callback.apply(context, args);
        }, ms || 0);
    };
}

export function tableTooltip() {
    const useTooltip = document.querySelectorAll<HTMLElement>('table tr td')
    if (useTooltip) {
        useTooltip.forEach((elm, index) => {
            if (elm.offsetWidth < elm.scrollWidth) {
                const title = $(elm).closest('table').find('th').eq($(elm).index())[0].innerText
                const textContent = $(elm).html()
                const classList = elm.classList.value
                $(elm).replaceWith(`
                    <td class="${classList}">
                        <div class="truncate popover-trigger" data-popover-target="popover-default-${index}" data-popover-placement="right">
                            ${textContent}
                        </div>
                        <div data-popover id="popover-default-${index}" role="tooltip" class="popover invisible transition-opacity opacity-0">
                            <div class="popover-header">
                                <h3 class="title">${title}</h3>
                            </div>
                            <div class="popover-content">
                                <p class="whitespace-normal overflow-auto">${textContent}</p>
                            </div>
                            <div data-popper-arrow></div>
                        </div>
                    </td>
                `)
            }
        })
    }
}

export const triggerTableTooltip = () => {
    const popoverTrigger = document.querySelectorAll<HTMLElement>('.popover-trigger')
    // console.log(popoverTrigger)
    popoverTrigger.forEach((elm) => {
        const indexElm = elm.getAttribute('data-popover-target').split('-')[2]
        const indexDefaultElm = elm.getAttribute('data-popover-target').split('-')[1]
        const targetElm = document.getElementById(`popover-${indexDefaultElm}-${indexElm}`)
        const options = {
            placement: 'right',
            triggerType: 'hover',
            offset: 0,
        }

        new Popover(targetElm, elm, options as any)
    })
}

export function handleFixedTheadTh() {
    const tableFixedTh = document.querySelectorAll('table thead tr th[data-sticky]')
    if (tableFixedTh) {
        tableFixedTh.forEach((elm) => {
            const lw = elm.getAttribute('data-sticky-lw')
            const rw = elm.getAttribute('data-sticky-rw')
            const bpExclude = elm.getAttribute('data-sticky-bp-ex')
            const classListLw = `sticky border-left`
            const classListRw = `sticky border-right`
            renderFixedTable(elm, bpExclude, lw, rw, classListLw, classListRw)
        })
    }
}

export function handleFixedTd() {
    const tableFixedTd = document.querySelectorAll('table tr td[data-sticky]')
    if (tableFixedTd) {
        tableFixedTd.forEach((elm) => {
            const lw = elm.getAttribute('data-sticky-lw')
            const rw = elm.getAttribute('data-sticky-rw')
            const bpExclude = elm.getAttribute('data-sticky-bp-ex')
            const classListLw = `sticky-td border-left`
            const classListRw = `sticky-td border-right`
            renderFixedTable(elm, bpExclude, lw, rw, classListLw, classListRw)
        })
    }
}

export function handleFixedTfootTh() {
    const tableFixedTh = document.querySelectorAll('table tfoot tr th[data-sticky]')
    if (tableFixedTh) {
        tableFixedTh.forEach((elm) => {
            const lw = elm.getAttribute('data-sticky-lw')
            const rw = elm.getAttribute('data-sticky-rw')
            const bpExclude = elm.getAttribute('data-sticky-bp-ex')
            const classListLw = `border-left`
            const classListRw = `border-right`
            renderFixedTable(elm, bpExclude, lw, rw, classListLw, classListRw)
        })
    }
}

function renderFixedTable(elm, bpExclude, lw, rw, classListLw, classListRw) {
    if (bpExclude) {
        if (bpExclude.split(',').indexOf(getDeviceConfig(window.innerWidth)) === -1) {
            if (lw) {
                $(elm).addClass(classListLw)
                $(elm).css('left', lw).css('z-index', 10)
            }
            if (rw) {
                $(elm).addClass(classListRw)
                $(elm).css('right', rw)
            }
        } else {
            if (lw) {
                $(elm).removeClass(classListLw)
                $(elm).removeAttr('style')
            }
            if (rw) {
                $(elm).removeClass(classListRw)
                $(elm).removeAttr('style')
            }
        }
    } else {
        if (lw) {
            $(elm).addClass(classListLw)
            $(elm).css('left', lw)
            $(elm).css('left', lw).css('z-index', 10)
        }
        if (rw) {
            $(elm).addClass(classListRw)
            $(elm).css('right', rw)
        }
    }
}

export const renderPagination = (response: any, renderData: (...args: any[]) => void, parentModal?: Element, options?: any) => {
    const pagiLabelFrom = parentModal.querySelector('.pagiLabelFrom')
    const pagiLabelTo = parentModal.querySelector('.pagiLabelTo')
    const pagiLabelTotal = parentModal.querySelector('.pagiLabelTotal')
    const pagiPrevLink = parentModal.querySelector('.pagiPrevLink')
    const pagiLoopLink = parentModal.querySelector('.pagiLoopLink')
    const pagiNextLink = parentModal.querySelector('.pagiNextLink')

    const {links, next_page_url, prev_page_url, from, to, total} = response
    $(pagiLabelFrom).html(formatter.format(from))
    $(pagiLabelTo).html(formatter.format(to))
    $(pagiLabelTotal).html(formatter.format(total))

    //region Handle Pagination Prev Button
    let pagiPrev = `
        <span aria-disabled="true" aria-label="{{ __('pagination.previous') }}">
            <span class="relative inline-flex items-center px-2 py-2 text-sm font-medium text-gray-300 bg-white border border-gray-200 cursor-default rounded-l-md leading-5" aria-hidden="true">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
            </span>
        </span>
    `
    if (prev_page_url !== null) {
        pagiPrev = `
            <a data-url="${prev_page_url}" rel="prev" class="pagiPrevActive cursor-pointer relative inline-flex items-center px-2 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-200 rounded-l-md leading-5 hover:text-gray-400 focus:z-10 focus:outline-none focus:ring ring-gray-300 focus:border-blue-300 active:bg-gray-100 active:text-gray-500 transition ease-in-out duration-150" aria-label="{{ __('pagination.previous') }}">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
            </a>
        `
    }
    $(pagiPrevLink).html(pagiPrev)
    const pagiPrevActive = document.querySelectorAll('.pagiPrevActive')
    if (pagiPrevActive) {
        pagiPrevActive.forEach((item) => {
            item.addEventListener('click', function () {
                const dataUrl = this.dataset.url

                renderData({
                    url: dataUrl
                })
            })
        })
    }
    //endregion

    //region Handle Pagination Next Button
    let pagiNext = `
        <span aria-disabled="true" aria-label="{{ __('pagination.next') }}">
            <span class="relative inline-flex items-center px-2 py-2 -ml-px text-sm font-medium text-gray-300 bg-white border border-gray-200 cursor-default rounded-r-md leading-5" aria-hidden="true">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
                </svg>
            </span>
        </span>
    `
    if (next_page_url !== null) {
        pagiNext = `
            <a data-url="${next_page_url}" rel="next" class="pagiNextActive cursor-pointer relative inline-flex items-center px-2 py-2 -ml-px text-sm font-medium text-gray-500 bg-white border border-gray-200 rounded-r-md leading-5 hover:text-gray-400 focus:z-10 focus:outline-none focus:ring ring-gray-300 focus:border-blue-300 active:bg-gray-100 active:text-gray-500 transition ease-in-out duration-150" aria-label="{{ __('pagination.next') }}">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
                </svg>
            </a>
        `
    }
    $(pagiNextLink).html(pagiNext)
    const pagiNextActive = document.querySelectorAll('.pagiNextActive')
    if (pagiNextActive) {
        pagiNextActive.forEach((item) => {
            item.addEventListener('click', function () {
                const dataUrl = this.dataset.url

                renderData({
                    url: dataUrl
                })
            })
        })
    }
    //endregion

    //region Handle Pagination Loop Button
    const pagiLink = []
    links.map((item: any, index: number) => {
        const {url, label, active} = item
        if (index !== 0 && index !== links.length - 1) {
            // const loopUrl = url !== null ? url : next_page_url
            let pLink = `
                <a data-url="${url}" class="pagiLinkActive cursor-pointer relative inline-flex items-center px-4 py-2 -ml-px text-sm font-medium text-gray-700 bg-white border border-gray-200 leading-5 hover:text-gray-500 focus:z-10 focus:outline-none focus:ring ring-gray-300 focus:border-blue-300 active:bg-gray-100 active:text-gray-700 transition ease-in-out duration-150" aria-label="{{ __('Go to page :page', ['page' => ${label}]) }}">
                    ${label}
                </a>
            `
            if (active) {
                pLink = `
                    <span aria-current="page">
                        <span class="relative inline-flex items-center px-4 py-2 -ml-px text-sm font-medium text-white bg-blue-600 border border-gray-300 cursor-default leading-5">
                            ${label}
                        </span>
                    </span>
                `
            }
            pagiLink.push(pLink)
        }
    })

    // @ts-ignore
    $(pagiLoopLink).html(pagiLink)
    const pagiLinkActive = document.querySelectorAll('.pagiLinkActive')
    if (pagiLinkActive) {
        pagiLinkActive.forEach((elm) => {
            const dataUrl = elm.getAttribute('data-url')

            if (dataUrl !== 'null') {
                elm.addEventListener('click', async function () {
                    renderData({
                        ...options,
                        url: dataUrl
                    })
                })
            }
        })
    }
    //endregion
}

export const handleReadMoreText = () => {
    const formGroupDetail = document.querySelectorAll('.form-group-detail.posible-long')
    if (formGroupDetail) {
        formGroupDetail.forEach((elm) => {
            const textContent = $.trim($(elm).text()).replace(/<p>|<\/p>/g, '')
            const classList = elm.classList.value
            const checkParseText = $.trim($(elm).text()).replace(/<[^>]*>?/g, '')
            if (checkParseText.length > 135) {
                const subLengthText = 135
                $(elm).replaceWith(`
                    <div class="${classList}">
                        <div class="trim-text">
                            <span>${$.trim(textContent.substring(0, subLengthText))}</span>
                            <span class="dot">...</span>
                            <span class="on-full hidden">${textContent.substring(subLengthText, textContent.length)}</span>
                        </div>
                        <span class="read-more btnReadMore">Read More</span>
                    </div>
                `)
            } else {
                $(elm).replaceWith(`
                    <div class="${classList}">
                        <div class="trim-text">${textContent}</div>
                    </div>
                `)
            }
        })
    }

    const btnReadMore = document.querySelectorAll<HTMLElement>('.btnReadMore')
    if (btnReadMore) {
        btnReadMore.forEach((elm) => {
            elm.addEventListener('click', function () {
                const upSiblingDot = $(elm).closest('div.form-group-detail.posible-long').find('span.dot')[0]
                const upSiblingShort = $(elm).closest('div.form-group-detail.posible-long').find('span.on-full')[0]
                if (checkClassList(upSiblingShort, 'hidden')) {
                    hiddenElm(upSiblingDot)
                    removeElmClass(upSiblingShort, 'hidden')
                    elm.innerText = 'Read Less'
                } else {
                    hiddenElm(upSiblingShort)
                    removeElmClass(upSiblingDot, 'hidden')
                    elm.innerText = 'Read More'
                }
            })
        })
    }
}

export const query_search = (function (a) {
    // @ts-ignore
    if (a === "")
        return {}
    let b = {}
    for (let i = 0; i < a.length; ++i) {
        let p = a[i].split('=', 2);
        if (p.length !== 1) {
            b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
        }
    }
    return b;
})(window.location.search.substring(1).split('&'));

export const singkatNama = (nama, singkatAfter) => {
    const kata = nama.split(' ')
    const jumlahKata = kata.length

    const singkatDari = singkatAfter || 2
    let singkatan = '';
    for (let i = 0; i < jumlahKata; i++) {
        if (i >= singkatDari) {
            if (typeof kata[i][0] !== 'undefined') {
                singkatan += kata[i][0] + '.';
            }
        } else {
            singkatan += kata[i] + ' ';
        }
    }

    return singkatan;
}

export const potongNama = (nama: string) => {
    const kata = nama.split(' ')
    const jumlahKata = kata.length

    let potong = '';
    for (let i = 0; i < jumlahKata; i++) {
        if (i <= 1) {
            potong += kata[i] + ' '
        }
    }

    return potong;
}

export function joinString(arr: any[]) {
    if (arr.length === 1) return arr[0];
    const firsts = arr.slice(0, arr.length - 1);
    const last = arr[arr.length - 1];
    return firsts.join(', ') + ' dan ' + last;
}

export const handleDropdown = () => {
    const triggerElm = document.querySelectorAll<HTMLElement>('[data-dropdown-ex]')
    triggerElm.forEach((elm) => {
        const target = elm.getAttribute('data-dropdown-ex')
        const targetElm = document.getElementById(target)
        const options = {
            placement: 'bottom',
            triggerType: 'click',
            offsetSkidding: -80,
            offsetDistance: 10,
            delay: 300,
        }
        new Dropdown(targetElm, elm, options as any)
    })
}

export const handlePriorityColor = (priority: string) => {
    let color: string
    if (priority === 'Medium') {
        color = '#E8B613';
    } else if (priority === 'High') {
        color = '#FF0000';
    } else {
        color = '#518105'
    }

    return color
}

export function parseUrlLocation(href) {
    const match = href.match(/^(https?:)\/\/(([^:\/?#]*)(?::([0-9]+))?)([\/]{0,1}[^?#]*)(\?[^#]*|)(#.*|)$/);
    return match && {
        href: href,
        protocol: match[1],
        host: match[2],
        hostname: match[3],
        port: match[4],
        pathname: match[5],
        search: match[6],
        hash: match[7]
    }
}

export function timeAgo(time: any) {
    switch (typeof time) {
        case 'number':
            break;
        case 'string':
            time = +new Date(time);
            break;
        case 'object':
            if (time.constructor === Date) time = time.getTime();
            break;
        default:
            time = +new Date();
    }
    const time_formats = [
        [60, 'detik', 1], // 60
        [120, '1 menit yang lalu', '1 menit dari sekarang'], // 60*2
        [3600, 'menit', 60], // 60*60, 60
        [7200, '1 jam yang lalu', '1 jam dari sekarang'], // 60*60*2
        [86400, 'jam', 3600], // 60*60*24, 60*60
        [172800, 'Kemarin', 'Besok'], // 60*60*24*2
        [604800, 'hari', 86400], // 60*60*24*7, 60*60*24
        [1209600, 'Seminggu terakhir', 'Minggu akan datang'], // 60*60*24*7*4*2
        [2419200, 'minggu', 604800], // 60*60*24*7*4, 60*60*24*7
        [4838400, 'Sebulan terakhir', 'Bulan akan datang'], // 60*60*24*7*4*2
        [29030400, 'bulan', 2419200], // 60*60*24*7*4*12, 60*60*24*7*4
        [58060800, 'Setahun terakhir', 'Tahun akan datang'], // 60*60*24*7*4*12*2
        [2903040000, 'tahun', 29030400], // 60*60*24*7*4*12*100, 60*60*24*7*4*12
        [5806080000, 'Seabad terakhir', 'Abad akan datang'], // 60*60*24*7*4*12*100*2
        [58060800000, 'Abad', 2903040000] // 60*60*24*7*4*12*100*20, 60*60*24*7*4*12*100
    ];
    let seconds = (+new Date() - time) / 1000,
            token = 'yang lalu',
            list_choice = 1;

    if (seconds == 0) {
        return 'Baru saja'
    }
    if (seconds < 0) {
        seconds = Math.abs(seconds);
        token = 'dari sekarang';
        list_choice = 2;
    }
    let i = 0
    let format
    while (format = time_formats[i++])
        if (seconds < format[0]) {
            if (typeof format[2] == 'string')
                return format[list_choice];
            else
                return Math.floor(seconds / format[2]) + ' ' + format[1] + ' ' + token;
        }
    return time;
}

export const compareArrays = (a, b) => {
    return JSON.stringify(a) === JSON.stringify(b);
}

export function removeObject(array: any[], key: string, value: string | number) {
    const index = array.findIndex(obj => obj[key] === value);
    return index >= 0 ? [
        ...array.slice(0, index),
        ...array.slice(index + 1)
    ] : array;
}

export function responseMessages(elm: Element, messages: any[] | string) {
    $(elm).html(null)
    if (messages) {
        if (Array.isArray(messages)) {
            if (messages.length !== 0) {
                messages.map((item) => {
                    $(elm).append(`
                        <li class="info-alert-text error">
                            <div><i class="fas fa-exclamation-circle mr-1"></i></div>
                            <div>${item}</div>
                        </li>
                    `)
                })
            }
        } else {
            $(elm).append(`
                <li class="info-alert-text error">
                    <div><i class="fas fa-exclamation-circle mr-1"></i></div>
                    <div class="truncate">${messages}</div>
                </li>
            `)
        }
    }
}

export function readImage(image: Blob, callback: (base64: string | ArrayBuffer) => void) {
    let reader = new FileReader();
    reader.onload = function () {
        callback(reader.result)
    }
    reader.readAsDataURL(image);
}

export const b64toBlob = (b64Data: string, contentType: string, sliceSize?: number) => {
    contentType = contentType || '';
    sliceSize = sliceSize || 512;

    const byteCharacters = atob(b64Data);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        const slice = byteCharacters.slice(offset, offset + sliceSize);

        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
    }

    return new Blob(byteArrays, {type: contentType});
}

export function getFileBase64(fileBlob: Blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(fileBlob);
        reader.onload = () => {
            resolve(reader.result)
        };
        reader.onerror = error => reject(error);
    });
}

export async function fileUrlToFile(url: string, filename: string, mimeType?: string) {
    return fetch(url)
            .then(res => res.arrayBuffer())
            .then(buf => new File([buf], filename, {type: mimeType}));
}

export function inArray(haystack: any[], find: any) {
    return haystack.indexOf(find) != -1;
}

export const conversiBilangan = (nilai) => {
    let num = nilai === null ? 0 : nilai
    num = num.toString().replace(/[^0-9.]/g, '');

    let si = [
        {v: 1E3, s: "Rb"}, // Ribuan
        {v: 1E6, s: "JT"}, // Jutaan
        {v: 1E9, s: "M"}, // Miliaran
        {v: 1E12, s: "T"}, // Triliun
        // {v: 1E15, s: "P"}, // Kuadriliun
        // {v: 1E18, s: "E"}, // Kuintiliun
        // {v: 1E21, s: "E"} // Sekstiliun
    ];

    let index: number;
    for (index = si.length - 1; index > 0; index--) {
        if (num >= si[index].v) {
            break;
        }
    }

    return (num / si[index].v).toFixed(2).replace(/\.0+$|(\.[0-9]*[1-9])0+$/, "$1") + si[index].s;
};

export const getLocale = () => {
    return document.documentElement.lang
}

export function removeURLParameter(url: string, parameter?: string) {
    //prefer to use l.search if you have a location/link object
    const urlParts = url.split('?');
    if (urlParts.length >= 2) {

        const prefix = encodeURIComponent(parameter) + '=';
        const pars = urlParts[1].split(/[&;]/g);

        //reverse iteration as may be destructive
        for (let i = pars.length; i-- > 0;) {
            //idiom for string.startsWith
            if (pars[i].lastIndexOf(prefix, 0) !== -1) {
                pars.splice(i, 1);
            }
        }

        return urlParts[0] + (pars.length > 0 ? '?' + pars.join('&') : '');
    }
    return url;
}

export function randomId(length: number) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
        counter += 1;
    }
    return result;
}

export function ucwords(str: string) {
    return (str + '').replace(/^([a-z])|\s+([a-z])/g, function ($1) {
        return $1.toUpperCase();
    });
}

export function getOrdinalNumber(n: number): string {
    const lastDigit = n % 10;
    const lastTwoDigits = n % 100;

    // Pengecualian untuk 11, 12, 13
    if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
        return n + "th";
    }

    switch (lastDigit) {
        case 1:
            return n + "st";
        case 2:
            return n + "nd";
        case 3:
            return n + "rd";
        default:
            return n + "th";
    }
}

export function startTimer(elm: HTMLElement) {
    let seconds = 0;
    let minutes = 0;
    let hours = 0;

    function updateTime() {
        seconds++;

        if (seconds >= 60) {
            seconds = 0;
            minutes++;

            if (minutes >= 60) {
                minutes = 0;
                hours++;
            }
        }

        // Format waktu dengan leading zeros
        const displayHours = hours.toString().padStart(2, '0');
        const displayMinutes = minutes.toString().padStart(2, '0');
        const displaySeconds = seconds.toString().padStart(2, '0');

        if (elm)
            elm.textContent = `${displayHours}:${displayMinutes}:${displaySeconds}`;
    }

    setInterval(updateTime, 1000);
}

export function toMonth(angka: number): string {
    try {
        const date = new Date(new Date().getFullYear(), angka - 1)
        const locale = document.documentElement.lang || 'en'
        return new Intl.DateTimeFormat(locale, {month: 'long'}).format(date)
    } catch (e) {
        return 'Bulan tidak valid';
    }
}

export function formatDateRangeWithDuration(startDate: string, endDate: string): {
    dateRange: string;
    duration: string;
} {
    const start = moment(startDate);
    const end = moment(endDate);

    // Format rentang tanggal
    let dateRange: string;

    if (start.format('MMMM YYYY') === end.format('MMMM YYYY')) {
        dateRange = `${start.format('D')} - ${end.format('D MMMM YYYY')}`;
    } else if (start.format('YYYY') === end.format('YYYY')) {
        dateRange = `${start.format('D MMMM')} - ${end.format('D MMMM YYYY')}`;
    } else {
        dateRange = `${start.format('D MMMM YYYY')} - ${end.format('D MMMM YYYY')}`;
    }

    // Hitung durasi dalam hari
    const durationDays = end.diff(start, 'days') + 1;
    const duration = `${durationDays} days`;

    return {dateRange, duration};
}
