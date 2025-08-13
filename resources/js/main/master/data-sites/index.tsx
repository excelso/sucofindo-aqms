import {closeModalDialog, showModalDialog} from "@/js/plugins/modal";
import {getMetaContent, responseMessages, showHiddenElmAndText} from "@/js/plugins/functions";
import {confirmAlert, failureAlert, successAlert, waitLoader} from "@/js/plugins/sweet-alert";
import Swal from "sweetalert2";

document.addEventListener('DOMContentLoaded', function () {
    const csrfToken = getMetaContent('csrf-token')
    const url = new URL(window.location.href)
    const win: Window = window

    const closeModalForm: NodeListOf<HTMLElement> = document.querySelectorAll('.closeModalForm')
    const dataTables: NodeListOf<HTMLElement> = document.querySelectorAll('.data-tables')
    const btnCreate = document.querySelector('.btnCreate')
    const modalForm = document.querySelector('.modalForm')
    const companyId: HTMLSelectElement = modalForm.querySelector('.companyId')
    const siteName: HTMLInputElement = modalForm.querySelector('.siteName')
    const siteNameError: HTMLElement = modalForm.querySelector('.siteNameError')
    const btnSave: HTMLElement = modalForm.querySelector('.btnSave')
    const btnDelete: HTMLElement = modalForm.querySelector('.btnDelete')

    const btnSearch = document.querySelector('.btnSearch')
    const modalPencarian = document.querySelector('.modalPencarian')

    //region Handle Close Modal
    closeModalForm.forEach((elm: Element) => {
        elm.addEventListener('click', function () {
            if (modalForm) {
                closeModalDialog(modalForm, () => {
                    siteName.value = ''
                    responseMessages(siteNameError, null)
                })
            }

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
                const btnCari = document.querySelector<HTMLElement>('.btnCari')
                const btnResetPencarian = document.querySelector<HTMLElement>('.btnResetPencarian')

                btnResetPencarian.addEventListener('click', function () {
                    win.location = `${url.pathname}`
                })

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
                    win.location = `${url.pathname}?${text_result.join('&')}`
                })
            })
        })
    }
    //endregion

    //region Handle Create
    if (btnCreate) {
        btnCreate.addEventListener('click', function () {
            showModalDialog(modalForm, `<i class="fas fa-plus-circle mr-2"></i> New Site`, function () {
                if (btnSave) {
                    btnSave.addEventListener('click', function () {
                        confirmAlert({
                            title: 'Confirm',
                            html: 'Are you sure want to create new Site?',
                            confirmButtonText: 'Save',
                            showDenyButton: true,
                            denyButtonText: 'No'
                        }, async () => {
                            await waitLoader('Please wait...', 'Process of storing new Site data.', async () => {
                                const response = await fetch(`${url.pathname}/store`, {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'X-CSRF-TOKEN': csrfToken
                                    },
                                    body: JSON.stringify({
                                        company_id: companyId.value,
                                        site_name: siteName.value,
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

    //region Handle Update & Delete
    if (dataTables) {
        dataTables.forEach((elm: Element) => {
            const btnEdit = elm.querySelector('.btnEdit')
            const siteId = elm.getAttribute('data-id')
            btnEdit.removeEventListener('click', (btnEdit as any).clickHandler)
            const clickHandler = function (this: HTMLElement) {
                handleData(siteId)
            }
            btnEdit.addEventListener('click', clickHandler)
        });
    }

    function handleData(siteId: string) {
        showModalDialog(modalForm, `<i class="fas fa-edit mr-2"></i> Update Site`, async function () {
            btnSave.innerHTML = `<i class="fas fa-save mr-1"></i> Save Change`

            //region Handle Get Detail Data Site
            await waitLoader(`Please wait ...`, `Getting Site data`, async () => {
                const response = await fetch(`${url.pathname}/detail/${siteId}`, {
                    method: 'GET',
                    headers: {
                        'X-CSRF-TOKEN': csrfToken,
                        'Content-Type': 'application/json',
                    },
                })

                const {status} = response
                const {message, data} = await response.json()

                if (status === 200) {
                    Swal.close()
                    const {
                        company_id,
                        site_name
                    } = data

                    companyId.value = company_id
                    companyId.dispatchEvent(new Event('exbox.change'))
                    siteName.value = site_name

                } else {
                    failureAlert({
                        html: message
                    })
                }
            })
            //endregion

            //region Handle Update
            if (btnSave) {
                btnSave.addEventListener('click', function () {
                    confirmAlert({
                        title: 'Confirm',
                        html: 'Are you sure want to update data Site?',
                        confirmButtonText: `<i class="fas fa-save mr-1"></i> Save Change`,
                        showDenyButton: true,
                        denyButtonText: 'Cancel'
                    }, async () => {
                        await waitLoader('Please Wait ...', 'Update data Site', async () => {

                            const response = await fetch(`${url.pathname}/update/${siteId}`, {
                                method: 'PUT',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'X-CSRF-TOKEN': csrfToken
                                },
                                body: JSON.stringify({
                                    company_id: companyId.value,
                                    site_name: siteName.value,
                                })
                            })

                            await handleResponse(response)

                        })
                    })
                })
            }
            //endregion

            //region Handle Delete
            showHiddenElmAndText(btnDelete)
            btnDelete.addEventListener('click', function () {
                confirmAlert({
                    title: `Confirmation`,
                    html: `Are you sure want to Delete data Site?`,
                    confirmButtonText: `<i class="fas fa-trash mr-1"></i> Delete`,
                    showDenyButton: true,
                    denyButtonText: `Cancel`,
                }, async () => {
                    await waitLoader(`Please wait ...`, `Delete data Site`, async () => {
                        const response = await fetch(`${url.pathname}/delete/${siteId}`, {
                            method: 'DELETE',
                            headers: {
                                'X-CSRF-TOKEN': csrfToken,
                                'Content-Type': 'application/json',
                            },
                        })

                        await handleResponse(response)
                    })
                })
            })
            //endregion

        });
    }
    //endregion

    //region Handle Response
    const handleResponse = async (response: Response) => {
        const {status} = response
        const {message, errorValidation} = await response.json()
        if (status === 200) {
            closeModalDialog(modalForm)
            successAlert({
                title: 'Success',
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
                    site_name,
                } = errorValidation

                responseMessages(siteNameError, site_name)

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
