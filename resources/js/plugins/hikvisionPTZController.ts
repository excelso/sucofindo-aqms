class HikvisionPTZController {
    private cameraId: string;
    private csrfToken: string;
    private baseUrl: string;
    private currentStatus: any = null;
    private lastStatusUpdate: number = 0;
    private statusCacheTime: number = 2000; // Cache status for 2 seconds
    private defaultStep: number = 100; // Default step size for movements

    constructor(csrfToken: string, cameraId: string) {
        this.csrfToken = csrfToken;
        this.cameraId = cameraId;
        this.baseUrl = '/hikvision-ptz';
    }

    /**
     * Get current PTZ status, with caching to avoid too many requests
     */
    async getCurrentStatus(forceRefresh: boolean = false): Promise<any> {
        const now = Date.now();

        // Use cached status if it's recent and not forcing refresh
        if (!forceRefresh && this.currentStatus && (now - this.lastStatusUpdate) < this.statusCacheTime) {
            console.log('Using cached PTZ status:', this.currentStatus);
            return this.currentStatus;
        }

        try {
            console.log('Fetching current PTZ status...');
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
                console.log('Current PTZ status:', this.currentStatus);
                return this.currentStatus;
            } else {
                throw new Error(result.message || 'Failed to get PTZ status');
            }

        } catch (error) {
            console.error('Error getting PTZ status:', error);
            // Return last known status or default values
            return this.currentStatus || {
                azimuth: 0,
                elevation: 0,
                zoom: 0,
                pan_degrees: 0,
                tilt_degrees: 0,
                is_moving: false
            };
        }
    }

    /**
     * Move camera relative to current position
     */
    async moveRelative(direction: 'up' | 'down' | 'left' | 'right', step: number = this.defaultStep): Promise<any> {
        try {
            // Get current status first
            const currentStatus = await this.getCurrentStatus();

            // Calculate new position based on current position
            let newAzimuth = currentStatus.azimuth || 0;
            let newElevation = currentStatus.elevation || 0;

            switch (direction) {
                case 'up':
                    newElevation += step;
                    break;
                case 'down':
                    newElevation -= step;
                    break;
                case 'left':
                    newAzimuth -= step;
                    break;
                case 'right':
                    newAzimuth += step;
                    break;
            }

            // Ensure values stay within valid ranges
            newAzimuth = Math.max(-1800, Math.min(1800, newAzimuth));
            newElevation = Math.max(-900, Math.min(900, newElevation));

            console.log(`Moving ${direction}:`, {
                from: { azimuth: currentStatus.azimuth, elevation: currentStatus.elevation },
                to: { azimuth: newAzimuth, elevation: newElevation },
                step: step
            });

            // Send absolute movement command with new calculated position
            const result = await this.moveAbsolute(newAzimuth, newElevation, currentStatus.zoom || 0);

            // Update cached status with new position
            this.currentStatus = {
                ...this.currentStatus,
                azimuth: newAzimuth,
                elevation: newElevation,
                pan_degrees: newAzimuth / 10.0,
                tilt_degrees: newElevation / 10.0
            };
            this.lastStatusUpdate = Date.now();

            return result;

        } catch (error) {
            console.error(`Error moving ${direction}:`, error);
            throw error;
        }
    }

    /**
     * Move to absolute position
     */
    async moveAbsolute(azimuth: number, elevation: number, zoom: number = 0): Promise<any> {
        try {
            const response = await fetch(`${this.baseUrl}/camera/${this.cameraId}/move/absolute`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': this.csrfToken
                },
                body: JSON.stringify({
                    camera_id: this.cameraId,
                    azimuth: azimuth,
                    elevation: elevation,
                    zoom: zoom
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.message || 'PTZ command failed');
            }

            console.log('PTZ absolute movement result:', result);
            return result.data;

        } catch (error) {
            console.error('Error in absolute movement:', error);
            this.showPTZError(`Movement failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Enhanced movement methods that read status first
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
     * Zoom with current position awareness
     */
    async zoomIn(step: number = 5): Promise<any> {
        const currentStatus = await this.getCurrentStatus();
        const newZoom = Math.min(100, (currentStatus.zoom || 0) + step);
        return this.moveAbsolute(currentStatus.azimuth || 0, currentStatus.elevation || 0, newZoom);
    }

    async zoomOut(step: number = 5): Promise<any> {
        const currentStatus = await this.getCurrentStatus();
        const newZoom = Math.max(0, (currentStatus.zoom || 0) - step);
        return this.moveAbsolute(currentStatus.azimuth || 0, currentStatus.elevation || 0, newZoom);
    }

    /**
     * Stop movement (maintain current position)
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
            console.log('PTZ stop result:', result);
            return result;

        } catch (error) {
            console.error('Error stopping PTZ:', error);
            throw error;
        }
    }

    /**
     * Go to preset position
     */
    async gotoPreset(presetNumber: number): Promise<any> {
        try {
            const response = await fetch(`${this.baseUrl}/camera/${this.cameraId}/preset/${presetNumber}/goto`, {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': this.csrfToken
                }
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

    /**
     * Set current position as preset
     */
    async setPreset(presetNumber: number, name?: string): Promise<any> {
        try {
            const response = await fetch(`${this.baseUrl}/camera/${this.cameraId}/preset/${presetNumber}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': this.csrfToken
                },
                body: JSON.stringify({
                    name: name || `Preset ${presetNumber}`
                })
            });

            return response.json();

        } catch (error) {
            console.error('Error setting preset:', error);
            throw error;
        }
    }

    /**
     * Get camera capabilities
     */
    async getCapabilities(): Promise<any> {
        try {
            const response = await fetch(`${this.baseUrl}/camera/${this.cameraId}/capabilities`);
            return response.json();
        } catch (error) {
            console.error('Error getting capabilities:', error);
            return null;
        }
    }

    /**
     * Update step size for movements
     */
    setStepSize(step: number): void {
        this.defaultStep = Math.max(10, Math.min(500, step)); // Keep step between 10-500
        console.log(`PTZ step size updated to: ${this.defaultStep}`);
    }

    /**
     * Get current step size
     */
    getStepSize(): number {
        return this.defaultStep;
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
        console.error('PTZ Error:', message);

        // You can implement your preferred notification system here
        if (typeof window !== 'undefined' && (window as any).showToast) {
            (window as any).showToast(message, 'error');
        }
    }

    /**
     * Get position info in human-readable format
     */
    getPositionInfo(): any {
        if (!this.currentStatus) return null;

        return {
            pan_degrees: this.currentStatus.pan_degrees || 0,
            tilt_degrees: this.currentStatus.tilt_degrees || 0,
            zoom_level: this.currentStatus.zoom || 0,
            azimuth: this.currentStatus.azimuth || 0,
            elevation: this.currentStatus.elevation || 0,
            is_moving: this.currentStatus.is_moving || false,
            last_updated: new Date(this.lastStatusUpdate).toLocaleTimeString()
        };
    }
}

export default HikvisionPTZController;
