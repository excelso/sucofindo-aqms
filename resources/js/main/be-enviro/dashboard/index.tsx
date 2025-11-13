import {Loader} from "@googlemaps/js-api-loader";
import {checkClassList, delay, elapsedDate, getMetaContent, removeElmClass} from "@/js/plugins/functions";
import {MarkerClusterer} from "@googlemaps/markerclusterer";
import tzLookup from "tz-lookup"
import {failureAlert} from "@/js/plugins/sweet-alert";
import {data} from "jquery";

interface CardData {
    imageUrl: string;
    title: string;
    subtitle: string;
    status: 'online' | 'offline';
    imageAlt?: string;
    uid: string; // 👈 Tambahkan uid
}

document.addEventListener('DOMContentLoaded', function () {

    //region Handle Init Component
    const csrfToken = getMetaContent('csrf-token')
    const url = new URL(window.location.href)

    const btnListSparing = document.querySelector('.btnListSparing')
    const btnListAqms = document.querySelector('.btnListAqms')
    const leftPanel = document.querySelector('.left-panel')
    const searchInput = document.querySelector('.searchInput')
    const btnCloseSearch = document.querySelector('.btnCloseSearch')

    const platformFromTitle = document.querySelector('.platformFromTitle')
    const statusButtons = document.querySelectorAll<HTMLElement>('.btn-status');
    const totalOnline = document.querySelector('.totalOnline')
    const totalOffline = document.querySelector('.totalOffline')
    const platformItems = document.querySelector('.platformItems')
    //endregion

    // 👇 Variabel global untuk menyimpan marker dan map
    let markersMap = new Map();
    let mapInstance = null;
    let prevInfoWindow = null;

    let currPlatformType: string | null = null;
    let currHeartbeatStatus: string | null = "1";

    if (btnCloseSearch) {
        btnCloseSearch.addEventListener('click', () => {
            leftPanel.classList.remove('is-open')
            btnCloseSearch.classList.remove('opacity-100')
            currPlatformType = null
            platformItems.innerHTML = ''
        })
    }

    if (btnListSparing) {
        btnListSparing.addEventListener('click', async () => {
            leftPanel.classList.add('is-open')

            if (btnCloseSearch) {
                btnCloseSearch.classList.add('opacity-100')
            }

            if (currPlatformType !== "SPARING") {
                currPlatformType = "SPARING";
                await handleDataPlatforms("SPARING", currHeartbeatStatus)
            }
        })
    }

    if (btnListAqms) {
        btnListAqms.addEventListener('click', async () => {
            leftPanel.classList.add('is-open')

            if (btnCloseSearch) {
                btnCloseSearch.classList.add('opacity-100')
            }

            if (currPlatformType !== "AQMS") {
                currPlatformType = "AQMS";
                await handleDataPlatforms("AQMS", currHeartbeatStatus)
            }
        })
    }

    function setActiveStatus(clickedButton: HTMLElement) {
        statusButtons.forEach(button => {
            button.classList.remove('active');
        });
        clickedButton.classList.add('active');
    }

    if (statusButtons) {
        statusButtons.forEach((elm) => {
            elm.addEventListener('click', async () => {
                const dataStatus = elm.getAttribute('data-status')
                setActiveStatus(elm)
                currHeartbeatStatus = dataStatus
                await handleDataPlatforms(currPlatformType, currHeartbeatStatus)
            })
        })
    }

    //region Handle Left Panel Platforms
    async function handleDataPlatforms(titleType: string, heartbeatStatus: string, search?: any) {
        platformFromTitle.textContent = titleType

        const response = await fetch(`${url.pathname}/data-platforms`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken
            },
            body: JSON.stringify({
                titleType: titleType,
                heartbeatStatus: heartbeatStatus,
                search
            })
        })

        const {status} = response
        const {message, onlineCount, offlineCount, data} = await response.json()
        if (status === 200) {
            platformItems.innerHTML = ''
            if (data.length !== 0) {
                data.forEach((item: any) => {
                    if (titleType === 'SPARING') {
                        const {uid, status_platform, thumbnail_path, thumbnail_file, site} = item
                        const {customer_lokasi} = site
                        const {nama_lokasi, customer} = customer_lokasi
                        const {nama_perusahaan} = customer

                        totalOnline.textContent = `(${onlineCount})`
                        totalOffline.textContent = `(${offlineCount})`

                        const cardData: CardData = {
                            imageUrl: thumbnail_path ? `/storage/${thumbnail_path}/${thumbnail_file}` : 'https://placehold.co/70',
                            title: uid,
                            subtitle: `${nama_perusahaan} / ${nama_lokasi}`,
                            status: status_platform,
                            imageAlt: `${uid}`,
                            uid: uid // 👈 Tambahkan uid
                        };

                        const card = createPlatformCard(cardData);
                        platformItems.appendChild(card);

                        // 👇 Event click untuk SPARING
                        card.addEventListener('click', () => {
                            focusToMarker(uid);
                        });
                    } else {
                        const {uid, heartbeat_status, thumbnail_path, thumbnail_file, sites} = item
                        const {site_name, companies} = sites
                        const {company_name} = companies

                        totalOnline.textContent = `(${onlineCount})`
                        totalOffline.textContent = `(${offlineCount})`
                        const cardData: CardData = {
                            imageUrl: thumbnail_path ? `/storage/${thumbnail_path}/${thumbnail_file}` : 'https://placehold.co/70',
                            title: uid,
                            subtitle: `${company_name} / ${site_name}`,
                            status: heartbeat_status !== null ? heartbeat_status : 'offline',
                            imageAlt: `${uid}`,
                            uid: uid // 👈 Tambahkan uid
                        };

                        const card = createPlatformCard(cardData);
                        platformItems.appendChild(card);

                        // 👇 Event click untuk AQMS
                        card.addEventListener('click', () => {
                            focusToMarker(uid);
                        });
                    }
                })
            }
        } else {
            platformItems.innerHTML = ''
            failureAlert({
                html: message
            })
        }
    }

    // 👇 Function untuk fokus ke marker
    function focusToMarker(uid: string) {
        const markerData = markersMap.get(uid);

        if (markerData && mapInstance) {
            const {marker, infowindow} = markerData;

            // Tutup info window sebelumnya jika ada
            if (prevInfoWindow) {
                prevInfoWindow.close();
            }

            // Fokus ke marker dengan animasi smooth
            mapInstance.panTo(marker.position);

            // Zoom in untuk melihat marker lebih jelas
            mapInstance.setZoom(15);

            // Buka info window
            infowindow.open(mapInstance, marker);
            prevInfoWindow = infowindow;

            // Optional: Tutup left panel setelah diklik
            // leftPanel.classList.remove('is-open');
            // if (btnCloseSearch) {
            //     btnCloseSearch.classList.remove('opacity-100');
            // }
        }
    }

    function createPlatformCard(data: CardData): HTMLDivElement {
        // Container utama
        const container = document.createElement('div');
        container.className = 'aqms-container cursor-pointer px-4 py-3 flex items-center gap-2 hover:bg-gray-100 hover:rounded-xl transition-all duration-150 ease-linear';

        // 👇 Tambahkan data-uid untuk debugging
        container.setAttribute('data-uid', data.uid);

        // Image container
        const imageContainer = document.createElement('div');
        imageContainer.className = 'w-[70px] h-[70px] rounded-md';

        const img = document.createElement('img');
        img.src = data.imageUrl;
        img.className = 'w-[70px] h-[70px] object-cover rounded-md';
        img.alt = data.imageAlt || data.title;

        imageContainer.appendChild(img);

        // Content container
        const contentContainer = document.createElement('div');

        // Title
        const title = document.createElement('div');
        title.className = 'font-bold';
        title.textContent = data.title;

        // Subtitle
        const subtitle = document.createElement('div');
        subtitle.className = 'font-normal text-[12px] text-gray-400';
        subtitle.textContent = data.subtitle;

        // Status container
        const statusContainer = document.createElement('div');
        statusContainer.className = 'online-status-container';

        const statusIndicator = document.createElement('div');
        statusIndicator.className = data.status;

        const statusText = document.createElement('div');
        statusText.className = 'font-normal text-[12px] text-gray-400';
        statusText.textContent = data.status === 'online' ? 'Online' : 'Offline';

        statusContainer.appendChild(statusIndicator);
        statusContainer.appendChild(statusText);

        // Append semua ke content container
        contentContainer.appendChild(title);
        contentContainer.appendChild(subtitle);
        contentContainer.appendChild(statusContainer);

        // Append ke container utama
        container.appendChild(imageContainer);
        container.appendChild(contentContainer);

        return container;
    }

    //endregion

    //region Google Maps
    const loader = new Loader({
        apiKey: "AIzaSyAGK1ffZ1HjoenaTDRZDEV5HW783uTC7EY",
        version: "weekly",
    })

    Promise.all([
        loader.importLibrary('maps'),
        loader.importLibrary('marker')
    ]).then(([mapsLib, markerLib]) => {

        const {Map} = mapsLib

        //region Handle Map Options
        const center = {lat: -2.44565, lng: 117.8888}
        const map = new Map(document.getElementById("map"), {
            center: center,
            zoom: 5,
            mapId: '8a026e9e5249f8152d589498',
            mapTypeControl: false,
            fullscreenControl: false,
            streetViewControl: false,
            zoomControl: false,
            zoomControlOptions: {
                position: google.maps.ControlPosition.LEFT_BOTTOM
            },
        })

        mapInstance = map;
        //endregion

        handleDataPlatformMarker(map, google).then(null)

    })
    //endregion

    //region Handle Data Platform Marker
    async function handleDataPlatformMarker(map, google) {
        const response = await fetch(`${url.pathname}/data-platforms-marker`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken
            },
        })

        const {status} = response
        const {message, data} = await response.json()
        if (status === 200) {
            if (data.length !== 0) {
                // 👇 Clear markers sebelum populate ulang
                markersMap.clear();

                let prev_infowindow = null
                const markerPointer = []
                const bounds = new google.maps.LatLngBounds()
                data.map((item: any) => {
                    const {platform_type, uid, lat, lng, images, location, status_online, total_logger} = item

                    //region Handle Marker Color
                    let markerColor = '#16c901'
                    if (platform_type === 'sparing') {
                        if (status_online === 'offline') {
                            markerColor = '#ff3131'
                        } else {
                            markerColor = '#16c901'
                        }
                    } else {
                        if (status_online === 'offline') {
                            markerColor = '#ff3131'
                        } else {
                            markerColor = '#4288fd'
                        }
                    }
                    //endregion

                    //region Info Window
                    const headerContent = document.createElement('div');
                    headerContent.className = 'font-bold';
                    headerContent.innerHTML = `${platform_type === 'sparing' ? 'SPARING' : 'AQMS'} - ${uid}`

                    let thumbnail = 'https://placehold.co/270'
                    if (images) {
                        thumbnail = images
                    }

                    let badgeStatus = 'ds-badge-success'
                    if (status_online === 'offline')
                        badgeStatus = 'ds-badge-error'

                    let statusPlatform = 'Online'
                    if (status_online === 'offline') {
                        statusPlatform = 'Offline'
                    }

                    let footerContent = `
                        <div class="mt-3">
                            <div class="flex items-center justify-between">
                                <a class="text-blue-500" href="/${platform_type}/dashboard/maps/summary/detail/${uid}/1">View Detail <i class="fas fa-arrow-right ml-2"></i></a>
                                <div class="ds-badge ds-badge-outline ${badgeStatus} !text-[11px] capitalize ml-10">${statusPlatform}</div>
                            </div>
                        </div>
                    `;

                    if (platform_type === 'sparing') {
                        if (total_logger === 2) {
                            footerContent = `
                                <div class="mt-3">
                                    <div class="flex items-center justify-between">
                                        <a class="px-4 py-2 flex-1 text-center rounded-md hover:bg-gray-300 cursor-pointer font-bold" href="/sparing/dashboard/maps/summary/detail/${uid}/1">
                                            Internal
                                        </a>
                                        <a class="px-4 py-2 flex-1 text-center rounded-md hover:bg-gray-300 cursor-pointer font-bold" href="/sparing/dashboard/maps/summary/detail/${uid}/2">
                                            KLHK
                                        </a>
                                    </div>
                                </div>
                            `
                        }
                    } else {
                        footerContent = `
                            <div class="mt-3">
                                <div class="flex items-center justify-between">
                                    <a class="text-blue-500" href="/aqms/reports/logs-parameter?platformUid=${uid}">View Report <i class="fas fa-arrow-right ml-2"></i></a>
                                    <div class="ds-badge ds-badge-outline ${badgeStatus} !text-[11px] capitalize ml-10">${statusPlatform}</div>
                                </div>
                            </div>
                        `;
                    }

                    const infowindow = new google.maps.InfoWindow({
                        content: `
                            <div class="info-window">
                                <div>
                                    <div class="flex items-center overflow-hidden w-full h-[300px]">
                                        <img src="${thumbnail}" class="object-center" width="300" alt="x">
                                    </div>
                                    <div class="mt-2">
                                        <div class="mb-2">
                                            <div class="font-bold">Location :</div>
                                            <div class="text-[12px]">${location}</div>
                                        </div>
                                    </div>
                                </div>
                                ${footerContent}
                            </div>
                        `,
                        headerContent: headerContent,
                        minWidth: 300,
                        maxWidth: 300,
                        zIndex: 99
                    })
                    //endregion

                    const marker = new google.maps.marker.AdvancedMarkerElement({
                        position: {lat, lng},
                        map,
                        title: `${uid}`,
                        content: platform_type === 'sparing' ? createSparingMarker(markerColor) : createAQMSMarker(markerColor),
                    })

                    function createSparingMarker(color: string) {
                        const div = document.createElement('div');
                        div.style.filter = 'drop-shadow(0 2px 2px rgba(0,0,0,0.3))';
                        div.innerHTML = `
                            <svg width="37" height="37" viewBox="0 0 44 48" fill="none">

                                <!-- Pin body CHUBBY & SMOOTH -->
                                <path d="M22 2C12.6 2 5 9.6 5 19c0 6 10 20 15 24 1 1 2 1 4 0 5-4 15-18 15-24 0-9.4-7.6-17-17-17z"
                                      fill="white" stroke="${color}" stroke-width="0"/>

                                <!-- Circle warna di tengah -->
                                <circle cx="22" cy="19" r="14" fill="${color}"/>

                                <!-- Wave icon realistis -->
                                <g transform="translate(22, 19) scale(0.08) translate(-130, -130)">
                                    <path d="M30.62988,79.49609a11.99872,11.99872,0,0,1,1.874-16.86621c1.23242-.98633,12.56543-9.7666,30.58593-14.27148,16.94727-4.2334,43.1211-5.30762,71.56641,13.65722,40.23389,26.82129,73.51563.87891,73.84766.61426a11.9996,11.9996,0,0,1,14.99218,18.74024c-1.23242.98633-12.56543,9.7666-30.58593,14.27148a85.50742,85.50742,0,0,1-20.71485,2.56152c-14.69531.001-32.28808-3.84277-50.85156-16.21874-40.23389-26.82227-73.51563-.87891-73.84766-.61426A11.9974,11.9974,0,0,1,30.62988,79.49609Zm177.874,39.13379c-.332.26563-33.61377,26.20606-73.84766-.61426C106.21094,99.05176,80.03711,100.125,63.08984,104.3584c-18.0205,4.50488-29.35351,13.28515-30.58593,14.27148a11.9996,11.9996,0,1,0,14.99218,18.74024c.332-.26563,33.61377-26.20606,73.84766.61426,18.56348,12.376,36.15625,16.21972,50.85156,16.21874a85.50742,85.50742,0,0,0,20.71485-2.56152c18.0205-4.50488,29.35351-13.28515,30.58593-14.27148a11.9996,11.9996,0,0,0-14.99218-18.74024Zm0,56c-.332.26465-33.61377,26.208-73.84766-.61426C106.21094,155.05176,80.03711,156.125,63.08984,160.3584c-18.0205,4.50488-29.35351,13.28515-30.58593,14.27148a11.9996,11.9996,0,1,0,14.99218,18.74024c.332-.26465,33.61377-26.20606,73.84766.61426,18.56348,12.376,36.15625,16.21972,50.85156,16.21874a85.50742,85.50742,0,0,0,20.71485-2.56152c18.0205-4.50488,29.35351-13.28515,30.58593-14.27148a11.9996,11.9996,0,1,0-14.99218-18.74024Z"
                                          fill="white"/>
                                </g>
                            </svg>
                        `;
                        return div;
                    }

                    function createAQMSMarker(color: string) {
                        const div = document.createElement('div');
                        div.style.filter = 'drop-shadow(0 2px 2px rgba(0,0,0,0.3))';
                        div.innerHTML = `
                            <svg width="37" height="37" viewBox="0 0 44 48" fill="none">

                                <!-- Pin body CHUBBY & SMOOTH -->
                                <path d="M22 2C12.6 2 5 9.6 5 19c0 6 10 20 15 24 1 1 2 1 4 0 5-4 15-18 15-24 0-9.4-7.6-17-17-17z"
                                      fill="white" stroke="${color}" stroke-width="0"/>

                                <!-- Circle warna di tengah -->
                                <circle cx="22" cy="19" r="14" fill="${color}"/>

                                <!-- Cloud & wind icon -->
                                <g transform="translate(22, 19) scale(0.4) translate(-32, -28)">

                                    <!-- Wind lines dengan BORDER (layer bawah - warna) -->
                                    <path d="M34,40c0,2.761,2.238,5,5,5s5-2.239,5-5s-2.238-5-5-5H8" fill="none" stroke="${color}" stroke-width="10" stroke-miterlimit="10" opacity="0.9"></path>
                                    <path d="M43,20c0-2.761,2.238-5,5-5s5,2.239,5,5s-2.238,5-5,5H8" fill="none" stroke="${color}" stroke-width="10" stroke-miterlimit="10" opacity="0.9"></path>

                                    <!-- Wind lines putih di atas (layer atas) -->
                                    <path d="M34,40c0,2.761,2.238,5,5,5s5-2.239,5-5s-2.238-5-5-5H8" fill="none" stroke="white" stroke-width="7" stroke-miterlimit="10"></path>
                                    <path d="M43,20c0-2.761,2.238-5,5-5s5,2.239,5,5s-2.238,5-5,5H8" fill="none" stroke="white" stroke-width="7" stroke-miterlimit="10"></path>
                                </g>
                            </svg>
                        `;
                        return div;
                    }

                    marker.addListener('click', function () {
                        if (prev_infowindow)
                            prev_infowindow.close()

                        prev_infowindow = infowindow
                        prevInfoWindow = infowindow // 👈 Update global prevInfoWindow
                        infowindow.open(map, marker)
                    })

                    bounds.extend(marker.position)
                    markerPointer.push(marker)

                    // 👇 Simpan marker dengan uid sebagai key
                    markersMap.set(uid, {
                        marker: marker,
                        infowindow: infowindow,
                        position: {lat, lng}
                    });
                })

                map.fitBounds(bounds)
                new MarkerClusterer({map, markers: markerPointer})
            }
        }
    }

    //endregion

})
