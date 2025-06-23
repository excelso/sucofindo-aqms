import {AirQualityCardManager, AirQualityData, MetricsData} from "@/js/main/dashboard/airQualityCardManager";
import Highcharts from 'highcharts'
import "highcharts/highcharts-more";
import {closeModalDialog, showModalDialog} from "@/js/plugins/modal";
import Hls from "hls.js";

document.addEventListener('DOMContentLoaded', function () {
    const modalCctv = document.querySelector('.modalCctv')
    const modalBody = modalCctv.querySelector('.modal-body')
    const modalDetailParameter = document.querySelector('.modalDetailParameter')
    const bodyChart: HTMLElement = modalDetailParameter.querySelector('.bodyChart')
    const closeModalForm = document.querySelectorAll('.closeModalForm')

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
                modalBody.appendChild(createVideoElementWithAutoplay(cctvLink))
            })
        },
        onMetricsClick: (id, metrics) => {
            showModalDialog(modalDetailParameter, `<i class="fas fa-file mr-2"></i> ${id}`, () => {
                handleDetailChart(metrics)
            })
        }
    });

    manager.loadData('/dashboard/platforms').then(() => {
        manager.renderAll();
    });
    //endregion

    //region Handle Create Video Element
    function createVideoElementWithAutoplay(streamUrl: string): HTMLVideoElement {
        const video = document.createElement('video') as HTMLVideoElement;

        video.autoplay = false; // Set false dulu
        video.width = 900;
        video.controls = true;
        video.style.height = 'auto';
        video.muted = true; // WAJIB untuk autoplay di Chrome

        if (Hls.isSupported()) {
            const hls = new Hls();
            hls.loadSource(streamUrl);
            hls.attachMedia(video);
            (video as any).hlsInstance = hls;

            // Autoplay setelah manifest ready
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                console.log('HLS ready, starting autoplay...');
                video.play().catch(error => {
                    console.warn('Autoplay failed:', error);
                });
            });

        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = streamUrl;
            video.autoplay = true; // Safari support autoplay lebih baik
        }

        return video;
    }

    //endregion

    function handleDetailChart(metric: MetricsData) {
        console.log(metric.bml)
        const now = Math.floor(new Date().setHours(0, 1, 0, 0) / 1000);
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

        const defaultData = Array.from({length: 144}, (_, j) => ({
            timestamp: now + (j * 300),
            value: Math.floor(Math.random() * ((metric.bml - 5) - (metric.buffer - 15)) + (metric.buffer - 15))
        }));

        const chartData = defaultData.map(item => ({
            x: item.timestamp * 1000, // Highcharts expects milliseconds
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
                        // Format as HH:MM for display
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
                tickInterval: 3600 * 1000, // 1 hour intervals in milliseconds
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
})
