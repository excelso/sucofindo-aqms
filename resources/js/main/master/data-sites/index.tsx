import {closeModalDialog, showModalDialog} from "@/js/plugins/modal";
import {getMetaContent, responseMessages} from "@/js/plugins/functions";
import {confirmAlert, failureAlert, successAlert, waitLoader} from "@/js/plugins/sweet-alert";

document.addEventListener('DOMContentLoaded', function () {
    const csrfToken = getMetaContent('csrf-token')

    const closeModalForm: NodeListOf<HTMLElement> = document.querySelectorAll('.closeModalForm')
    const btnCreate = document.querySelector('.btnCreate')
    const modalForm = document.querySelector('.modalForm')
    const companyId: HTMLSelectElement = modalForm.querySelector('.companyId')
    const siteName: HTMLInputElement = modalForm.querySelector('.siteName')
    const siteNameError: HTMLElement = modalForm.querySelector('.siteNameError')
    const btnSave: HTMLElement = modalForm.querySelector('.btnSave')

    //region Handle Close Modal
    closeModalForm.forEach((elm: Element) => {
        elm.addEventListener('click', function () {
            if (modalForm) {
                closeModalDialog(modalForm, () => {
                    siteName.value = ''
                    responseMessages(siteNameError, null)
                })
            }
        })
    })
    //endregion

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
                                const response = await fetch('/master/sites/store', {
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
