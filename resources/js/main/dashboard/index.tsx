import Hls from "hls.js";
import {closeModalDialog, showModalDialog} from "@/js/plugins/modal";
import {AirQualityCardManager, MetricsData} from "@/js/main/dashboard/airQualityCardManager";
import Highcharts from "highcharts";
import {getMetaContent} from "@/js/plugins/functions";
import {failureAlert} from "@/js/plugins/sweet-alert";

document.addEventListener('DOMContentLoaded', function () {
    const csrfToken = getMetaContent('csrf-token')

    const modalCctv = document.querySelector('.modalCctv')
    const modalBody = modalCctv.querySelector('.modal-body')
    const modalDetailParameter = document.querySelector('.modalDetailParameter')
    const bodyChart: HTMLElement = modalDetailParameter.querySelector('.bodyChart')
    const closeModalForm = document.querySelectorAll('.closeModalForm')

    // Store active WebRTC connections
    const activeWebRTCStreams: Map<HTMLVideoElement, WebRTCStreamManager> = new Map();

    //region Handle Close Menu
    closeModalForm.forEach((elm) => {
        elm.addEventListener('click', function () {
            closeModalDialog(modalCctv, () => {
                const videos = modalBody.querySelectorAll('video');
                videos.forEach(video => {
                    if ((video as any).hlsInstance) {
                        (video as any).hlsInstance.destroy();
                        (video as any).hlsInstance = null;
                    }

                    // Stop video sebelum remove
                    video.pause();
                    video.src = '';
                    video.load(); // Reset video element
                    video.remove();
                });
            })

            closeModalDialog(modalDetailParameter)
        })
    })
    //endregion

    //region Handle AQI Card
    const manager = new AirQualityCardManager({
        containerSelector: '.airQualityParent',
        batchSize: 50,
        enableLazyLoading: true,
        enableCharts: true,
        realTimeUpdateInterval: 15000,
        apiEndpoint: '/dashboard/platforms',
        onCctvClick: (id, cctvLink) => {
            showModalDialog(modalCctv, `
                <div class="flex items-center">
                    <img src="/images/vector/icons8-cctv-100.png" width="24" class="mr-2" alt=""/> ${id}
                </div>
            `, () => {
                createVideoElementWithAutoplay(cctvLink, 'camera1')
            })
        },
        onMetricsClick: (uid, metrics) => {
            showModalDialog(modalDetailParameter, `<i class="fas fa-file mr-2"></i> ${uid}`, () => {
                handleDetailChart(uid, metrics)
            })
        }
    });

    manager.loadData('/dashboard/platforms').then(() => {
        manager.renderAll();
    });
    //endregion

    //region Handle Create Video Element with WebRTC and HLS Fallback
    function createVideoElementWithAutoplay(streamUrl: string, cameraId: string): void {
        // Clear existing content
        modalBody.innerHTML = '';

        // Detect protocol based on port in URL
        const isWebRTC = streamUrl.includes(':8889') || streamUrl.includes('/rtc/');
        const isHLS = streamUrl.includes(':8888') || streamUrl.includes('.m3u8') || streamUrl.includes('/hls/');

        console.log('Stream URL:', streamUrl);
        console.log('Detected protocol:', { isWebRTC, isHLS });

        // Create container
        const container = document.createElement('div');
        container.style.cssText = `
            width: 100%;
            max-width: 900px;
            margin: 0 auto;
            position: relative;
        `;

        // Create content area
        const contentArea = document.createElement('div');
        contentArea.style.cssText = `
            position: relative;
            width: 100%;
            min-height: 500px;
            background: #000;
            border-radius: 8px;
            overflow: hidden;
        `;

        const statusContainer = document.createElement('div');
        statusContainer.className = 'flex items-center absolute top-[15px] right-[15px] gap-3'

        // Create status indicator
        const statusDiv = document.createElement('div');
        statusDiv.style.cssText = `
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 7px 10px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: bold;
            z-index: 1000;
            backdrop-filter: blur(4px);
        `;

        // Protocol indicator
        const protocolDiv = document.createElement('div');
        protocolDiv.style.cssText = `
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 6px 10px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: bold;
            z-index: 1000;
            backdrop-filter: blur(4px);
        `;

        contentArea.appendChild(statusContainer);
        statusContainer.appendChild(statusDiv);
        statusContainer.appendChild(protocolDiv);
        container.appendChild(contentArea);
        modalBody.appendChild(container);

        // Status update function
        const updateStatus = (text: string, color: string = 'white') => {
            statusDiv.textContent = text;
            statusDiv.style.color = color;
        };

        // Auto-select protocol based on URL
        if (isWebRTC) {
            loadWebRTCIframe();
        } else if (isHLS) {
            loadHLSPlayer();
        } else {
            loadHLSPlayer();
        }

        function loadWebRTCIframe() {
            updateStatus('Loading WebRTC...', '#ffa500');
            protocolDiv.textContent = 'WebRTC';
            protocolDiv.style.background = 'rgba(0,123,255,0.8)';

            let iframeUrl: string;
            if (streamUrl.includes(':8889') || streamUrl.includes('/rtc/')) {
                iframeUrl = streamUrl;
            } else {
                iframeUrl = `http://103.127.132.72:8889/${cameraId || 'camera1'}/`;
            }

            createWebRTCIframe(iframeUrl);
        }

        function createWebRTCIframe(url: string) {
            const iframe = document.createElement('iframe');
            iframe.src = url;
            iframe.style.cssText = `
                width: 100%;
                height: 500px;
                border: none;
                border-radius: 8px;
            `;

            // Tambahkan security attributes
            iframe.setAttribute('allow', 'camera; microphone; autoplay; encrypted-media');
            iframe.setAttribute('allowfullscreen', 'true');
            iframe.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');

            iframe.onload = () => {
                updateStatus('WebRTC Connected ✓', '#00ff00');
                console.log('✅ WebRTC iframe loaded successfully');
            };

            iframe.onerror = () => {
                updateStatus('WebRTC Load Failed', '#ff0000');
                console.error('❌ WebRTC iframe failed to load');

                // Fallback ke HLS
                setTimeout(() => {
                    console.log('🔄 Falling back to HLS...');
                    iframe.remove();
                    loadHLSPlayer();
                }, 2000);
            };

            contentArea.appendChild(iframe);
        }

        function loadHLSPlayer() {
            updateStatus('Loading HLS...', '#ffa500');
            protocolDiv.textContent = 'HLS';
            protocolDiv.style.background = 'rgba(255,193,7,0.8)';

            const video = document.createElement('video') as HTMLVideoElement;

            video.autoplay = false;
            video.width = 900;
            video.controls = true;
            video.style.height = '500px';
            video.muted = true; // WAJIB untuk autoplay di Chrome

            if (Hls.isSupported()) {
                const hls = new Hls();
                hls.loadSource(streamUrl);
                hls.attachMedia(video);
                (video as any).hlsInstance = hls;

                // Autoplay setelah manifest ready
                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    updateStatus('HLS Connected ✓', '#00ff00');
                    console.log('HLS ready, starting autoplay...')
                    video.play().catch(error => {
                        updateStatus('HLS Load Failed', '#ff0000');
                        console.warn('Autoplay failed:', error)
                    })
                })

            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = streamUrl;
                video.autoplay = true;
            }

            contentArea.appendChild(video);
        }
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

        console.log(metric)
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
                text: `Range: ${metric.buffer} - ${metric.bml}`
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
                plotLines: [
                    {
                        value: metric.bml,
                        width: 2,
                        dashStyle: 'Solid',
                        color: 'rgb(255,0,0)'
                    },
                    {
                        value: metric.buffer,
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
                    return `<b>Time:</b> ${formatTimestamp(timestamp, 'datetime')}<br><b>AQI:</b> ${this.y}`;
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
                color: {
                    linearGradient: { x1: 0, x2: 0, y1: 1, y2: 0 },
                    stops: [
                        [0, '#ffffff'],
                        [1, '#0079ff']
                    ]
                },
            }, {
                type: 'line',
                name: 'BML',
                color: 'rgb(255,0,0)'
            }, {
                type: 'line',
                name: 'Buffer',
                color: 'rgb(228,186,47)'
            }]
        }, function (chart) {

        });
    }
    //endregion
})
