import {closeModalDialog, showModalDialog} from "@/js/plugins/modal";
import {convertWebRTCToWhepUrl, getMetaContent, responseMessages, showHiddenElm} from "@/js/plugins/functions";
import {confirmAlert, failureAlert, successAlert, waitLoader} from "@/js/plugins/sweet-alert";
import DataSitesModel from "@/js/main/master/data-sites/model/DataSitesModel";
import Swal from "sweetalert2";
import {TabItem, Tabs} from "flowbite";
import MapsHelper from "@/js/plugins/mapsHelper";
import VideoStreamHandler from "@/js/plugins/videoStreamHandler";
import HikvisionPTZController from "@/js/plugins/hikvisionPTZController";
import {EnhancedVideoStreamHandler} from "@/js/plugins/EnhancedVideoStreamHandler";
import OnvifPTZController from "@/js/plugins/OnvifPTZController";

interface MenuItem {
    text: string;
    href?: string;
    class: string;
    icon?: string;
}

document.addEventListener('DOMContentLoaded', function () {
    const csrfToken = getMetaContent('csrf-token')
    const url = new URL(window.location.href)

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
    const uidAlias: HTMLInputElement = modalForm.querySelector('.uidAlias')
    const uidAliasError: HTMLElement = modalForm.querySelector('.uidAliasError')
    const cctvLink1: HTMLInputElement = modalForm.querySelector('.cctvLink1')
    const cctvLink1Error: HTMLElement = modalForm.querySelector('.cctvLink1Error')
    const cctvLink2: HTMLInputElement = modalForm.querySelector('.cctvLink2')
    const cctv1IsSupportPTZ: HTMLInputElement = modalForm.querySelector('.cctv1IsSupportPTZ')
    const cctvLink2Error: HTMLElement = modalForm.querySelector('.cctvLink2Error')
    const cctv2IsSupportPTZ: HTMLInputElement = modalForm.querySelector('.cctv2IsSupportPTZ')
    const cctvLinkHls: HTMLInputElement = modalForm.querySelector('.cctvLinkHls')
    const cctvLinkHlsError: HTMLElement = modalForm.querySelector('.cctvLinkHlsError')
    const cctvPortalIP: HTMLInputElement = modalForm.querySelector('.cctvPortalIP')
    const cctvPortalIPError: HTMLElement = modalForm.querySelector('.cctvPortalIPError')
    const cctvPortalUsername: HTMLInputElement = modalForm.querySelector('.cctvPortalUsername')
    const cctvPortalUsernameError: HTMLElement = modalForm.querySelector('.cctvPortalUsernameError')
    const cctvPortalPassword: HTMLInputElement = modalForm.querySelector('.cctvPortalPassword')
    const cctvPortalPasswordError: HTMLElement = modalForm.querySelector('.cctvPortalPasswordError')
    const btnShowPortalPassword: HTMLElement = modalForm.querySelector('.btnShowPortalPassword')
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

    const modalCctv: HTMLElement = document.querySelector('.modalCctv')
    const modalBody: HTMLElement = modalCctv.querySelector('.modal-body')

    const dropdownMenu = createDropdownMenu()

    const modelSite = new DataSitesModel(companyId, companySiteId, {
        csrfToken
    });

    const cameraLive = new EnhancedVideoStreamHandler({
        autoplay: true,
        controls: true,
        muted: true,
        maxHeight: '100vh',
        videoHeight: '400px',
        retryAttempts: 5,
    });

    //region Handle Close Modal
    closeModalForm.forEach((elm: Element) => {
        elm.addEventListener('click', function () {
            if (modalForm) {
                closeModalDialog(modalForm, () => {
                    modelSite.setSelectedValue('')
                    uidOld.value = ''
                    uid.value = ''
                    cctvLink1.value = ''
                    cctvLink2.value = ''
                    cctvLinkHls.value = ''
                    platformTimezone.value = ''
                    platformTimezone.dispatchEvent(new Event('exbox.change'));

                    showTab('#platform')
                })
            }

            if (modalCctv) {
                closeModalDialog(modalCctv, () => {
                    cameraLive.destroy();
                })
            }
        })
    })
    //endregion

    //region Handle Dropdown
    function createDropdownMenu(): HTMLElement {
        // Cek apakah dropdown sudah ada
        const existingDropdown = document.getElementById('dropdownMenu');
        if (existingDropdown) {
            return existingDropdown;
        }

        // Buat elemen dropdown
        const dropdown: HTMLElement = document.createElement('div');
        dropdown.id = 'dropdownMenu';
        dropdown.className = 'hidden absolute w-48 bg-white rounded-md shadow-lg z-50';

        const dropdownContent: HTMLElement = document.createElement('div');
        dropdownContent.className = 'py-1 rounded-md bg-white shadow-xs';

        dropdown.appendChild(dropdownContent);
        document.body.appendChild(dropdown);

        return dropdown;
    }

    function generateMenuItems(platformId: string): MenuItem[] {
        const menuItems: MenuItem[] = [];

        menuItems.push({text: 'Edit', class: 'text-gray-700 btnEdit', icon: 'fas fa-edit'});
        menuItems.push({
            text: 'Calibration',
            class: 'text-gray-700',
            icon: 'fas fa-rotate-right',
            href: `${url}/calibration/${platformId}`
        });

        return menuItems;
    }

    function updateDropdownContent(platformId: string): void {
        const dropdownContent = dropdownMenu.querySelector('.py-1');
        if (dropdownContent) {
            // Clear existing content
            dropdownContent.innerHTML = '';

            // Generate menu items based on status
            const menuItems = generateMenuItems(platformId);

            menuItems.forEach(item => {
                const div: HTMLDivElement = document.createElement('div')

                const link: HTMLAnchorElement = document.createElement('a');
                if (item.href) {
                    link.href = item?.href;
                }
                link.className = `block px-4 py-3 text-sm ${item.class} hover:bg-gray-100`;
                link.innerHTML = `
                    <i class="${item.icon} mr-2"></i> ${item.text}
                `;

                div.appendChild(link)
                dropdownContent.appendChild(div);
            });
        }
    }

    function showDropdown(button: HTMLElement, platformId: string, callback?: () => void): void {
        const rect: DOMRect = button.getBoundingClientRect();
        const scrollTop: number = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft: number = window.pageXOffset || document.documentElement.scrollLeft;

        dropdownMenu.style.top = (rect.bottom + scrollTop) + 'px';
        dropdownMenu.style.left = (rect.right - dropdownMenu.offsetWidth + scrollLeft - 200) + 'px';
        dropdownMenu.style.zIndex = '250';

        // Update menu content based on status
        updateDropdownContent(platformId);

        dropdownMenu.classList.remove('hidden');

        if (callback) {
            callback();
        }
    }

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
                    } else if (id === '#camera') {
                        btnShowPortalPassword.addEventListener('click', function () {
                            let currentType = cctvPortalPassword.getAttribute('type') === 'password' ? 'text' : 'password'
                            let currentTypeIcon = cctvPortalPassword.getAttribute('type') === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash'
                            cctvPortalPassword.setAttribute('type', currentType)
                            btnShowPortalPassword.innerHTML = `<i class="${currentTypeIcon}"></i>`
                        })
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
                                        uid_alias: uidAlias.value,
                                        cctv_link_1: cctvLink1.value,
                                        cctv_1_support_ptz: cctv1IsSupportPTZ.checked ? 1 : 0,
                                        cctv_link_2: cctvLink2.value,
                                        cctv_2_support_ptz: cctv2IsSupportPTZ.checked ? 1 : 0,
                                        cctv_link_hls: cctvLinkHls.value,
                                        timezone: platformTimezone.value,
                                        lat: alamatLat.value,
                                        lng: alamatLng.value,
                                        cctv_portal_ip: cctvPortalIP.value,
                                        cctv_portal_username: cctvPortalUsername.value,
                                        cctv_portal_password: cctvPortalPassword.value,
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
            const platformUid = elm.getAttribute('data-uid')
            const btnCamera1 = elm.querySelector('.btnCamera1')
            const btnCamera2 = elm.querySelector('.btnCamera2')
            const btnCCTVHls = elm.querySelector('.btnCCTVHls')
            const dropdownBtn: HTMLElement | null = elm.querySelector('.dropdownPlatform')

            if (dropdownBtn) {
                dropdownBtn.addEventListener('click', function (e: Event) {
                    e.stopPropagation();

                    if (!dropdownMenu.classList.contains('hidden') &&
                            dropdownMenu.getAttribute('data-trigger') === this.getAttribute('data-id')) {
                        dropdownMenu.classList.add('hidden');
                        return;
                    }

                    dropdownMenu.classList.add('hidden');
                    dropdownMenu.setAttribute('data-trigger', this.getAttribute('data-id') || '');
                    showDropdown(this, platformId, () => {

                        //region Handle Edit
                        const btnEdit = dropdownMenu.querySelectorAll('.btnEdit')
                        btnEdit.forEach((elm) => {
                            elm.addEventListener('click', async function () {
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
                                        const {
                                            company_site_id,
                                            uid: data_uid,
                                            uid_alias,
                                            cctv_link_1,
                                            cctv_1_support_ptz,
                                            cctv_link_2,
                                            cctv_2_support_ptz,
                                            cctv_link_hls,
                                            cctv_portal_ip,
                                            cctv_portal_username,
                                            cctv_portal_password,
                                            timezone,
                                            lat,
                                            lng,
                                            logger_limit
                                        } = data

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
                                            uidAlias.value = uid_alias
                                            cctvLink1.value = cctv_link_1
                                            cctv1IsSupportPTZ.checked = cctv_1_support_ptz === 1
                                            cctvLink2.value = cctv_link_2
                                            cctv2IsSupportPTZ.checked = cctv_2_support_ptz === 1
                                            cctvLinkHls.value = cctv_link_hls
                                            platformTimezone.value = timezone
                                            platformTimezone.dispatchEvent(new Event('exbox.change'))
                                            alamatLat.value = lat
                                            alamatLng.value = lng
                                            cctvPortalIP.value = cctv_portal_ip
                                            cctvPortalUsername.value = cctv_portal_username
                                            cctvPortalPassword.value = cctv_portal_password

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
                                                                    uid_alias: uidAlias.value,
                                                                    cctv_link_1: cctvLink1.value,
                                                                    cctv_1_support_ptz: cctv1IsSupportPTZ.checked ? 1 : 0,
                                                                    cctv_link_2: cctvLink2.value,
                                                                    cctv_2_support_ptz: cctv2IsSupportPTZ.checked ? 1 : 0,
                                                                    cctv_link_hls: cctvLinkHls.value,
                                                                    timezone: platformTimezone.value,
                                                                    lat: alamatLat.value,
                                                                    lng: alamatLng.value,
                                                                    cctv_portal_ip: cctvPortalIP.value,
                                                                    cctv_portal_username: cctvPortalUsername.value,
                                                                    cctv_portal_password: cctvPortalPassword.value,
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
                        })
                        //endregion

                    });
                });
            }

            //region Handle Camera 1
            if (btnCamera1) {
                btnCamera1.addEventListener('click', () => {
                    showModalDialog(modalCctv, `
                        <div class="flex items-center">
                            <img src="/images/vector/icons8-cctv-100.png" width="24" class="mr-2" alt=""/> ${platformUid}
                        </div>
                    `, async () => {
                        cameraLive.initializeWithCameras(modalBody, [{
                            cameraName: "Camera 1 RTC",
                            videoLink: convertWebRTCToWhepUrl(btnCamera1.getAttribute('data-href')),
                            videoControl: false,
                            protocol: 'whep',
                            supportPTZ: btnCamera1.getAttribute('data-ptz') === '1'
                        }]);

                        if (btnCamera1.getAttribute('data-ptz') === '1') {
                            await handlePTZControl()
                        }
                    })
                })
            }
            //endregion

            //region Handle Camera 2
            if (btnCamera2) {
                btnCamera2.addEventListener('click', () => {
                    showModalDialog(modalCctv, `
                        <div class="flex items-center">
                            <img src="/images/vector/icons8-cctv-100.png" width="24" class="mr-2" alt=""/> ${platformUid}
                        </div>
                    `, async () => {
                        cameraLive.initializeWithCameras(modalBody, [{
                            cameraName: "Camera 1 RTC",
                            videoLink: convertWebRTCToWhepUrl(btnCamera2.getAttribute('data-href')),
                            videoControl: true,
                            protocol: 'whep',
                            supportPTZ: btnCamera2.getAttribute('data-ptz') === '1'
                        }]);

                        if (btnCamera2.getAttribute('data-ptz') === '1') {
                            await handlePTZControl()
                        }
                    })
                })
            }
            //endregion

            //region Handle PTZ Control
            const handlePTZControl = async () => {
                const onvif = new OnvifPTZController(csrfToken, platformUid);
                cameraLive.setPTZCallbacks({
                    onMoveUp: () => {
                        onvif.moveContinuous('up', 0.3)
                    },
                    onMoveDown: () => {
                        onvif.moveContinuous('down', 0.3)
                    },
                    onMoveLeft: () => {
                        onvif.moveContinuous('left', 0.3)
                    },
                    onMoveRight: () => {
                        onvif.moveContinuous('right', 0.3)
                    },
                    onZoomIn: () => {
                        onvif.zoomIn(0.3)
                        setTimeout(() => {
                            onvif.stop()
                        }, 2000)
                    },
                    onZoomOut: () => {
                        onvif.zoomOut(0.3)
                        setTimeout(() => {
                            onvif.stop()
                        }, 2000)
                    },
                    onStop: () => {
                        onvif.stop()
                    }
                })
            }
            //endregion

            //region Handle Camera HLS
            if (btnCCTVHls) {
                btnCCTVHls.addEventListener('click', () => {
                    showModalDialog(modalCctv, `
                        <div class="flex items-center">
                            <img src="/images/vector/icons8-cctv-100.png" width="24" class="mr-2" alt=""/> ${platformUid}
                        </div>
                    `, () => {
                        cameraLive.initializeWithCameras(modalBody, [{
                            cameraName: "Camera HLS",
                            videoLink: btnCCTVHls.getAttribute('data-href'),
                            videoControl: true,
                            protocol: 'hls',
                            supportPTZ: false
                        }]);
                    })
                })
            }
            //endregion
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
                    uid_alias,
                    cctv_link_1,
                    cctv_link_2,
                    cctv_link_hls,
                    timezone,
                    cctv_portal_ip,
                    cctv_portal_username,
                    cctv_portal_password,
                } = errorValidation

                responseMessages(companySiteIdError, company_site_id)
                responseMessages(uidError, uid)
                responseMessages(uidAliasError, uid_alias)
                responseMessages(cctvLink1Error, cctv_link_1)
                responseMessages(cctvLink2Error, cctv_link_2)
                responseMessages(cctvLinkHlsError, cctv_link_hls)
                responseMessages(platformTimezoneError, timezone)
                responseMessages(cctvPortalIPError, cctv_portal_ip)
                responseMessages(cctvPortalUsernameError, cctv_portal_username)
                responseMessages(cctvPortalPasswordError, cctv_portal_password)

            } else {
                failureAlert({
                    title: 'Oppss!',
                    html: message
                })
            }
        }
    }
    //endregion

    window.addEventListener('click', function () {
        dropdownMenu.classList.add('hidden');
    });

    // Prevent dropdown from closing when clicking inside it
    dropdownMenu.addEventListener('click', function (e) {
        e.stopPropagation();
    });

})
