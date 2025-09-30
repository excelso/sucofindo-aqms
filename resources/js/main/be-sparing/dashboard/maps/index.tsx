import {Loader} from "@googlemaps/js-api-loader";
import {checkClassList, delay, elapsedDate, getMetaContent, removeElmClass} from "@/js/plugins/functions";
import {Marker, MarkerClusterer} from "@googlemaps/markerclusterer";
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
                        <a href="/dashboard/maps/summary/detail/${uid}/${tipe_logger}" class="right-nav-item">
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

    loader.importLibrary('maps').then((libs) => {

        const {Map} = libs

        //region Handle Map Options
        const center = {lat: -2.44565, lng: 117.8888}
        const map = new Map(document.getElementById("map"), {
            center: center,
            zoom: 5,
            mapTypeControl: false,
            fullscreenControl: false,
            streetViewControl: false,
            zoomControl: true,
            zoomControlOptions: {
                position: google.maps.ControlPosition.LEFT_BOTTOM
            },
        })
        //endregion

        //region Handle Map Style
        let hideLabels = [{
            featureType: "administrative.province",
            stylers: [{visibility: "on"}]
        }, {
            featureType: "administrative.locality",
            stylers: [{visibility: "on"}]
        }, {
            featureType: "poi",
            stylers: [{visibility: "off"}]
        }, {
            featureType: 'transit',
            stylers: [{visibility: 'on'}]
        }, {
            featureType: 'landscape.natural',
            stylers: [{visibility: 'off'}]
        }];

        map.setOptions({styles: hideLabels});
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
                    const {uid, lat, lng, alamat_platform, status_platform, tipe_logger, total_logger, site, status_validasi} = item
                    const {nama_site, customer, customer_lokasi} = site || {}
                    const {nama_lokasi} = customer_lokasi || {}
                    const {nama_perusahaan, alamat, jenis_industri} = customer || {}
                    const {parameter, jenis_industri: nama_jenis} = jenis_industri || {}

                    let badgeStatus = 'ds-badge-success'
                    if (status_platform === 'offline')
                        badgeStatus = 'ds-badge-error'

                    let statusPlatform = 'Online'
                    if (status_validasi === 'Active') {
                        if (status_platform === 'offline') {
                            statusPlatform = 'Offline'
                        }
                    } else {
                        statusPlatform = 'Belum Aktif'
                    }

                    //region Handle Marker Color
                    let markerColor = '#16c901'
                    if (status_platform === 'offline') {
                        markerColor = '#ff3131'
                    }
                    //endregion

                    let footerWindow = `
                        <div class="p-4">
                            <div class="flex items-center justify-between">
                                <a class="text-blue-500" href="/dashboard/maps/summary/detail/${uid}/${tipe_logger}">Lihat Detail <i class="fas fa-arrow-right ml-2"></i></a>
                                <div class="ds-badge ds-badge-outline ${badgeStatus} !text-[11px] capitalize ml-10">${statusPlatform}</div>
                            </div>
                        </div>
                    `
                    if (total_logger == 2) {
                        footerWindow = `
                            <div class="p-0">
                                <div class="flex items-center justify-between">
                                    <a class="p-4 flex-1 text-center hover:bg-gray-300 cursor-pointer font-bold border-r" href="/dashboard/maps/summary/detail/${uid}/1">
                                        Internal
                                    </a>
                                    <a class="p-4 flex-1 text-center hover:bg-gray-300 cursor-pointer font-bold" href="/dashboard/maps/summary/detail/${uid}/2">
                                        KLHK
                                    </a>
                                </div>
                            </div>
                        `
                    }

                    const infowindow = new google.maps.InfoWindow({
                        content: `
                            <div class="info-window w-auto min-w-[300px] max-w-[300px]">
                                <div class="p-4 border-b border-[1px]">
                                    <div class="font-bold text-[14px]">${nama_perusahaan}</div>
                                    <div class="flex items-center mt-1.5">
                                        <div class="w-[3px] h-[13px] bg-gray-400 mr-2"></div>
                                        <div class="text-[12px]">${uid} - ${nama_site}</div>
                                    </div>
                                    <div class="mt-5">
                                        <div class="mb-2">
                                            <div class="font-bold">Lokasi :</div>
                                            <div class="text-[12px]">${nama_lokasi}</div>
                                        </div>
                                        <div class="mb-2">
                                            <div class="font-bold">Jenis Industri :</div>
                                            <div class="text-[12px]">${nama_jenis}</div>
                                        </div>
                                        <div class="mb-1">
                                            <div class="font-bold">Alamat :</div>
                                            <div class="text-[12px]">${alamat_platform !== null ? alamat_platform : '-'}</div>
                                        </div>
                                    </div>
                                </div>
                                ${footerWindow}
                            </div>
                        `
                    })

                    const marker = new google.maps.Marker({
                        position: {lat, lng},
                        icon: {
                            path: 'M215.7 499.2C267 435 384 279.4 384 192C384 86 298 0 192 0S0 86 0 192c0 87.4 117 243 168.3 307.2c12.3 15.3 35.1 15.3 47.4 0zM192 128a64 64 0 1 1 0 128 64 64 0 1 1 0-128z',
                            scale: 0.055,
                            strokeWeight: 0.2,
                            strokeColor: markerColor,
                            strokeOpacity: 1,
                            fillColor: markerColor,
                            fillOpacity: 0.9,
                            anchor: new google.maps.Point(384 / 2, 512),
                        },
                        title: `${uid} - ${nama_site}`,
                        map,
                    })

                    marker.addListener('click', function () {
                        if (prev_infowindow)
                            prev_infowindow.close()

                        prev_infowindow = infowindow
                        infowindow.open(map, marker)
                    })
                    bounds.extend(marker.position)
                    markerPointer.push(marker)
                })

                map.fitBounds(bounds)
                new MarkerClusterer({map, markers: markerPointer})
            }
        }
    }

    //endregion

})
