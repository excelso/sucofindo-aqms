import {closeModalDialog, showModalDialog} from "@/js/plugins/modal";
import {getMetaContent, hide, responseMessages, show} from "@/js/plugins/functions";
import {confirmAlert, failureAlert, successAlert, waitLoader} from "@/js/plugins/sweet-alert";
import {TabItem, Tabs} from "flowbite";
import {SiteMonitorHandler} from "@/js/main/master/data-users/SiteMonitorHandler";
import Swal from "sweetalert2";
import {ExBox} from "@/js/experiment/ex-box";

document.addEventListener('DOMContentLoaded', function () {
    const csrfToken = getMetaContent('csrf-token')
    const url = new URL(window.location.href)
    const win: Window = window

    const closeModalForm: NodeListOf<HTMLElement> = document.querySelectorAll('.closeModalForm')
    const dataTables: NodeListOf<HTMLElement> = document.querySelectorAll('.data-tables')
    const btnCreate = document.querySelector('.btnCreate')
    const modalForm = document.querySelector('.modalForm')
    const companyId: HTMLSelectElement = modalForm.querySelector('.companyId')
    const tipeUser: HTMLSelectElement = modalForm.querySelector('.tipeUser')
    const formSSO: HTMLInputElement = modalForm.querySelector('.formSSO')
    const btnLookupSid: HTMLInputElement = modalForm.querySelector('.btnLookupSid')
    const sidCode: HTMLInputElement = modalForm.querySelector('.sidCode')
    const sidCodeError: HTMLElement = modalForm.querySelector('.sidCodeError')
    const userId: HTMLInputElement = modalForm.querySelector('.userId')
    const namaLengkap: HTMLInputElement = modalForm.querySelector('.namaLengkap')
    const namaLengkapError: Element = modalForm.querySelector('.namaLengkapError')
    const emailUserOld: HTMLInputElement = modalForm.querySelector('.emailUserOld')
    const emailUser: HTMLInputElement = modalForm.querySelector('.emailUser')
    const emailUserError: Element = modalForm.querySelector('.emailUserError')
    const roleId: HTMLSelectElement = modalForm.querySelector('.roleId')
    const roleIdError: Element = modalForm.querySelector('.roleIdError')
    const formNonSSO: HTMLElement = modalForm.querySelector('.formNonSSO')
    const btnLookPassword = modalForm.querySelector('.btnLookPassword')
    const passwordUser: HTMLInputElement = modalForm.querySelector('.passwordUser')
    const passwordUserError = modalForm.querySelector('.passwordUserError')
    const btnLookRePassword = modalForm.querySelector('.btnLookRePassword')
    const rePasswordUser: HTMLInputElement = modalForm.querySelector('.rePasswordUser')
    const rePasswordUserError = modalForm.querySelector('.rePasswordUserError')
    const statusUser: HTMLSelectElement = modalForm.querySelector('.statusUser')
    const btnSave: HTMLElement = modalForm.querySelector('.btnSave')
    const btnDelete: HTMLElement = modalForm.querySelector('.btnDelete')
    const siteMonitor: HTMLElement = modalForm.querySelector('#site-monitor')

    const siteMonitorHandler = new SiteMonitorHandler(siteMonitor)
    const exTipeUser = new ExBox(tipeUser)
    const exRoleId = new ExBox(roleId)
    const exStatusUser = new ExBox(statusUser)

    //region Handle Tabs
    let tab: Tabs | null = null
    function initializeTabs() {
        try {
            const roleExTabs: HTMLElement = document.querySelector('[data-role="exTabs"]')

            if (!roleExTabs) {
                console.warn('Tab container [data-role="exTabs"] not found')
                return null
            }

            const roleExTabsChilds = roleExTabs.querySelectorAll('li')

            if (roleExTabsChilds.length === 0) {
                console.warn('No tab items found in container')
                return null
            }

            const tabsElms: TabItem[] = []

            roleExTabsChilds.forEach((elm) => {
                const triggerLinks = elm.querySelectorAll('[data-tabs-target]')
                triggerLinks.forEach((elmTrigger: HTMLElement) => {
                    const elmTarget = elmTrigger.getAttribute('data-tabs-target')
                    const targetElement = elmTarget ? document.querySelector(elmTarget) : null

                    if (elmTarget && targetElement) {
                        tabsElms.push({
                            id: elmTarget,
                            triggerEl: elmTrigger,
                            targetEl: targetElement
                        } as TabItem)
                    }
                })
            })

            if (tabsElms.length === 0) {
                console.warn('No valid tab elements found')
                return null
            }

            const options = {
                defaultTabId: '#user',
                activeClasses: 'border-b-2 border-blue-700 text-blue-700',
                inactiveClasses: 'hover:text-gray-900 hover:bg-gray-100 text-gray-400',
                onShow: (x: any) => {
                    const {id} = x._activeTab
                }
            }

            return new Tabs(roleExTabs, tabsElms, options)

        } catch (error) {
            console.error('Error initializing tabs:', error)
            return null
        }
    }

    tab = initializeTabs()
    function showTab(tabId: string) {
        if (tab) {
            tab.show(tabId)
        } else {
            console.warn('Tabs not initialized')
        }
    }
    //endregion

    //region Handle Close Modal
    closeModalForm.forEach((elm: Element) => {
        elm.addEventListener('click', function () {
            if (modalForm) {
                closeModalDialog(modalForm, () => {
                    exTipeUser.setSelected('1')
                    sidCode.value = ''
                    responseMessages(sidCodeError, null)

                    exRoleId.setSelected('')
                    exStatusUser.setSelected('Active')

                    siteMonitorHandler.clearAllSelections()
                    showTab('#user')

                    hide(btnDelete)
                })
            }
        })
    })
    //endregion

    //region Handle SID Code
    async function handleSIDCode() {
        await waitLoader('Mohon Tunggu...', 'Mengambil data User', async () => {
            const response = await fetch(`${url}/get-user-sso?sid_code=${sidCode.value}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken
                },
            })

            const {status} = response
            const {message, data, errorValidation} = await response.json()
            if (status === 200) {
                Swal.close()
                if (data) {
                    const {name} = data
                    namaLengkap.value = name
                } else {
                    failureAlert({
                        title: 'Oppss!',
                        html: 'Data User SSO Tidak Ditemukan!'
                    })
                }
            } else {
                if (errorValidation) {
                    Swal.close()
                    const {sid_code} = errorValidation
                    responseMessages(sidCodeError, sid_code)
                } else {
                    failureAlert({
                        title: 'Oppss!',
                        html: message
                    })
                }
            }
        })
    }

    //endregion

    //region Handle User Type
    if (tipeUser) {
        tipeUser.addEventListener('change', function (evt: Event) {
            const target = evt.target as HTMLSelectElement
            if (target.value === '2') {
                hide(formSSO)
                show(formNonSSO)
            } else {
                show(formSSO)
                hide(formNonSSO)
            }
        })
    }
    //endregion

    //region Handle Hide/Show Password
    if (btnLookPassword) {
        btnLookPassword.addEventListener('click', function () {
            let currentType = passwordUser.getAttribute('type') === 'password' ? 'text' : 'password'
            let currentTypeIcon = passwordUser.getAttribute('type') === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash'
            passwordUser.setAttribute('type', currentType)
            btnLookPassword.innerHTML = `<i class="${currentTypeIcon}"></i>`
        })
    }

    if (btnLookRePassword) {
        btnLookRePassword.addEventListener('click', function () {
            let currentType = rePasswordUser.getAttribute('type') === 'password' ? 'text' : 'password'
            let currentTypeIcon = rePasswordUser.getAttribute('type') === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash'
            rePasswordUser.setAttribute('type', currentType)
            btnLookRePassword.innerHTML = `<i class="${currentTypeIcon}"></i>`
        })
    }
    //endregion

    //region Handle Lookup SID
    if (btnLookupSid) {
        btnLookupSid.addEventListener('click', async function () {
            responseMessages(sidCodeError, null)
            await handleSIDCode()
        })
    }
    //endregion

    //region Handle Store
    if (btnCreate) {
        btnCreate.addEventListener('click', function () {
            showModalDialog(modalForm, `<i class="fas fa-user-plus mr-2"></i> New User`, function () {
                if (btnSave) {
                    btnSave.addEventListener('click', function () {
                        const selectedData = siteMonitorHandler.getAllSelectedData()
                        const sitePermissionDatas = []
                        selectedData.typeLoggers.forEach((item) => {
                            sitePermissionDatas.push({
                                platform_id: item.platformId,
                                type_logger: item.type,
                                is_active: 1
                            })
                        })

                        confirmAlert({
                            title: 'Confirm',
                            html: 'Are you sure want to create new User?',
                            confirmButtonText: '<i class="fas fa-save mr-2"></i> Save',
                            showDenyButton: true,
                            denyButtonText: 'No'
                        }, async () => {
                            await waitLoader('Please wait...', 'Process of storing new User data.', async () => {
                                const response = await fetch(`${url}/store`, {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'X-CSRF-TOKEN': csrfToken
                                    },
                                    body: JSON.stringify({
                                        company_id: companyId.value,
                                        tipe_user: tipeUser.value,
                                        sid_code: sidCode.value,
                                        nama_lengkap: namaLengkap.value,
                                        email: emailUser.value,
                                        password: passwordUser.value,
                                        re_password: rePasswordUser.value,
                                        role_id: roleId.value,
                                        status_user: statusUser.value,
                                        site_permission: sitePermissionDatas
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
            const userId = elm.getAttribute('data-id')
            const btnEdit = elm.querySelector('.btnEdit')

            if (btnEdit) {
                btnEdit.addEventListener('click', async function () {
                    await waitLoader('Please wait...', 'Loading User data', async () => {
                        const response = await fetch(`${url}/detail/${userId}`, {
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
                            const {
                                tipe_user,
                                sid_code,
                                nama_lengkap,
                                email,
                                user_level,
                                status_user,
                                user_platforms
                            } = data

                            showModalDialog(modalForm, `<i class="fas fa-user-edit mr-2"></i> Update User`, () => {

                                //region Handle Fill Forms
                                exTipeUser.setSelected(tipe_user)
                                if (tipe_user === 2) {
                                    hide(formSSO)
                                    show(formNonSSO)
                                } else {
                                    show(formSSO)
                                    sidCode.value = sid_code

                                    hide(formNonSSO)
                                }

                                namaLengkap.value = nama_lengkap
                                emailUser.value = email
                                emailUserOld.value = email
                                exRoleId.setSelected(user_level)
                                exStatusUser.setSelected(status_user)
                                siteMonitorHandler.setPermissions(user_platforms)
                                //endregion

                                //region Handle Save Update
                                if (btnSave) {
                                    btnSave.addEventListener('click', function () {
                                        const selectedData = siteMonitorHandler.getAllSelectedData()
                                        const sitePermissionDatas = []
                                        selectedData.typeLoggers.forEach((item) => {
                                            sitePermissionDatas.push({
                                                platform_id: item.platformId,
                                                type_logger: item.type,
                                                is_active: 1
                                            })
                                        })

                                        confirmAlert({
                                            title: 'Confirm',
                                            html: 'Are you sure want to update User data?',
                                            confirmButtonText: '<i class="fas fa-save mr-2"></i> Save',
                                            showDenyButton: true,
                                            denyButtonText: 'No'
                                        }, async () => {
                                            await waitLoader('Please wait...', 'Process updating of User data.', async () => {
                                                const response = await fetch(`${url}/update/${userId}`, {
                                                    method: 'PUT',
                                                    headers: {
                                                        'Content-Type': 'application/json',
                                                        'X-CSRF-TOKEN': csrfToken
                                                    },
                                                    body: JSON.stringify({
                                                        company_id: companyId.value,
                                                        tipe_user: tipeUser.value,
                                                        sid_code: sidCode.value,
                                                        nama_lengkap: namaLengkap.value,
                                                        email: emailUser.value,
                                                        email_old: emailUserOld.value,
                                                        password: passwordUser.value,
                                                        re_password: rePasswordUser.value,
                                                        role_id: roleId.value,
                                                        status_user: statusUser.value,
                                                        site_permission: sitePermissionDatas
                                                    })
                                                })

                                                await handleResponse(response)
                                            })
                                        })
                                    })
                                }
                                //endregion

                                //region Handle Delete
                                show(btnDelete)
                                if (btnDelete) {
                                    btnDelete.addEventListener('click', function () {
                                        confirmAlert({
                                            title: 'Confirm',
                                            html: 'Are you sure want to delete User data?',
                                            confirmButtonText: '<i class="fas fa-trash-can mr-2"></i> Delete',
                                            showDenyButton: true,
                                            denyButtonText: 'No'
                                        }, async () => {
                                            await waitLoader('Please wait...', 'Process deleting of User data.', async () => {
                                                const response = await fetch(`${url}/delete/${userId}`, {
                                                    method: 'DELETE',
                                                    headers: {
                                                        'Content-Type': 'application/json',
                                                        'X-CSRF-TOKEN': csrfToken
                                                    }
                                                })

                                                await handleResponse(response)
                                            })
                                        })
                                    })
                                }
                                //endregion

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
                    html: 'Data yang diperlukan belum lengkap'
                })

                const {
                    nama_lengkap,
                    email,
                    password,
                    re_password,
                    role_id
                } = errorValidation

                responseMessages(namaLengkapError, nama_lengkap)
                responseMessages(emailUserError, email)
                responseMessages(passwordUserError, password)
                responseMessages(rePasswordUserError, re_password)
                responseMessages(roleIdError, role_id)

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
