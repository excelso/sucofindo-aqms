import {getMetaContent, responseMessages, showHiddenElmAndText} from "@/js/plugins/functions";
import {closeModalDialog, showModalDialog} from "@/js/plugins/modal";
import {confirmAlert, failureAlert, successAlert, waitLoader} from "@/js/plugins/sweet-alert";
import DataCustomerLokasiModel from "@/js/main/be-sparing/master/data-customer-lokasi/model/DataCustomerLokasiModel";

document.addEventListener('DOMContentLoaded', function () {

    //region Init Component
    const csrfToken = getMetaContent('csrf-token')
    const url = new URL(window.location.href)
    const win: Window = window

    const dataTables: NodeListOf<Element> = document.querySelectorAll('.data-tables')
    const closeModalForm: NodeListOf<Element> = document.querySelectorAll('.closeModalForm')

    const btnTambah: Element = document.querySelector('.btnTambah')
    const modalForm: Element = document.querySelector('.modalForm')
    const customerId: HTMLInputElement = modalForm.querySelector('.customerId')
    const customerIdError: Element = modalForm.querySelector('.customerIdError')
    const customerLokasiId: HTMLSelectElement = modalForm.querySelector('.customerLokasiId')
    const customerLokasiIdError: Element = modalForm.querySelector('.customerLokasiIdError')
    const siteId: HTMLInputElement = modalForm.querySelector('.siteId')
    const namaSite: HTMLInputElement = modalForm.querySelector('.namaSite')
    const namaSiteError: Element = modalForm.querySelector('.namaSiteError')
    const btnSimpan: Element = modalForm.querySelector('.btnSimpan')
    const btnHapus: Element = modalForm.querySelector('.btnHapus')

    const btnPencarian: Element = document.querySelector('.btnPencarian')
    const modalPencarian: HTMLInputElement = document.querySelector('.modalPencarian')
    //endregion

    //region Handle Close Modal
    closeModalForm.forEach((elm: Element) => {
        elm.addEventListener('click', function () {
            if (modalForm) {
                closeModalDialog(modalForm, () => {
                    $(siteId).val('')
                    $(customerId).val('').trigger('change.select2')
                    $(namaSite).val('')
                })
            }

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
                const btnCari = document.querySelector<HTMLElement>('.btnCari')
                const srcCustomerId = document.querySelector<HTMLSelectElement>('.srcCustomerId')
                const srcCustomerLokasiId = document.querySelector<HTMLSelectElement>('.srcCustomerLokasiId')
                const btnResetPencarian = document.querySelector<HTMLElement>('.btnResetPencarian')

                new DataCustomerLokasiModel(srcCustomerId, srcCustomerLokasiId)
                modalPencarian.addEventListener('keypress', function (ev) {
                    if (ev.key === 'Enter') {
                        $(btnCari).trigger('click');
                    }
                })

                btnResetPencarian.addEventListener('click', function () {
                    win.location = `${url.pathname}`
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

    //region Handle Tambah
    if (btnTambah) {
        btnTambah.addEventListener('click', function () {
            showModalDialog(modalForm, '<i class="fas fa-plus-circle mr-2"></i> Tambah WMP', () => {
                new DataCustomerLokasiModel(customerId, customerLokasiId)

                if (btnSimpan) {
                    btnSimpan.addEventListener('click', function () {
                        confirmAlert({
                            title: 'Konfirmasi',
                            html: 'Apakah anda akan membuat data WMP baru?',
                            confirmButtonText: 'Ya, Simpan',
                            showDenyButton: true,
                            denyButtonText: 'Tidak'
                        }, async () => {
                            await waitLoader('Mohon Tunggu...', 'Menyimpan data WMP baru', async () => {
                                const response = await fetch(`${url.pathname}/store`, {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'X-CSRF-TOKEN': csrfToken
                                    },
                                    body: JSON.stringify({
                                        customer_id: customerId.value,
                                        customer_lokasi_id: customerLokasiId.value,
                                        nama_site: namaSite.value,
                                    })
                                })

                                await handleResponse(response)
                            })
                        })
                    })
                }
            })
        })
    }
    //endregion

    //region Handle Update dan Delete
    if (dataTables) {
        dataTables.forEach((item) => {
            const btnEdit = item.querySelector('.btnEdit')
            const dataItems = item.getAttribute('data-items')
            const {id, customer_id, customer_lokasi_id, nama_site} = JSON.parse(dataItems)

            if (btnEdit) {
                $(btnEdit).off('click').on('click', function () {
                    showModalDialog(modalForm, '<i class="fas fa-edit mr-2"></i> Update WMP', async () => {
                        const customerLokasiModel = new DataCustomerLokasiModel(customerId, customerLokasiId)

                        siteId.value = id
                        customerId.value = customer_id
                        customerId.dispatchEvent(new Event('exbox.change'))
                        await customerLokasiModel.setSelectedAndUpdate(customer_lokasi_id)
                        namaSite.value = nama_site

                        if (btnSimpan) {
                            btnSimpan.addEventListener('click', function () {
                                confirmAlert({
                                    title: 'Konfirmasi',
                                    html: 'Apakah anda akan mengubah data WMP?',
                                    confirmButtonText: 'Ya, Simpan',
                                    showDenyButton: true,
                                    denyButtonText: 'Tidak'
                                }, async () => {
                                    await waitLoader('Mohon Tunggu...', 'Menyimpan Perubahan data WMP', async () => {
                                        const response = await fetch(`${url.pathname}/update`, {
                                            method: 'POST',
                                            headers: {
                                                'Content-Type': 'application/json',
                                                'X-CSRF-TOKEN': csrfToken
                                            },
                                            body: JSON.stringify({
                                                site_id: siteId.value,
                                                customer_id: customerId.value,
                                                customer_lokasi_id: customerLokasiId.value,
                                                nama_site: namaSite.value,
                                            })
                                        })

                                        await handleResponse(response)
                                    })
                                })
                            })
                        }

                        showHiddenElmAndText(btnHapus)
                        if (btnHapus) {
                            btnHapus.addEventListener('click', function () {
                                confirmAlert({
                                    title: 'Konfirmasi',
                                    html: 'Apakah anda akan menghapus data WMP ini?',
                                    confirmButtonText: 'Ya, Hapus',
                                    showDenyButton: true,
                                    denyButtonText: 'Tidak'
                                }, async () => {
                                    await waitLoader('Mohon Tunggu...', 'Menghapus data WMP', async () => {
                                        const response = await fetch(`${url.pathname}/delete`, {
                                            method: 'DELETE',
                                            headers: {
                                                'Content-Type': 'application/json',
                                                'X-CSRF-TOKEN': csrfToken
                                            },
                                            body: JSON.stringify({
                                                site_id: siteId.value,
                                            })
                                        })

                                        await handleResponse(response)
                                    })
                                })
                            })
                        }
                    })
                })
            }

        })
    }
    //endregion

    //region Handle Response
    const handleResponse = async (response: Response) => {
        const {status} = response
        const {message, errorValidation} = await response.json()
        if (status === 200) {
            closeModalDialog(modalForm)
            successAlert({
                title: 'Berhasil',
                html: message,
                confirmButtonText: 'Tutup'
            }, () => {
                window.location.reload()
            })
        } else {
            if (errorValidation) {
                failureAlert({
                    title: 'Oppss!',
                    html: 'Data yang diperlukan belum lengkap'
                })

                const {
                    customer_id,
                    customer_lokasi_id,
                    nama_site,
                } = errorValidation

                responseMessages(customerIdError, customer_id)
                responseMessages(customerLokasiIdError, customer_lokasi_id)
                responseMessages(namaSiteError, nama_site)

            } else {
                failureAlert({
                    title: 'Oppss!',
                    html: message
                })
            }
        }
    }
    //endregion

})
