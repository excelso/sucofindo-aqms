import {closeModalDialog, showModalDialog} from "@/js/plugins/modal";
import {getMetaContent, hide, responseMessages, show} from "@/js/plugins/functions";
import {confirmAlert, failureAlert, successAlert, waitLoader} from "@/js/plugins/sweet-alert";
import {TabItem, Tabs} from "flowbite";
import {SiteMonitorHandler} from "@/js/main/be-enviro/users/SiteMonitorHandler";
import Swal from "sweetalert2";
import {ExBox} from "@/js/experiment/ex-box";

document.addEventListener('DOMContentLoaded', function () {
    const csrfToken = getMetaContent('csrf-token')
    const url = new URL(window.location.href)
    const win: Window = window

    type CheckboxElement = HTMLInputElement & {
        indeterminate: boolean
    }

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

    const siteMonitorSparing: HTMLElement = modalForm.querySelector('#site-monitor-sparing')
    const searchInput: HTMLInputElement = siteMonitorSparing.querySelector('.searchInput')
    const checkAll: HTMLInputElement = siteMonitorSparing.querySelector('.checkAll')
    const checkCustomers = Array.from(siteMonitorSparing.querySelectorAll('.checkCustomer')).filter(isCheckbox)
    const checkSites = Array.from(siteMonitorSparing.querySelectorAll('.checkSite')).filter(isCheckbox)
    const typeLoggers = Array.from(siteMonitorSparing.querySelectorAll('.typeLoggerIn, .typeLoggerRe')).filter(isCheckbox)

    const btnPencarian: Element = document.querySelector('.btnPencarian')
    const modalPencarian: HTMLInputElement = document.querySelector('.modalPencarian')

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
                        $(btnCari).trigger('click')
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

    //region Handle SID Code
    async function handleSIDCode() {
        await waitLoader('Mohon Tunggu...', 'Mengambil data User', async () => {
            const response = await fetch(`${url.pathname}/get-user-sso?sid_code=${sidCode.value}`, {
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
                                const response = await fetch(`${url.pathname}/store`, {
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
                        const response = await fetch(`${url.pathname}/detail/${userId}`, {
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
                                user_platforms,
                                user_sites
                            } = data

                            showModalDialog(modalForm, `<i class="fas fa-user-edit mr-2"></i> Update User`, () => {
                                handleCheckbox()

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

                                let checkboxChecked = []
                                user_sites.map((site: any) => {
                                    const {customer_id, site_id, user_sites_tipe_logger} = site
                                    checkboxChecked.push({
                                        customer_id: customer_id,
                                        site_id: site_id,
                                        type_logger: user_sites_tipe_logger.map((item: any) => {
                                            return {
                                                id: item.id,
                                                type_logger: item.tipe_logger,
                                                is_active: item.is_active
                                            }
                                        })
                                    })
                                })

                                setCheckboxesFromData(checkboxChecked)
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

                                        const sites = []
                                        checkSites.forEach(siteCheckbox => {
                                            if (siteCheckbox.checked || siteCheckbox.indeterminate) {
                                                const customerId = Number(siteCheckbox.dataset.parent)
                                                const siteId = Number(siteCheckbox.dataset.id)

                                                if (isNaN(customerId) || isNaN(siteId)) return

                                                const internalLogger = siteMonitorSparing.querySelector<CheckboxElement>(`.typeLoggerIn[data-parent="${customerId}"][data-parent-site="${siteId}"]`)
                                                const reEngineerLogger = siteMonitorSparing.querySelector<CheckboxElement>(`.typeLoggerRe[data-parent="${customerId}"][data-parent-site="${siteId}"]`)

                                                console.log(internalLogger)
                                                const typeLogger: [any, any] = [
                                                    {
                                                        id: internalLogger.getAttribute('data-id') ?? 'x',
                                                        type_logger: 1,
                                                        is_active: internalLogger && internalLogger.checked ? 1 : 0
                                                    },
                                                    {
                                                        id: reEngineerLogger.getAttribute('data-id') ?? 'x',
                                                        type_logger: 2,
                                                        is_active: reEngineerLogger && reEngineerLogger.checked ? 1 : 0
                                                    }
                                                ]

                                                sites.push({
                                                    customer_id: customerId,
                                                    site_id: siteId,
                                                    type_logger: typeLogger
                                                })
                                            }
                                        })

                                        confirmAlert({
                                            title: 'Confirm',
                                            html: 'Are you sure want to update User data?',
                                            confirmButtonText: '<i class="fas fa-save mr-2"></i> Save',
                                            showDenyButton: true,
                                            denyButtonText: 'No'
                                        }, async () => {
                                            await waitLoader('Please wait...', 'Process updating of User data.', async () => {
                                                const response = await fetch(`${url.pathname}/update/${userId}`, {
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
                                                        site_permission: sitePermissionDatas,
                                                        sites: sites
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
                                                const response = await fetch(`${url.pathname}/delete/${userId}`, {
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

    //region Handle Check Box
    searchInput.addEventListener('input', function() {
        filterTable(this.value)
    })

    //region Handle Checkbox dari data Existing
    function setCheckboxesFromData(data: any[]): void {
        // Reset semua checkbox
        checkCustomers.forEach(customer => customer.checked = false)
        checkSites.forEach(site => site.checked = false)
        typeLoggers.forEach(logger => logger.checked = false)

        // console.log(data)
        data.forEach((item: any) => {
            const siteCheckbox = checkSites.find(site =>
                    Number(site.dataset.parent) === item.customer_id &&
                    Number(site.dataset.id) === item.site_id
            )

            if (siteCheckbox) {
                siteCheckbox.checked = true

                const internalLogger = siteMonitorSparing.querySelector<CheckboxElement>(
                        `.typeLoggerIn[data-parent="${item.customer_id}"][data-parent-site="${item.site_id}"]`
                )
                const reEngineerLogger = siteMonitorSparing.querySelector<CheckboxElement>(
                        `.typeLoggerRe[data-parent="${item.customer_id}"][data-parent-site="${item.site_id}"]`
                )

                if (internalLogger) {
                    if (item.type_logger.length !== 0) {
                        internalLogger.checked = item.type_logger[0].type_logger === 1 && item.type_logger[0].is_active === 1
                        internalLogger.setAttribute('data-id', item.type_logger[0].id)
                    }
                }

                if (reEngineerLogger) {
                    if (item.type_logger.length !== 0) {
                        if (item.type_logger[1]) {
                            reEngineerLogger.checked = item.type_logger[1].type_logger === 2 && item.type_logger[1].is_active === 1
                            reEngineerLogger.setAttribute('data-id', item.type_logger[1].id)
                        }
                    }
                }
            }
        })

        updateCheckboxStatus()
    }
    //endregion

    //region Handle Checkbox
    function handleCheckbox() {
        checkAll.addEventListener('change', function () {
            const isChecked = this.checked
            checkCustomers.forEach(customer => {
                customer.checked = isChecked
                customer.indeterminate = false
            })
            checkSites.forEach(site => {
                site.checked = isChecked
                site.indeterminate = false
            })
            typeLoggers.forEach(logger => logger.checked = isChecked)
        })

        checkCustomers.forEach(customer => {
            customer.addEventListener('change', function () {
                const customerId = this.dataset.id
                if (!customerId) return

                const isChecked = this.checked
                const relatedSites = Array.from(siteMonitorSparing.querySelectorAll<CheckboxElement>(`.checkSite[data-parent="${customerId}"]`)).filter(isCheckbox)
                const relatedLoggers = Array.from(siteMonitorSparing.querySelectorAll<CheckboxElement>(`[data-parent="${customerId}"][data-type-logger="true"]`)).filter(isCheckbox)

                relatedSites.forEach(site => {
                    site.checked = isChecked
                    site.indeterminate = false
                })
                relatedLoggers.forEach(logger => logger.checked = isChecked)

                this.indeterminate = false
                updateCheckboxStatus()
            })
        })

        checkSites.forEach(site => {
            site.addEventListener('change', function () {
                const siteId = this.dataset.id
                if (!siteId) return

                const isChecked = this.checked
                const relatedLoggers = Array.from(siteMonitorSparing.querySelectorAll<CheckboxElement>(`[data-parent-site="${siteId}"][data-type-logger="true"]`)).filter(isCheckbox)

                relatedLoggers.forEach(logger => logger.checked = isChecked)

                this.indeterminate = false
                updateCheckboxStatus()
            })
        })

        typeLoggers.forEach(logger => {
            logger.addEventListener('change', updateCheckboxStatus)
        })
    }
    //endregion

    //region Filter Table
    function isHTMLElement(element: Element): element is HTMLElement {
        return element instanceof HTMLElement
    }

    function setRowVisibility(row: Element, isVisible: boolean) {
        if (isHTMLElement(row)) {
            row.style.display = isVisible ? '' : 'none'
        }
    }

    function filterTable(searchTerm: string): void {
        const rows = Array.from(siteMonitorSparing.querySelectorAll('tbody tr'))
        const lowercaseSearchTerm = searchTerm.toLowerCase()
        let visibleCustomers = new Set<string>()

        rows.forEach((row: HTMLElement, index) => {
            if (row.classList.contains('parent')) {
                // Baris customer
                const customerId = row.querySelector('.checkCustomer')?.getAttribute('data-id')
                row.style.display = visibleCustomers.has(customerId || '') ? '' : 'none'
            } else if (row.classList.contains('child') && row.querySelector('.checkSite')) {
                // Baris site
                const siteName = row.querySelector('td:nth-child(2) div')?.textContent?.toLowerCase()
                const isVisible = siteName?.includes(lowercaseSearchTerm) || searchTerm === ''
                const customerId = row.querySelector('.checkSite')?.getAttribute('data-parent')

                if (isVisible && customerId) {
                    visibleCustomers.add(customerId)
                }

                setRowVisibility(row, isVisible)

                // Atur visibility untuk dua baris berikutnya (Internal dan Re-Engineer)
                if (rows[index + 1]) setRowVisibility(rows[index + 1], isVisible)
                if (rows[index + 2]) setRowVisibility(rows[index + 2], isVisible)
            }
        })

        // Tampilkan kembali baris customer yang memiliki site yang cocok
        rows.forEach((row: HTMLElement) => {
            if (row.classList.contains('parent')) {
                const customerId = row.querySelector('.checkCustomer')?.getAttribute('data-id')
                row.style.display = visibleCustomers.has(customerId || '') ? '' : 'none'
            }
        })

        updateCheckboxStatus()
    }
    //endregion

    //region Update Checkbox Check Status
    function updateCheckboxStatus() {
        checkCustomers.forEach(customerCheckbox => {
            const customerId = customerCheckbox.dataset.id
            if (!customerId) return

            const relatedSites = Array.from(
                    siteMonitorSparing.querySelectorAll<CheckboxElement>(
                            `.checkSite[data-parent="${customerId}"]:not([data-type-logger="true"])`
                    )
            ).filter(isCheckbox)

            const relatedLoggers = Array.from(
                    siteMonitorSparing.querySelectorAll<CheckboxElement>(
                            `[data-parent="${customerId}"][data-type-logger="true"]`
                    )
            ).filter(isCheckbox)

            relatedSites.forEach(site => {
                if (site.checked) {
                    site.checked = false
                }
            })

            const checkedSites = relatedSites.filter(site => site.checked)
            const checkedLoggers = relatedLoggers.filter(logger => logger.checked)

            if (checkedSites.length === 0 && checkedLoggers.length === 0) {
                customerCheckbox.checked = false
                customerCheckbox.indeterminate = false
            } else if (checkedLoggers.length === relatedLoggers.length) {
                customerCheckbox.checked = true
                customerCheckbox.indeterminate = false
            } else {
                customerCheckbox.checked = false
                customerCheckbox.indeterminate = true
            }
        })

        checkSites.forEach(siteCheckbox => {
            const siteId = siteCheckbox.dataset.id
            if (!siteId) return

            const relatedLoggers = Array.from(siteMonitorSparing.querySelectorAll<CheckboxElement>(`[data-parent-site="${siteId}"][data-type-logger="true"]`)).filter(isCheckbox)

            const allLoggersChecked = relatedLoggers.every(logger => logger.checked)
            const someLoggersChecked = relatedLoggers.some(logger => logger.checked)

            siteCheckbox.checked = allLoggersChecked
            siteCheckbox.indeterminate = !allLoggersChecked && someLoggersChecked
        })

        const allCustomersChecked = checkCustomers.every(customer => customer.checked)
        const someCustomersChecked = checkCustomers.some(customer => customer.checked || customer.indeterminate)

        checkAll.checked = allCustomersChecked
        checkAll.indeterminate = !allCustomersChecked && someCustomersChecked
    }

    function isCheckbox(element: Element): element is CheckboxElement {
        return element instanceof HTMLInputElement && element.type === 'checkbox'
    }
    //endregion

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
