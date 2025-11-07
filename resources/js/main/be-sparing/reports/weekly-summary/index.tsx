import {getMetaContent, hiddenElm, showHiddenElmAndText} from "@/js/plugins/functions";
import moment from "moment";
import {closeModalDialog, showModalDialog} from "@/js/plugins/modal";
import DataCustomerLokasiModel from "@/js/main/be-sparing/master/data-customer-lokasi/model/DataCustomerLokasiModel";

document.addEventListener('DOMContentLoaded', () => {

    const csrfToken = getMetaContent('csrf-token')
    const url = new URL(window.location.href)
    const win: Window = window

    const btnPencarian = document.querySelector('.btnPencarian')
    const modalPencarian = document.querySelector('.modalPencarian')
    const closeModalForm = document.querySelectorAll('.closeModalForm')

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
                const lookCustomerId: HTMLInputElement = modalPencarian.querySelector('.lookCustomerId')
                const lookCustomerLokasiId: HTMLSelectElement = modalPencarian.querySelector('.lookCustomerLokasiId')
                const lookCustomerLokasiIdTemp: HTMLInputElement = modalPencarian.querySelector('.lookCustomerLokasiIdTemp')
                const btnCari = document.querySelector<HTMLElement>('.btnCari')
                const btnResetPencarian = document.querySelector<HTMLElement>('.btnResetPencarian')

                lookCustomerLokasiId.setAttribute('data-selected', lookCustomerLokasiIdTemp.value)

                new DataCustomerLokasiModel(lookCustomerId, lookCustomerLokasiId)
                modalPencarian.addEventListener('keyup', function (ev: KeyboardEvent) {
                    if (ev.key === 'Enter') {
                        $(btnCari).trigger('click');
                    }
                })

                btnResetPencarian.addEventListener('click', function () {
                    win.location = `${url.pathname}`
                })

                $(btnCari).off('click').on('click', function () {
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

                    closeModalDialog(modalPencarian, () => {
                        history.pushState({}, null, `${url.pathname}?${text_result_url.join('&')}`)
                        win.location.href = `${url.pathname}?${text_result_url.join('&')}`
                    })
                })
            })
        })
    }
    //endregion

})
