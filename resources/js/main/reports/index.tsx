import {closeModalDialog, showModalDialog} from "@/js/plugins/modal";
import {getMetaContent, responseMessages} from "@/js/plugins/functions";
import {confirmAlert, failureAlert, successAlert, waitLoader} from "@/js/plugins/sweet-alert";

document.addEventListener('DOMContentLoaded', function () {
    const csrfToken = getMetaContent('csrf-token')

    const closeModalForm: NodeListOf<HTMLElement> = document.querySelectorAll('.closeModalForm')
    const btnSearch = document.querySelector('.btnSearch')
    const modalPencarian = document.querySelector('.modalPencarian')

    //region Handle Close Modal
    closeModalForm.forEach((elm: Element) => {
        elm.addEventListener('click', function () {
            if (modalPencarian) {
                closeModalDialog(modalPencarian, () => {

                })
            }
        })
    })
    //endregion

    //region Handle Pencarian
    if (btnSearch !== null) {
        btnSearch.addEventListener('click', function () {
            showModalDialog(modalPencarian, null, () => {
                const btnCari = document.querySelector<HTMLElement>('.btnCari')
                modalPencarian.addEventListener('keypress', function (ev) {
                    // @ts-ignore
                    if (ev.key === 'Enter') {
                        $(btnCari).trigger('click');
                    }
                })

                btnCari.addEventListener('click', function () {
                    const elmPencarian = modalPencarian.querySelectorAll<HTMLInputElement>('[name]')
                    const text_result = []
                    elmPencarian.forEach((elm) => {
                        const elmNames = elm.getAttribute('name')
                        if (elm.value !== '')
                            text_result.push(`${elmNames}=${elm.value}`)
                    })

                    const win: Window = window
                    win.location = `/reports/logs-parameter?${text_result.join('&')}`
                })
            })
        })
    }
    //endregion

})
