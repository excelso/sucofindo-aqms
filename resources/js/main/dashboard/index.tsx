import Hls from "hls.js";
import {closeModalDialog, showModalDialog} from "@/js/plugins/modal";
import {AirQualityCardManager, MetricsData} from "@/js/main/dashboard/airQualityCardManager";
import Highcharts from "highcharts";
import {getMetaContent} from "@/js/plugins/functions";
import {failureAlert, waitLoader} from "@/js/plugins/sweet-alert";
import {SocketClient} from "@/js/plugins/SocketClient";
import Swal from "sweetalert2";

document.addEventListener('DOMContentLoaded', function () {
    const csrfToken = getMetaContent('csrf-token')

    const modalCctv = document.querySelector('.modalCctv')
    const modalBody = modalCctv.querySelector('.modal-body')
    const modalDetailParameter = document.querySelector('.modalDetailParameter')
    const bodyChart: HTMLElement = modalDetailParameter.querySelector('.bodyChart')
    const closeModalForm = document.querySelectorAll('.closeModalForm')
    const socket = SocketClient.getInstance('dashboard', 'ws://127.0.0.1:3300')

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
        enableSocketIO: true,
        socketIOUrl: 'ws://127.0.0.1:3300',
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
            socket.emit('req-video', {
                recordingId: pointData.linkVideo.linkVideoId,
            }, async (response) => {
                await waitLoader('Please wait...', 'Loading Recorded Video', () => {
                    const {status, videoUrl} = response.status;
                    if (status === 'completed') {
                        Swal.close()

                        showModalDialog(modalCctv, `
                            <div class="flex items-center">
                                <img src="/images/vector/icons8-cctv-100.png" width="24" class="mr-2" alt=""/> ${pointData.cardId}
                            </div>
                        `, () => {

                            createVideoElementWithAutoplay(videoUrl)
                        })
                    }
                })
            })
        }
    });

    manager.startRealTimeMode();
    // manager.loadData('/dashboard/platforms').then(() => {
    //     manager.renderAll();
    //
    // });
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
})
