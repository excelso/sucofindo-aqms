import {getMetaContent, hiddenElm, showHiddenElmAndText} from "@/js/plugins/functions";
import moment from "moment";
import {closeModalDialog, showModalDialog} from "@/js/plugins/modal";
import DataCustomerLokasiModel from "@/js/main/be-sparing/master/data-customer-lokasi/model/DataCustomerLokasiModel";
import DataSitesModel from "@/js/main/master/data-sites/model/DataSitesModel";
import DataSitesLocationModel from "@/js/main/master/data-sites-location/model/DataSitesLocationModel";

document.addEventListener('DOMContentLoaded', () => {

    const csrfToken = getMetaContent('csrf-token')
    const url = new URL(window.location.href)
    const win: Window = window

    const btnSearch = document.querySelector('.btnSearch')
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
    if (btnSearch !== null) {
        btnSearch.addEventListener('click', function () {
            showModalDialog(modalPencarian, null, () => {
                const srcCompanyId = document.querySelector<HTMLSelectElement>('.srcCompanyId')
                const srcCompanySiteId = document.querySelector<HTMLSelectElement>('.srcCompanySiteId')
                const srcCompanySiteLocationId = document.querySelector<HTMLSelectElement>('.srcCompanySiteLocationId')
                const btnCari = document.querySelector<HTMLElement>('.btnCari')
                const btnResetPencarian = document.querySelector<HTMLElement>('.btnResetPencarian')

                new DataSitesModel(srcCompanyId, srcCompanySiteId, {
                    csrfToken
                });

                new DataSitesLocationModel(srcCompanySiteId, srcCompanySiteLocationId, {
                    csrfToken
                });

                btnResetPencarian.addEventListener('click', function () {
                    win.location = `${url.pathname}`
                })

                modalPencarian.addEventListener('keypress', function (ev: KeyboardEvent) {
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
                    win.location = `${url.pathname}?${text_result.join('&')}`
                })
            })
        })
    }
    //endregion

})
