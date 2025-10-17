class OnvifPTZController {
    private cameraId: string;
    private csrfToken: string;
    private baseUrl: string;
    private currentStatus: any = null;
    private lastStatusUpdate: number = 0;
    private statusCacheTime: number = 2000; // Cache status for 2 seconds
    private defaultStep: number = 0.1; // Default step size for ONVIF (normalized values)
    private defaultSpeed: number = 0.5; // Default speed for continuous movements

    constructor(csrfToken: string, cameraId: string) {
        this.csrfToken = csrfToken;
        this.cameraId = cameraId;
        this.baseUrl = '/aqms/onvif/onvif-ptz'; // Update base URL untuk ONVIF
    }

    /**
     * Get current PTZ status, with caching to avoid too many requests
     */
    async getCurrentStatus(forceRefresh: boolean = false): Promise<any> {
        const now = Date.now();

        // Use cached status if it's recent and not forcing refresh
        if (!forceRefresh && this.currentStatus && (now - this.lastStatusUpdate) < this.statusCacheTime) {
            console.log('Using cached ONVIF PTZ status:', this.currentStatus);
            return this.currentStatus;
        }

        try {
            console.log('Fetching current ONVIF PTZ status...');
            const response = await fetch(`${this.baseUrl}/camera/${this.cameraId}/status`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': this.csrfToken
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                this.currentStatus = result.status;
                this.lastStatusUpdate = now;
                console.log('Current ONVIF PTZ status:', this.currentStatus);
                return this.currentStatus;
            } else {
                throw new Error(result.message || 'Failed to get PTZ status');
            }

        } catch (error) {
            console.error('Error getting ONVIF PTZ status:', error);
            // Return last known status or default values
            return this.currentStatus || {
                pan_position: 0,
                tilt_position: 0,
                zoom_position: 0,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Move camera relative to current position using ONVIF normalized values
     */
    async moveRelative(direction: 'up' | 'down' | 'left' | 'right', step: number = this.defaultStep): Promise<any> {
        try {
            console.log(`Moving ${direction} with step: ${step}`);

            const response = await fetch(`${this.baseUrl}/control`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': this.csrfToken
                },
                body: JSON.stringify({
                    action: 'relative',
                    camera_id: this.cameraId,
                    params: {
                        direction: direction,
                        step: step
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.message || 'Relative movement failed');
            }

            console.log('ONVIF relative movement result:', result);

            // Update cached status after movement
            setTimeout(() => this.getCurrentStatus(true), 500);

            return result.data;

        } catch (error) {
            console.error(`Error in relative movement ${direction}:`, error);
            this.showPTZError(`Movement failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Continuous movement using ONVIF protocol
     */
    async moveContinuous(direction: 'up' | 'down' | 'left' | 'right' | 'up-left' | 'up-right' | 'down-left' | 'down-right', speed: number = this.defaultSpeed): Promise<any> {
        try {
            console.log(`Continuous movement ${direction} with speed: ${speed}`);

            const response = await fetch(`${this.baseUrl}/control`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': this.csrfToken
                },
                body: JSON.stringify({
                    action: 'continuous',
                    camera_id: this.cameraId,
                    params: {
                        direction: direction,
                        speed: speed
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.message || 'Continuous movement failed');
            }

            console.log('ONVIF continuous movement result:', result);
            return result.data;

        } catch (error) {
            console.error(`Error in continuous movement ${direction}:`, error);
            this.showPTZError(`Continuous movement failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Move to absolute position using ONVIF normalized coordinates
     */
    async moveAbsolute(pan: number, tilt: number, zoom: number = 0): Promise<any> {
        try {
            // Ensure values are within ONVIF normalized range
            pan = Math.max(-1.0, Math.min(1.0, pan));
            tilt = Math.max(-1.0, Math.min(1.0, tilt));
            zoom = Math.max(0.0, Math.min(1.0, zoom));

            console.log(`Absolute movement to pan: ${pan}, tilt: ${tilt}, zoom: ${zoom}`);

            const response = await fetch(`${this.baseUrl}/control`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': this.csrfToken
                },
                body: JSON.stringify({
                    action: 'absolute',
                    camera_id: this.cameraId,
                    params: {
                        pan: pan,
                        tilt: tilt,
                        zoom: zoom
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.message || 'Absolute movement failed');
            }

            console.log('ONVIF absolute movement result:', result);

            // Update cached status with new position
            this.currentStatus = {
                ...this.currentStatus,
                pan_position: pan,
                tilt_position: tilt,
                zoom_position: zoom,
                timestamp: new Date().toISOString()
            };
            this.lastStatusUpdate = Date.now();

            return result.data;

        } catch (error) {
            console.error('Error in absolute movement:', error);
            this.showPTZError(`Movement failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Enhanced movement methods for ONVIF
     */
    async moveUp(step: number = this.defaultStep): Promise<any> {
        return this.moveRelative('up', step);
    }

    async moveDown(step: number = this.defaultStep): Promise<any> {
        return this.moveRelative('down', step);
    }

    async moveLeft(step: number = this.defaultStep): Promise<any> {
        return this.moveRelative('left', step);
    }

    async moveRight(step: number = this.defaultStep): Promise<any> {
        return this.moveRelative('right', step);
    }

    /**
     * Continuous movement methods
     */
    async startContinuousUp(speed: number = this.defaultSpeed): Promise<any> {
        return this.moveContinuous('up', speed);
    }

    async startContinuousDown(speed: number = this.defaultSpeed): Promise<any> {
        return this.moveContinuous('down', speed);
    }

    async startContinuousLeft(speed: number = this.defaultSpeed): Promise<any> {
        return this.moveContinuous('left', speed);
    }

    async startContinuousRight(speed: number = this.defaultSpeed): Promise<any> {
        return this.moveContinuous('right', speed);
    }

    /**
     * Zoom methods using ONVIF continuous movement
     */
    async zoomIn(speed: number = this.defaultSpeed): Promise<any> {
        try {
            const response = await fetch(`${this.baseUrl}/control`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': this.csrfToken
                },
                body: JSON.stringify({
                    action: 'zoom',
                    camera_id: this.cameraId,
                    params: {
                        direction: 'in',
                        speed: speed
                    }
                })
            });

            const result = await response.json();
            console.log('ONVIF zoom in result:', result);
            return result;

        } catch (error) {
            console.error('Error zooming in:', error);
            throw error;
        }
    }

    async zoomOut(speed: number = this.defaultSpeed): Promise<any> {
        try {
            const response = await fetch(`${this.baseUrl}/control`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': this.csrfToken
                },
                body: JSON.stringify({
                    action: 'zoom',
                    camera_id: this.cameraId,
                    params: {
                        direction: 'out',
                        speed: speed
                    }
                })
            });

            const result = await response.json();
            console.log('ONVIF zoom out result:', result);
            return result;

        } catch (error) {
            console.error('Error zooming out:', error);
            throw error;
        }
    }

    /**
     * Stop all movements
     */
    async stop(): Promise<any> {
        try {
            const response = await fetch(`${this.baseUrl}/control`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': this.csrfToken
                },
                body: JSON.stringify({
                    action: 'stop',
                    camera_id: this.cameraId
                })
            });

            const result = await response.json();
            console.log('ONVIF stop result:', result);
            return result;

        } catch (error) {
            console.error('Error stopping PTZ:', error);
            throw error;
        }
    }

    /**
     * Preset management using ONVIF
     */
    async gotoPreset(presetToken: string): Promise<any> {
        try {
            const response = await fetch(`${this.baseUrl}/control`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': this.csrfToken
                },
                body: JSON.stringify({
                    action: 'preset',
                    camera_id: this.cameraId,
                    params: {
                        action: 'goto',
                        preset_token: presetToken
                    }
                })
            });

            const result = await response.json();

            if (result.success) {
                // Force status refresh after preset movement
                setTimeout(() => this.getCurrentStatus(true), 1000);
            }

            return result;

        } catch (error) {
            console.error('Error going to preset:', error);
            throw error;
        }
    }

    async setPreset(presetToken: string, name?: string): Promise<any> {
        try {
            const response = await fetch(`${this.baseUrl}/control`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': this.csrfToken
                },
                body: JSON.stringify({
                    action: 'preset',
                    camera_id: this.cameraId,
                    params: {
                        action: 'set',
                        preset_token: presetToken,
                        name: name || presetToken
                    }
                })
            });

            return response.json();

        } catch (error) {
            console.error('Error setting preset:', error);
            throw error;
        }
    }

    async removePreset(presetToken: string): Promise<any> {
        try {
            const response = await fetch(`${this.baseUrl}/control`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': this.csrfToken
                },
                body: JSON.stringify({
                    action: 'preset',
                    camera_id: this.cameraId,
                    params: {
                        action: 'remove',
                        preset_token: presetToken
                    }
                })
            });

            return response.json();

        } catch (error) {
            console.error('Error removing preset:', error);
            throw error;
        }
    }

    /**
     * Test ONVIF connection
     */
    async testConnection(): Promise<any> {
        try {
            const response = await fetch(`${this.baseUrl}/camera/${this.cameraId}/test-connection`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': this.csrfToken
                }
            });

            return response.json();
        } catch (error) {
            console.error('Error testing connection:', error);
            return null;
        }
    }

    /**
     * Move to predefined positions using normalized coordinates
     */
    async moveToCenter(): Promise<any> {
        return this.moveAbsolute(0, 0, 0);
    }

    async moveToTopLeft(): Promise<any> {
        return this.moveAbsolute(-0.5, 0.5, 0);
    }

    async moveToTopRight(): Promise<any> {
        return this.moveAbsolute(0.5, 0.5, 0);
    }

    async moveToBottomLeft(): Promise<any> {
        return this.moveAbsolute(-0.5, -0.5, 0);
    }

    async moveToBottomRight(): Promise<any> {
        return this.moveAbsolute(0.5, -0.5, 0);
    }

    /**
     * Update step size for movements (ONVIF normalized values)
     */
    setStepSize(step: number): void {
        this.defaultStep = Math.max(0.01, Math.min(1.0, step)); // Keep step between 0.01-1.0
        console.log(`ONVIF PTZ step size updated to: ${this.defaultStep}`);
    }

    /**
     * Update speed for continuous movements
     */
    setSpeed(speed: number): void {
        this.defaultSpeed = Math.max(0.1, Math.min(1.0, speed)); // Keep speed between 0.1-1.0
        console.log(`ONVIF PTZ speed updated to: ${this.defaultSpeed}`);
    }

    /**
     * Get current step size
     */
    getStepSize(): number {
        return this.defaultStep;
    }

    /**
     * Get current speed
     */
    getSpeed(): number {
        return this.defaultSpeed;
    }

    /**
     * Force status refresh
     */
    async refreshStatus(): Promise<any> {
        return this.getCurrentStatus(true);
    }

    /**
     * Show PTZ error message
     */
    private showPTZError(message: string): void {
        console.error('ONVIF PTZ Error:', message);

        // You can implement your preferred notification system here
        if (typeof window !== 'undefined' && (window as any).showToast) {
            (window as any).showToast(message, 'error');
        }
    }

    /**
     * Get position info in human-readable format for ONVIF
     */
    getPositionInfo(): any {
        if (!this.currentStatus) return null;

        return {
            pan_position: this.currentStatus.pan_position || 0,
            tilt_position: this.currentStatus.tilt_position || 0,
            zoom_position: this.currentStatus.zoom_position || 0,
            pan_degrees: (this.currentStatus.pan_position || 0) * 180, // Convert normalized to degrees
            tilt_degrees: (this.currentStatus.tilt_position || 0) * 90, // Convert normalized to degrees
            zoom_percentage: (this.currentStatus.zoom_position || 0) * 100, // Convert to percentage
            last_updated: new Date(this.lastStatusUpdate).toLocaleTimeString(),
            protocol: 'ONVIF'
        };
    }

    /**
     * Convert degrees to ONVIF normalized values
     */
    degreesToNormalized(panDegrees: number, tiltDegrees: number): { pan: number, tilt: number } {
        return {
            pan: Math.max(-1.0, Math.min(1.0, panDegrees / 180)),
            tilt: Math.max(-1.0, Math.min(1.0, tiltDegrees / 90))
        };
    }

    /**
     * Convert ONVIF normalized values to degrees
     */
    normalizedToDegrees(pan: number, tilt: number): { panDegrees: number, tiltDegrees: number } {
        return {
            panDegrees: pan * 180,
            tiltDegrees: tilt * 90
        };
    }

    /**
     * Move using degrees (converts to normalized values)
     */
    async moveToDegrees(panDegrees: number, tiltDegrees: number, zoomPercentage: number = 0): Promise<any> {
        const normalized = this.degreesToNormalized(panDegrees, tiltDegrees);
        const zoomNormalized = Math.max(0.0, Math.min(1.0, zoomPercentage / 100));

        return this.moveAbsolute(normalized.pan, normalized.tilt, zoomNormalized);
    }

    /**
     * Get protocol information
     */
    getProtocolInfo(): any {
        return {
            protocol: 'ONVIF',
            coordinate_system: 'Normalized (-1.0 to 1.0 for pan/tilt, 0.0 to 1.0 for zoom)',
            pan_range: [-1.0, 1.0],
            tilt_range: [-1.0, 1.0],
            zoom_range: [0.0, 1.0],
            default_step: this.defaultStep,
            default_speed: this.defaultSpeed,
            soap_endpoint: '/onvif/PTZ'
        };
    }
}

export default OnvifPTZController;
