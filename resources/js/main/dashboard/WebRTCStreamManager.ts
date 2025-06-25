class WebRTCStreamManager {
    private peerConnection: RTCPeerConnection | null = null;
    private video: HTMLVideoElement | null = null;
    private isConnected: boolean = false;
    private onStatusChange: ((status: string, color: string) => void) | null = null;

    constructor(onStatusChange?: (status: string, color: string) => void) {
        this.onStatusChange = onStatusChange || null;
    }

    private updateStatus(status: string, color: string = '#ffffff') {
        if (this.onStatusChange) {
            this.onStatusChange(status, color);
        }
        console.log(`WebRTC Status: ${status}`);
    }

    async startStream(video: HTMLVideoElement, serverUrl: string, streamPath: string): Promise<void> {
        try {
            this.video = video;
            this.updateStatus('Creating WebRTC connection...', '#ffa500');

            // Create RTCPeerConnection
            this.peerConnection = new RTCPeerConnection({
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' }
                ]
            });

            // Handle incoming stream
            this.peerConnection.ontrack = (event) => {
                console.log('WebRTC: Received remote stream', event);
                if (event.streams && event.streams[0]) {
                    video.srcObject = event.streams[0];
                    this.isConnected = true;
                    this.updateStatus('WebRTC Connected ✓', '#00ff00');

                    // Auto play
                    video.play().catch(error => {
                        console.warn('Autoplay failed:', error);
                        this.updateStatus('WebRTC Ready - Click to Play', '#00aa00');
                    });
                }
            };

            // Connection state monitoring
            this.peerConnection.oniceconnectionstatechange = () => {
                const state = this.peerConnection?.iceConnectionState;
                console.log('ICE state:', state);

                if (state === 'failed' || state === 'closed') {
                    this.isConnected = false;
                    this.updateStatus('WebRTC Connection Failed', '#ff0000');
                    throw new Error('WebRTC connection failed');
                } else if (state === 'connected' || state === 'completed') {
                    this.isConnected = true;
                    this.updateStatus('WebRTC Connected ✓', '#00ff00');
                }
            };

            // Create offer
            const offer = await this.peerConnection.createOffer({
                offerToReceiveVideo: true,
                offerToReceiveAudio: true
            });

            await this.peerConnection.setLocalDescription(offer);

            // Send to MediaMTX WHEP endpoint
            const whepUrl = `${serverUrl}:8889/${streamPath}/whep`;
            console.log('WebRTC WHEP URL:', whepUrl);

            const response = await fetch(whepUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/sdp',
                },
                body: offer.sdp,
                mode: 'cors'
            });

            if (!response.ok) {
                throw new Error(`WHEP failed: ${response.status}`);
            }

            const answerSdp = await response.text();
            await this.peerConnection.setRemoteDescription({
                type: 'answer',
                sdp: answerSdp,
            });

            this.updateStatus('WebRTC handshake complete', '#00aa00');

        } catch (error) {
            console.error('WebRTC error:', error);
            this.updateStatus(`WebRTC Error: ${error.message}`, '#ff0000');
            throw error;
        }
    }

    stop(): void {
        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }

        if (this.video?.srcObject) {
            const stream = this.video.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            this.video.srcObject = null;
        }

        this.isConnected = false;
        this.updateStatus('Disconnected', '#888888');
    }

    isStreamConnected(): boolean {
        return this.isConnected;
    }
}
