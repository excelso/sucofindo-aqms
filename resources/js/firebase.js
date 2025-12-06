import {initializeApp} from "firebase/app"
import {getMessaging, getToken, onMessage} from "firebase/messaging"

export const firebaseStoreToken = (options) => {
    const {csrfToken, firebaseReqToken} = options
    return new Promise(async (resolve, reject) => {
        const url = new URL(window.location.href)
        let urlNotifikasi = '/aqms/notifikasi/firebase/save-token';
        if (url.pathname.includes('sparing')) {
            urlNotifikasi = '/sparing/notifikasi/firebase/save-token'
        }

        const response = await fetch(`${urlNotifikasi}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken
            },
            body: JSON.stringify({
                firebaseReqToken
            })
        })

        const {status} = response
        const {message} = await response.json()
        if (status === 200) {
            resolve()
        } else {
            reject(message)
        }
    })
}
