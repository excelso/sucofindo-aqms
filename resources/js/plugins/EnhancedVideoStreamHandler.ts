interface CameraData {
    cameraName: string;
    videoLink: string;
    protocol: 'rtc' | 'hls' | 'whep';
    supportPTZ: boolean;
    videoControl: boolean;
}

interface CamerasConfig extends Array<CameraData> {}

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
    gridColumns?: number; // Jumlah kolom dalam grid
    videoHeight?: string; // Tinggi video dalam grid
}

interface StreamProtocolInfo {
    isWebRTCPath: boolean;
    isWebRTCPort: boolean;
    isWhepPath: boolean;
    isHLSPort: boolean;
    isHLSFile: boolean;
    isMp4File: boolean;
    shouldUseIframe: boolean;
    shouldUseHLSPlayer: boolean;
}

interface PTZControlsCallbacks {
    onMoveUp?: (cameraId: string) => void;
    onMoveDown?: (cameraId: string) => void;
    onMoveLeft?: (cameraId: string) => void;
    onMoveRight?: (cameraId: string) => void;
    onZoomIn?: (cameraId: string) => void;
    onZoomOut?: (cameraId: string) => void;
    onStop?: (cameraId: string) => void;
}

interface VideoInstance {
    cameraData: CameraData;
    container: HTMLElement;
    videoElement: HTMLVideoElement | HTMLIFrameElement | null;
    hlsInstance: any;
    ptzContainer: HTMLElement | null;
}

class EnhancedVideoStreamHandler {
    private modalBody: HTMLElement;
    private config: VideoStreamConfig;
    private ptzCallbacks: PTZControlsCallbacks = {};
    private mainContainer: HTMLElement | null = null;
    private gridContainer: HTMLElement | null = null;
    private camerasData: CamerasConfig = [];
    private videoInstances: Map<string, VideoInstance> = new Map();
    private activeCameraId: string | null = null;

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
            ptzControlPosition: 'bottom-right',
            gridColumns: 2, // Default 2 kolom
            videoHeight: '300px', // Default tinggi video
            ...config
        };
    }

    /**
     * Set cameras data from array format
     * @param camerasArray Array of camera objects
     */
    public setCamerasData(camerasArray: CamerasConfig): void {
        this.camerasData = camerasArray;
        console.log('Cameras data set:', this.camerasData);
    }

    /**
     * Set PTZ control callbacks
     */
    public setPTZCallbacks(callbacks: PTZControlsCallbacks): void {
        this.ptzCallbacks = {...this.ptzCallbacks, ...callbacks};
    }

    /**
     * Create multiple video elements in grid layout
     */
    public createMultiVideoGrid(modalBody: HTMLElement): void {
        this.modalBody = modalBody;
        this.clearExistingContent();

        // Create main layout
        this.createMainLayout();

        // Calculate grid layout
        const totalCameras = this.camerasData.length;

        if (totalCameras === 0) {
            console.warn('No cameras available to display');
            return;
        }

        // Create video containers for each camera
        this.camerasData.forEach((camera, index) => {
            this.createVideoContainer(camera, index);
        });

        // Set first camera as active if available
        if (this.camerasData.length > 0) {
            this.setActiveCamera(this.camerasData[0].cameraName);
        }
    }

    /**
     * Create main layout container
     */
    private createMainLayout(): void {
        this.mainContainer = document.createElement('div');
        this.mainContainer.className = 'w-full max-w-none mx-auto';

        // Grid container
        this.gridContainer = document.createElement('div');

        // Calculate responsive grid
        const cameraCount = Object.keys(this.camerasData).length;
        const columns = Math.min(this.config.gridColumns!, cameraCount);

        this.gridContainer.className = `grid gap-0 w-full`;
        this.gridContainer.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;

        this.mainContainer.appendChild(this.gridContainer);
        this.modalBody.appendChild(this.mainContainer);
    }

    /**
     * Create individual video container
     */
    private createVideoContainer(camera: CameraData, index: number): void {
        if (!this.gridContainer) return;

        // Create container for this camera
        const videoContainer = document.createElement('div');
        videoContainer.className = 'relative bg-black overflow-hidden border-0 border-gray-300 hover:border-blue-500 transition-colors cursor-pointer';
        videoContainer.style.height = this.config.videoHeight!;

        // Add click handler to set as active camera
        videoContainer.addEventListener('click', () => {
            this.setActiveCamera(camera.cameraName);
        });

        // Create header with camera name and PTZ indicator
        const header = this.createCameraHeader(camera);
        videoContainer.appendChild(header);

        // Create video content area
        const videoContent = document.createElement('div');
        videoContent.className = 'video-content relative w-full h-full';
        videoContainer.appendChild(videoContent);

        // Create status container
        const statusContainer = this.createStatusContainer();
        videoContent.appendChild(statusContainer.container);

        // Load appropriate video player
        const protocolInfo = this.detectProtocol(camera.videoLink);
        this.logProtocolDetection(camera.videoLink, protocolInfo);

        let videoElement: HTMLVideoElement | null = null;
        let hlsInstance: any = null;

        // Always use video element instead of iframe
        if (protocolInfo.isWebRTCPath || protocolInfo.isWebRTCPort || protocolInfo.isHLSPort) {
            videoElement = this.loadVideoPlayer(camera.videoLink, camera.videoControl, protocolInfo, videoContent, statusContainer);
        } else if (protocolInfo.shouldUseHLSPlayer || protocolInfo.isHLSFile) {
            const result = this.loadHLSPlayer(camera.videoLink, videoContent, statusContainer);
            videoElement = result.video;
            hlsInstance = result.hls;
        } else if (protocolInfo.isMp4File) {
            videoElement = this.loadMP4Player(camera.videoLink, videoContent, statusContainer);
        } else {
            videoElement = this.loadVideoPlayer(camera.videoLink, camera.videoControl, protocolInfo, videoContent, statusContainer);
        }

        // Create PTZ controls if supported
        let ptzContainer: HTMLElement | null = null;
        if (camera.supportPTZ && this.config.showPTZControls) {
            ptzContainer = this.createPTZControls(camera.cameraName);
            videoContent.appendChild(ptzContainer);
        }

        // Store video instance
        const videoInstance: VideoInstance = {
            cameraData: camera,
            container: videoContainer,
            videoElement,
            hlsInstance,
            ptzContainer
        };

        this.videoInstances.set(camera.cameraName, videoInstance);
        this.gridContainer.appendChild(videoContainer);
    }

    /**
     * Create camera header with name and info
     */
    private createCameraHeader(camera: CameraData): HTMLElement {
        const header = document.createElement('div');
        console.log(this.camerasData.length)
        if (this.camerasData.length > 1) {
            header.className = 'absolute top-0 left-0 right-0 p-3 z-10';
        } else {
            header.className = 'absolute top-0 left-0 right-0 bg-gradient-to-b from-black/20 to-transparent p-3 z-10';
        }

        const title = document.createElement('div');
        title.className = 'absolute top-3 right-[185px] text-white font-bold text-sm flex items-center gap-4';

        const nameSpan = document.createElement('span');
        nameSpan.textContent = camera.cameraName;

        const ptzBadge = document.createElement('span');
        if (camera.supportPTZ) {
            ptzBadge.className = 'bg-green-500 text-white px-2 py-1 rounded text-xs';
            ptzBadge.textContent = 'PTZ';
        } else {
            ptzBadge.className = 'bg-gray-500 text-white px-2 py-1 rounded text-xs';
            ptzBadge.textContent = 'FIXED';
        }

        title.appendChild(nameSpan);
        title.appendChild(ptzBadge);
        header.appendChild(title);

        return header;
    }

    /**
     * Set active camera (highlight border, enable PTZ)
     */
    private setActiveCamera(cameraId: string): void {
        // Remove active state from all cameras
        this.videoInstances.forEach((instance, id) => {
            instance.container.classList.remove('border-blue-500', 'border-4');
            instance.container.classList.add('border-gray-300', 'border-1');

            // Hide PTZ controls for inactive cameras
            if (instance.ptzContainer) {
                instance.ptzContainer.style.display = 'none';
            }
        });

        // Set active camera
        const activeInstance = this.videoInstances.get(cameraId);
        if (activeInstance) {
            activeInstance.container.classList.remove('border-gray-300', 'border-1');
            activeInstance.container.classList.add('border-blue-500', 'border-4');

            // Show PTZ controls for active camera
            if (activeInstance.ptzContainer) {
                activeInstance.ptzContainer.style.display = 'block';
            }

            this.activeCameraId = cameraId;
            console.log(`Active camera set to: ${cameraId}`);
        }
    }

    /**
     * Create status container
     */
    private createStatusContainer(): {
        container: HTMLDivElement;
        statusDiv: HTMLDivElement;
        protocolDiv: HTMLDivElement;
        updateStatus: (text: string, color?: string) => void;
    } {
        const container = document.createElement('div');
        container.className = 'flex items-center absolute top-3 right-4 gap-2 z-10';

        const statusDiv = document.createElement('div');
        statusDiv.className = 'bg-black/80 text-white px-2 py-1 rounded text-xs font-bold';

        const protocolDiv = document.createElement('div');
        protocolDiv.className = 'bg-black/80 text-white px-2 py-1 rounded text-xs font-bold';

        container.appendChild(statusDiv);
        container.appendChild(protocolDiv);

        const updateStatus = (text: string, color: string = 'white') => {
            statusDiv.textContent = text;
            statusDiv.style.color = color;
        };

        return {container, statusDiv, protocolDiv, updateStatus};
    }

    /**
     * Create PTZ controls for specific camera
     */
    private createPTZControls(cameraId: string): HTMLElement {
        const ptzContainer = document.createElement('div');
        ptzContainer.className = 'ptz-controls absolute z-[1001]';
        ptzContainer.style.display = 'none'; // Hidden by default

        // Position based on config
        const position = this.config.ptzControlPosition;
        const positionClasses = {
            'bottom-left': 'bottom-2 left-2',
            'bottom-right': 'bottom-2 right-2',
            'top-left': 'top-12 left-2',
            'top-right': 'top-12 right-2'
        };

        // @ts-ignore
        if (position && position !== 'side') {
            ptzContainer.className += ` ${positionClasses[position]}`;
        }

        ptzContainer.innerHTML = `
            <div class="bg-black/90 rounded-lg p-2 backdrop-blur-sm">
                <div class="text-white text-xs font-bold mb-2 text-center">${cameraId}</div>

                <!-- Movement Controls -->
                <div class="grid grid-cols-3 gap-1 mb-2">
                    <div></div>
                    <button class="ptz-btn ptz-up bg-gray-700 hover:bg-blue-600 text-white rounded p-1 transition-colors duration-200 flex items-center justify-center" title="Move Up">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/>
                        </svg>
                    </button>
                    <div></div>

                    <button class="ptz-btn ptz-left bg-gray-700 hover:bg-blue-600 text-white rounded p-1 transition-colors duration-200 flex items-center justify-center" title="Move Left">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
                        </svg>
                    </button>
                    <button class="ptz-btn ptz-stop bg-red-600 hover:bg-red-700 text-white rounded p-1 transition-colors duration-200 flex items-center justify-center text-xs font-bold" title="Stop">
                        ■
                    </button>
                    <button class="ptz-btn ptz-right bg-gray-700 hover:bg-blue-600 text-white rounded p-1 transition-colors duration-200 flex items-center justify-center" title="Move Right">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                        </svg>
                    </button>

                    <div></div>
                    <button class="ptz-btn ptz-down bg-gray-700 hover:bg-blue-600 text-white rounded p-1 transition-colors duration-200 flex items-center justify-center" title="Move Down">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z"/>
                        </svg>
                    </button>
                    <div></div>
                </div>

                <!-- Zoom Controls -->
                <div class="grid grid-cols-2 gap-1">
                    <button class="ptz-btn ptz-zoom-in bg-green-600 hover:bg-green-700 text-white rounded p-1 transition-colors duration-200 flex items-center justify-center" title="Zoom In">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                            <path d="M12 10h-2v2H9v-2H7V9h2V7h1v2h2v1z"/>
                        </svg>
                    </button>
                    <button class="ptz-btn ptz-zoom-out bg-orange-600 hover:bg-orange-700 text-white rounded p-1 transition-colors duration-200 flex items-center justify-center" title="Zoom Out">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                            <path d="M7 9h5v1H7z"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;

        // Add event listeners
        this.setupPTZEventListeners(ptzContainer, cameraId);

        return ptzContainer;
    }

    /**
     * Setup PTZ event listeners for specific camera
     */
    private setupPTZEventListeners(ptzContainer: HTMLElement, cameraId: string): void {
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
        buttons.up?.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log(`PTZ: Move Up - Camera: ${cameraId}`);
            this.ptzCallbacks.onMoveUp?.(cameraId);
        });

        buttons.down?.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log(`PTZ: Move Down - Camera: ${cameraId}`);
            this.ptzCallbacks.onMoveDown?.(cameraId);
        });

        buttons.left?.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log(`PTZ: Move Left - Camera: ${cameraId}`);
            this.ptzCallbacks.onMoveLeft?.(cameraId);
        });

        buttons.right?.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log(`PTZ: Move Right - Camera: ${cameraId}`);
            this.ptzCallbacks.onMoveRight?.(cameraId);
        });

        // Zoom controls
        buttons.zoomIn?.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log(`PTZ: Zoom In - Camera: ${cameraId}`);
            this.ptzCallbacks.onZoomIn?.(cameraId);
        });

        buttons.zoomOut?.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log(`PTZ: Zoom Out - Camera: ${cameraId}`);
            this.ptzCallbacks.onZoomOut?.(cameraId);
        });

        // Stop control
        buttons.stop?.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log(`PTZ: Stop - Camera: ${cameraId}`);
            this.ptzCallbacks.onStop?.(cameraId);
        });
    }

    /**
     * Setup keyboard controls for active camera
     */
    private setupKeyboardControls(): void {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Only handle if modal is visible and there's an active camera
            if (!this.modalBody.closest('.modal:not(.hidden)') || !this.activeCameraId) return;

            // Only handle if active camera supports PTZ
            const activeCamera = this.camerasData.find((item) => item.cameraName === this.activeCameraId);
            if (!activeCamera || !activeCamera.supportPTZ) return;

            switch (event.key) {
                case 'ArrowUp':
                    event.preventDefault();
                    this.ptzCallbacks.onMoveUp?.(this.activeCameraId);
                    break;
                case 'ArrowDown':
                    event.preventDefault();
                    this.ptzCallbacks.onMoveDown?.(this.activeCameraId);
                    break;
                case 'ArrowLeft':
                    event.preventDefault();
                    this.ptzCallbacks.onMoveLeft?.(this.activeCameraId);
                    break;
                case 'ArrowRight':
                    event.preventDefault();
                    this.ptzCallbacks.onMoveRight?.(this.activeCameraId);
                    break;
                case '+':
                case '=':
                    event.preventDefault();
                    this.ptzCallbacks.onZoomIn?.(this.activeCameraId);
                    break;
                case '-':
                    event.preventDefault();
                    this.ptzCallbacks.onZoomOut?.(this.activeCameraId);
                    break;
                case ' ':
                case 'Escape':
                    event.preventDefault();
                    this.ptzCallbacks.onStop?.(this.activeCameraId);
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        (this.modalBody as any)._ptzKeyListener = handleKeyDown;
    }

    /**
     * Protocol detection and player loading methods
     */
    private detectProtocol(streamUrl: string): StreamProtocolInfo {
        const isWebRTCPath = streamUrl.includes('/rtc/') || streamUrl.includes('/hls/');
        const isWhepPath = streamUrl.includes('/whep') || streamUrl.includes('/whep/');
        const isWebRTCPort = streamUrl.includes(':8889') && !streamUrl.includes('.m3u8');
        const isHLSPort = streamUrl.includes(':8888') && !streamUrl.includes('.m3u8');
        const isHLSFile = streamUrl.includes('.m3u8');
        const isMp4File = streamUrl.includes('.mp4');

        const shouldUseIframe = isWebRTCPath || isWebRTCPort || isHLSPort;
        const shouldUseHLSPlayer = isHLSFile;

        return {
            isWebRTCPath,
            isWebRTCPort,
            isWhepPath,
            isHLSPort,
            isHLSFile,
            isMp4File,
            shouldUseIframe,
            shouldUseHLSPlayer
        };
    }

    private logProtocolDetection(streamUrl: string, protocolInfo: StreamProtocolInfo): void {
        console.log('Stream URL:', streamUrl);
        console.log('Protocol detection:', protocolInfo);
    }

    private loadVideoPlayer(
        streamUrl: string,
        videoControl: boolean,
        protocolInfo: StreamProtocolInfo,
        container: HTMLElement,
        statusContainer: any
    ): HTMLVideoElement {
        const {protocolDiv, updateStatus} = statusContainer;

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

        updateStatus(`Loading...`, '#ffa500');
        protocolDiv.textContent = protocolType;
        protocolDiv.style.background = protocolColor;

        // Create video element instead of iframe
        const video = document.createElement('video') as HTMLVideoElement;
        video.autoplay = this.config.autoplay!;
        video.controls = videoControl;
        video.muted = this.config.muted!;
        video.playsInline = true; // Important for mobile devices

        video.style.cssText = `
            width: 100%;
            height: 100%;
            object-fit: contain;
            background: #000;
        `;

        // Setup video event handlers
        video.addEventListener('loadstart', () => {
            updateStatus('Connecting...', '#ffa500');
        });

        video.addEventListener('canplay', () => {
            updateStatus('Connected', '#00ff00');
            console.log(`✅ ${protocolType} video ready`);
        });

        video.addEventListener('error', (e) => {
            updateStatus('Failed', '#ff0000');
            console.error(`❌ ${protocolType} video error:`, e);
        });

        video.addEventListener('waiting', () => {
            updateStatus('Buffering...', '#ffa500');
        });

        video.addEventListener('playing', () => {
            updateStatus('Playing', '#00ff00');
        });

        // Initialize WebRTC connection if it's a WebRTC stream
        if (protocolInfo.isWebRTCPath || protocolInfo.isWebRTCPort || protocolInfo.isWhepPath) {
            this.initializeWebRTCConnection(video, streamUrl, updateStatus, protocolType);
        } else if (protocolInfo.isHLSPort || protocolInfo.isHLSFile) {
            // For HLS streams, use HLS.js
            this.initializeHLSConnection(video, streamUrl, updateStatus);
        } else {
            // Direct video source
            video.src = streamUrl;
        }

        container.appendChild(video);
        return video;
    }

    /**
     * Initialize WebRTC connection using WHEP protocol
     */
    private async initializeWebRTCConnection(
        video: HTMLVideoElement,
        streamUrl: string,
        updateStatus: (text: string, color?: string) => void,
        protocolType: string
    ): Promise<void> {
        try {
            updateStatus('Establishing WebRTC...', '#ffa500');

            // Use existing loadWhepPlayback method
            const peerConnection = await this.loadWhepPlayback(streamUrl, video);

            // Monitor connection state
            peerConnection.onconnectionstatechange = () => {
                const state = peerConnection.connectionState;
                console.log(`WebRTC connection state: ${state}`);

                switch (state) {
                    case 'connecting':
                        updateStatus('Connecting...', '#ffa500');
                        break;
                    case 'connected':
                        updateStatus(`${protocolType} Connected`, '#00ff00');
                        break;
                    case 'disconnected':
                        updateStatus('Disconnected', '#ff6600');
                        break;
                    case 'failed':
                        updateStatus('Connection Failed', '#ff0000');
                        // Attempt fallback to HLS
                        this.attemptHLSFallback(video, streamUrl, updateStatus);
                        break;
                    case 'closed':
                        updateStatus('Connection Closed', '#666666');
                        break;
                }
            };

            peerConnection.oniceconnectionstatechange = () => {
                const iceState = peerConnection.iceConnectionState;
                console.log(`ICE connection state: ${iceState}`);

                if (iceState === 'failed' || iceState === 'disconnected') {
                    console.log('🔄 ICE connection failed, attempting reconnection...');
                    // Could implement reconnection logic here
                }
            };

        } catch (error) {
            console.error('WebRTC initialization failed:', error);
            updateStatus('WebRTC Failed', '#ff0000');

            // Fallback to HLS if available
            this.attemptHLSFallback(video, streamUrl, updateStatus);
        }
    }

    /**
     * Initialize HLS connection
     */
    private initializeHLSConnection(
        video: HTMLVideoElement,
        streamUrl: string,
        updateStatus: (text: string, color?: string) => void
    ): void {
        if ((window as any).Hls?.isSupported()) {
            const hls = new (window as any).Hls({
                enableWorker: true,
                lowLatencyMode: true,
                backBufferLength: 90
            });

            hls.loadSource(streamUrl);
            hls.attachMedia(video);

            hls.on((window as any).Hls.Events.MANIFEST_PARSED, () => {
                updateStatus('HLS Ready', '#00ff00');
                if (this.config.autoplay) {
                    video.play().catch(() => {
                        updateStatus('Ready (click to play)', '#00ff00');
                    });
                }
            });

            hls.on((window as any).Hls.Events.ERROR, (event: any, data: any) => {
                console.error('HLS Error:', data);
                if (data.fatal) {
                    updateStatus('HLS Error', '#ff0000');
                }
            });

            // Store HLS instance for cleanup
            (video as any)._hlsInstance = hls;

        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            // Native HLS support (Safari)
            video.src = streamUrl;
            updateStatus('Native HLS', '#00ff00');
        } else {
            updateStatus('HLS Not Supported', '#ff0000');
        }
    }

    /**
     * Attempt HLS fallback when WebRTC fails
     */
    private attemptHLSFallback(
        video: HTMLVideoElement,
        originalUrl: string,
        updateStatus: (text: string, color?: string) => void
    ): void {
        // Convert WebRTC URL to potential HLS URL
        let hlsUrl = originalUrl;

        // Example URL conversion (adjust based on your server setup)
        if (originalUrl.includes(':8889')) {
            hlsUrl = originalUrl.replace(':8889', ':8888').replace('/rtc/', '/hls/');
            if (!hlsUrl.includes('.m3u8')) {
                hlsUrl += '/index.m3u8';
            }
        }

        console.log(`🔄 Attempting HLS fallback: ${hlsUrl}`);
        updateStatus('Trying HLS fallback...', '#ffa500');

        this.initializeHLSConnection(video, hlsUrl, updateStatus);
    }

    /**
     * Enhanced loadWhepPlayback with better error handling
     */
    private async loadWhepPlayback(streamUrl: string, videoElm: HTMLVideoElement): Promise<RTCPeerConnection> {
        const pc = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ],
            iceCandidatePoolSize: 10
        });

        // Set up event handlers
        pc.ontrack = (event) => {
            console.log('📺 Received WebRTC track:', event.track.kind);
            videoElm.srcObject = event.streams[0];

            // Autoplay when track is received
            if (videoElm.autoplay) {
                videoElm.play().catch(console.warn);
            }
        };

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                console.log('🧊 ICE candidate:', event.candidate.type);
            }
        };

        // Add transceivers for receiving video and audio
        pc.addTransceiver('video', { direction: 'recvonly' });
        pc.addTransceiver('audio', { direction: 'recvonly' });

        // Create and set local description
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        try {
            console.log('📡 Sending WHEP request to:', streamUrl);

            const response = await fetch(streamUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/sdp',
                    'Accept': 'application/sdp'
                },
                body: offer.sdp
            });

            if (!response.ok) {
                throw new Error(`WHEP request failed: ${response.status} ${response.statusText}`);
            }

            const answerSdp = await response.text();
            console.log('✅ Received SDP answer, setting remote description');

            await pc.setRemoteDescription({
                type: 'answer',
                sdp: answerSdp
            });

            console.log('🎉 WHEP connection established successfully');
            return pc;

        } catch (error) {
            console.error('❌ WHEP connection failed:', error);
            pc.close();
            throw error;
        }
    }

    private loadHLSPlayer(
        streamUrl: string,
        container: HTMLElement,
        statusContainer: any
    ): { video: HTMLVideoElement, hls: any } {
        const {protocolDiv, updateStatus} = statusContainer;

        updateStatus('Loading...', '#f8bf31');
        protocolDiv.textContent = 'HLS';
        protocolDiv.style.background = '#f8bf31';

        const video = document.createElement('video') as HTMLVideoElement;
        video.autoplay = this.config.autoplay!;
        video.controls = this.config.controls!;
        video.muted = this.config.muted!;

        video.style.cssText = `
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: ${this.config.borderRadius};
            background: #000;
        `;

        let hlsInstance: any = null;

        if ((window as any).Hls?.isSupported()) {
            hlsInstance = new (window as any).Hls();
            hlsInstance.loadSource(streamUrl);
            hlsInstance.attachMedia(video);

            hlsInstance.on((window as any).Hls.Events.MANIFEST_PARSED, () => {
                updateStatus('Connected', '#00ff00');
                if (this.config.autoplay) {
                    video.play().catch(() => updateStatus('Ready', '#00ff00'));
                }
            });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = streamUrl;
            if (this.config.autoplay) {
                video.autoplay = true;
            }
        }

        container.appendChild(video);
        return { video, hls: hlsInstance };
    }

    private loadMP4Player(
        streamUrl: string,
        container: HTMLElement,
        statusContainer: any
    ): HTMLVideoElement {
        const {protocolDiv, updateStatus} = statusContainer;

        updateStatus('Loading...', '#f8bf31');
        protocolDiv.textContent = 'MP4';
        protocolDiv.style.background = '#007bff';

        const video = document.createElement('video') as HTMLVideoElement;
        video.autoplay = this.config.autoplay!;
        video.controls = this.config.controls!;
        video.muted = this.config.muted!;
        video.preload = 'metadata';

        video.style.cssText = `
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: ${this.config.borderRadius};
            background: #000;
        `;

        video.addEventListener('canplay', () => {
            updateStatus('Ready', '#00ff00');
            if (this.config.autoplay) {
                video.play().catch(() => updateStatus('Ready', '#00ff00'));
            }
        });

        video.addEventListener('error', () => updateStatus('Failed', '#ff0000'));

        video.src = streamUrl;
        container.appendChild(video);
        return video;
    }

    /**
     * Clear existing content
     */
    private clearExistingContent(): void {
        // Clean up all video instances
        this.videoInstances.forEach((instance) => {
            if (instance.hlsInstance) {
                instance.hlsInstance.destroy();
            }
            if (instance.videoElement instanceof HTMLVideoElement) {
                instance.videoElement.pause();
                instance.videoElement.src = '';
            }
        });

        this.videoInstances.clear();

        // Remove keyboard event listener
        if ((this.modalBody as any)._ptzKeyListener) {
            document.removeEventListener('keydown', (this.modalBody as any)._ptzKeyListener);
            delete (this.modalBody as any)._ptzKeyListener;
        }

        // Clear modal content
        this.modalBody.innerHTML = '';

        // Reset containers
        this.mainContainer = null;
        this.gridContainer = null;
        this.activeCameraId = null;
    }

    /**
     * Public methods
     */
    public getActiveCameraId(): string | null {
        return this.activeCameraId;
    }

    public getCamerasData(): CamerasConfig {
        return this.camerasData;
    }

    public updateGridColumns(columns: number): void {
        this.config.gridColumns = columns;
        if (this.gridContainer) {
            this.gridContainer.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
        }
    }

    public updateVideoHeight(height: string): void {
        this.config.videoHeight = height;
        this.videoInstances.forEach((instance) => {
            instance.container.style.height = height;
        });
    }

    public destroy(): void {
        this.clearExistingContent();
    }

    /**
     * Initialize with cameras data and create grid
     */
    public initializeWithCameras(modalBody: HTMLElement, camerasData: CamerasConfig): void {
        this.setCamerasData(camerasData);
        this.createMultiVideoGrid(modalBody);
        this.setupKeyboardControls();
    }
}

export {EnhancedVideoStreamHandler, type CamerasConfig};
