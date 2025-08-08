import {closeModalDialog, showModalDialog} from "@/js/plugins/modal";
import {getMetaContent, responseMessages, showHiddenElm} from "@/js/plugins/functions";
import {confirmAlert, failureAlert, successAlert, waitLoader} from "@/js/plugins/sweet-alert";
import DataSitesModel from "@/js/main/master/data-sites/model/DataSitesModel";
import Swal from "sweetalert2";
import {TabItem, Tabs} from "flowbite";
import MapsHelper from "@/js/plugins/mapsHelper";

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
    const cctvLinkHls: HTMLInputElement = modalForm.querySelector('.cctvLinkHls')
    const cctvLinkHlsError: HTMLElement = modalForm.querySelector('.cctvLinkHlsError')
    const platformTimezone: HTMLInputElement = modalForm.querySelector('.platformTimezone')
    const platformTimezoneError: HTMLElement = modalForm.querySelector('.platformTimezoneError')

    const pm10Min: HTMLInputElement = modalForm.querySelector('.pm10Min')
    const pm10MinError: HTMLElement = modalForm.querySelector('.pm10MinError')
    const pm10MinBuffer: HTMLInputElement = modalForm.querySelector('.pm10MinBuffer')
    const pm10MinBufferError: HTMLElement = modalForm.querySelector('.pm10MinBufferError')
    const pm10MaxBuffer: HTMLInputElement = modalForm.querySelector('.pm10MaxBuffer')
    const pm10MaxBufferError: HTMLElement = modalForm.querySelector('.pm10MaxBufferError')
    const pm10Max: HTMLInputElement = modalForm.querySelector('.pm10Max')
    const pm10MaxError: HTMLElement = modalForm.querySelector('.pm10MaxError')

    const pm25Min: HTMLInputElement = modalForm.querySelector('.pm25Min')
    const pm25MinError: HTMLElement = modalForm.querySelector('.pm25MinError')
    const pm25MinBuffer: HTMLInputElement = modalForm.querySelector('.pm25MinBuffer')
    const pm25MinBufferError: HTMLElement = modalForm.querySelector('.pm25MinBufferError')
    const pm25MaxBuffer: HTMLInputElement = modalForm.querySelector('.pm25MaxBuffer')
    const pm25MaxBufferError: HTMLElement = modalForm.querySelector('.pm25MaxBufferError')
    const pm25Max: HTMLInputElement = modalForm.querySelector('.pm25Max')
    const pm25MaxError: HTMLElement = modalForm.querySelector('.pm25MaxError')

    const tspMin: HTMLInputElement = modalForm.querySelector('.tspMin')
    const tspMinError: HTMLElement = modalForm.querySelector('.tspMinError')
    const tspMinBuffer: HTMLInputElement = modalForm.querySelector('.tspMinBuffer')
    const tspMinBufferError: HTMLElement = modalForm.querySelector('.tspMinBufferError')
    const tspMaxBuffer: HTMLInputElement = modalForm.querySelector('.tspMaxBuffer')
    const tspMaxBufferError: HTMLElement = modalForm.querySelector('.tspMaxBufferError')
    const tspMax: HTMLInputElement = modalForm.querySelector('.tspMax')
    const tspMaxError: HTMLElement = modalForm.querySelector('.tspMaxError')

    const noiseMin: HTMLInputElement = modalForm.querySelector('.noiseMin')
    const noiseMinError: HTMLElement = modalForm.querySelector('.noiseMinError')
    const noiseMinBuffer: HTMLInputElement = modalForm.querySelector('.noiseMinBuffer')
    const noiseMinBufferError: HTMLElement = modalForm.querySelector('.noiseMinBufferError')
    const noiseMaxBuffer: HTMLInputElement = modalForm.querySelector('.noiseMaxBuffer')
    const noiseMaxBufferError: HTMLElement = modalForm.querySelector('.noiseMaxBufferError')
    const noiseMax: HTMLInputElement = modalForm.querySelector('.noiseMax')
    const noiseMaxError: HTMLElement = modalForm.querySelector('.noiseMaxError')

    const mapsBody: HTMLDivElement = modalForm.querySelector('#mapsBody')
    const markerImage: HTMLImageElement = modalForm.querySelector('.markerImage')
    const alamatLat: HTMLInputElement = modalForm.querySelector('.alamatLat')
    const alamatLng: HTMLInputElement = modalForm.querySelector('.alamatLng')

    const btnSave: HTMLElement = modalForm.querySelector('.btnSave')
    const btnDelete: HTMLElement = modalForm.querySelector('.btnDelete')

    const modelSite = new DataSitesModel(companyId, companySiteId, {
        csrfToken
    })

    //region Handle Close Modal
    closeModalForm.forEach((elm: Element) => {
        elm.addEventListener('click', function () {
            if (modalForm) {
                closeModalDialog(modalForm, () => {
                    modelSite.setSelectedValue('')
                    uidOld.value = ''
                    uid.value = ''
                    cctvLink.value = ''
                    cctvLinkHls.value = ''
                    platformTimezone.value = ''
                    platformTimezone.dispatchEvent(new Event('exbox.change'));

                    showTab('#platform')
                })
            }
        })
    })
    //endregion

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
                defaultTabId: '#platform',
                activeClasses: 'border-b-2 border-blue-700 text-blue-700',
                inactiveClasses: 'hover:text-gray-900 hover:bg-gray-100 text-gray-400',
                onShow: (x: any) => {
                    const {id} = x._activeTab

                    if (id === '#maps') {
                        const mapsHelper = new MapsHelper();
                        mapsHelper.mapsConfig(mapsBody).then(({map, google}) => {
                            if (alamatLat.value !== '' && alamatLng.value !== '') {
                                const latlng = new google.maps.LatLng(parseFloat(alamatLat.value), parseFloat(alamatLng.value))
                                map.setCenter(latlng)
                                map.setZoom(13)
                            }

                            google.maps.event.addListener(map, "idle", function () {
                                const center = this.getCenter()
                                const latlng = new google.maps.LatLng(center.lat(), center.lng())

                                alamatLat.value = center.lat()
                                alamatLng.value = center.lng()

                                const projection = map.getProjection();
                                const bounds = map.getBounds();
                                const topRight = projection.fromLatLngToPoint(bounds.getNorthEast());
                                const bottomLeft = projection.fromLatLngToPoint(bounds.getSouthWest());
                                const scale = Math.pow(2, map.getZoom());
                                const worldPoint = projection.fromLatLngToPoint(latlng);
                                const pixelConvert = [Math.floor((worldPoint.x - bottomLeft.x) * scale), Math.floor((worldPoint.y - topRight.y) * scale)]

                                markerImage.style.left = `${pixelConvert[0] - 16}px`
                                markerImage.style.top = `${pixelConvert[1] + 197}px`
                            });
                        });
                    }
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

    //region Handle Store
    if (btnCreate) {
        btnCreate.addEventListener('click', function () {
            showModalDialog(modalForm, `<i class="fas fa-plus-circle mr-2"></i> New Platform`, function () {

                if (btnSave) {
                    btnSave.addEventListener('click', function () {
                        confirmAlert({
                            title: 'Confirm',
                            html: 'Are you sure want to create new Platform?',
                            confirmButtonText: '<i class="fas fa-save mr-2"></i> Save',
                            showDenyButton: true,
                            denyButtonText: 'Cancel'
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
                                        cctv_link_hls: cctvLinkHls.value,
                                        timezone: platformTimezone.value,
                                        lat: alamatLat.value,
                                        lng: alamatLng.value,
                                        pm10_min: pm10Min.value,
                                        pm10_min_buffer: pm10MinBuffer.value,
                                        pm10_max_buffer: pm10MaxBuffer.value,
                                        pm10_max: pm10Max.value,
                                        pm25_min: pm25Min.value,
                                        pm25_min_buffer: pm25MinBuffer.value,
                                        pm25_max_buffer: pm25MaxBuffer.value,
                                        pm25_max: pm25Max.value,
                                        tsp_min: tspMin.value,
                                        tsp_min_buffer: tspMinBuffer.value,
                                        tsp_max_buffer: tspMaxBuffer.value,
                                        tsp_max: tspMax.value,
                                        noise_min: noiseMin.value,
                                        noise_min_buffer: noiseMinBuffer.value,
                                        noise_max_buffer: noiseMaxBuffer.value,
                                        noise_max: noiseMax.value,
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
                            const {company_site_id, uid: data_uid, cctv_link, cctv_link_hls, timezone, lat, lng, logger_limit} = data
                            const {
                                pm10_min,
                                pm10_min_buffer,
                                pm10_max_buffer,
                                pm10_max,
                                pm25_min,
                                pm25_min_buffer,
                                pm25_max_buffer,
                                pm25_max,
                                tsp_min,
                                tsp_min_buffer,
                                tsp_max_buffer,
                                tsp_max,
                                noise_min,
                                noise_min_buffer,
                                noise_max_buffer,
                                noise_max,
                            } = logger_limit || {}

                            showModalDialog(modalForm, `<i class="fas fa-edit mr-2"></i> Update Platform`, () => {
                                modelSite.setSelectedValue(company_site_id)
                                uidOld.value = data_uid
                                uid.value = data_uid
                                cctvLink.value = cctv_link
                                cctvLinkHls.value = cctv_link_hls
                                platformTimezone.value = timezone
                                platformTimezone.dispatchEvent(new Event('exbox.change'))
                                alamatLat.value = lat
                                alamatLng.value = lng

                                pm10Min.value = pm10_min ?? 0
                                pm10MinBuffer.value = pm10_min_buffer ?? 0
                                pm10MaxBuffer.value = pm10_max_buffer ?? 0
                                pm10Max.value = pm10_max ?? 0

                                pm25Min.value = pm25_min ?? 0
                                pm25MinBuffer.value = pm25_min_buffer ?? 0
                                pm25MaxBuffer.value = pm25_max_buffer ?? 0
                                pm25Max.value = pm25_max ?? 0

                                tspMin.value = tsp_min ?? 0
                                tspMinBuffer.value = tsp_min_buffer ?? 0
                                tspMaxBuffer.value = tsp_max_buffer ?? 0
                                tspMax.value = tsp_max ?? 0

                                noiseMin.value = noise_min ?? 0
                                noiseMinBuffer.value = noise_min_buffer ?? 0
                                noiseMaxBuffer.value = noise_max_buffer ?? 0
                                noiseMax.value = noise_max ?? 0

                                if (btnSave) {
                                    btnSave.addEventListener('click', function () {
                                        confirmAlert({
                                            title: 'Confirm',
                                            html: 'Are you sure want to update data Platform?',
                                            confirmButtonText: '<i class="fas fa-save mr-2"></i> Save Change',
                                            showDenyButton: true,
                                            denyButtonText: 'Cancel'
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
                                                        cctv_link_hls: cctvLinkHls.value,
                                                        timezone: platformTimezone.value,
                                                        lat: alamatLat.value,
                                                        lng: alamatLng.value,
                                                        pm10_min: pm10Min.value,
                                                        pm10_min_buffer: pm10MinBuffer.value,
                                                        pm10_max_buffer: pm10MaxBuffer.value,
                                                        pm10_max: pm10Max.value,
                                                        pm25_min: pm25Min.value,
                                                        pm25_min_buffer: pm25MinBuffer.value,
                                                        pm25_max_buffer: pm25MaxBuffer.value,
                                                        pm25_max: pm25Max.value,
                                                        tsp_min: tspMin.value,
                                                        tsp_min_buffer: tspMinBuffer.value,
                                                        tsp_max_buffer: tspMaxBuffer.value,
                                                        tsp_max: tspMax.value,
                                                        noise_min: noiseMin.value,
                                                        noise_min_buffer: noiseMinBuffer.value,
                                                        noise_max_buffer: noiseMaxBuffer.value,
                                                        noise_max: noiseMax.value,
                                                    })
                                                })

                                                await handleResponse(response)
                                            })
                                        })
                                    })
                                }

                                showHiddenElm(btnDelete)
                                if (btnDelete) {
                                    btnDelete.addEventListener('click', function () {
                                        confirmAlert({
                                            title: 'Confirm',
                                            html: 'Are you sure want to delete data Platform?',
                                            confirmButtonText: '<i class="fas fa-trash-can mr-2"></i> Yes, Delete it!',
                                            showDenyButton: true,
                                            denyButtonText: 'Cancel'
                                        }, async () => {
                                            await waitLoader('Please wait...', 'Process of updating Platform data.', async () => {
                                                const response = await fetch(`/master/platform-loggers/delete/${platformId}`, {
                                                    method: 'DELETE',
                                                    headers: {
                                                        'Content-Type': 'application/json',
                                                        'X-CSRF-TOKEN': csrfToken
                                                    },
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
                    cctv_link,
                    cctv_link_hls,
                    timezone,
                } = errorValidation

                responseMessages(companySiteIdError, company_site_id)
                responseMessages(uidError, uid)
                responseMessages(cctvLinkError, cctv_link)
                responseMessages(cctvLinkHlsError, cctv_link_hls)
                responseMessages(platformTimezoneError, timezone)

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
