interface VideoStreamConfig {
    autoplay?: boolean;
    controls?: boolean;
    muted?: boolean;
    maxHeight?: string;
    borderRadius?: string;
    retryAttempts?: number;
    errorTimeout?: number;
    safetyTimeout?: number;
    showPTZControls?: boolean;
    ptzControlPosition?: 'side' | 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
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

interface PTZControlsCallbacks {
    onMoveUp?: () => void;
    onMoveDown?: () => void;
    onMoveLeft?: () => void;
    onMoveRight?: () => void;
    onZoomIn?: () => void;
    onZoomOut?: () => void;
    onStop?: () => void;
}

class VideoStreamHandler {
    private modalBody: HTMLElement;
    private config: VideoStreamConfig;
    private currentVideo: HTMLVideoElement | null = null;
    private currentIframe: HTMLIFrameElement | null = null;
    private hlsInstance: any = null;
    private ptzCallbacks: PTZControlsCallbacks = {};
    private mainContainer: HTMLElement | null = null;
    private videoContainer: HTMLElement | null = null;
    private ptzContainer: HTMLElement | null = null;

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
            showPTZControls: true,
            ptzControlPosition: 'side',
            ...config
        };
    }

    /**
     * Set PTZ control callbacks
     */
    public setPTZCallbacks(callbacks: PTZControlsCallbacks): void {
        this.ptzCallbacks = {...this.ptzCallbacks, ...callbacks};
    }

    /**
     * Main method to create and display video element with auto-protocol detection
     */
    public createVideoElement(modalBody: HTMLElement, streamUrl: string): void {
        this.modalBody = modalBody;
        this.clearExistingContent();

        // Create main layout containers
        this.createMainLayout();

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

        // Add PTZ controls if enabled
        if (this.config.showPTZControls) {
            this.addPTZControls();
        }
    }

    /**
     * Create main layout with video and PTZ controls containers
     */
    private createMainLayout(): void {
        // Main container with flex layout
        this.mainContainer = document.createElement('div');
        this.mainContainer.className = this.config.ptzControlPosition === 'side'
            ? 'flex gap-2 w-full max-w-none mx-auto'
            : 'w-full max-w-[900px] mx-auto relative';

        // Video container
        this.videoContainer = document.createElement('div');
        this.videoContainer.className = this.config.ptzControlPosition === 'side'
            ? 'flex-1 relative bg-black rounded-sm overflow-hidden min-h-[500px]'
            : 'relative w-full bg-black rounded-sm overflow-hidden min-h-[500px]';

        // PTZ container (will be populated later if needed)
        if (this.config.ptzControlPosition === 'side') {
            this.ptzContainer = document.createElement('div');
            this.ptzContainer.className = 'ptz-control-container flex-shrink-0 w-64 bg-transparent';
        }

        // Assemble layout
        this.mainContainer.appendChild(this.videoContainer);
        if (this.ptzContainer) {
            this.mainContainer.appendChild(this.ptzContainer);
        }

        this.modalBody.appendChild(this.mainContainer);
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

        // Reset containers
        this.mainContainer = null;
        this.videoContainer = null;
        this.ptzContainer = null;
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
        container.className = 'flex items-center absolute top-[20px] right-[20px] gap-3 z-10';

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

        return {container, statusDiv, protocolDiv, updateStatus};
    }

    /**
     * Create PTZ controls - side layout or overlay
     */
    private createPTZControls(): HTMLDivElement {
        const ptzControlsContainer = document.createElement('div');

        if (this.config.ptzControlPosition === 'side') {
            // Side layout - not absolute positioned
            ptzControlsContainer.className = 'ptz-controls w-full h-full flex flex-col justify-start';

            ptzControlsContainer.innerHTML = `
                <div class="bg-gray-900 bg-opacity-95 p-6 h-fit">
                    <div class="text-white text-sm font-bold mb-4 text-center">Camera Control</div>

                    <!-- Movement Controls -->
                    <div class="grid grid-cols-3 gap-2 mb-4">
                        <div></div>
                        <button class="ptz-btn ptz-up bg-gray-700 hover:bg-blue-600 text-white rounded-lg p-3 transition-colors duration-200 flex items-center justify-center" title="Move Up">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/>
                            </svg>
                        </button>
                        <div></div>

                        <button class="ptz-btn ptz-left bg-gray-700 hover:bg-blue-600 text-white rounded-lg p-3 transition-colors duration-200 flex items-center justify-center" title="Move Left">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
                            </svg>
                        </button>
                        <button class="ptz-btn ptz-stop bg-red-600 hover:bg-red-700 text-white rounded-lg p-3 transition-colors duration-200 flex items-center justify-center text-sm font-bold" title="Stop">
                            ⏹
                        </button>
                        <button class="ptz-btn ptz-right bg-gray-700 hover:bg-blue-600 text-white rounded-lg p-3 transition-colors duration-200 flex items-center justify-center" title="Move Right">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                            </svg>
                        </button>

                        <div></div>
                        <button class="ptz-btn ptz-down bg-gray-700 hover:bg-blue-600 text-white rounded-lg p-3 transition-colors duration-200 flex items-center justify-center" title="Move Down">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z"/>
                            </svg>
                        </button>
                        <div></div>
                    </div>

                    <!-- Zoom Controls -->
                    <div class="grid grid-cols-2 gap-3">
                        <button class="ptz-btn ptz-zoom-in bg-green-600 hover:bg-green-700 text-white rounded-lg p-3 transition-colors duration-200 flex items-center justify-center" title="Zoom In">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                                <path d="M12 10h-2v2H9v-2H7V9h2V7h1v2h2v1z"/>
                            </svg>
                        </button>
                        <button class="ptz-btn ptz-zoom-out bg-orange-600 hover:bg-orange-700 text-white rounded-lg p-3 transition-colors duration-200 flex items-center justify-center" title="Zoom Out">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                                <path d="M7 9h5v1H7z"/>
                            </svg>
                        </button>
                    </div>

                    <!-- Keyboard Shortcuts Info -->
                    <div class="mt-4 pt-4 border-t border-gray-600">
                        <div class="text-white text-xs font-bold mb-2">Keyboard Shortcuts:</div>
                        <div class="text-gray-300 text-xs space-y-1">
                            <div>Arrow Keys: Move Camera</div>
                            <div>+/=: Zoom In</div>
                            <div>-: Zoom Out</div>
                            <div>Space/Esc: Stop</div>
                        </div>
                    </div>
                </div>
            `;
        } else {
            // Original overlay layout
            ptzControlsContainer.className = 'ptz-controls absolute z-[1001]';

            // Position based on config
            const position = this.config.ptzControlPosition;
            const positionClasses = {
                'bottom-left': 'bottom-4 left-4',
                'bottom-right': 'bottom-6 right-4',
                'top-left': 'top-4 left-4',
                'top-right': 'top-4 right-4'
            };

            // @ts-ignore
            if (position && position !== 'side') {
                ptzControlsContainer.className += ` ${positionClasses[position]}`;
            }

            ptzControlsContainer.innerHTML = `
                <div class="bg-black bg-opacity-80 rounded-lg p-4 backdrop-blur-sm">
                    <div class="text-white text-xs font-bold mb-3 text-center">Camera Control</div>

                    <!-- Movement Controls -->
                    <div class="grid grid-cols-3 gap-1 mb-3">
                        <div></div>
                        <button class="ptz-btn ptz-up bg-gray-700 hover:bg-blue-600 text-white rounded p-2 transition-colors duration-200 flex items-center justify-center" title="Move Up">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/>
                            </svg>
                        </button>
                        <div></div>

                        <button class="ptz-btn ptz-left bg-gray-700 hover:bg-blue-600 text-white rounded p-2 transition-colors duration-200 flex items-center justify-center" title="Move Left">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
                            </svg>
                        </button>
                        <button class="ptz-btn ptz-stop bg-red-600 hover:bg-red-700 text-white rounded p-2 transition-colors duration-200 flex items-center justify-center text-xs font-bold" title="Stop">
                            ⏹
                        </button>
                        <button class="ptz-btn ptz-right bg-gray-700 hover:bg-blue-600 text-white rounded p-2 transition-colors duration-200 flex items-center justify-center" title="Move Right">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                            </svg>
                        </button>

                        <div></div>
                        <button class="ptz-btn ptz-down bg-gray-700 hover:bg-blue-600 text-white rounded p-2 transition-colors duration-200 flex items-center justify-center" title="Move Down">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z"/>
                            </svg>
                        </button>
                        <div></div>
                    </div>

                    <!-- Zoom Controls -->
                    <div class="grid grid-cols-2 gap-2">
                        <button class="ptz-btn ptz-zoom-in bg-green-600 hover:bg-green-700 text-white rounded p-2 transition-colors duration-200 flex items-center justify-center" title="Zoom In">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                                <path d="M12 10h-2v2H9v-2H7V9h2V7h1v2h2v1z"/>
                            </svg>
                        </button>
                        <button class="ptz-btn ptz-zoom-out bg-orange-600 hover:bg-orange-700 text-white rounded p-2 transition-colors duration-200 flex items-center justify-center" title="Zoom Out">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                                <path d="M7 9h5v1H7z"/>
                            </svg>
                        </button>
                    </div>
                </div>
            `;
        }

        return ptzControlsContainer;
    }

    /**
     * Add PTZ controls to the appropriate container
     */
    private addPTZControls(): void {
        const ptzControls = this.createPTZControls();

        if (this.config.ptzControlPosition === 'side' && this.ptzContainer) {
            // Add to side container
            this.ptzContainer.appendChild(ptzControls);
        } else if (this.videoContainer) {
            // Add as overlay to video container
            this.videoContainer.style.position = 'relative';
            this.videoContainer.appendChild(ptzControls);
        }

        // Add event listeners
        this.setupPTZEventListeners(ptzControls);
    }

    /**
     * Setup PTZ control event listeners
     */
    private setupPTZEventListeners(ptzContainer: HTMLDivElement): void {
        const buttons = {
            up: ptzContainer.querySelector('.ptz-up'),
            down: ptzContainer.querySelector('.ptz-down'),
            left: ptzContainer.querySelector('.ptz-left'),
            right: ptzContainer.querySelector('.ptz-right'),
            zoomIn: ptzContainer.querySelector('.ptz-zoom-in'),
            zoomOut: ptzContainer.querySelector('.ptz-zoom-out'),
            stop: ptzContainer.querySelector('.ptz-stop')
        };

        // Movement controls
        buttons.up?.addEventListener('click', () => {
            console.log('PTZ: Move Up');
            this.ptzCallbacks.onMoveUp?.();
        });

        buttons.down?.addEventListener('click', () => {
            console.log('PTZ: Move Down');
            this.ptzCallbacks.onMoveDown?.();
        });

        buttons.left?.addEventListener('click', () => {
            console.log('PTZ: Move Left');
            this.ptzCallbacks.onMoveLeft?.();
        });

        buttons.right?.addEventListener('click', () => {
            console.log('PTZ: Move Right');
            this.ptzCallbacks.onMoveRight?.();
        });

        // Zoom controls
        buttons.zoomIn?.addEventListener('click', () => {
            console.log('PTZ: Zoom In');
            this.ptzCallbacks.onZoomIn?.();
        });

        buttons.zoomOut?.addEventListener('click', () => {
            console.log('PTZ: Zoom Out');
            this.ptzCallbacks.onZoomOut?.();
        });

        // Stop control
        buttons.stop?.addEventListener('click', () => {
            console.log('PTZ: Stop');
            this.ptzCallbacks.onStop?.();
        });

        // Add keyboard controls
        this.setupKeyboardControls();
    }

    /**
     * Setup keyboard controls for PTZ
     */
    private setupKeyboardControls(): void {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Only handle if the modal is visible and contains the video
            if (!this.modalBody.closest('.modal:not(.hidden)')) return;

            switch (event.key) {
                case 'ArrowUp':
                    event.preventDefault();
                    console.log('PTZ: Move Up (Keyboard)');
                    this.ptzCallbacks.onMoveUp?.();
                    break;
                case 'ArrowDown':
                    event.preventDefault();
                    console.log('PTZ: Move Down (Keyboard)');
                    this.ptzCallbacks.onMoveDown?.();
                    break;
                case 'ArrowLeft':
                    event.preventDefault();
                    console.log('PTZ: Move Left (Keyboard)');
                    this.ptzCallbacks.onMoveLeft?.();
                    break;
                case 'ArrowRight':
                    event.preventDefault();
                    console.log('PTZ: Move Right (Keyboard)');
                    this.ptzCallbacks.onMoveRight?.();
                    break;
                case '+':
                case '=':
                    event.preventDefault();
                    console.log('PTZ: Zoom In (Keyboard)');
                    this.ptzCallbacks.onZoomIn?.();
                    break;
                case '-':
                    event.preventDefault();
                    console.log('PTZ: Zoom Out (Keyboard)');
                    this.ptzCallbacks.onZoomOut?.();
                    break;
                case ' ':
                case 'Escape':
                    event.preventDefault();
                    console.log('PTZ: Stop (Keyboard)');
                    this.ptzCallbacks.onStop?.();
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        // Store the event listener for cleanup
        (this.modalBody as any)._ptzKeyListener = handleKeyDown;
    }

    /**
     * Load iframe player for WebRTC/HLS streams
     */
    private loadIframePlayer(streamUrl: string, protocolInfo: StreamProtocolInfo): void {
        if (!this.videoContainer) return;

        const {container: statusContainer, protocolDiv, updateStatus} = this.createStatusContainer();

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
            min-height: 500px;
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
        this.videoContainer.appendChild(statusContainer);
        this.videoContainer.appendChild(iframe);

        this.currentIframe = iframe;
    }

    /**
     * Load HLS player
     */
    private loadHLSPlayer(streamUrl: string): void {
        if (!this.videoContainer) return;

        const {container: statusContainer, protocolDiv, updateStatus} = this.createStatusContainer();
        this.videoContainer.appendChild(statusContainer);

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

        this.videoContainer.appendChild(video);
        this.currentVideo = video;
    }

    /**
     * Load MP4 player with comprehensive error handling
     */
    private loadMP4Player(streamUrl: string): void {
        if (!this.videoContainer) return;

        const {container: statusContainer, protocolDiv, updateStatus} = this.createStatusContainer();
        this.videoContainer.appendChild(statusContainer);

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
        this.videoContainer.appendChild(video);
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
            console.log(`🔍 Error attempt ${errorCount}:`, {
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
        // Remove keyboard event listener
        if ((this.modalBody as any)._ptzKeyListener) {
            document.removeEventListener('keydown', (this.modalBody as any)._ptzKeyListener);
            delete (this.modalBody as any)._ptzKeyListener;
        }

        this.clearExistingContent();
    }

    /**
     * Update configuration
     */
    public updateConfig(newConfig: Partial<VideoStreamConfig>): void {
        this.config = { ...this.config, ...newConfig };
    }

    /**
     * Show/Hide PTZ controls
     */
    public togglePTZControls(show: boolean): void {
        const ptzControls = this.modalBody.querySelector('.ptz-controls') as HTMLElement;
        if (ptzControls) {
            ptzControls.style.display = show ? 'block' : 'none';
        }
    }

    /**
     * Show/Hide PTZ controls - alternative method
     */
    public showPTZControls(isShow: boolean): void {
        if (isShow) {
            // Update config to show PTZ controls
            this.config.showPTZControls = true;

            // Add PTZ controls if they don't exist
            const existingPTZControls = this.modalBody.querySelector('.ptz-controls');
            if (!existingPTZControls) {
                this.addPTZControls();
            } else {
                // Show existing controls
                (existingPTZControls as HTMLElement).style.display = 'block';
            }
        } else {
            // Update config to hide PTZ controls
            this.config.showPTZControls = false;

            // Remove PTZ controls from DOM
            const ptzControls = this.modalBody.querySelector('.ptz-control-container');
            if (ptzControls) {
                ptzControls.remove();
            }

            // Remove keyboard event listener if PTZ is hidden
            if ((this.modalBody as any)._ptzKeyListener) {
                document.removeEventListener('keydown', (this.modalBody as any)._ptzKeyListener);
                delete (this.modalBody as any)._ptzKeyListener;
            }
        }
    }

    /**
     * Send PTZ command (example implementation)
     */
    public sendPTZCommand(command: string, params?: any): void {
        console.log(`Sending PTZ command: ${command}`, params);
        // Implementasi untuk mengirim perintah PTZ ke server/API
        // Contoh:
        // fetch('/api/ptz-control', {
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/json',
        //     },
        //     body: JSON.stringify({
        //         command: command,
        //         params: params
        //     })
        // });
    }

    /**
     * Set PTZ control position
     */
    public setPTZPosition(position: 'side' | 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right'): void {
        this.config.ptzControlPosition = position;

        // If changing to/from side position, need to recreate layout
        if (position === 'side' || this.config.ptzControlPosition === 'side') {
            console.log('PTZ position change requires layout recreation');
            // This would require recreating the entire layout
            // For now, just update the config for future use
            return;
        }

        // Update existing controls if they exist
        const ptzControls = this.modalBody.querySelector('.ptz-controls') as HTMLElement;
        // @ts-ignore
        if (ptzControls && position !== 'side') {
            // Remove old position classes
            ptzControls.className = ptzControls.className.replace(/\b(bottom|top)-(left|right)\b/g, '');

            // Add new position classes
            const positionClasses = {
                'bottom-left': 'bottom-4 left-4',
                'bottom-right': 'bottom-4 right-4',
                'top-left': 'top-4 left-4',
                'top-right': 'top-4 right-4'
            };

            ptzControls.className += ` ${positionClasses[position]}`;
        }
    }

    /**
     * Get PTZ controls element
     */
    public getPTZControls(): HTMLElement | null {
        return this.modalBody.querySelector('.ptz-controls');
    }

    /**
     * Enable/Disable specific PTZ functions
     */
    public setPTZEnabled(controls: {
        pan?: boolean;
        tilt?: boolean;
        zoom?: boolean;
    }): void {
        const ptzContainer = this.modalBody.querySelector('.ptz-controls');
        if (!ptzContainer) return;

        if (controls.pan === false) {
            const panButtons = ptzContainer.querySelectorAll('.ptz-left, .ptz-right');
            panButtons.forEach(btn => {
                (btn as HTMLElement).style.opacity = '0.3';
                (btn as HTMLElement).style.pointerEvents = 'none';
            });
        }

        if (controls.tilt === false) {
            const tiltButtons = ptzContainer.querySelectorAll('.ptz-up, .ptz-down');
            tiltButtons.forEach(btn => {
                (btn as HTMLElement).style.opacity = '0.3';
                (btn as HTMLElement).style.pointerEvents = 'none';
            });
        }

        if (controls.zoom === false) {
            const zoomButtons = ptzContainer.querySelectorAll('.ptz-zoom-in, .ptz-zoom-out');
            zoomButtons.forEach(btn => {
                (btn as HTMLElement).style.opacity = '0.3';
                (btn as HTMLElement).style.pointerEvents = 'none';
            });
        }
    }

    /**
     * Switch between side and overlay PTZ layout
     */
    public switchPTZLayout(layout: 'side' | 'overlay'): void {
        const newPosition = layout === 'side' ? 'side' : 'bottom-right';

        if (this.config.ptzControlPosition === newPosition) {
            return; // Already in the desired layout
        }

        // Store current stream URL if any
        let currentStreamUrl = '';
        if (this.currentVideo?.src) {
            currentStreamUrl = this.currentVideo.src;
        } else if (this.currentIframe?.src) {
            currentStreamUrl = this.currentIframe.src;
        }

        // Update config
        this.config.ptzControlPosition = newPosition;

        // If we have a stream, recreate the layout
        if (currentStreamUrl) {
            this.createVideoElement(this.modalBody, currentStreamUrl);
        }
    }

    /**
     * Get current PTZ layout type
     */
    public getPTZLayout(): 'side' | 'overlay' {
        return this.config.ptzControlPosition === 'side' ? 'side' : 'overlay';
    }
}

export default VideoStreamHandler;
