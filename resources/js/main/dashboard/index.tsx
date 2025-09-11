import Hls from "hls.js";
import {closeModalDialog, showModalDialog} from "@/js/plugins/modal";
import {AirQualityCardManager, CameraData, MetricsData} from "@/js/main/dashboard/airQualityCardManager";
import Highcharts from "highcharts";
import {
    convertWebRTCToWhepUrl,
    formatter,
    getMetaContent, handleFixedTd,
    handleFixedTheadTh, hiddenElm, htmlEntities,
    renderPagination, showHiddenElm,
    tableTooltip,
    triggerTableTooltip
} from "@/js/plugins/functions";
import {failureAlert, waitLoader} from "@/js/plugins/sweet-alert";
import {SocketClient} from "@/js/plugins/SocketClient";
import Swal from "sweetalert2";
import moment from "moment-timezone";
import MapsHelper from "@/js/plugins/mapsHelper";
import VideoStreamHandler from "@/js/plugins/videoStreamHandler";
import HikvisionPTZController from "@/js/plugins/hikvisionPTZController";
import videojs from "video.js";
import {MediaMtxWhepPlayer} from "@/js/plugins/MediaMtxWhepPlayer";
import {CamerasConfig, EnhancedVideoStreamHandler} from "@/js/plugins/EnhancedVideoStreamHandler";
import OnvifPTZController from "@/js/plugins/OnvifPTZController";
import {ExPicker} from "@/js/experiment/ex-picker";
import {PlatformSkeletonManager} from "@/js/main/dashboard/platformSkeletonManager";

document.addEventListener('DOMContentLoaded', function () {
    const csrfToken = getMetaContent('csrf-token')
    const url = new URL(window.location.href)
    const win: Window = window

    const appEnv: HTMLInputElement = document.querySelector('.app_env')
    const datePeriod: HTMLElement = document.querySelector('.datePeriod')
    const modalCctv: HTMLElement = document.querySelector('.modalCctv')
    const modalBody: HTMLElement = modalCctv.querySelector('.modal-body')
    const bodyCamera: HTMLElement = modalBody.querySelector('.body-camera')
    const modalCctvRecord: HTMLElement = document.querySelector('.modalCctvRecord')
    const modalBodyRecord: HTMLElement = modalCctvRecord.querySelector('.modal-body')
    const bodyCameraRecord: HTMLElement = modalBodyRecord.querySelector('.body-camera')

    const modalDetailParameter = document.querySelector('.modalDetailParameter')
    const bodyChart: HTMLElement = modalDetailParameter.querySelector('.bodyChart')
    const paramNotFound = modalDetailParameter.querySelector('.paramNotFound')
    const paramLoader = modalDetailParameter.querySelector('.paramLoader')
    const regulationNote: HTMLDivElement = modalDetailParameter.querySelector('.regulationNote')

    const modalHeartbeat = document.querySelector('.modalHeartbeat')
    const onlinePercentage = modalHeartbeat.querySelector('.onlinePercentage')
    const onlinePercentageBody = modalHeartbeat.querySelector('.onlinePercentageBody')
    const offlinePercentage = modalHeartbeat.querySelector('.offlinePercentage')
    const offlinePercentageBody = modalHeartbeat.querySelector('.offlinePercentageBody')
    const btnDownload = modalHeartbeat.querySelector('.btnDownload')
    const tHeartbeatData = modalHeartbeat.querySelector('.tHeartbeatData')
    const heartbeatNotFound = modalHeartbeat.querySelector('.heartbeatNotFound')
    const heartbeatLoader = modalHeartbeat.querySelector('.heartbeatLoader')
    const footerHeartbeat = modalHeartbeat.querySelector('.footerHeartbeat')

    const modalPlatformReport = document.querySelector('.modalPlatformReport')
    const goodStatus = modalPlatformReport.querySelector('.goodStatus')
    const goodLimit = modalPlatformReport.querySelector('.goodLimit')
    const modeStatus = modalPlatformReport.querySelector('.modeStatus')
    const modeLimit = modalPlatformReport.querySelector('.modeLimit')
    const nogoStatus = modalPlatformReport.querySelector('.nogoStatus')
    const nogoLimit = modalPlatformReport.querySelector('.nogoLimit')
    const tReportData = modalPlatformReport.querySelector('.tReportData')
    const reportNotFound = modalPlatformReport.querySelector('.reportNotFound')
    const reportLoader = modalPlatformReport.querySelector('.reportLoader')
    const footerReport = modalPlatformReport.querySelector('.footerReport')

    const btnSearch = document.querySelector('.btnSearch')
    const modalSearch = document.querySelector('.modalPencarian')

    const modalMaps = document.querySelector('.modalMaps')
    const mapsBody: HTMLDivElement = document.querySelector('#mapsBody')

    const closeModalForm = document.querySelectorAll('.closeModalForm')

    const cameraRecord = new EnhancedVideoStreamHandler({
        autoplay: true,
        controls: true,
        muted: true,
        maxHeight: '100vh',
        videoHeight: '400px',
        retryAttempts: 5,
    });

    const cameraLive = new EnhancedVideoStreamHandler({
        autoplay: true,
        controls: true,
        muted: true,
        maxHeight: '100vh',
        videoHeight: '400px',
        retryAttempts: 5,
    });

    //region Handle Close Menu
    closeModalForm.forEach((elm) => {
        elm.addEventListener('click', function () {
            closeModalDialog(modalCctv, () => {
                cameraLive.destroy();
            })

            closeModalDialog(modalCctvRecord, () => {
                cameraRecord.destroy();
            })

            closeModalDialog(modalDetailParameter)
            closeModalDialog(modalHeartbeat, () => {
                onlinePercentage.textContent = `0%`
                offlinePercentage.textContent = `0%`
                tHeartbeatData.innerHTML = null
            })

            closeModalDialog(modalMaps)
            closeModalDialog(modalPlatformReport, () => {
                tReportData.innerHTML = null
            })

            if (modalSearch) {
                closeModalDialog(modalSearch)
            }
        })
    })
    //endregion

    //region Handle AQI Card
    const platform = new PlatformSkeletonManager({
        containerSelector: '.airQualityParent',
        apiEndpoint: '/dashboard/platforms',
        apiEndpointData: '/dashboard/platform/{uid}/data',
        enableCharts: true,
        realTimeUpdateInterval: 120000,
        enableSocketIO: false,

        // Event handlers
        onCctvClick: (uid, cameraData) => showModalLiveVideo(bodyCamera, uid, cameraData),
        onMetricsClick: (uid, metrics) => {
            showModalDialog(modalDetailParameter, `<i class="fas fa-file mr-2"></i> ${uid}`, async () => {
                let regulation = 'Noise: KepmenLH Nomor 48 Tahun 1996'
                if (metrics.type === 'pm25') {
                    regulation = 'BML Parameter PM 2.5 mengacu pada PP Nomor 22 Tahun 2021'
                } else if (metrics.type === 'pm10') {
                    regulation = 'BML Parameter PM 10 mengacu pada PP Nomor 22 Tahun 2021'
                } else if (metrics.type === 'tsp') {
                    regulation = 'BML Parameter TSP mengacu pada PP Nomor 22 Tahun 2021'
                }

                regulationNote.textContent = regulation
                await handleDetailChart(uid, metrics)
            })
        },
        onClickAirIndexPoint: async (events, pointData) => {
            const {linkVideo} = pointData
            const {uid, linkVideoRecorded} = linkVideo

            if (linkVideoRecorded) {
                showModalVideoRecord(bodyCameraRecord, uid, linkVideoRecorded)
            }
        },
        onHeartbeatStatusClick: (id) => {
            handleModalHeartbeat(id)
        },
        onSiteLocationClick: (id, lat, lng) => {
            showModalDialog(modalMaps, null, () => {
                const mapsHelper = new MapsHelper();
                mapsHelper.mapsConfig(mapsBody).then(({map, google}) => {
                    map.setCenter({lat, lng})
                    map.setZoom(11);
                    new google.maps.Marker({
                        position: {lat, lng},
                        icon: {
                            path: 'M215.7 499.2C267 435 384 279.4 384 192C384 86 298 0 192 0S0 86 0 192c0 87.4 117 243 168.3 307.2c12.3 15.3 35.1 15.3 47.4 0zM192 128a64 64 0 1 1 0 128 64 64 0 1 1 0-128z',
                            scale: 0.055,
                            strokeWeight: 0.2,
                            strokeColor: '#16c901',
                            strokeOpacity: 1,
                            fillColor: '#16c901',
                            fillOpacity: 0.9,
                            anchor: new google.maps.Point(384 / 2, 512),
                        },
                        map,
                    });
                })
            })
        },
        onStatusClick: (uid) => {
            handleModalReportPlatform(uid)
        }
    });

    const urlParams = new URLSearchParams(url.searchParams)
    if (urlParams.size !== 0) {
        datePeriod.textContent = moment(urlParams.get('date')).format('DD MMM YYYY')
    } else {
        datePeriod.textContent = moment().format('DD MMM YYYY')
    }

    //region Handle Search
    if (btnSearch) {
        btnSearch.addEventListener('click', function () {
            showModalDialog(modalSearch, null, () => {
                const btnResetSearch = modalSearch.querySelector('.btnResetSearch')
                const date: HTMLInputElement = modalSearch.querySelector('.date')
                const btnCari = modalSearch.querySelector<HTMLElement>('.btnSearch')

                new ExPicker(date, {
                    dateFormat: 'yyyy-mm-dd',
                    firstYear: 1950,
                    maxDate: moment().format('YYYY-MM-DD'),
                })

                modalSearch.addEventListener('keypress', function (ev: KeyboardEvent) {
                    if (ev.key === 'Enter') {
                        $(btnCari).trigger('click')
                    }
                })

                btnCari.addEventListener('click', function () {
                    const elmPencarian = modalSearch.querySelectorAll<HTMLInputElement>('[name]')
                    elmPencarian.forEach((elm) => {
                        const elmNames = elm.getAttribute('name')
                        if (elm.value !== '') {
                            url.searchParams.set(elmNames, elm.value)
                        } else {
                            url.searchParams.delete(elmNames)
                        }
                    })

                    closeModalDialog(modalSearch, async () => {
                        history.pushState(null, '', url.toString())
                        datePeriod.textContent = moment(date.value).format('DD MMM YYYY')
                        await platform.filter({
                            date: date.value
                        })
                    })
                })

                btnResetSearch.addEventListener('click', function () {
                    const urlParams = new URLSearchParams(url.searchParams)
                    if (urlParams.size !== 0) {
                        [...urlParams.keys()].forEach((item) => {
                            if (item !== 'sort') {
                                url.searchParams.delete(item)
                            }
                        })

                        closeModalDialog(modalSearch, async () => {
                            datePeriod.textContent = moment().format('DD MMM YYYY')
                            history.pushState(null, '', url.toString())
                            await platform.filter({})
                            platform.checkAndRestartRealTime()
                        })
                    }
                })
            })
        })
    }
    //endregion

    //region Handle Open Video on AQI Chart
    const showModalVideoRecord = (modalBodyElm: HTMLElement, uid: any, videoUrl: string) => {
        showModalDialog(modalCctvRecord, `
            <div class="flex items-center">
                <img src="/images/vector/icons8-cctv-100.png" width="24" class="mr-2" alt=""/> ${uid}
            </div>
        `, () => {

            cameraRecord.initializeWithCameras(modalBodyElm, [
                {
                    cameraName: "Camera 1",
                    "videoLink": videoUrl,
                    "protocol": 'whep',
                    "supportPTZ": false,
                    "videoControl": true,
                }
            ]);
        })
    }
    //endregion

    //region Handle Open Video on AQI Chart
    const showModalLiveVideo = (bodyElm1: HTMLElement, uid: any, cameraData: CameraData[]) => {
        showModalDialog(modalCctv, `
            <div class="flex items-center">
                <img src="/images/vector/icons8-cctv-100.png" width="24" class="mr-2" alt=""/> ${uid}
            </div>
        `, async () => {

            const dataCamera: CamerasConfig = [];
            cameraData.forEach((item) => {
                dataCamera.push({
                    "cameraName": item.cameraName,
                    "videoLink": convertWebRTCToWhepUrl(item.videoLink),
                    "protocol": 'whep',
                    "supportPTZ": item.supportPTZ,
                    "videoControl": false,
                })
            })

            cameraLive.initializeWithCameras(bodyElm1, dataCamera)
            const onvif = new OnvifPTZController(csrfToken, uid);
            cameraLive.setPTZCallbacks({
                onMoveUpLeft: () => {
                    onvif.moveContinuous('up-left', 0.3)
                },
                onMoveUp: () => {
                    onvif.moveContinuous('up', 0.3)
                },
                onMoveUpRight: () => {
                    onvif.moveContinuous('up-right', 0.3)
                },
                onMoveDownLeft: () => {
                    onvif.moveContinuous('down-left', 0.3)
                },
                onMoveDown: () => {
                    onvif.moveContinuous('down', 0.3)
                },
                onMoveDownRight: () => {
                    onvif.moveContinuous('down-right', 0.3)
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
        })
    }
    //endregion

    //region Handle Chart Detail
    async function handleDetailChart(uid: string, metric: MetricsData) {
        hiddenElm(paramNotFound)
        showHiddenElm(paramLoader)

        let date = moment().format('YYYY-MM-DD')
        const urlParams = new URLSearchParams(url.searchParams)
        if (urlParams.size !== 0) {
            date = urlParams.get('date')
        }

        const response = await fetch(`/dashboard/detail-metric/${uid}?metric=${metric.type}&date=${date}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken
            },
        })

        const {status} = response
        const {message, data, timezone} = await response.json()
        if (status !== 200) {
            failureAlert({
                html: message
            })
            return
        }

        // region Helper Functions for Date Validation
        function isValidTimestamp(timestamp: number | undefined | null): boolean {
            return timestamp !== undefined &&
                    timestamp !== null &&
                    !isNaN(timestamp) &&
                    isFinite(timestamp) &&
                    timestamp > 0;
        }

        function isValidDate(date: Date | undefined | null): boolean {
            return date instanceof Date &&
                    !isNaN(date.getTime()) &&
                    isFinite(date.getTime());
        }

        function safeFormatTimestamp(timestamp: number | undefined | null, format: 'time' | 'datetime' = 'time', timezone: string = 'Asia/Jakarta', locale: string = 'id-ID', useSecond: boolean = false): string {
            if (!isValidTimestamp(timestamp)) {
                return format === 'time' ? '--:--' : 'Invalid Date';
            }

            try {
                const date = new Date(timestamp! * 1000);

                if (!isValidDate(date)) {
                    return format === 'time' ? '--:--' : 'Invalid Date';
                }

                if (format === 'time') {
                    const dateOptions: Intl.DateTimeFormatOptions = {
                        timeZone: timezone,
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                    };

                    if (useSecond) {
                        dateOptions.second = '2-digit';
                    }

                    return new Intl.DateTimeFormat(locale, dateOptions).format(date);
                } else {
                    // Untuk format datetime
                    const dateOptions: Intl.DateTimeFormatOptions = {
                        timeZone: timezone,
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                    };

                    if (useSecond) {
                        dateOptions.second = '2-digit';
                    }

                    return new Intl.DateTimeFormat(locale, dateOptions).format(date);
                }
            } catch (error) {
                console.warn('Error formatting timestamp:', error);
                return format === 'time' ? '--:--' : 'Invalid Date';
            }
        }

        function safeFormatDate(date: Date | undefined | null, timezone: string = 'Asia/Jakarta', locale: string = 'id-ID'): string {
            if (!isValidDate(date)) {
                return 'Invalid Date';
            }

            try {
                return new Intl.DateTimeFormat(locale, {
                    timeZone: timezone,
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false
                }).format(date!);
            } catch (error) {
                console.warn('Error formatting date:', error);
                return 'Invalid Date';
            }
        }

        // endregion

        hiddenElm(paramLoader)
        const chartData = data.map((item) => ({
            x: item.timestamp * 1000,
            y: item.value,
            timestamp: item.timestamp
        }));

        const yValues = chartData.map(point => point.y);
        const dataMaxY = Math.max(...yValues);

        const platformTimezone = timezone || 'Asia/Jakarta';
        const platformLocale = 'en-EN';

        Highcharts.chart({
            chart: {
                renderTo: bodyChart,
                type: 'spline',
                height: 350,
                style: {
                    fontFamily: 'Arial, sans-serif'
                }
            },
            title: {
                text: `${metric.title}`
            },
            subtitle: {
                text: null
            },
            credits: {enabled: false},
            xAxis: {
                type: 'datetime',
                labels: {
                    formatter: function () {
                        const timestampMs = this.value as number;
                        const timestampSeconds = timestampMs / 1000;
                        return safeFormatTimestamp(timestampSeconds, 'time', platformTimezone, platformLocale);
                    },
                    style: {
                        fontSize: '10px',
                        color: '#999'
                    }
                },
                gridLineWidth: 1,
                gridLineColor: '#eee',
                gridLineDashStyle: 'Dash',
                tickInterval: 3600 * 1000,
            },
            yAxis: {
                title: {
                    text: 'Metric Value'
                },
                labels: {enabled: true},
                gridLineWidth: 0,
                gridLineDashStyle: 'LongDash',
                min: 0,
                max: dataMaxY > metric.bml_max_buffer ? dataMaxY : (metric.bml_max_buffer + 50),
                plotLines: [
                    {
                        value: metric.bml_max,
                        width: 2,
                        dashStyle: 'Solid',
                        color: 'rgb(255,0,0)'
                    },
                    {
                        value: metric.bml_max_buffer,
                        width: 2,
                        dashStyle: 'Solid',
                        color: 'rgb(228,186,47)'
                    }
                ]
            },
            tooltip: {
                backgroundColor: 'white',
                borderWidth: 0,
                borderRadius: 8,
                shadow: true,
                style: {fontSize: '12px'},
                formatter: function () {
                    const timestampMs = this.x;
                    const timestampSeconds = timestampMs / 1000;
                    const formattedTime = safeFormatTimestamp(timestampSeconds, 'datetime', platformTimezone, platformLocale, true);
                    const timezoneShort = platformTimezone.split('/')[1] || platformTimezone;

                    return `<b>Time (${timezoneShort}):</b> ${formattedTime}<br><b>${metric.title}:</b> ${this.y} ${metric.unit}`;
                }
            },
            plotOptions: {
                spline: {
                    lineWidth: 3,
                    marker: {
                        enabled: false,
                        states: {
                            hover: {
                                enabled: true,
                                lineWidth: 2,
                                lineColor: 'white',
                                radius: 6
                            }
                        }
                    },
                    states: {
                        hover: {lineWidth: 3}
                    }
                }
            },
            series: [{
                type: 'line',
                name: `${metric.title}`,
                showInLegend: false,
                data: chartData,
                // color: {
                //     linearGradient: { x1: 0, x2: 0, y1: 1, y2: 0 },
                //     stops: [
                //         [0, '#ffffff'],
                //         [1, '#0079ff']
                //     ]
                // },
            }, {
                type: 'line',
                name: `Buffer (${metric.bml_max_buffer})`,
                color: 'rgb(228,186,47)'
            }, {
                type: 'line',
                name: `BML (${metric.bml_max})`,
                color: 'rgb(255,0,0)'
            }]
        }, function (chart) {

        });
    }

    //endregion

    //region Handle Modal Heartbeat Platform
    function handleModalHeartbeat(uid: string) {
        showModalDialog(modalHeartbeat, null, async () => {
            const urlParams = new URLSearchParams(url.searchParams)
            renderData({
                date: urlParams.get('date') ?? moment().format('YYYY-MM-DD'),
                filterStatus: 'All'
            })
        })

        function renderData(options?: any) {
            hiddenElm(heartbeatNotFound)
            showHiddenElm(heartbeatLoader)
            lookupData(options).then(response => {
                renderBody(uid, response, options.date)

                hiddenElm(heartbeatLoader)

                const {dataResponse} = response as any
                renderPagination(dataResponse, renderData, footerHeartbeat, options)
            })
        }

        function lookupData(options: any) {
            return new Promise(async (resolve, reject) => {
                const {url: dataLinks, date, filterStatus} = options || {}
                const dataUrl = dataLinks ? `${dataLinks}&date=${date}&status=${filterStatus}` : `/dashboard/platform-heartbeat/${uid}?date=${date}&status=${filterStatus}`
                const response = await fetch(dataUrl, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': csrfToken
                    },
                })

                const {status} = response
                const {message, onlinePercent, offlinePercent, data} = await response.json()
                if (status === 200) {
                    resolve({
                        dataResponse: data,
                        onlinePercent: onlinePercent,
                        offlinePercent: offlinePercent
                    })
                } else {
                    reject(message)
                }
            })
        }

        function renderBody(uid: string, response: any, date: string) {
            const {dataResponse, onlinePercent, offlinePercent} = response
            const {data} = dataResponse

            onlinePercentage.textContent = `${onlinePercent}%`
            onlinePercentageBody.addEventListener('click', () => {
                const urlParams = new URLSearchParams(url.searchParams)
                renderData({
                    date: urlParams.get('date') ?? moment().format('YYYY-MM-DD'),
                    filterStatus: 'Online'
                })
            })

            offlinePercentage.textContent = `${offlinePercent}%`
            offlinePercentageBody.addEventListener('click', () => {
                const urlParams = new URLSearchParams(url.searchParams)
                renderData({
                    date: urlParams.get('date') ?? moment().format('YYYY-MM-DD'),
                    filterStatus: 'Offline'
                })
            })

            if (btnDownload) {
                btnDownload.addEventListener('click', async function () {
                    await handleExportHeartbeat(uid, date)
                })
            }

            const itemBodies = []
            if (data.length !== 0) {
                data.map((item: any, index: number) => {
                    const {uid, heartbeat_status, date_formated} = item

                    let heartbeatStatus = '<span class="ds-badge ds-badge-outline ds-badge-success !text-[11px]">Online</span>'
                    if (heartbeat_status === 'Offline') {
                        heartbeatStatus = '<span class="ds-badge ds-badge-outline ds-badge-error !text-[11px]">Offline</span>'
                    }

                    itemBodies.push(`
                        <tr class="data-deduction">
                            <td class="text-center">${uid}</td>
                            <td class="text-left">${heartbeatStatus}</td>
                            <td class="text-center">${moment(date_formated).format('DD MMM YYYY - HH:mm')}</td>
                        </tr>
                    `)
                })

                tHeartbeatData.innerHTML = itemBodies.join('')

                tableTooltip()
                triggerTableTooltip()
                handleFixedTheadTh()
                handleFixedTd()
            } else {
                showHiddenElm(heartbeatNotFound)
            }
        }

        async function handleExportHeartbeat(uid: string, date: string) {
            await waitLoader('Downloading...', 'This may take longer.', async () => {
                const response = await fetch(`/dashboard/export-excel-heartbeat/${uid}?date=${date}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': csrfToken,
                        'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                    }
                });

                if (!response.ok) {
                    const {message} = await response.json();
                    Swal.close();

                    failureAlert({
                        html: message
                    })
                }

                const blob = await response.blob();
                Swal.close();

                const urlBlob = window.URL.createObjectURL(blob);
                const aLink = document.createElement('a');
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                aLink.href = urlBlob;
                aLink.download = `report-platform-status_${timestamp}.xlsx`;
                document.body.appendChild(aLink);
                aLink.click();
                setTimeout(() => URL.revokeObjectURL(urlBlob), 10000);
                document.body.removeChild(aLink);
            });
        }
    }

    //endregion

    //region Handle Modal Report Platform
    function handleModalReportPlatform(uid: string) {
        showModalDialog(modalPlatformReport, null, async () => {
            const urlParams = new URLSearchParams(url.searchParams)
            renderData({
                date: urlParams.get('date') ?? moment().format('YYYY-MM-DD'),
            })
        })

        function renderData(options?: any) {
            hiddenElm(reportNotFound)
            showHiddenElm(reportLoader)
            lookupData(options).then(response => {
                renderBody(uid, response)

                hiddenElm(reportLoader)

                const {dataResponse} = response as any
                renderPagination(dataResponse, renderData, footerReport, options)
            })
        }

        function lookupData(options: any) {
            return new Promise(async (resolve, reject) => {
                const {url: dataLinks, date} = options || {}
                const dataUrl = dataLinks ? `${dataLinks}&date=${date}` : `/dashboard/platform-report/${uid}?date=${date}`
                const response = await fetch(dataUrl, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': csrfToken
                    },
                })

                const {status} = response
                const {
                    message,
                    limit_tsp_min,
                    limit_tsp_max_buffer,
                    limit_tsp_max,
                    good_status,
                    mode_status,
                    nogo_status,
                    data
                } = await response.json()
                if (status === 200) {
                    resolve({
                        dataResponse: data,
                        limit_tsp_min,
                        limit_tsp_max_buffer,
                        limit_tsp_max,
                        good_status,
                        mode_status,
                        nogo_status,
                    })
                } else {
                    reject(message)
                }
            })
        }

        function renderBody(uid: string, response: any) {
            const {
                dataResponse,
                limit_tsp_max_buffer,
                limit_tsp_max,
                good_status,
                mode_status,
                nogo_status
            } = response
            const {from, data} = dataResponse

            goodStatus.textContent = `${good_status}%`
            goodLimit.textContent = `< ${limit_tsp_max_buffer} µg/m³`
            modeStatus.textContent = `${mode_status}%`
            modeLimit.textContent = `${limit_tsp_max_buffer} µg/m³ - ${limit_tsp_max} µg/m³`
            nogoStatus.textContent = `${nogo_status}%`
            nogoLimit.textContent = `> ${limit_tsp_max} µg/m³`

            const itemBodies = []
            if (data.length !== 0) {
                hiddenElm(reportNotFound)

                let no = from
                data.map((item: any) => {
                    const {
                        uid,
                        uid_alias,
                        datetime_unix,
                        max_pm_25,
                        max_pm_10,
                        max_tsp,
                        noise_leq,
                        max_aqi_index,
                        max_aqi_index_tsp,
                        limit
                    } = item
                    const {
                        tsp_max_buffer,
                        tsp_max
                    } = limit

                    let status = 'Good'
                    let statusColor = 'bg-green-200'
                    let statusEmo = htmlEntities('&#x1F601;')
                    if (max_tsp > tsp_max_buffer && max_tsp < tsp_max) {
                        status = 'Moderate'
                        statusColor = 'bg-orange-200'
                        statusEmo = htmlEntities('&#x1F61E;')
                    } else if (max_tsp > tsp_max) {
                        status = 'Nod Good'
                        statusColor = 'bg-red-300'
                        statusEmo = htmlEntities('&#x1F922;')
                    }

                    const dateTime = moment.unix(datetime_unix).tz('Asia/Makassar');

                    itemBodies.push(`
                        <tr class="data-deduction">
                            <td class="text-center">${no}</td>
                            <td class="text-center">${uid}</td>
                            <td class="text-center">${dateTime.format('DD MMM YYYY HH:mm:ss')}</td>
                            <td class="text-right">${max_pm_25}</td>
                            <td class="text-right">${max_pm_10}</td>
                            <td class="text-right">${max_tsp}</td>
                            <td class="text-right">${noise_leq}</td>
                            <td class="text-center">
                                ${max_aqi_index}
                            </td>
                            <td class="text-center">
                                ${max_aqi_index_tsp}
                            </td>
                            <td class="text-left">
                                <span class="status-badge inline-flex items-center rounded-full gap-1 px-[7px] py-[3px] ${statusColor} text-[12px] font-bold">
                                    ${statusEmo} ${status}
                                </span>
                            </td>
                        </tr>
                    `)

                    no++
                })

                tReportData.innerHTML = itemBodies.join('')

                tableTooltip()
                triggerTableTooltip()
                handleFixedTheadTh()
                handleFixedTd()
            } else {
                showHiddenElm(reportNotFound)
            }
        }
    }

    //endregion

})
