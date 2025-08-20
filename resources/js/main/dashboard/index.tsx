import Hls from "hls.js";
import {closeModalDialog, showModalDialog} from "@/js/plugins/modal";
import {AirQualityCardManager, CameraData, MetricsData} from "@/js/main/dashboard/airQualityCardManager";
import Highcharts from "highcharts";
import {
    convertWebRTCToWhepUrl,
    formatter,
    getMetaContent, handleFixedTd,
    handleFixedTheadTh,
    renderPagination,
    tableTooltip,
    triggerTableTooltip
} from "@/js/plugins/functions";
import {failureAlert, waitLoader} from "@/js/plugins/sweet-alert";
import {SocketClient} from "@/js/plugins/SocketClient";
import Swal from "sweetalert2";
import moment from "moment";
import MapsHelper from "@/js/plugins/mapsHelper";
import VideoStreamHandler from "@/js/plugins/videoStreamHandler";
import HikvisionPTZController from "@/js/plugins/hikvisionPTZController";
import videojs from "video.js";
import {MediaMtxWhepPlayer} from "@/js/plugins/MediaMtxWhepPlayer";
import {CamerasConfig, EnhancedVideoStreamHandler} from "@/js/plugins/EnhancedVideoStreamHandler";
import OnvifPTZController from "@/js/plugins/OnvifPTZController";

document.addEventListener('DOMContentLoaded', function () {
    const csrfToken = getMetaContent('csrf-token')

    const appEnv: HTMLInputElement = document.querySelector('.app_env')
    const modalCctv: HTMLElement = document.querySelector('.modalCctv')
    const modalBody: HTMLElement = modalCctv.querySelector('.modal-body')
    const bodyCamera: HTMLElement = modalBody.querySelector('.body-camera')

    const modalDetailParameter = document.querySelector('.modalDetailParameter')
    const bodyChart: HTMLElement = modalDetailParameter.querySelector('.bodyChart')
    const regulationNote: HTMLDivElement = modalDetailParameter.querySelector('.regulationNote')

    const modalHeartbeat = document.querySelector('.modalHeartbeat')
    const onlinePercentage = modalHeartbeat.querySelector('.onlinePercentage')
    const offlinePercentage = modalHeartbeat.querySelector('.offlinePercentage')
    const tHeartbeatData = modalHeartbeat.querySelector('.tHeartbeatData')
    const footerHeartbeat = modalHeartbeat.querySelector('.footerHeartbeat')

    const modalMaps = document.querySelector('.modalMaps')
    const mapsBody: HTMLDivElement = document.querySelector('#mapsBody')

    const closeModalForm = document.querySelectorAll('.closeModalForm')

    const cameraRecord = new EnhancedVideoStreamHandler({
        autoplay: true,
        controls: true,
        muted: true,
        maxHeight: '100vh',
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
                cameraRecord.destroy();
                cameraLive.destroy();
            })

            closeModalDialog(modalDetailParameter)
            closeModalDialog(modalHeartbeat)
            closeModalDialog(modalMaps)
        })
    })
    //endregion

    //region Handle AQI Card
    new AirQualityCardManager({
        containerSelector: '.airQualityParent',
        batchSize: 50,
        enableLazyLoading: true,
        enableCharts: true,
        realTimeUpdateInterval: 60000,
        apiEndpoint: '/dashboard/platforms',
        autoLoadInitialData: false,
        onCctvClick: (id, cameraData) => {
            showModalLiveVideo(bodyCamera, id, cameraData)
        },
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
        onConnectionStatus: (status) => {
            console.log('Connection status:', status);
        },
        onClickAirIndexPoint: async (events, pointData) => {
            const { linkVideo } = pointData
            const { uid, linkVideoRecorded } = linkVideo

            if (linkVideoRecorded) {
                showModalVideoRecord(bodyCamera, uid, linkVideoRecorded)
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
        }
    });
    //endregion

    //region Handle Open Video on AQI Chart
    const showModalVideoRecord = (modalBodyElm: HTMLElement, uid: any, videoUrl: string) => {
        showModalDialog(modalCctv, `
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
        })
    }
    //endregion

    //region Handle Chart Detail
    async function handleDetailChart(uid: string, metric: MetricsData) {

        const response = await fetch(`/dashboard/detail-metric/${uid}?metric=${metric.type}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken
            },
        })

        const {status} = response
        const {message, data} = await response.json()
        if (status !== 200) {
            failureAlert({
                html: message
            })
            return
        }

        const formatTimestamp = (timestamp: number, format: 'time' | 'datetime' = 'time'): string => {
            const date = new Date(timestamp * 1000);

            if (format === 'time') {
                return date.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                });
            } else {
                return date.toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                });
            }
        };

        const chartData = data.map((item) => ({
            x: item.timestamp * 1000,
            y: item.value,
            timestamp: item.timestamp
        }));

        const yValues = chartData.map(point => point.y);
        const dataMaxY = Math.max(...yValues);

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
                        const value = (this as any).value as number;
                        return formatTimestamp(value / 1000, 'time');
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
                    const timestamp = this.x / 1000;
                    return `<b>Time:</b> ${formatTimestamp(timestamp, 'datetime')}<br><b>${metric.title}:</b> ${this.y}`;
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
            renderData()
        })

        function renderData(options?: any) {
            lookupData(options).then(response => {
                renderBody(response)

                const {dataResponse} = response as any
                renderPagination(dataResponse, renderData, footerHeartbeat, options)
            })
        }

        function lookupData(options: any) {
            return new Promise(async (resolve, reject) => {
                const {url: dataLinks} = options || {}
                const dataUrl = dataLinks ?? `/dashboard/platform-heartbeat/${uid}`
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

        function renderBody(response: any) {
            const {dataResponse, onlinePercent, offlinePercent} = response
            const {data} = dataResponse

            console.log(response)

            onlinePercentage.textContent = `${onlinePercent}%`
            offlinePercentage.textContent = `${offlinePercent}%`

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
            }
        }
    }
    //endregion

})
