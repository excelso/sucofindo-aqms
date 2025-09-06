import {getMetaContent, responseMessages, showHiddenElmAndText} from "@/js/plugins/functions";
import {closeModalDialog, showModalDialog} from "@/js/plugins/modal";
import DataSitesModel from "@/js/main/master/data-sites/model/DataSitesModel";
import DataSitesLocationModel from "@/js/main/master/data-sites-location/model/DataSitesLocationModel";
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
    const companySiteId: HTMLSelectElement = modalForm.querySelector('.companySiteId')
    const companySiteIdError: HTMLElement = modalForm.querySelector('.companySiteIdError')
    const locationName: HTMLInputElement = modalForm.querySelector('.locationName')
    const locationNameError: HTMLElement = modalForm.querySelector('.locationNameError')
    const btnSave: HTMLElement = modalForm.querySelector('.btnSave')
    const btnDelete: HTMLElement = modalForm.querySelector('.btnDelete')

    const modelSite = new DataSitesModel(companyId, companySiteId, {
        csrfToken
    });

    //region Handle Close Modal
    closeModalForm.forEach((elm: Element) => {
        elm.addEventListener('click', function () {
            if (modalForm) {
                closeModalDialog(modalForm, () => {
                    modelSite.setSelectedValue('')

                    locationName.value = ''
                    responseMessages(locationNameError, null)
                })
            }
        })
    })
    //endregion

    //region Handle Create
    if (btnCreate) {
        btnCreate.addEventListener('click', function () {
            showModalDialog(modalForm, `<i class="fas fa-plus-circle mr-2"></i> New Location`, function () {
                if (btnSave) {
                    btnSave.addEventListener('click', function () {
                        confirmAlert({
                            title: 'Confirm',
                            html: 'Are you sure want to create new Location?',
                            confirmButtonText: 'Save',
                            showDenyButton: true,
                            denyButtonText: 'No'
                        }, async () => {
                            await waitLoader('Please wait...', 'Process of storing new Location data.', async () => {
                                const response = await fetch(`${url.pathname}/store`, {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'X-CSRF-TOKEN': csrfToken
                                    },
                                    body: JSON.stringify({
                                        company_id: companyId.value,
                                        company_site_id: companySiteId.value,
                                        location_name: locationName.value,
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
        showModalDialog(modalForm, `<i class="fas fa-edit mr-2"></i> Update Location`, async function () {
            btnSave.innerHTML = `<i class="fas fa-save mr-1"></i> Save Change`

            //region Handle Get Detail Data Site
            await waitLoader(`Please wait ...`, `Getting Location data`, async () => {
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
                        company_site_id,
                        location_name,
                        sites,
                    } = data

                    const {
                        company_id
                    } = sites

                    companyId.value = company_id
                    companyId.dispatchEvent(new Event('exbox.change'))
                    modelSite.setSelectedValue(company_site_id)
                    locationName.value = location_name

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
                        html: 'Are you sure want to update data Location?',
                        confirmButtonText: `<i class="fas fa-save mr-1"></i> Save Change`,
                        showDenyButton: true,
                        denyButtonText: 'Cancel'
                    }, async () => {
                        await waitLoader('Please Wait ...', 'Update data Location', async () => {

                            const response = await fetch(`${url.pathname}/update/${siteId}`, {
                                method: 'PUT',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'X-CSRF-TOKEN': csrfToken
                                },
                                body: JSON.stringify({
                                    company_id: companyId.value,
                                    company_site_id: companySiteId.value,
                                    location_name: locationName.value,
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
                    html: `Are you sure want to Delete data Location?`,
                    confirmButtonText: `<i class="fas fa-trash mr-1"></i> Delete`,
                    showDenyButton: true,
                    denyButtonText: `Cancel`,
                }, async () => {
                    await waitLoader(`Please wait ...`, `Delete data Location`, async () => {
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
                    company_site_id,
                    location_name,
                } = errorValidation

                responseMessages(companySiteIdError, company_site_id)
                responseMessages(locationNameError, location_name)

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
