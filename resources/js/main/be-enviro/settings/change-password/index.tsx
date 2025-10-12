import {getMetaContent, hiddenElm, responseMessages} from "@/js/plugins/functions";
import {closeAlert, confirmAlert, failureAlert, successAlert, waitLoader} from "@/js/plugins/sweet-alert";

document.addEventListener('DOMContentLoaded', function () {
    const csrfToken = getMetaContent('csrf-token')
    let url = new URL(window.location.href)
    const passwordLama: HTMLInputElement = document.querySelector('.passwordLama')
    const passwordLamaError = document.querySelector('.passwordLamaError')
    const btnLookPasswordLama = document.querySelector('.btnLookPasswordLama')
    const passwordBaru: HTMLInputElement = document.querySelector('.passwordBaru')
    const passwordBaruError = document.querySelector('.passwordBaruError')
    const btnLookPasswordBaru = document.querySelector('.btnLookPasswordBaru')
    const rePasswordBaru: HTMLInputElement = document.querySelector('.rePasswordBaru')
    const rePasswordBaruError = document.querySelector('.rePasswordBaruError')
    const btnLookRePasswordBaru = document.querySelector('.btnLookRePasswordBaru')
    const btnSimpan = document.querySelector('.btnSimpan')

    if (btnLookPasswordLama) {
        btnLookPasswordLama.addEventListener('click', function () {
            let currentType = passwordLama.getAttribute('type') === 'password' ? 'text' : 'password'
            let currentTypeIcon = passwordLama.getAttribute('type') === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash'
            passwordLama.setAttribute('type', currentType)
            btnLookPasswordLama.innerHTML = `<i class="${currentTypeIcon}"></i>`
        })
    }

    if (btnLookPasswordBaru) {
        btnLookPasswordBaru.addEventListener('click', function () {
            let currentType = passwordBaru.getAttribute('type') === 'password' ? 'text' : 'password'
            let currentTypeIcon = passwordBaru.getAttribute('type') === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash'
            passwordBaru.setAttribute('type', currentType)
            btnLookPasswordBaru.innerHTML = `<i class="${currentTypeIcon}"></i>`
        })
    }

    if (btnLookRePasswordBaru) {
        btnLookRePasswordBaru.addEventListener('click', function () {
            let currentType = rePasswordBaru.getAttribute('type') === 'password' ? 'text' : 'password'
            let currentTypeIcon = rePasswordBaru.getAttribute('type') === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash'
            rePasswordBaru.setAttribute('type', currentType)
            btnLookRePasswordBaru.innerHTML = `<i class="${currentTypeIcon}"></i>`
        })
    }

    if (btnSimpan) {
        btnSimpan.addEventListener('click', function () {
            confirmAlert({
                title: 'Confirm',
                html: 'Will you change a new password?',
                confirmButtonText: 'Save Change',
                showDenyButton: true,
                denyButtonText: 'Cancel'
            }, async () => {
                await waitLoader('Please Wait...', 'Save Change New Password', async () => {

                    const response = await fetch(`${url.pathname}/update`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': csrfToken
                        },
                        body: JSON.stringify({
                            password_lama: passwordLama.value,
                            password_baru: passwordBaru.value,
                            re_password_baru: rePasswordBaru.value,
                        })
                    })

                    const {status} = response
                    const {message, errorValidation} = await response.json()
                    if (status === 200) {
                        successAlert({
                            title: 'Success',
                            html: message,
                            confirmButtonText: 'Close'
                        }, () => {
                            window.location.reload()
                        })
                    } else {
                        closeAlert()
                        if (errorValidation) {
                            const {
                                password_lama,
                                password_baru,
                                re_password_baru,
                            } = errorValidation

                            responseMessages(passwordLamaError, password_lama)
                            responseMessages(passwordBaruError, password_baru)
                            responseMessages(rePasswordBaruError, re_password_baru)

                        } else {
                            failureAlert({
                                html: message,
                                confirmButtonText: 'Cancel'
                            })
                        }
                    }

                })
            })
        })
    }

})
