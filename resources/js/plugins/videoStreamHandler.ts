interface VideoStreamConfig {
    autoplay?: boolean;
    controls?: boolean;
    muted?: boolean;
    maxHeight?: string;
    borderRadius?: string;
    retryAttempts?: number;
    errorTimeout?: number;
    safetyTimeout?: number;
}

interface StreamProtocolInfo {
    isWebRTCPath: boolean;
    isWebRTCPort: boolean;
    isHLSPort: boolean;
    isHLSFile: boolean;
    isMp4File: boolean;
    shouldUseIframe: boolean;
    shouldUseHLSPlayer: boolean;
}

class VideoStreamHandler {
    private modalBody: HTMLElement;
    private config: VideoStreamConfig;
    private currentVideo: HTMLVideoElement | null = null;
    private currentIframe: HTMLIFrameElement | null = null;
    private hlsInstance: any = null;

    constructor(config: VideoStreamConfig = {}) {
        this.config = {
            autoplay: false,
            controls: true,
            muted: true,
            maxHeight: '70vh',
            borderRadius: '8px',
            retryAttempts: 3,
            errorTimeout: 2000,
            safetyTimeout: 10000,
            ...config
        };
    }

    /**
     * Main method to create and display video element with auto-protocol detection
     */
    public createVideoElement(modalBody: HTMLElement, streamUrl: string): void {
        this.modalBody = modalBody;
        this.clearExistingContent();

        const protocolInfo = this.detectProtocol(streamUrl);
        this.logProtocolDetection(streamUrl, protocolInfo);

        if (!protocolInfo.isHLSFile && protocolInfo.shouldUseIframe) {
            this.loadIframePlayer(streamUrl, protocolInfo);
        } else if (protocolInfo.shouldUseHLSPlayer) {
            this.loadHLSPlayer(streamUrl);
        } else if (protocolInfo.isMp4File) {
            this.loadMP4Player(streamUrl);
        } else {
            // Default fallback to HLS player
            this.loadHLSPlayer(streamUrl);
        }
    }

    /**
     * Clear existing video content
     */
    private clearExistingContent(): void {
        // Clean up existing HLS instance
        if (this.hlsInstance) {
            this.hlsInstance.destroy();
            this.hlsInstance = null;
        }

        // Clean up current video
        if (this.currentVideo) {
            this.currentVideo.pause();
            this.currentVideo.src = '';
            this.currentVideo = null;
        }

        // Clean up current iframe
        this.currentIframe = null;

        // Clear modal content
        this.modalBody.innerHTML = '';
        this.modalBody.className = this.modalBody.className.replace(/\brelative\b/g, '').trim();
    }

    /**
     * Detect streaming protocol from URL
     */
    private detectProtocol(streamUrl: string): StreamProtocolInfo {
        const isWebRTCPath = streamUrl.includes('/rtc/') || streamUrl.includes('/hls/');
        const isWebRTCPort = streamUrl.includes(':8889') && !streamUrl.includes('.m3u8');
        const isHLSPort = streamUrl.includes(':8888') && !streamUrl.includes('.m3u8');
        const isHLSFile = streamUrl.includes('.m3u8');
        const isMp4File = streamUrl.includes('.mp4');

        const shouldUseIframe = isWebRTCPath || isWebRTCPort || isHLSPort;
        const shouldUseHLSPlayer = isHLSFile;

        return {
            isWebRTCPath,
            isWebRTCPort,
            isHLSPort,
            isHLSFile,
            isMp4File,
            shouldUseIframe,
            shouldUseHLSPlayer
        };
    }

    /**
     * Log protocol detection results
     */
    private logProtocolDetection(streamUrl: string, protocolInfo: StreamProtocolInfo): void {
        console.log('Stream URL:', streamUrl);
        console.log('Protocol detection:', protocolInfo);
    }

    /**
     * Create status container with indicators
     */
    private createStatusContainer(): {
        container: HTMLDivElement;
        statusDiv: HTMLDivElement;
        protocolDiv: HTMLDivElement;
        updateStatus: (text: string, color?: string) => void;
    } {
        const container = document.createElement('div');
        container.className = 'flex items-center absolute top-[20px] right-[20px] gap-3';

        const statusDiv = document.createElement('div');
        statusDiv.className = 'bg-[rgba(0,0,0,0.8)] text-white px-[10px] py-[7px] rounded-sm text-[11px] font-bold z-[1000] backdrop-opacity-[4px]';

        const protocolDiv = document.createElement('div');
        protocolDiv.className = 'bg-[rgba(0,0,0,0.8)] text-white px-[10px] py-[7px] rounded-sm text-[11px] font-bold z-[1000] backdrop-opacity-[4px]';

        container.appendChild(statusDiv);
        container.appendChild(protocolDiv);

        const updateStatus = (text: string, color: string = 'white') => {
            statusDiv.textContent = text;
            statusDiv.style.color = color;
        };

        return { container, statusDiv, protocolDiv, updateStatus };
    }

    /**
     * Load iframe player for WebRTC/HLS streams
     */
    private loadIframePlayer(streamUrl: string, protocolInfo: StreamProtocolInfo): void {
        // Create container for iframe
        const container = document.createElement('div');
        container.className = 'w-full max-w-[900px] mx-auto relative';

        const contentArea = document.createElement('div');
        contentArea.className = 'relative w-full bg-black rounded-sm overflow-hidden min-h-[300px]';

        const { container: statusContainer, protocolDiv, updateStatus } = this.createStatusContainer();
        statusContainer.className = 'flex items-center absolute top-[15px] right-[15px] gap-3';

        // Determine protocol type for display
        let protocolType = 'WebRTC';
        let protocolColor = 'rgba(0,123,255,0.8)';

        if (protocolInfo.isWebRTCPath) {
            protocolType = streamUrl.includes('/rtc/') ? 'WebRTC' : 'WebRTC/HLS';
        } else if (protocolInfo.isWebRTCPort) {
            protocolType = 'WebRTC';
        } else if (protocolInfo.isHLSPort) {
            protocolType = 'HLS Stream';
            protocolColor = 'rgba(255,193,7,0.8)';
        }

        updateStatus(`Loading ${protocolType}...`, '#ffa500');
        protocolDiv.textContent = protocolType;
        protocolDiv.style.background = protocolColor;

        // Create iframe
        const iframe = document.createElement('iframe');
        iframe.src = streamUrl;
        iframe.style.cssText = `
            width: 100%;
            height: auto;
            min-height: 400px;
            max-height: ${this.config.maxHeight};
            border: none;
            border-radius: ${this.config.borderRadius};
            aspect-ratio: 16/9;
        `;

        // Add security attributes
        iframe.setAttribute('allow', 'camera; microphone; autoplay; encrypted-media');
        iframe.setAttribute('allowfullscreen', 'true');
        iframe.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');

        // Event handlers
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
                this.loadHLSPlayer(streamUrl);
            }, this.config.errorTimeout);
        };

        // Assemble elements
        contentArea.appendChild(statusContainer);
        contentArea.appendChild(iframe);
        container.appendChild(contentArea);
        this.modalBody.appendChild(container);

        this.currentIframe = iframe;
    }

    /**
     * Load HLS player
     */
    private loadHLSPlayer(streamUrl: string): void {
        this.modalBody.classList.add('relative');

        const { container: statusContainer, protocolDiv, updateStatus } = this.createStatusContainer();
        this.modalBody.appendChild(statusContainer);

        updateStatus('Load HLS Player...', '#f8bf31');
        protocolDiv.textContent = 'HLS';
        protocolDiv.style.background = '#f8bf31';

        const video = document.createElement('video') as HTMLVideoElement;
        video.autoplay = this.config.autoplay!;
        video.controls = this.config.controls!;
        video.muted = this.config.muted!;

        video.style.cssText = `
            width: 100%;
            height: 500px;
            max-height: ${this.config.maxHeight};
            object-fit: contain;
            border-radius: ${this.config.borderRadius};
            background: #000;
        `;

        if ((window as any).Hls?.isSupported()) {
            const hls = new (window as any).Hls();
            hls.loadSource(streamUrl);
            hls.attachMedia(video);
            this.hlsInstance = hls;

            hls.on((window as any).Hls.Events.MANIFEST_PARSED, () => {
                console.log('HLS ready, starting autoplay...');
                updateStatus('HLS Connected ✓', '#00ff00');

                if (this.config.autoplay) {
                    video.play().catch(error => {
                        updateStatus('HLS Load Failed', '#ff0000');
                        console.warn('Autoplay failed:', error);
                    });
                }
            });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = streamUrl;
            if (this.config.autoplay) {
                video.autoplay = true;
            }
        }

        this.modalBody.appendChild(video);
        this.currentVideo = video;
    }

    /**
     * Load MP4 player with comprehensive error handling
     */
    private loadMP4Player(streamUrl: string): void {
        this.modalBody.classList.add('relative');

        const { container: statusContainer, protocolDiv, updateStatus } = this.createStatusContainer();
        this.modalBody.appendChild(statusContainer);

        updateStatus('Loading MP4 Player...', '#f8bf31');
        protocolDiv.textContent = 'MP4';
        protocolDiv.style.background = '#007bff';

        const video = document.createElement('video') as HTMLVideoElement;
        video.autoplay = this.config.autoplay!;
        video.controls = this.config.controls!;
        video.muted = this.config.muted!;
        video.preload = 'metadata';

        video.style.cssText = `
            width: 100%;
            height: 500px;
            max-height: ${this.config.maxHeight};
            object-fit: contain;
            border-radius: ${this.config.borderRadius};
            background: #000;
        `;

        this.setupMP4EventHandlers(video, streamUrl, updateStatus);
        this.modalBody.appendChild(video);
        this.currentVideo = video;
    }

    /**
     * Setup comprehensive event handlers for MP4 player
     */
    private setupMP4EventHandlers(
        video: HTMLVideoElement,
        streamUrl: string,
        updateStatus: (text: string, color?: string) => void
    ): void {
        let errorCount = 0;
        let hasStartedPlaying = false;
        let isRetrying = false;
        let errorTimeout: number | null = null;

        const trackSuccessStates = () => {
            if (video.readyState >= 1) {
                hasStartedPlaying = true;
                console.log('✅ Video has metadata, considering it working');
            }
            if (video.currentTime > 0) {
                hasStartedPlaying = true;
                console.log('✅ Video is playing, ignoring future errors');
            }
        };

        const handleVideoError = (e: Event) => {
            errorCount++;

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

            if (errorTimeout) {
                clearTimeout(errorTimeout);
            }

            errorTimeout = setTimeout(() => {
                if (video.readyState === 0 && video.currentTime === 0 && !hasStartedPlaying) {
                    this.handleActualError(video, error, errorCount, isRetrying, updateStatus);
                } else {
                    console.log('✅ Video recovered, no action needed');
                    updateStatus('MP4 Ready ✓', '#00ff00');
                }
            }, this.config.errorTimeout!) as any;
        };

        // Event listeners
        video.addEventListener('loadstart', () => {
            updateStatus('Connecting to video...', '#f8bf31');
            console.log('📡 Load started');
        });

        video.addEventListener('loadedmetadata', () => {
            hasStartedPlaying = true;
            updateStatus('Video metadata loaded', '#00ff00');
            console.log('📋 Metadata loaded - video should work');
            if (errorTimeout) {
                clearTimeout(errorTimeout);
                errorTimeout = null;
            }
        });

        video.addEventListener('canplay', () => {
            hasStartedPlaying = true;
            updateStatus('MP4 Ready ✓', '#00ff00');

            if (this.config.autoplay) {
                video.play().catch(playError => {
                    console.warn('Autoplay failed:', playError);
                    updateStatus('MP4 Ready (Click to play)', '#00ff00');
                });
            }
        });

        video.addEventListener('playing', () => {
            hasStartedPlaying = true;
            updateStatus('Playing MP4 ✓', '#00ff00');
            console.log('▶️ Video playing successfully');
        });

        video.addEventListener('timeupdate', () => {
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

        video.addEventListener('progress', trackSuccessStates);
        video.addEventListener('error', handleVideoError);

        video.addEventListener('stalled', () => {
            if (!hasStartedPlaying) {
                console.warn('⚠️ Video stalled before playing');
            }
        });

        // Set source and load
        video.src = streamUrl;
        video.load();

        // Safety timeout
        setTimeout(() => {
            if (!hasStartedPlaying && video.readyState === 0) {
                console.log('⏰ Timeout - video didn\'t start in time');
                updateStatus('Video load timeout', '#ff0000');
            }
        }, this.config.safetyTimeout!);
    }

    /**
     * Handle actual video errors after debouncing
     */
    private handleActualError(
        video: HTMLVideoElement,
        error: MediaError | null,
        errorCount: number,
        isRetrying: boolean,
        updateStatus: (text: string, color?: string) => void
    ): void {
        if (isRetrying) return;

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
            }, 1000);
        } else if (errorCount > this.config.retryAttempts!) {
            updateStatus('MP4 Load Failed', '#ff0000');
            console.error('❌ Too many errors, giving up');
        }
    }

    /**
     * Get current video element
     */
    public getCurrentVideo(): HTMLVideoElement | null {
        return this.currentVideo;
    }

    /**
     * Get current iframe element
     */
    public getCurrentIframe(): HTMLIFrameElement | null {
        return this.currentIframe;
    }

    /**
     * Get HLS instance
     */
    public getHLSInstance(): any {
        return this.hlsInstance;
    }

    /**
     * Destroy the handler and clean up resources
     */
    public destroy(): void {
        this.clearExistingContent();
    }

    /**
     * Update configuration
     */
    public updateConfig(newConfig: Partial<VideoStreamConfig>): void {
        this.config = { ...this.config, ...newConfig };
    }
}

export default VideoStreamHandler;
