import Hls from "hls.js";
import {closeModalDialog, showModalDialog} from "@/js/plugins/modal";
import {AirQualityCardManager, MetricsData} from "@/js/main/dashboard/airQualityCardManager";
import Highcharts from "highcharts";
import {
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

document.addEventListener('DOMContentLoaded', function () {
    const csrfToken = getMetaContent('csrf-token')

    const appEnv: HTMLInputElement = document.querySelector('.app_env')
    const modalCctv = document.querySelector('.modalCctv')
    const modalBody = modalCctv.querySelector('.modal-body')

    const modalDetailParameter = document.querySelector('.modalDetailParameter')
    const bodyChart: HTMLElement = modalDetailParameter.querySelector('.bodyChart')

    const modalHeartbeat = document.querySelector('.modalHeartbeat')
    const onlinePercentage = modalHeartbeat.querySelector('.onlinePercentage')
    const offlinePercentage = modalHeartbeat.querySelector('.offlinePercentage')
    const tHeartbeatData = modalHeartbeat.querySelector('.tHeartbeatData')
    const footerHeartbeat = modalHeartbeat.querySelector('.footerHeartbeat')

    const modalMaps = document.querySelector('.modalMaps')
    const mapsBody: HTMLDivElement = document.querySelector('#mapsBody')

    const closeModalForm = document.querySelectorAll('.closeModalForm')
    // const socket = SocketClient.getInstance('dashboard', appEnv.value === 'local' ? 'ws://127.0.0.1:3300' : 'https://aqms-api.cloudtrack.id')

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
            closeModalDialog(modalHeartbeat)
            closeModalDialog(modalMaps)
        })
    })
    //endregion

    //region Handle AQI Card
    const manager = new AirQualityCardManager({
        containerSelector: '.airQualityParent',
        batchSize: 50,
        enableLazyLoading: true,
        enableCharts: true,
        realTimeUpdateInterval: 60000,
        apiEndpoint: '/dashboard/platforms',
        autoLoadInitialData: false,
        // enableSocketIO: true,
        // socketIOUrl: appEnv.value === 'local' ? 'ws://127.0.0.1:3300' : 'https://aqms-api.cloudtrack.id',
        // socketIOOptions: {
        //     withCredentials: appEnv.value === 'production' || appEnv.value === 'staging',
        // },
        onCctvClick: (id, cctvLink) => {
            showModalDialog(modalCctv, `
                <div class="flex items-center">
                    <img src="/images/vector/icons8-cctv-100.png" width="24" class="mr-2" alt=""/> ${id}
                </div>
            `, () => {
                createVideoElementWithAutoplay(cctvLink)
            })
        },
        onMetricsClick: (uid, metrics) => {
            showModalDialog(modalDetailParameter, `<i class="fas fa-file mr-2"></i> ${uid}`, async () => {
                await handleDetailChart(uid, metrics)
            })
        },
        onConnectionStatus: (status) => {
            console.log('Connection status:', status);
        },
        onClickForcastPoint: async (events, pointData) => {
            const { cardId, linkVideo } = pointData
            const { linkVideoId, linkVideoRecorded } = linkVideo

            // if (socket.isConnected()) {
            //     await waitLoader('Please wait...', 'Loading Recorded Video', () => {
            //         if (linkVideoId) {
            //             requestVideo(linkVideoId, cardId, linkVideoRecorded)
            //         } else {
            //             failureAlert({
            //                 html: 'Video Recorded Not Found',
            //             })
            //         }
            //     })
            // } else {
            //     // Offline mode - gunakan video yang sudah ada
            // }

            if (linkVideoRecorded) {
                showVideoModal(cardId, linkVideoRecorded)
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
                    map.setZoom(15);
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
                        // title: `${uid} - ${nama_site}`,
                        map,
                    });
                })
            })
        }
    });

    // manager.startRealTimeMode();
    //endregion

    //region Handle Open Video on Forecast Chart
    const showVideoModal = (cardId: any, videoUrl: string) => {
        showModalDialog(modalCctv, `
            <div class="flex items-center">
                <img src="/images/vector/icons8-cctv-100.png" width="24" class="mr-2" alt=""/> ${cardId}
            </div>
        `, () => {
            createVideoElementWithAutoplay(videoUrl)
        })
    }

    // const handleRecordingProgress = (recordingId: string, cardId: string) => {
    //     // Listen untuk recording progress
    //     socket.on('recording:progress', (data) => {
    //         if (data.id === recordingId) {
    //             const { progress, status } = data
    //
    //             if (status === 'recording') {
    //                 Swal.update({
    //                     title: 'Recording in Progress',
    //                     html: `
    //                         <div class="text-md mb-3">Progress: ${progress}%</div>
    //                         <div class="text-sm text-gray-600">Please wait while we record the video...</div>
    //                     `,
    //                     showConfirmButton: false,
    //                     allowOutsideClick: false,
    //                     allowEscapeKey: false
    //                 });
    //                 Swal.showLoading();
    //             }
    //
    //             if (progress === 99) {
    //                 socket.off('recording:progress')
    //             }
    //         }
    //     })
    //
    //     socket.on('recording:retrying', (data) => {
    //         if (data.id === recordingId) {
    //             const { status } = data
    //
    //             if (status === 'retrying') {
    //                 Swal.update({
    //                     title: 'Retrying Record',
    //                     html: `
    //                         <div class="text-md text-gray-600">Please Wait, Retry Recording Video</div>
    //                     `,
    //                     showConfirmButton: false,
    //                     allowOutsideClick: false,
    //                     allowEscapeKey: false
    //                 });
    //                 Swal.showLoading();
    //             }
    //
    //             socket.off('recording:retrying')
    //         }
    //     })
    //
    //     socket.on('recording:completed', (data) => {
    //         if (data.id === recordingId) {
    //             socket.off('recording:completed')
    //             requestVideo(recordingId, cardId)
    //         }
    //     })
    // }
    //
    // const requestVideo = (recordingId: string, cardId: string, fallbackVideoUrl = null) => {
    //     socket.emit('req-video', { recordingId }, async (response) => {
    //         if (response.status) {
    //             const { status, videoUrl } = response.status
    //
    //             if (status === 'completed') {
    //                 Swal.close()
    //                 showVideoModal(cardId, videoUrl)
    //             } else if (status === 'recording') {
    //                 await waitLoader('Recording in progress...', 'Please wait while video is being recorded', () => {
    //                     handleRecordingProgress(recordingId, cardId)
    //                 })
    //             } else if (status === 'failed') {
    //                 Swal.close();
    //                 failureAlert({
    //                     html: 'Recording Video is Failed',
    //                 })
    //             }
    //         } else if (fallbackVideoUrl) {
    //             // Fallback ke video yang sudah ada
    //             Swal.close()
    //             showVideoModal(cardId, fallbackVideoUrl)
    //         }
    //     })
    // }
    //endregion

    //region Handle Create Video Element with WebRTC and HLS Fallback
    function createVideoElementWithAutoplay(streamUrl: string): void {
        // Clear existing content
        modalBody.innerHTML = '';

        // Detect protocol based on port in URL
        const isWebRTCPath = streamUrl.includes('/rtc/') || streamUrl.includes('/hls/');
        const isWebRTCPort = streamUrl.includes(':8889') && !streamUrl.includes('.m3u8');
        const isHLSPort = streamUrl.includes(':8888') && !streamUrl.includes('.m3u8');
        const isHLSFile = streamUrl.includes('.m3u8');
        const isMp4File = streamUrl.includes('.mp4');

        // Determine if you should use iframe or HLS player
        const shouldUseIframe = isWebRTCPath || isWebRTCPort || isHLSPort;
        const shouldUseHLSPlayer = isHLSFile;

        console.log('Stream URL:', streamUrl);
        console.log('Protocol detection:', {
            isWebRTCPath,
            isWebRTCPort,
            isHLSPort,
            isHLSFile,
            shouldUseIframe,
            shouldUseHLSPlayer
        });

        // Auto-select protocol based on URL
        if (!isHLSFile && shouldUseIframe) {
            loadIframeWithContainer();
        } else if (shouldUseHLSPlayer) {
            loadHLSPlayer();
        } else if (isMp4File) {
            loadMP4Player();
        } else {
            // Default fallback to HLS player
            loadHLSPlayer();
        }

        function loadIframeWithContainer() {
            // Create container for iframe (keep the container logic for iframe)
            const container = document.createElement('div');
            container.className = 'w-full max-w-[900px] mx-auto relative'

            // Create content area
            const contentArea = document.createElement('div');
            contentArea.className = 'relative w-full bg-black rounded-sm overflow-hidden min-h-[300px]'

            const statusContainer = document.createElement('div');
            statusContainer.className = 'flex items-center absolute top-[15px] right-[15px] gap-3'

            // Create status indicator
            const statusDiv = document.createElement('div');
            statusDiv.className = 'bg-[rgba(0,0,0,0.8)] text-white px-[10px] py-[7px] rounded-sm text-[11px] font-bold z-[1000] backdrop-opacity-[4px]'

            // Protocol indicator
            const protocolDiv = document.createElement('div');
            protocolDiv.className = 'bg-[rgba(0,0,0,0.8)] text-white px-[10px] py-[7px] rounded-sm text-[11px] font-bold z-[1000] backdrop-opacity-[4px]'

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

            // Determine a protocol type for display
            let protocolType = 'WebRTC';
            let protocolColor = 'rgba(0,123,255,0.8)';

            if (isWebRTCPath) {
                protocolType = streamUrl.includes('/rtc/') ? 'WebRTC' : 'WebRTC/HLS';
            } else if (isWebRTCPort) {
                protocolType = 'WebRTC';
            } else if (isHLSPort) {
                protocolType = 'HLS Stream';
                protocolColor = 'rgba(255,193,7,0.8)';
            }

            updateStatus(`Loading ${protocolType}...`, '#ffa500');
            protocolDiv.textContent = protocolType;
            protocolDiv.style.background = protocolColor;

            const iframe = document.createElement('iframe');
            iframe.src = streamUrl;

            iframe.style.cssText = `
                width: 100%;
                height: auto;
                min-height: 400px;
                max-height: 70vh;
                border: none;
                border-radius: 8px;
                aspect-ratio: 16/9;
            `;

            // Add security attributes
            iframe.setAttribute('allow', 'camera; microphone; autoplay; encrypted-media');
            iframe.setAttribute('allowfullscreen', 'true');
            iframe.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');

            iframe.onload = () => {
                const protocolType = protocolDiv.textContent || 'Stream';
                updateStatus(`${protocolType} Connected ✓`, '#00ff00');
                console.log(`✅ ${protocolType} iframe loaded successfully`);
            };

            iframe.onerror = () => {
                const protocolType = protocolDiv.textContent || 'Stream';
                updateStatus(`${protocolType} Load Failed`, '#ff0000');
                console.error(`❌ ${protocolType} iframe failed to load`);

                // Fallback to HLS player
                setTimeout(() => {
                    console.log('🔄 Falling back to HLS player...');
                    modalBody.innerHTML = '';
                    loadHLSPlayer();
                }, 2000);
            };

            contentArea.appendChild(iframe);
        }

        function loadHLSPlayer() {
            modalBody.classList.add('relative')
            const statusContainer = document.createElement('div');
            statusContainer.className = 'flex items-center absolute top-[20px] right-[20px] gap-3'

            const statusDiv = document.createElement('div');
            statusDiv.className = 'bg-[rgba(0,0,0,0.8)] text-white px-[10px] py-[7px] rounded-sm text-[11px] font-bold z-[1000] backdrop-opacity-[4px]'

            const protocolDiv = document.createElement('div');
            protocolDiv.className = 'bg-[rgba(0,0,0,0.8)] text-white px-[10px] py-[7px] rounded-sm text-[11px] font-bold z-[1000] backdrop-opacity-[4px]'

            statusContainer.appendChild(statusDiv)
            statusContainer.appendChild(protocolDiv)
            modalBody.appendChild(statusContainer)

            const updateStatus = (text: string, color: string = 'white') => {
                statusDiv.textContent = text;
                statusDiv.style.color = color;
            };

            updateStatus('Load HLS Player...', '#f8bf31')
            protocolDiv.textContent = 'HLS';
            protocolDiv.style.background = '#f8bf31';

            const video = document.createElement('video') as HTMLVideoElement;

            video.autoplay = false;
            video.controls = true;
            video.muted = true; // WAJIB untuk autoplay di Chrome

            video.style.cssText = `
                width: 100%;
                height: 500px;
                max-height: 70vh;
                object-fit: contain;
                border-radius: 8px;
                background: #000;
            `;

            if (Hls.isSupported()) {
                const hls = new Hls();
                hls.loadSource(streamUrl);
                hls.attachMedia(video);
                (video as any).hlsInstance = hls;

                // Autoplay setelah manifest ready
                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    console.log('HLS ready, starting autoplay...')
                    updateStatus(`HLS Connected ✓`, '#00ff00');
                    video.play().catch(error => {
                        updateStatus(`HLS Load Failed`, '#ff0000');
                        console.warn('Autoplay failed:', error)
                    })
                })

            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = streamUrl;
                video.autoplay = true;
            }

            modalBody.appendChild(video);
        }

        function loadMP4Player() {
            modalBody.classList.add('relative')
            const statusContainer = document.createElement('div');
            statusContainer.className = 'flex items-center absolute top-[20px] right-[20px] gap-3'

            const statusDiv = document.createElement('div');
            statusDiv.className = 'bg-[rgba(0,0,0,0.8)] text-white px-[10px] py-[7px] rounded-sm text-[11px] font-bold z-[1000] backdrop-opacity-[4px]'

            const protocolDiv = document.createElement('div');
            protocolDiv.className = 'bg-[rgba(0,0,0,0.8)] text-white px-[10px] py-[7px] rounded-sm text-[11px] font-bold z-[1000] backdrop-opacity-[4px]'

            statusContainer.appendChild(statusDiv)
            statusContainer.appendChild(protocolDiv)
            modalBody.appendChild(statusContainer)

            const updateStatus = (text: string, color: string = 'white') => {
                statusDiv.textContent = text;
                statusDiv.style.color = color;
            };

            updateStatus('Loading MP4 Player...', '#f8bf31')
            protocolDiv.textContent = 'MP4';
            protocolDiv.style.background = '#007bff';

            const video = document.createElement('video') as HTMLVideoElement;

            video.autoplay = false;
            video.controls = true;
            video.muted = true;
            video.preload = 'metadata';

            video.style.cssText = `
                width: 100%;
                height: 500px;
                max-height: 70vh;
                object-fit: contain;
                border-radius: 8px;
                background: #000;
            `;

            // Tracking variables
            let errorCount = 0;
            let hasStartedPlaying = false;
            let isRetrying = false;
            let errorTimeout: number | null = null;

            // Success state tracking
            const trackSuccessStates = () => {
                if (video.readyState >= 1) { // HAVE_METADATA
                    hasStartedPlaying = true;
                    console.log('✅ Video has metadata, considering it working');
                }

                if (video.currentTime > 0) {
                    hasStartedPlaying = true;
                    console.log('✅ Video is playing, ignoring future errors');
                }
            };

            // Debounced error handler - only act on error if video truly isn't working
            const handleVideoError = (e: Event) => {
                errorCount++;

                // If video is already playing successfully, ignore errors
                if (hasStartedPlaying || video.currentTime > 0 || video.readyState >= 2) {
                    console.log('🔇 Ignoring error - video is working fine');
                    return;
                }

                const error = video.error;
                console.log(`📍 Error attempt ${errorCount}:`, {
                    errorCode: error?.code,
                    readyState: video.readyState,
                    networkState: video.networkState,
                    currentTime: video.currentTime,
                    hasStartedPlaying
                });

                // Clear existing timeout
                if (errorTimeout) {
                    clearTimeout(errorTimeout);
                }

                // Wait before acting on error (give video time to recover)
                errorTimeout = setTimeout(() => {
                    // Double-check if video is still broken
                    if (video.readyState === 0 && video.currentTime === 0 && !hasStartedPlaying) {
                        handleActualError(error);
                    } else {
                        console.log('✅ Video recovered, no action needed');
                        updateStatus('MP4 Ready ✓', '#00ff00');
                    }
                }, 2000); // Wait 2 seconds before considering it a real error
            };

            // Only handle error if video is truly broken
            const handleActualError = (error: MediaError | null) => {
                if (isRetrying) return; // Prevent multiple retries

                console.error('🚨 Confirmed video error after debounce:', error?.code);

                if (error?.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED && errorCount <= 2) {
                    isRetrying = true;
                    updateStatus('Retrying different approach...', '#f8bf31');

                    setTimeout(() => {
                        console.log('🔄 Retry attempt without crossOrigin');
                        video.crossOrigin = null;
                        video.preload = 'none';
                        video.load();
                        isRetrying = false;
                        errorCount = 0;
                    }, 1000);

                } else if (errorCount > 3) {
                    updateStatus('MP4 Load Failed', '#ff0000');
                    console.error('❌ Too many errors, giving up');
                }
            };

            // Success event handlers
            video.addEventListener('loadstart', () => {
                updateStatus('Connecting to video...', '#f8bf31');
                console.log('📡 Load started');
            });

            video.addEventListener('loadedmetadata', () => {
                hasStartedPlaying = true;
                updateStatus('Video metadata loaded', '#00ff00');
                console.log('📋 Metadata loaded - video should work');

                // Clear any pending error timeouts
                if (errorTimeout) {
                    clearTimeout(errorTimeout);
                    errorTimeout = null;
                }
            });

            video.addEventListener('canplay', () => {
                hasStartedPlaying = true;
                updateStatus('MP4 Ready ✓', '#00ff00');

                // Auto play
                video.play().catch(playError => {
                    console.warn('Autoplay failed:', playError);
                    updateStatus('MP4 Ready (Click to play)', '#00ff00');
                });
            });

            video.addEventListener('playing', () => {
                hasStartedPlaying = true;
                updateStatus('Playing MP4 ✓', '#00ff00');
                console.log('▶️ Video playing successfully');
            });

            video.addEventListener('timeupdate', () => {
                // Track that video is actually working
                if (video.currentTime > 0) {
                    hasStartedPlaying = true;
                    trackSuccessStates();
                }
            });

            video.addEventListener('waiting', () => {
                if (hasStartedPlaying) {
                    updateStatus('Buffering...', '#f8bf31');
                }
            });

            video.addEventListener('progress', () => {
                trackSuccessStates();
            });

            // Use debounced error handler
            video.addEventListener('error', handleVideoError);

            // Additional safety check
            video.addEventListener('stalled', () => {
                if (!hasStartedPlaying) {
                    console.warn('⚠️ Video stalled before playing');
                }
            });

            // Set source and load
            video.src = streamUrl;
            video.load();

            modalBody.appendChild(video);

            // Safety timeout - if video doesn't start in 10 seconds, consider it failed
            setTimeout(() => {
                if (!hasStartedPlaying && video.readyState === 0) {
                    console.log('⏰ Timeout - video didn\'t start in 10 seconds');
                    updateStatus('Video load timeout', '#ff0000');
                }
            }, 10000);
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
                text: `Range: ${metric.bml_max_buffer} - ${metric.bml_max}`
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
                // color: {
                //     linearGradient: { x1: 0, x2: 0, y1: 1, y2: 0 },
                //     stops: [
                //         [0, '#ffffff'],
                //         [1, '#0079ff']
                //     ]
                // },
            }, {
                type: 'line',
                name: `Buffer (${metric.bml_max_buffer} ${metric.type})`,
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
