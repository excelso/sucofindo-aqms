import {Loader} from "@googlemaps/js-api-loader";
import {checkClassList, delay, elapsedDate, getMetaContent, removeElmClass} from "@/js/plugins/functions";
import {MarkerClusterer} from "@googlemaps/markerclusterer";
import tzLookup from "tz-lookup"

document.addEventListener('DOMContentLoaded', function () {

    //region Handle Init Component
    const csrfToken = getMetaContent('csrf-token')
    const url = new URL(window.location.href)

    const btnOpenNav = document.querySelector('.btnOpenNav')
    const btnCloseNav = document.querySelector('.btnCloseNav')
    const rightNav = document.querySelector('.right-nav')
    const loaderSearch = document.querySelector('.loaderSearch')
    const userLevel: HTMLInputElement = document.querySelector('.userLevel')
    const searchPlatform = document.querySelector('.searchPlatform')
    const bodyPlatforms = document.querySelector('.bodyPlatforms')
    //endregion

    let markersMap = new Map();
    let mapInstance = null;
    let prevInfoWindow = null;

    //region Handle Right Nav Platforms
    if (btnOpenNav) {
        btnOpenNav.addEventListener('click', function () {
            if (checkClassList(rightNav, 'close')) {
                removeElmClass(rightNav, 'close')
                $(rightNav).addClass('open')

                handleDataPlatforms('').then(null)
                $(searchPlatform).keyup(() => {
                    $(loaderSearch).html('<i class="fas fa-spinner fa-pulse"></i>')
                })
                $(searchPlatform).keyup(delay(() => {
                    handleDataPlatforms($(searchPlatform).val()).then(null)
                }, 1000))
            }
        })
    }

    if (btnCloseNav) {
        btnCloseNav.addEventListener('click', function () {
            if (checkClassList(rightNav, 'open')) {
                removeElmClass(rightNav, 'open')
                $(rightNav).addClass('close')
                $(searchPlatform).val('')
            }
        })
    }

    async function handleDataPlatforms(search: any) {
        $(bodyPlatforms).html(null)

        const response = await fetch(`${url.pathname}/data-platform`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken
            },
            body: JSON.stringify({
                search
            })
        })

        const {status} = response
        const {message, data} = await response.json()
        if (status === 200) {
            if (data.length !== 0) {
                $(loaderSearch).html('<i class="fas fa-search"></i>')

                const dataPlatforms = []
                data.map((item: any) => {
                    const {uid, status_platform, lat, lng, last_online, tipe_logger, site, status_validasi} = item || {}
                    const {nama_site} = site || {}

                    let statusPlatform = '<span class="ds-badge ds-badge-outline ds-badge-success !text-[12px]">Online</span>'
                    let lastOnline = ''
                    if (status_validasi === 'Active') {
                        if (status_platform === 'offline') {
                            statusPlatform = '<span class="ds-badge ds-badge-outline ds-badge-error !text-[12px]">Offline</span>'
                            if (last_online) {
                                lastOnline = `
                                    <div class="text-[13px]">
                                        <i class="fas fa-clock mr-1"></i> ${elapsedDate(last_online * 1000, tzLookup(lat, lng))}
                                    </div>
                                `
                            }
                        }
                    } else {
                        statusPlatform = '<span class="ds-badge ds-badge-outline ds-badge-error !text-[12px]">Belum Aktif</span>'
                    }

                    let tipeLogger = ` / ${tzLookup(lat, lng)}`
                    if (userLevel.value !== 'viewer') {
                        tipeLogger = ' / Internal'
                        if (tipe_logger === 2) {
                            tipeLogger = ' / KLHK'
                        }
                    }

                    dataPlatforms.push(`
                        <a href="/sparing/dashboard/maps/summary/detail/${uid}/${tipe_logger}" class="right-nav-item">
                            <div class="avatar"><span>${Array.from(uid)[0]}</span></div>
                            <div class="min-w-0">
                                <div class="text-[15px]">${uid}</div>
                                <div class="text-[13px] truncate">${nama_site} ${tipeLogger}</div>
                                ${lastOnline}
                            </div>
                            <div class="ml-auto shrink-0">
                                ${statusPlatform}
                            </div>
                        </a>
                    `)
                })

                // @ts-ignore
                $(bodyPlatforms).html(dataPlatforms)
            }
        }
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
        const response = await fetch(`${url.pathname}/data-platform-marker`, {
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
                let prev_infowindow = null
                const markerPointer = []
                const bounds = new google.maps.LatLngBounds()
                data.map((item: any) => {
                    const {platform_type, uid, lat, lng, images, location, status_online, total_logger} = item

                    //region Handle Marker Color
                    let markerColor = '#16c901'
                    if (status_online === 'offline') {
                        markerColor = '#ff3131'
                    }
                    //endregion

                    //region Info Window
                    const headerContent = document.createElement('div');
                    headerContent.className = 'font-bold';
                    headerContent.innerHTML = `${uid}`

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
                                <a class="text-blue-500" href="/sparing/dashboard/maps/summary/detail/${uid}/1">View Detail <i class="fas fa-arrow-right ml-2"></i></a>
                                <div class="ds-badge ds-badge-outline ${badgeStatus} !text-[11px] capitalize ml-10">${statusPlatform}</div>
                            </div>
                        </div>
                    `;

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
                        content: createSparingMarker(markerColor),
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
