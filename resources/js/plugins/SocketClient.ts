import { io, Socket } from 'socket.io-client';

export interface SocketOptions {
    autoConnect?: boolean;
    reconnection?: boolean;
    reconnectionDelay?: number;
    reconnectionAttempts?: number;
    timeout?: number;
}

export interface LoggerEventData {
    uid: string;
    pm_10: number;
    pm_25: number;
    tsp: number;
    noise: number;
    temp?: number;
    datetime_unix: number;
    forecastData?: Array<{ timestamp: number; value: number; link_video_recorded?: string }>;
    aqi_value?: number;
}

export interface StationStatusData {
    uid: string;
    status: string;
    isOnline: boolean;
}

export interface SocketEventCallbacks {
    onConnect?: (socketId: string) => void;
    onDisconnect?: (reason: string) => void;
    onConnectError?: (error: Error) => void;
    onReconnect?: (attemptNumber: number) => void;
    onReconnectError?: (error: Error) => void;
    onReconnectFailed?: () => void;
    onLoggerData?: (data: LoggerEventData) => void;
    onBulkDataUpdate?: (data: any[]) => void;
    onStationStatusChange?: (data: StationStatusData) => void;
    onHeartbeat?: () => void;
    onNotification?: (data: any) => void;
    onConnectionStatusChange?: (status: 'connected' | 'disconnected' | 'error') => void;
}

export class SocketClient {
    private static instances: Map<string, SocketClient> = new Map();
    private socket?: Socket;
    private url: string;
    private options: SocketOptions;
    private callbacks: SocketEventCallbacks;
    private connectionStatus: 'connected' | 'disconnected' | 'error' = 'disconnected';
    private lastUpdateTime: Date = new Date();
    private isAutoConnect: boolean = true;

    private constructor(url: string, options: SocketOptions = {}, callbacks: SocketEventCallbacks = {}) {
        this.url = url;
        this.options = {
            autoConnect: true,
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
            timeout: 20000,
            ...options
        };
        this.callbacks = callbacks;
        this.isAutoConnect = this.options.autoConnect ?? true;

        if (this.isAutoConnect) {
            this.connect();
        }
    }

    /**
     * Get or create a SocketClient instance
     * @param instanceName - Unique name for the socket instance
     * @param url - Socket.IO server URL
     * @param options - Socket.IO options
     * @param callbacks - Event callbacks
     */
    public static getInstance(
        instanceName: string,
        url: string,
        options: SocketOptions = {},
        callbacks: SocketEventCallbacks = {}
    ): SocketClient {
        if (!SocketClient.instances.has(instanceName)) {
            SocketClient.instances.set(instanceName, new SocketClient(url, options, callbacks));
        }
        return SocketClient.instances.get(instanceName)!;
    }

    /**
     * Get existing instance by name
     */
    public static getExistingInstance(instanceName: string): SocketClient | undefined {
        return SocketClient.instances.get(instanceName);
    }

    /**
     * Remove instance
     */
    public static removeInstance(instanceName: string): boolean {
        const instance = SocketClient.instances.get(instanceName);
        if (instance) {
            instance.disconnect();
            return SocketClient.instances.delete(instanceName);
        }
        return false;
    }

    /**
     * Get all active instances
     */
    public static getActiveInstances(): string[] {
        return Array.from(SocketClient.instances.keys());
    }

    /**
     * Connect to Socket.IO server
     */
    public connect(): void {
        if (this.socket && this.socket.connected) {
            console.log('🔌 Socket already connected');
            return;
        }

        try {
            console.log(`🔌 Connecting to Socket.IO server: ${this.url}`);
            this.socket = io(this.url, {
                transports: ['websocket'],
                ...this.options
            });
            this.setupEventHandlers();
        } catch (error) {
            console.error('❌ Failed to initialize Socket.IO:', error);
            this.updateConnectionStatus('error');
        }
    }

    /**
     * Disconnect from Socket.IO server
     */
    public disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = undefined;
            console.log('🔌 Socket.IO disconnected manually');
        }
    }

    /**
     * Setup event handlers
     */
    private setupEventHandlers(): void {
        if (!this.socket) return;

        // Connection events
        this.socket.on('connect', () => {
            console.log('🔌 Socket.IO connected to server');
            console.log('Socket ID:', this.socket?.id);
            this.updateConnectionStatus('connected');
            if (this.callbacks.onConnect) {
                this.callbacks.onConnect(this.socket?.id || '');
            }
        });

        this.socket.on('disconnect', (reason) => {
            console.log('🔌 Socket.IO disconnected:', reason);
            this.updateConnectionStatus('disconnected');
            if (this.callbacks.onDisconnect) {
                this.callbacks.onDisconnect(reason);
            }
        });

        this.socket.on('connect_error', (error) => {
            console.error('❌ Socket.IO connection error:', error);
            this.updateConnectionStatus('error');
            if (this.callbacks.onConnectError) {
                this.callbacks.onConnectError(error);
            }
        });

        this.socket.on('reconnect', (attemptNumber) => {
            console.log(`🔌 Socket.IO reconnected after ${attemptNumber} attempts`);
            this.updateConnectionStatus('connected');
            if (this.callbacks.onReconnect) {
                this.callbacks.onReconnect(attemptNumber);
            }
        });

        this.socket.on('reconnect_error', (error) => {
            console.error('❌ Socket.IO reconnection error:', error);
            this.updateConnectionStatus('error');
            if (this.callbacks.onReconnectError) {
                this.callbacks.onReconnectError(error);
            }
        });

        this.socket.on('reconnect_failed', () => {
            console.error('❌ Socket.IO failed to reconnect');
            this.updateConnectionStatus('error');
            if (this.callbacks.onReconnectFailed) {
                this.callbacks.onReconnectFailed();
            }
        });

        // Data events
        this.socket.on('logger_data', (loggerData: LoggerEventData) => {
            console.log('📡 Received logger data:', loggerData);
            this.lastUpdateTime = new Date();
            if (this.callbacks.onLoggerData) {
                this.callbacks.onLoggerData(loggerData);
            }
        });

        this.socket.on('bulk_data_update', (bulkData: any[]) => {
            console.log('📡 Received bulk data update:', bulkData);
            this.lastUpdateTime = new Date();
            if (this.callbacks.onBulkDataUpdate) {
                this.callbacks.onBulkDataUpdate(bulkData);
            }
        });

        this.socket.on('station_status_change', (data: StationStatusData) => {
            console.log('📡 Received station status change:', data);
            this.lastUpdateTime = new Date();
            if (this.callbacks.onStationStatusChange) {
                this.callbacks.onStationStatusChange(data);
            }
        });

        // Heartbeat and notifications
        this.socket.on('heartbeat', () => {
            this.lastUpdateTime = new Date();
            console.log('💓 Heartbeat received');
            if (this.callbacks.onHeartbeat) {
                this.callbacks.onHeartbeat();
            }
        });

        this.socket.on('notification', (data: any) => {
            console.log('📢 Notification:', data);
            if (this.callbacks.onNotification) {
                this.callbacks.onNotification(data);
            }
        });

        this.socket.on('req-video', (data: any) => {
            console.log('Req Video', data)
        })
    }

    /**
     * Update connection status
     */
    private updateConnectionStatus(status: 'connected' | 'disconnected' | 'error'): void {
        this.connectionStatus = status;
        if (this.callbacks.onConnectionStatusChange) {
            this.callbacks.onConnectionStatusChange(status);
        }
    }

    /**
     * Emit event to server
     */
    public emit(event: string, data: any, callback?: (response: any) => void): void {
        if (this.socket && this.socket.connected) {
            if (callback) {
                // Emit dengan callback
                this.socket.emit(event, data, callback);
                console.log(`📤 Emitted event '${event}' with callback to server:`, data);
            } else {
                // Emit tanpa callback (backward compatibility)
                this.socket.emit(event, data);
                console.log(`📤 Emitted event '${event}' to server:`, data);
            }
        } else {
            console.warn('⚠️ Socket.IO not connected. Cannot emit event:', event);
            if (callback) {
                callback({
                    success: false,
                    error: 'Socket not connected'
                });
            }
        }
    }

    /**
     * Listen for custom events
     */
    public on(event: string, callback: (data: any) => void): void {
        if (this.socket) {
            this.socket.on(event, callback);
        } else {
            console.warn('⚠️ Socket.IO not initialized. Cannot listen for event:', event);
        }
    }

    /**
     * Remove event listener
     */
    public off(event: string, callback?: (data: any) => void): void {
        if (this.socket) {
            this.socket.off(event, callback);
        }
    }

    /**
     * Update callbacks
     */
    public updateCallbacks(newCallbacks: Partial<SocketEventCallbacks>): void {
        this.callbacks = { ...this.callbacks, ...newCallbacks };
    }

    /**
     * Get connection status
     */
    public getConnectionStatus(): 'connected' | 'disconnected' | 'error' {
        return this.connectionStatus;
    }

    /**
     * Get socket ID
     */
    public getSocketId(): string | undefined {
        return this.socket?.id;
    }

    /**
     * Check if socket is connected
     */
    public isConnected(): boolean {
        return this.socket?.connected || false;
    }

    /**
     * Get last update time
     */
    public getLastUpdateTime(): Date {
        return this.lastUpdateTime;
    }

    /**
     * Force reconnect
     */
    public reconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            setTimeout(() => {
                this.connect();
            }, 1000);
        } else {
            this.connect();
        }
    }

    /**
     * Get socket instance (for advanced usage)
     */
    public getSocket(): Socket | undefined {
        return this.socket;
    }

    /**
     * Set socket options (only applies to new connections)
     */
    public setOptions(options: Partial<SocketOptions>): void {
        this.options = { ...this.options, ...options };
    }

    /**
     * Get current options
     */
    public getOptions(): SocketOptions {
        return { ...this.options };
    }
}
