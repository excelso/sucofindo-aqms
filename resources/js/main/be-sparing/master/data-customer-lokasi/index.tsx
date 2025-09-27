import {getMetaContent, responseMessages, showHiddenElmAndText} from "@/js/plugins/functions";
import {closeModalDialog, showModalDialog} from "@/js/plugins/modal";
import {confirmAlert, failureAlert, successAlert, waitLoader} from "@/js/plugins/sweet-alert";

document.addEventListener('DOMContentLoaded', function () {

    //region Init Component
    const csrfToken = getMetaContent('csrf-token')
    const url = new URL(window.location.href)
    const win: Window = window

    const dataTables: NodeListOf<Element> = document.querySelectorAll('.data-tables')
    const closeModalForm: NodeListOf<Element> = document.querySelectorAll('.closeModalForm')

    const btnTambah: Element = document.querySelector('.btnTambah')
    const modalForm: Element = document.querySelector('.modalForm')
    const customerId: HTMLSelectElement = modalForm.querySelector('.customerId')
    const customerIdError: Element = modalForm.querySelector('.customerIdError')
    const lokasiId: HTMLInputElement = modalForm.querySelector('.lokasiId')
    const namaLokasi: HTMLInputElement = modalForm.querySelector('.namaLokasi')
    const namaLokasiError: Element = modalForm.querySelector('.namaLokasiError')
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
                    customerId.value = ''
                    customerId.dispatchEvent(new Event('exbox.change'))
                    responseMessages(customerIdError, null)

                    lokasiId.value = ''
                    namaLokasi.value = ''
                    responseMessages(namaLokasiError, null)
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
                const btnResetPencarian = document.querySelector<HTMLElement>('.btnResetPencarian')

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
            showModalDialog(modalForm, '<i class="fas fa-plus-circle mr-2"></i> Tambah Site / Lokasi', () => {
                if (btnSimpan) {
                    btnSimpan.addEventListener('click', function () {
                        confirmAlert({
                            title: 'Konfirmasi',
                            html: 'Apakah anda akan membuat data Site / Lokasi baru?',
                            confirmButtonText: 'Ya, Simpan',
                            showDenyButton: true,
                            denyButtonText: 'Tidak'
                        }, async () => {
                            await waitLoader('Mohon Tunggu...', 'Menyimpan data Site / Lokasi baru', async () => {
                                const response = await fetch(`${url.pathname}/store`, {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'X-CSRF-TOKEN': csrfToken
                                    },
                                    body: JSON.stringify({
                                        customer_id: customerId.value,
                                        nama_lokasi: namaLokasi.value,
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
            const {id, customer_id, nama_lokasi} = JSON.parse(dataItems)

            if (btnEdit) {
                $(btnEdit).off('click').on('click', function () {
                    showModalDialog(modalForm, '<i class="fas fa-edit mr-2"></i> Update Site / Lokasi', () => {
                        lokasiId.value = id
                        customerId.value = customer_id
                        customerId.dispatchEvent(new Event('exbox.change'))
                        namaLokasi.value = nama_lokasi

                        if (btnSimpan) {
                            btnSimpan.addEventListener('click', function () {
                                confirmAlert({
                                    title: 'Konfirmasi',
                                    html: 'Apakah anda akan mengubah data Site / Lokasi?',
                                    confirmButtonText: 'Ya, Simpan',
                                    showDenyButton: true,
                                    denyButtonText: 'Tidak'
                                }, async () => {
                                    await waitLoader('Mohon Tunggu...', 'Menyimpan Perubahan data Site / Lokasi', async () => {
                                        const response = await fetch(`${url.pathname}/update`, {
                                            method: 'POST',
                                            headers: {
                                                'Content-Type': 'application/json',
                                                'X-CSRF-TOKEN': csrfToken
                                            },
                                            body: JSON.stringify({
                                                lokasi_id: lokasiId.value,
                                                customer_id: customerId.value,
                                                nama_lokasi: namaLokasi.value,
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
                                    html: 'Apakah anda akan menghapus data Site / Lokasi ini?',
                                    confirmButtonText: 'Ya, Hapus',
                                    showDenyButton: true,
                                    denyButtonText: 'Tidak'
                                }, async () => {
                                    await waitLoader('Mohon Tunggu...', 'Menghapus data Site / Lokasi', async () => {
                                        const response = await fetch(`${url.pathname}/delete`, {
                                            method: 'DELETE',
                                            headers: {
                                                'Content-Type': 'application/json',
                                                'X-CSRF-TOKEN': csrfToken
                                            },
                                            body: JSON.stringify({
                                                lokasi_id: lokasiId.value,
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
                    nama_lokasi,
                } = errorValidation

                responseMessages(customerIdError, customer_id)
                responseMessages(namaLokasiError, nama_lokasi)

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
