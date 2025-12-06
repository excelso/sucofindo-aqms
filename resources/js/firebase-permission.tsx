import {initializeApp} from "firebase/app"
import {getMessaging, getToken, onMessage} from "firebase/messaging"
import {firebaseStoreToken} from "@/js/firebase";
import Toasts from "@/js/plugins/toast";
import {confirmAlert} from "@/js/plugins/sweet-alert";
import {checkClassList, getMetaContent, throttle} from "@/js/plugins/functions";

document.addEventListener('DOMContentLoaded', () => {

    const csrfToken = getMetaContent('csrf-token')
    const user_id = getMetaContent('user_id')

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

        const url = new URL(window.location.href)
        let urlNotifikasi = '/aqms/notifikasi/data-notif';
        if (url.pathname.includes('sparing')) {
            urlNotifikasi = '/sparing/notifikasi/data-notif'
        }

        const response = await fetch(loadMore ? `${urlNotifikasi}?loadMore=${loadMore}` : urlNotifikasi, {
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
                    const {id, nama_pengirim, title, message, detail, link, kategori, created_at, readed} = item

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
                            <div class="notif-item-detail">${message ?? detail}</div>
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
        const url = new URL(window.location.href)
        let urlNotifikasi = '/aqms/notifikasi/count-data-notif';
        if (url.pathname.includes('sparing')) {
            urlNotifikasi = '/sparing/notifikasi/count-data-notif'
        }

        const response = await fetch(urlNotifikasi, {
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
            const url = new URL(window.location.href)
            let urlNotifikasi = '/aqms/notifikasi/read-notif';
            if (url.pathname.includes('sparing')) {
                urlNotifikasi = '/sparing/notifikasi/read-notif'
            }

            const response = await fetch(`${urlNotifikasi}`, {
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
        const url = new URL(window.location.href)
        let urlNotifikasi = '/aqms/notifikasi/mark-all-read';
        if (url.pathname.includes('sparing')) {
            urlNotifikasi = '/sparing/notifikasi/mark-all-read'
        }

        const response = await fetch(`${urlNotifikasi}`, {
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

    const firebaseConfig = {
        apiKey: "AIzaSyCiWzilxK0LfC-NfzoaiUt6Fh5-fguQCpE",
        authDomain: "sparingberau.firebaseapp.com",
        projectId: "sparingberau",
        storageBucket: "sparingberau.appspot.com",
        messagingSenderId: "340771933723",
        appId: "1:340771933723:web:692ba915d2a922a3f972be",
        measurementId: "G-2Y1631LCHJ"
    };

    const toasts = new Toasts({
        width: 300,
        timing: 'ease',
        duration: '.5s',
        dimOld: true,
        position: 'top-right'
    });

    const handleFirebaseMessage = (messaging: any) => {
        onMessage(messaging, (payload) => {
            const {data} = payload
            const {notification, user_receiver_id} = data
            const {title, body} = JSON.parse(notification)
            if (rightNavNotif !== null) {
                if (parseInt(user_receiver_id) === parseInt(user_id)) {
                    getCountNotifikasi().then(null)
                    toasts.push({
                        title,
                        content: body,
                        style: 'dark',
                        closeButton: true
                    })
                }
            }
        })
    }

    const handleFirebase = () => {
        const messaging = getMessaging();
        getToken(messaging, {vapidKey: 'BCZ7k2TVsUGoc9--Y2021valA3NzNBkTWxWjkdgkxrMbXBVFvWeei42SCwV1uRpKinO8pAHQhUehp9XFAVC71Jw'}).then((currentToken) => {
            if (currentToken) {
                console.log(currentToken)
                // Store Firebase Token ke Database
                firebaseStoreToken({
                    csrfToken,
                    firebaseReqToken: currentToken
                }).then(null)
            } else {
                console.log('No registration token available. Request permission to generate one.')
            }
        }).catch((err) => {
            console.log('An error occurred while retrieving token. ', err)
        })
    }

    initializeApp(firebaseConfig);
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/firebase-messaging-sw.js')
            .then((register) => {
                if (("Notification" in window)) {
                    if (Notification.permission !== 'granted') {
                        confirmAlert({
                            title: 'Permintaan Notifikasi',
                            html: `
                                <div>Mohon Aktifkan Notifikasi pada Browser Anda</div>
                            `,
                            confirmButtonText: 'Oke, Aktifkan',
                            allowOutsideClick: false
                        }, () => {
                            Notification.requestPermission().then((permission) => {
                                if (permission === "granted") {
                                    handleFirebase()
                                }
                            });
                        })
                    } else {
                        handleFirebase()
                    }
                }
            })
    } else {
        console.log('Service Worker not supported')
    }

    // Handle Message Firebase pakai Worker
    if (typeof navigator.serviceWorker !== 'undefined') {
        navigator.serviceWorker.onmessage = (event) => {
            const {data} = event
            const {data: dataNotifikasi, notification} = data
            const {user_receiver_id} = dataNotifikasi
            const {title, body} = notification

            if (parseInt(user_receiver_id) === parseInt(user_id)) {
                if (rightNavNotif) {
                    $(dataCountNotif).show()
                    const currTotal = parseInt($(countNotif).text().replace('+', ''))
                    const calcTotal = currTotal + 1
                    $(countNotif).text(calcTotal > 9 ? '9+' : calcTotal)
                    new Notification(title, {body, icon: '/images/favicon.png'})
                }
            }
        }
    }
})
