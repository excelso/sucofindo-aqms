import {getMetaContent} from "@/js/plugins/functions";
import {closeModalDialog, showModalDialog} from "@/js/plugins/modal";
import moment from "moment/moment";

document.addEventListener('DOMContentLoaded', function () {

    //region Handle Init Component
    const csrfToken = getMetaContent('csrf-token')
    const url = new URL(window.location.href)
    const win: Window = window

    const btnPencarian = document.querySelector('.btnPencarian')
    const modalPencarian = document.querySelector('.modalPencarian')
    const closeModalForm = document.querySelectorAll('.closeModalForm')
    // endregion

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
                const interval = modalPencarian.querySelector<HTMLInputElement>('.interval')
                const formHarian = modalPencarian.querySelector<HTMLElement>('.formHarian')
                const formTanggal = modalPencarian.querySelector<HTMLElement>('.formTanggal')
                const formBulanan = modalPencarian.querySelector<HTMLElement>('.formBulanan')
                const tanggalCurr = modalPencarian.querySelector<HTMLInputElement>('.tanggalCurr')
                const tanggal = modalPencarian.querySelector<HTMLInputElement>('.tanggal')
                const minDateCurr = modalPencarian.querySelector<HTMLInputElement>('.minDateCurr')
                const minDate = modalPencarian.querySelector<HTMLInputElement>('.minDate')
                const maxDateCurr = modalPencarian.querySelector<HTMLInputElement>('.maxDateCurr')
                const maxDate = modalPencarian.querySelector<HTMLInputElement>('.maxDate')
                const bulan = modalPencarian.querySelector<HTMLInputElement>('.bulan')
                const tahun = modalPencarian.querySelector<HTMLInputElement>('.tahun')
                const btnCari = modalPencarian.querySelector<HTMLElement>('.btnCari')
                const btnResetPencarian = document.querySelector<HTMLElement>('.btnResetPencarian')

                if ($(interval).val() === '1') {
                    $(formHarian).show()
                    $(tanggal).val(tanggalCurr.value)
                    $(formTanggal).hide()
                    $(formBulanan).hide()
                    $(minDate).val('')
                    $(maxDate).val('')
                    $(bulan).val('')
                    $(tahun).val('')
                } else if ($(interval).val() === '2') {
                    $(formHarian).hide()
                    $(tanggal).val('')
                    $(formTanggal).hide()
                    $(formBulanan).show()
                    $(minDate).val('')
                    $(maxDate).val('')
                } else {
                    $(formHarian).hide()
                    $(tanggal).val('')
                    $(formTanggal).show()
                    $(formBulanan).hide()
                    $(minDate).val(minDateCurr.value)
                    $(maxDate).val(maxDateCurr.value)
                    $(bulan).val('')
                    $(tahun).val('')
                }

                $(interval).on('change', function () {
                    if ($(this).val() === '1') {
                        $(formHarian).show()
                        $(tanggal).val(tanggalCurr.value)
                        $(formTanggal).hide()
                        $(formBulanan).hide()
                        $(minDate).val('')
                        $(maxDate).val('')
                        $(bulan).val('')
                        $(tahun).val('')
                    } else if ($(this).val() === '2') {
                        $(formHarian).hide()
                        $(tanggal).val('')
                        $(formTanggal).hide()
                        $(formBulanan).show()
                        $(minDate).val('')
                        $(maxDate).val('')
                        $(bulan).val(moment().format('M'))
                        $(tahun).val(moment().format('YYYY'))
                    } else {
                        $(formHarian).hide()
                        $(tanggal).val('')
                        $(formTanggal).show()
                        $(formBulanan).hide()
                        $(minDate).val(minDateCurr.value)
                        $(maxDate).val(maxDateCurr.value)
                        $(bulan).val('')
                        $(tahun).val('')
                    }
                })

                modalPencarian.addEventListener('keypress', function (ev: KeyboardEvent) {
                    if (ev.key === 'Enter') {
                        $(btnCari).trigger('click');
                    }
                })

                btnResetPencarian.addEventListener('click', function () {
                    win.location = `${url.pathname}`
                })

                $(btnCari).off('click').on('click', function () {
                    const elmPencarian = modalPencarian.querySelectorAll('[name]')
                    const text_result_url = []
                    elmPencarian.forEach((elm: HTMLInputElement) => {
                        const elmNames = elm.getAttribute('name')
                        if (elmNames === 'platformUid') {
                            const valueParts = elm.value.split('#')
                            const [uid, tipeLogger] = valueParts;
                            text_result_url.push(`${elmNames}=${uid}&tipeLogger=${tipeLogger}`)
                        } else {
                            if (elm.value !== '') {
                                text_result_url.push(`${elmNames}=${elm.value}`)
                            }
                        }
                    })

                    const wind: Window = window
                    wind.location = `${url.pathname}?${text_result_url.join('&')}`
                })
            })
        })
    }
    //endregion

})
