import {closeModalDialog, showModalDialog} from "@/js/plugins/modal";
import {getMetaContent, responseMessages} from "@/js/plugins/functions";
import {confirmAlert, failureAlert, successAlert, waitLoader} from "@/js/plugins/sweet-alert";
import DataSitesModel from "@/js/main/master/data-sites/model/DataSitesModel";
import Swal from "sweetalert2";

document.addEventListener('DOMContentLoaded', function () {
    const csrfToken = getMetaContent('csrf-token')

    const closeModalForm: NodeListOf<HTMLElement> = document.querySelectorAll('.closeModalForm')
    const dataTables: NodeListOf<HTMLElement> = document.querySelectorAll('.data-tables')
    const btnCreate = document.querySelector('.btnCreate')
    const modalForm = document.querySelector('.modalForm')
    const companyId: HTMLSelectElement = modalForm.querySelector('.companyId')
    const companySiteId: HTMLSelectElement = modalForm.querySelector('.companySiteId')
    const companySiteIdError: HTMLElement = modalForm.querySelector('.companySiteIdError')
    const uidOld: HTMLInputElement = modalForm.querySelector('.uidOld')
    const uid: HTMLInputElement = modalForm.querySelector('.uid')
    const uidError: HTMLElement = modalForm.querySelector('.uidError')
    const cctvLink: HTMLInputElement = modalForm.querySelector('.cctvLink')
    const cctvLinkError: HTMLElement = modalForm.querySelector('.cctvLinkError')
    const btnSave: HTMLElement = modalForm.querySelector('.btnSave')

    //region Handle Close Modal
    closeModalForm.forEach((elm: Element) => {
        elm.addEventListener('click', function () {
            if (modalForm) {
                closeModalDialog(modalForm, () => {

                })
            }
        })
    })
    //endregion

    const modelSite = new DataSitesModel(companyId, companySiteId, {
        csrfToken
    })

    //region Handle Store
    if (btnCreate) {
        btnCreate.addEventListener('click', function () {
            showModalDialog(modalForm, `<i class="fas fa-plus-circle mr-2"></i> New Platform`, function () {

                if (btnSave) {
                    btnSave.addEventListener('click', function () {
                        confirmAlert({
                            title: 'Confirm',
                            html: 'Are you sure want to create new Platform?',
                            confirmButtonText: 'Save',
                            showDenyButton: true,
                            denyButtonText: 'No'
                        }, async () => {
                            await waitLoader('Please wait...', 'Process of storing new Platform data.', async () => {
                                const response = await fetch('/master/platform-loggers/store', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'X-CSRF-TOKEN': csrfToken
                                    },
                                    body: JSON.stringify({
                                        company_site_id: companySiteId.value,
                                        uid: uid.value,
                                        cctv_link: cctvLink.value,
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
        dataTables.forEach((elm) => {
            const platformId = elm.getAttribute('data-id')
            const btnEdit = elm.querySelector('.btnEdit')

            if (btnEdit) {
                btnEdit.addEventListener('click', async function () {
                    await waitLoader('Please wait...', 'Process of storing new Platform data.', async () => {
                        const response = await fetch(`/master/platform-loggers/detail/${platformId}`, {
                            method: 'GET',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-CSRF-TOKEN': csrfToken
                            }
                        })

                        const {status} = response
                        const {message, data} = await response.json()
                        Swal.close()

                        if (status === 200) {
                            const {company_site_id, uid: data_uid, cctv_link} = data
                            showModalDialog(modalForm, `<i class="fas fa-edit mr-2"></i> Update Platform`, () => {
                                modelSite.setSelectedValue(company_site_id)
                                uidOld.value = data_uid
                                uid.value = data_uid
                                cctvLink.value = cctv_link

                                if (btnSave) {
                                    btnSave.addEventListener('click', function () {
                                        confirmAlert({
                                            title: 'Confirm',
                                            html: 'Are you sure want to update data Platform?',
                                            confirmButtonText: 'Save',
                                            showDenyButton: true,
                                            denyButtonText: 'No'
                                        }, async () => {
                                            await waitLoader('Please wait...', 'Process of updating Platform data.', async () => {
                                                const response = await fetch(`/master/platform-loggers/update/${platformId}`, {
                                                    method: 'PUT',
                                                    headers: {
                                                        'Content-Type': 'application/json',
                                                        'X-CSRF-TOKEN': csrfToken
                                                    },
                                                    body: JSON.stringify({
                                                        company_site_id: companySiteId.value,
                                                        uid_old: uidOld.value,
                                                        uid: uid.value,
                                                        cctv_link: cctvLink.value,
                                                    })
                                                })

                                                await handleResponse(response)
                                            })
                                        })
                                    })
                                }
                            })
                        } else {
                            failureAlert({
                                html: message
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
                    html: 'The required data is incomplete.'
                })

                const {
                    company_site_id,
                    uid,
                    cctv_link
                } = errorValidation

                responseMessages(companySiteIdError, company_site_id)
                responseMessages(uidError, uid)
                responseMessages(cctvLinkError, cctv_link)

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
