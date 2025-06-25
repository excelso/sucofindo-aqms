import {io, Socket} from "socket.io-client";

export class RTSPStream {
    private socket: Socket;
    private ctx: CanvasRenderingContext2D;
    private canvas: HTMLCanvasElement;
    private currentStreamId: string | null = null;
    private frameCount: number = 0;
    private isConnected: boolean = false;

    constructor(bodyElm: HTMLCanvasElement) {
        this.socket = io('http://localhost:3300', {
            transports: ['websocket', 'polling'],
            autoConnect: true,
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
            timeout: 20000
        });

        this.canvas = bodyElm;
        this.ctx = bodyElm.getContext('2d') as CanvasRenderingContext2D;

        if (!this.ctx) {
            throw new Error('Failed to get 2D context from canvas');
        }

        this.initSocketListener();
        this.initCanvas();
    }

    private initCanvas(): void {
        // Initialize canvas with default state
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#555';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('No Stream Active', this.canvas.width / 2, this.canvas.height / 2);
    }

    private initSocketListener(): void {
        this.socket.on('connect', () => {
            console.log('✅ Connected to Server');
            this.isConnected = true;
        });

        this.socket.on('disconnect', (reason: string) => {
            console.log('❌ Disconnected from Service:', reason);
            this.isConnected = false;
            this.resetStream();
        });

        // Fix: Use arrow function to preserve 'this' context
        this.socket.on('stream-data', (data: any) => {
            this.frameCount++;

            // Clear canvas
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            // Draw stream info
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('📡 Receiving Stream Data', this.canvas.width / 2, this.canvas.height / 2 - 40);
            this.ctx.fillText(`Frame: ${this.frameCount}`, this.canvas.width / 2, this.canvas.height / 2 - 10);
            this.ctx.fillText(`Stream ID: ${data.streamId}`, this.canvas.width / 2, this.canvas.height / 2 + 20);

            // Show data size info
            if (data.data) {
                const dataSize = Math.round(data.data.length / 1024);
                this.ctx.fillText(`Data: ${dataSize} KB`, this.canvas.width / 2, this.canvas.height / 2 + 50);
            }

            // Log every 100 frames to avoid spam
            if (this.frameCount % 100 === 0) {
                console.log(`📺 Received ${this.frameCount} frames for stream ${data.streamId}`);
            }
        });

        this.socket.on('stream-ready', (data: any) => {
            console.log(`✅ Stream ${data.streamId} is ready`);
            this.updateStreamStatus('Stream Ready', '#00ff00');
        });

        this.socket.on('stream-error', (data: any) => {
            console.error(`❌ Stream error for ${data.streamId}:`, data.error);
            this.updateStreamStatus(`Error: ${data.error}`, '#ff0000');
        });

        this.socket.on('stream-ended', (data: any) => {
            console.log(`📺 Stream ${data.streamId} ended`);
            this.updateStreamStatus('Stream Ended', '#ffaa00');
            this.resetStream();
        });

        this.socket.on('connect_error', (err: Error) => {
            console.error('❌ Connection error:', err.message);
            this.isConnected = false;
        });

        this.socket.on('reconnect', (attemptNumber: number) => {
            console.log(`🔄 Reconnected after ${attemptNumber} attempts`);
            this.isConnected = true;
        });

        this.socket.on('reconnect_error', (err: Error) => {
            console.error('❌ Reconnection failed:', err.message);
        });
    }

    private updateStreamStatus(message: string, color: string): void {
        this.ctx.fillStyle = color;
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(message, this.canvas.width / 2, this.canvas.height - 20);
    }

    private resetStream(): void {
        this.currentStreamId = null;
        this.frameCount = 0;
        this.initCanvas();
    }

    public async startStream(rtspUrl: string): Promise<boolean> {
        try {
            // if (!this.isConnected) {
            //     console.error('❌ Not connected to server');
            //     return false;
            // }

            if (this.currentStreamId) {
                console.warn('⚠️ Stream already active, stopping current stream first');
                await this.stopStream();
            }

            console.log(`🚀 Starting stream: ${rtspUrl}`);
            this.updateStreamStatus('Starting stream...', '#ffaa00');

            const response = await fetch('http://localhost:3300/api/start-stream', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ rtspUrl })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                this.currentStreamId = result.streamId;
                console.log(`✅ Stream started with ID: ${this.currentStreamId}`);

                // Join stream room
                return new Promise((resolve) => {
                    this.socket.emit('join-stream', this.currentStreamId, (joinResult: any) => {
                        if (joinResult && joinResult.success) {
                            console.log('✅ Successfully joined stream room');
                            this.frameCount = 0;
                            this.updateStreamStatus('Waiting for stream data...', '#00aaff');
                            resolve(true);
                        } else {
                            console.error('❌ Failed to join stream room:', joinResult?.error || 'Unknown error');
                            this.currentStreamId = null;
                            this.updateStreamStatus('Failed to join stream', '#ff0000');
                            resolve(false);
                        }
                    });
                });
            } else {
                console.error('❌ Failed to start stream:', result.error || 'Unknown error');
                this.updateStreamStatus(`Failed: ${result.error || 'Unknown error'}`, '#ff0000');
                return false;
            }
        } catch (error: any) {
            console.error(`❌ Error starting stream: ${error.message}`);
            this.updateStreamStatus(`Error: ${error.message}`, '#ff0000');
            return false;
        }
    }

    public async stopStream(): Promise<boolean> {
        try {
            if (!this.currentStreamId) {
                console.warn('⚠️ No active stream to stop');
                return true;
            }

            console.log(`🛑 Stopping stream: ${this.currentStreamId}`);
            this.updateStreamStatus('Stopping stream...', '#ffaa00');

            // Leave stream room first
            this.socket.emit('leave-stream', this.currentStreamId, (leaveResult: any) => {
                console.log('📤 Left stream room:', leaveResult);
            });

            // Stop stream via API
            const response = await fetch('http://localhost:3300/api/stop-stream', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ streamId: this.currentStreamId })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                console.log('✅ Stream stopped successfully');
                this.resetStream();
                return true;
            } else {
                console.error('❌ Failed to stop stream:', result.error || 'Unknown error');
                this.updateStreamStatus(`Stop failed: ${result.error || 'Unknown error'}`, '#ff0000');
                return false;
            }
        } catch (error: any) {
            console.error(`❌ Error stopping stream: ${error.message}`);
            this.updateStreamStatus(`Stop error: ${error.message}`, '#ff0000');
            return false;
        }
    }

    public getStreamInfo(): { streamId: string | null; frameCount: number; isConnected: boolean } {
        return {
            streamId: this.currentStreamId,
            frameCount: this.frameCount,
            isConnected: this.isConnected
        };
    }

    public isStreamActive(): boolean {
        return this.currentStreamId !== null;
    }

    public async getActiveStreams(): Promise<any[]> {
        try {
            const response = await fetch('http://localhost:3300/api/streams');
            const result = await response.json();

            if (response.ok && result.success) {
                return result.streams || [];
            } else {
                console.error('Failed to get active streams:', result.error);
                return [];
            }
        } catch (error: any) {
            console.error('Error getting active streams:', error.message);
            return [];
        }
    }

    public disconnect(): void {
        if (this.currentStreamId) {
            this.stopStream();
        }
        this.socket.disconnect();
        console.log('🔌 Disconnected from server');
    }

    // Event handlers for external use
    public onStreamReady(callback: (data: any) => void): void {
        this.socket.on('stream-ready', callback);
    }

    public onStreamError(callback: (data: any) => void): void {
        this.socket.on('stream-error', callback);
    }

    public onStreamEnded(callback: (data: any) => void): void {
        this.socket.on('stream-ended', callback);
    }

    public onConnect(callback: () => void): void {
        this.socket.on('connect', callback);
    }

    public onDisconnect(callback: (reason: string) => void): void {
        this.socket.on('disconnect', callback);
    }
}
