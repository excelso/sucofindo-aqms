import Highcharts from 'highcharts'
import "highcharts/highcharts-more";
import "highcharts/modules/solid-gauge";
import "highcharts/modules/no-data-to-display";
import {io, Socket} from 'socket.io-client';
import {SocketClient, SocketEventCallbacks, SocketOptions} from "@/js/plugins/SocketClient";
import {createSmoothGradient} from "@/js/main/dashboard/chartHelper";
import {Dropdown} from 'flowbite';
import type {DropdownOptions, DropdownInterface} from 'flowbite';
import type {InstanceOptions} from 'flowbite';

// Platform data structure
interface PlatformInfo {
    uid: string;
    uid_alias: string;
    cctv_link_1?: string | null;
    cctv_link_2?: string | null;
    cctv1_is_support_ptz?: number;
    cctv2_is_support_ptz?: number;
}

// Platform data from individual endpoints
interface PlatformData {
    uid: string;
    status: string;
    emoji?: string;
    colorCode?: string;
    isOnline: boolean;
    siteName: string;
    location?: string;
    metrics?: {
        pm10?: {
            value?: number;
            bml_min?: number;
            bml_min_buffer?: number;
            bml_max_buffer?: number;
            bml_max?: number;
        };
        pm25?: {
            value?: number;
            bml_min?: number;
            bml_min_buffer?: number;
            bml_max_buffer?: number;
            bml_max?: number;
        };
        tsp?: {
            value?: number;
            bml_min?: number;
            bml_min_buffer?: number;
            bml_max_buffer?: number;
            bml_max?: number;
        };
        noise?: {
            value?: number;
            bml_min?: number;
            bml_min_buffer?: number;
            bml_max_buffer?: number;
            bml_max?: number;
        };
    };
    airIndexData?: Array<{
        timestamp: number;
        value: number;
        value_tsp: number;
        pm25: number;
        pm10: number;
        tsp: number;
        aqi_from: string;
        link_video_id?: string;
        link_video_status?: string;
        link_video_recorded?: string;
    }>;
    timezone?: string;
    locale?: string;
    lat?: number;
    lng?: number;
    lastUpdated?: Date;
}

// Combined data structure
interface CombinedPlatformData extends PlatformInfo, PlatformData {}

interface CameraData {
    cameraName: string;
    videoLink: string;
    supportPTZ: boolean;
}

interface MetricsData {
    title: string;
    type: string;
    value: number;
    bml_min: number;
    bml_min_buffer: number;
    bml_max_buffer: number;
    bml_max: number;
    unit: string;
}

interface LoadingState {
    platforms: boolean;
    platformData: Map<string, boolean>;
}

interface PlatformManagerOptions {
    containerSelector?: string;
    platformsEndpoint?: string; // Endpoint to load platforms list
    platformDataEndpoint?: string; // Endpoint template for individual platform data (use {uid} as placeholder)
    batchLoadSize?: number; // Number of platforms to load concurrently
    enableCharts?: boolean;
    enableSocketIO?: boolean;
    socketIOUrl?: string;
    socketInstanceName?: string;
    socketIOOptions?: SocketOptions;
    realTimeUpdateInterval?: number;
    autoLoadInitialData?: boolean;
    loadingDelay?: number; // Delay between batch loads (ms)
    retryAttempts?: number; // Number of retry attempts for failed platform data
    retryDelay?: number; // Delay between retries (ms)
    onStatusClick?: (id: string) => void;
    onCctvClick?: (id: string, cctvData: Array<CameraData>) => void;
    onMetricsClick?: (id: string, metrics: MetricsData) => void;
    onDataUpdate?: (updatedData: CombinedPlatformData[]) => void;
    onConnectionStatus?: (status: 'connected' | 'disconnected' | 'error') => void;
    onPlatformLoadProgress?: (loaded: number, total: number) => void;
    onPlatformLoadError?: (uid: string, error: Error) => void;
    onAllPlatformsLoaded?: () => void;
    onHeartbeatStatusClick?: (id: string) => void;
    onSiteLocationClick?: (id: string, lat: number, lng: number) => void;
    onClickAirIndexPoint?: (events: any, pointData: any) => void;
}

class PlatformAirQualityManager {
    // Properties
    private platforms: PlatformInfo[] = [];
    private platformData: Map<string, CombinedPlatformData> = new Map();
    private container: HTMLElement | null = null;
    private options: PlatformManagerOptions;
    private loadingState: LoadingState;
    private chartInstances: Map<string, any> = new Map();
    private currentAQISource: Map<string, 'pm25_pm10' | 'tsp'> = new Map();
    private socketClient?: SocketClient;
    private connectionStatus: 'connected' | 'disconnected' | 'error' = 'disconnected';
    private realTimeInterval?: number;
    private loadingElement: HTMLElement | null = null;
    private progressElement: HTMLElement | null = null;
    private errorPlatforms: Set<string> = new Set();
    private retryQueue: Map<string, number> = new Map();

    constructor(options: PlatformManagerOptions = {}) {
        this.options = {
            batchLoadSize: 3, // Load 3 platforms at a time
            enableCharts: true,
            autoLoadInitialData: true,
            loadingDelay: 500,
            retryAttempts: 3,
            retryDelay: 2000,
            realTimeUpdateInterval: 0,
            socketInstanceName: 'platform-air-quality',
            socketIOOptions: {
                autoConnect: true,
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionAttempts: 5,
                timeout: 20000,
            },
            ...options
        };

        this.loadingState = {
            platforms: false,
            platformData: new Map()
        };

        if (options.containerSelector) {
            this.container = document.querySelector(options.containerSelector);
        }

        // Initialize UI elements
        this.initializeUIElements();

        // Auto-load if configured
        if (this.options.autoLoadInitialData && this.options.platformsEndpoint) {
            this.loadAllData().catch(error => {
                console.error('Failed to load initial data:', error);
                this.showError('Failed to load platforms');
            });
        }

        // Initialize Socket.IO if configured
        if (this.options.enableSocketIO && this.options.socketIOUrl) {
            this.initSocketIO();
        }
    }

    private initializeUIElements(): void {
        if (!this.container) return;

        // Create loading element
        this.loadingElement = this.createElement('div', 'flex flex-col items-center justify-center p-16');
        this.loadingElement.innerHTML = `
            <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4"></div>
            <h3 class="text-lg font-medium text-gray-900 mb-2">Loading Platforms</h3>
            <p class="text-sm text-gray-500 loading-status">Fetching platform list...</p>
        `;

        // Create progress element
        this.progressElement = this.createElement('div', 'mt-4 w-full max-w-md');
        this.progressElement.innerHTML = `
            <div class="flex justify-between text-sm text-gray-600 mb-2">
                <span class="loaded-count">0</span>
                <span class="total-count">0</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
                <div class="bg-blue-600 h-2 rounded-full progress-bar" style="width: 0%"></div>
            </div>
        `;
    }

    private showLoading(show: boolean = true, status: string = 'Loading...'): void {
        if (!this.container || !this.loadingElement) return;

        if (show) {
            const statusEl = this.loadingElement.querySelector('.loading-status');
            if (statusEl) statusEl.textContent = status;

            this.container.innerHTML = '';
            this.container.appendChild(this.loadingElement);

            if (this.progressElement) {
                this.loadingElement.appendChild(this.progressElement);
            }
        } else {
            if (this.container.contains(this.loadingElement)) {
                this.container.removeChild(this.loadingElement);
            }
        }
    }

    private updateProgress(loaded: number, total: number): void {
        if (!this.progressElement) return;

        const loadedEl = this.progressElement.querySelector('.loaded-count');
        const totalEl = this.progressElement.querySelector('.total-count');
        const progressBar = this.progressElement.querySelector('.progress-bar') as HTMLElement;

        if (loadedEl) loadedEl.textContent = `Loaded: ${loaded}`;
        if (totalEl) totalEl.textContent = `Total: ${total}`;
        if (progressBar) {
            const percentage = total > 0 ? (loaded / total) * 100 : 0;
            progressBar.style.width = `${percentage}%`;
        }

        // Update loading status text
        const statusEl = this.loadingElement?.querySelector('.loading-status');
        if (statusEl) {
            if (loaded < total) {
                statusEl.textContent = `Loading platform data... (${loaded}/${total})`;
            } else {
                statusEl.textContent = 'Rendering platforms...';
            }
        }
    }

    private showError(message: string): void {
        if (!this.container) return;

        const errorElement = this.createElement('div', 'flex justify-center items-center p-16');
        errorElement.innerHTML = `
            <div class="text-center">
                <div class="text-6xl text-red-300 mb-4">⚠️</div>
                <h3 class="text-lg font-medium text-gray-900 mb-2">Error Loading Data</h3>
                <p class="text-red-500 mb-4">${message}</p>
                <button class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 retry-btn">Retry</button>
            </div>
        `;

        const retryBtn = errorElement.querySelector('.retry-btn');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => {
                this.loadAllData().catch(console.error);
            });
        }

        this.container.innerHTML = '';
        this.container.appendChild(errorElement);
    }

    private async loadAllData(): Promise<void> {
        try {
            // Step 1: Load platforms list
            this.showLoading(true, 'Fetching platform list...');
            await this.loadPlatforms();

            // Step 2: Load data for each platform
            await this.loadAllPlatformData();

            // Step 3: Render all cards
            this.showLoading(false);
            this.renderAll();

            // Notify completion
            if (this.options.onAllPlatformsLoaded) {
                this.options.onAllPlatformsLoaded();
            }

        } catch (error) {
            console.error('Error in loadAllData:', error);
            throw error;
        }
    }

    private async loadPlatforms(): Promise<void> {
        if (!this.options.platformsEndpoint) {
            throw new Error('Platforms endpoint not configured');
        }

        try {
            this.loadingState.platforms = true;
            console.log('🔄 Loading platforms list...');

            const response = await fetch(this.options.platformsEndpoint);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            this.platforms = Array.isArray(data) ? data : data.data || [];

            console.log(`✅ Loaded ${this.platforms.length} platforms`);
            this.loadingState.platforms = false;

        } catch (error) {
            this.loadingState.platforms = false;
            console.error('❌ Error loading platforms:', error);
            throw error;
        }
    }

    private async loadAllPlatformData(): Promise<void> {
        if (!this.options.platformDataEndpoint || this.platforms.length === 0) {
            return;
        }

        const batchSize = this.options.batchLoadSize || 3;
        const totalPlatforms = this.platforms.length;
        let loadedCount = 0;

        // Update initial progress
        this.updateProgress(0, totalPlatforms);

        // Process platforms in batches
        for (let i = 0; i < totalPlatforms; i += batchSize) {
            const batch = this.platforms.slice(i, i + batchSize);

            // Load batch concurrently
            const batchPromises = batch.map(platform =>
                    this.loadPlatformData(platform).catch(error => {
                        console.error(`Error loading ${platform.uid}:`, error);
                        this.errorPlatforms.add(platform.uid);

                        if (this.options.onPlatformLoadError) {
                            this.options.onPlatformLoadError(platform.uid, error);
                        }

                        // Store for retry
                        this.retryQueue.set(platform.uid, 0);
                        return null;
                    })
            );

            await Promise.all(batchPromises);

            // Update progress
            loadedCount += batch.length;
            this.updateProgress(loadedCount - this.errorPlatforms.size, totalPlatforms);

            if (this.options.onPlatformLoadProgress) {
                this.options.onPlatformLoadProgress(loadedCount - this.errorPlatforms.size, totalPlatforms);
            }

            // Add delay between batches to avoid overwhelming the server
            if (i + batchSize < totalPlatforms && this.options.loadingDelay) {
                await this.delay(this.options.loadingDelay);
            }
        }

        // Retry failed platforms
        if (this.retryQueue.size > 0) {
            await this.retryFailedPlatforms();
        }

        console.log(`✅ Successfully loaded ${this.platformData.size}/${totalPlatforms} platforms`);
        if (this.errorPlatforms.size > 0) {
            console.warn(`⚠️ Failed to load ${this.errorPlatforms.size} platforms:`, Array.from(this.errorPlatforms));
        }
    }

    private async loadPlatformData(platform: PlatformInfo): Promise<void> {
        if (!this.options.platformDataEndpoint) return;

        const uid = platform.uid;
        const url = this.options.platformDataEndpoint.replace('{uid}', uid);

        try {
            this.loadingState.platformData.set(uid, true);

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data: PlatformData = await response.json();

            // Combine platform info with platform data
            const combinedData: CombinedPlatformData = {
                ...platform,
                ...data,
                lastUpdated: new Date()
            };

            this.platformData.set(uid, combinedData);
            this.loadingState.platformData.set(uid, false);

            console.log(`✅ Loaded data for ${uid}`);

        } catch (error) {
            this.loadingState.platformData.set(uid, false);
            throw error;
        }
    }

    private async retryFailedPlatforms(): Promise<void> {
        const maxRetries = this.options.retryAttempts || 3;
        const retryDelay = this.options.retryDelay || 2000;

        for (const [uid, attempts] of this.retryQueue.entries()) {
            if (attempts >= maxRetries) continue;

            const platform = this.platforms.find(p => p.uid === uid);
            if (!platform) continue;

            console.log(`🔄 Retrying ${uid} (attempt ${attempts + 1}/${maxRetries})...`);
            await this.delay(retryDelay);

            try {
                await this.loadPlatformData(platform);
                this.retryQueue.delete(uid);
                this.errorPlatforms.delete(uid);
                console.log(`✅ Successfully loaded ${uid} on retry`);
            } catch (error) {
                this.retryQueue.set(uid, attempts + 1);
                console.error(`❌ Retry ${attempts + 1} failed for ${uid}:`, error);
            }
        }
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private renderAll(): void {
        if (!this.container) {
            console.error('Container not found');
            return;
        }

        this.container.innerHTML = '';

        if (this.platformData.size === 0) {
            this.showNoData();
            return;
        }

        const fragment = document.createDocumentFragment();
        const cardContainer = this.createElement('div', 'grid md:grid-cols-2 sm:grid-cols-1 grid-cols-3 gap-4');

        let index = 0;
        for (const [uid, data] of this.platformData) {
            const card = this.createSingleCard(data, index);
            cardContainer.appendChild(card);
            index++;
        }

        fragment.appendChild(cardContainer);
        this.container.appendChild(fragment);
    }

    private showNoData(): void {
        if (!this.container) return;

        const noDataElement = this.createElement('div', 'flex justify-center items-center p-16');
        noDataElement.innerHTML = `
            <div class="text-center">
                <div class="text-6xl text-gray-300 mb-4">📊</div>
                <h3 class="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
                <p class="text-gray-500">No platforms found or all platforms failed to load.</p>
            </div>
        `;

        this.container.innerHTML = '';
        this.container.appendChild(noDataElement);
    }

    private createElement(tag: string, className?: string, textContent?: string): HTMLElement {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (textContent) element.textContent = textContent;
        return element;
    }

    // Create single card (reuse from original implementation with modifications)
    private createSingleCard(data: CombinedPlatformData, index: number): HTMLElement {
        const cardId = `card-${data.uid}-${index}`;

        const card = this.createElement('div', 'card !mb-0 cursor-pointer');
        card.dataset.index = index.toString();
        card.id = cardId;

        const cardBody = this.createElement('div', 'card-body');

        // Header section
        const headerFlex = this.createElement('div', 'card-dashboard-header');
        const leftSection = this.createElement('div', 'left-section');
        const idTitle = this.createElement('div', 'idle-title', data.uid_alias);

        if (data.location) {
            const locationDiv = this.createElement('div', 'text-[12px] text-gray-500', data.location);
            leftSection.appendChild(locationDiv);
        }

        const statusContainer = this.createElement('div', 'status');

        // Status badge
        const badge = this.createElement('div', `status-badge inline-flex items-center rounded-full gap-1 px-[4px] py-[3px] ${data.colorCode || 'bg-gray-200'} text-[12px] font-bold`);
        const emoji = this.createElement('div');
        emoji.textContent = data.emoji || '🟢';
        const statusText = this.createElement('div', 'mr-1', data.status || 'Unknown');
        badge.appendChild(emoji);
        badge.appendChild(statusText);

        // Online status
        const onlineContainer = this.createElement('div', 'online-status-container');
        const indicator = this.createElement('div', `${data.isOnline ? 'online' : 'offline'}`);
        const onlineText = this.createElement('div', 'text-[14px]', data.isOnline ? 'Online' : 'Offline');
        onlineContainer.appendChild(indicator);
        onlineContainer.appendChild(onlineText);

        // Site
        const siteContainer = this.createElement('div', 'flex items-center gap-2 text-[14px]');
        const siteIcon = this.createElement('i', 'fas fa-location-dot');
        const siteText = this.createElement('div');
        siteText.textContent = data.siteName || 'Unknown Site';
        siteContainer.appendChild(siteIcon);
        siteContainer.appendChild(siteText);

        statusContainer.appendChild(badge);
        statusContainer.appendChild(onlineContainer);
        statusContainer.appendChild(siteContainer);
        leftSection.appendChild(idTitle);
        leftSection.appendChild(statusContainer);

        // Right side - CCTV icon
        const rightSection = this.createElement('div', 'right-section');
        const cctvLink = this.createElement('a', 'cursor-pointer') as HTMLAnchorElement;
        const cctvImg = document.createElement('img');

        if (!data.cctv_link_1) {
            cctvImg.src = '/images/vector/icons8-cctv-disabled-100.png';
            cctvLink.className = 'cursor-not-allowed';
        } else {
            cctvImg.src = '/images/vector/icons8-cctv-100.png';
            cctvLink.className = 'cursor-pointer';
        }

        cctvImg.width = 24;
        cctvImg.alt = 'cctv';
        cctvLink.appendChild(cctvImg);
        rightSection.appendChild(cctvLink);

        if (data.cctv_link_1 && this.options.onCctvClick) {
            cctvLink.addEventListener('click', () => {
                const cameras: CameraData[] = [];

                if (data.cctv_link_1) {
                    cameras.push({
                        cameraName: "Camera 1",
                        videoLink: data.cctv_link_1,
                        supportPTZ: data.cctv1_is_support_ptz === 1
                    });
                }

                if (data.cctv_link_2) {
                    cameras.push({
                        cameraName: "Camera 2",
                        videoLink: data.cctv_link_2,
                        supportPTZ: data.cctv2_is_support_ptz === 1
                    });
                }

                this.options.onCctvClick!(data.uid, cameras);
            });
        }

        headerFlex.appendChild(leftSection);
        headerFlex.appendChild(rightSection);

        // Metrics section
        const metricsContainer = this.createElement('div', 'mt-4');
        const metricsGrid = this.createElement('div', 'grid grid-cols-4 gap-2');

        const metrics = [
            {
                title: 'PM2.5',
                type: 'pm25' as const,
                value: data.metrics?.pm25?.value || 0,
                bml_min: data.metrics?.pm25?.bml_min,
                bml_min_buffer: data.metrics?.pm25?.bml_min_buffer,
                bml_max_buffer: data.metrics?.pm25?.bml_max_buffer,
                bml_max: data.metrics?.pm25?.bml_max,
                unit: 'μg/m³'
            },
            {
                title: 'PM10',
                type: 'pm10' as const,
                value: data.metrics?.pm10?.value || 0,
                bml_min: data.metrics?.pm10?.bml_min,
                bml_min_buffer: data.metrics?.pm10?.bml_min_buffer,
                bml_max_buffer: data.metrics?.pm10?.bml_max_buffer,
                bml_max: data.metrics?.pm10?.bml_max,
                unit: 'μg/m³'
            },
            {
                title: 'TSP',
                type: 'tsp' as const,
                value: data.metrics?.tsp?.value || 0,
                bml_min: data.metrics?.tsp?.bml_min,
                bml_min_buffer: data.metrics?.tsp?.bml_min_buffer,
                bml_max_buffer: data.metrics?.tsp?.bml_max_buffer,
                bml_max: data.metrics?.tsp?.bml_max,
                unit: 'μg/m³'
            },
            {
                title: 'Noise',
                type: 'noise' as const,
                value: data.metrics?.noise?.value || 0,
                bml_min: data.metrics?.noise?.bml_min,
                bml_min_buffer: data.metrics?.noise?.bml_min_buffer,
                bml_max_buffer: data.metrics?.noise?.bml_max_buffer,
                bml_max: data.metrics?.noise?.bml_max,
                unit: 'dbA'
            }
        ];

        metrics.forEach(metric => {
            const metricCard = this.createElement('div', 'border rounded-md');
            const titleDiv = this.createElement('div', 'font-bold text-[12px] m-2 mb-2', metric.title);
            const chartDiv = this.createElement('div', `chart-${metric.type}`);
            chartDiv.id = `${cardId}-${metric.type}`;

            metricCard.appendChild(titleDiv);
            metricCard.appendChild(chartDiv);
            metricsGrid.appendChild(metricCard);

            if (this.options.onMetricsClick) {
                metricCard.addEventListener('click', () => {
                    this.options.onMetricsClick!(data.uid, metric);
                });
            }

            // Create gauge chart after DOM insertion
            if (this.options.enableCharts) {
                setTimeout(() => {
                    this.createGaugeChart(
                            data.uid,
                            chartDiv,
                            metric.title,
                            metric.type,
                            metric.bml_min || 0,
                            metric.bml_max || 100,
                            metric.value,
                            cardId,
                            metricCard
                    );
                }, 100);
            }
        });

        metricsContainer.appendChild(metricsGrid);

        // AirIndex section
        if (data.airIndexData && data.airIndexData.length > 0) {
            const airIndexSection = this.createAirIndexSection(cardId, data);
            cardBody.appendChild(airIndexSection);
        }

        // Assemble card
        cardBody.appendChild(headerFlex);
        cardBody.appendChild(metricsContainer);
        card.appendChild(cardBody);

        return card;
    }

    private createAirIndexSection(cardId: string, data: CombinedPlatformData): HTMLElement {
        const airIndexSection = this.createElement('div', 'mt-4');
        const airIndexTitle = this.createElement('div', 'font-bold text-[14px]', 'Air Quality Index');
        const airIndexChart = this.createElement('div', 'chart-one');
        airIndexChart.id = `${cardId}-airIndex`;

        airIndexSection.appendChild(airIndexTitle);
        airIndexSection.appendChild(airIndexChart);

        // Create chart after DOM insertion
        if (this.options.enableCharts && data.airIndexData) {
            setTimeout(() => {
                this.createAirIndexChart(airIndexChart, data.airIndexData!, cardId);
            }, 200);
        }

        return airIndexSection;
    }

    // Chart creation methods (simplified versions from original)
    private createGaugeChart(
            uid: string,
            element: HTMLElement,
            title: string,
            type: 'pm10' | 'pm25' | 'tsp' | 'noise',
            bmlMin: number,
            bmlMax: number,
            initialValue: number,
            cardId: string,
            metricCard: HTMLElement
    ): void {
        // Implementation similar to original but simplified
        // Store chart instance for updates
        this.chartInstances.set(`${cardId}-${type}`, null);
    }

    private createAirIndexChart(
            element: HTMLElement,
            data: Array<any>,
            cardId: string
    ): void {
        // Implementation similar to original but simplified
        // Store chart instance for updates
        this.chartInstances.set(`${cardId}-airIndex`, null);
    }

    private initSocketIO(): void {
        // Socket.IO initialization similar to original
    }

    // Public API methods
    public async refreshAll(): Promise<void> {
        this.platforms = [];
        this.platformData.clear();
        this.errorPlatforms.clear();
        this.retryQueue.clear();
        await this.loadAllData();
    }

    public async refreshPlatform(uid: string): Promise<void> {
        const platform = this.platforms.find(p => p.uid === uid);
        if (!platform) {
            console.warn(`Platform ${uid} not found`);
            return;
        }

        try {
            await this.loadPlatformData(platform);
            this.renderAll();
        } catch (error) {
            console.error(`Error refreshing ${uid}:`, error);
        }
    }

    public getPlatformData(uid: string): CombinedPlatformData | undefined {
        return this.platformData.get(uid);
    }

    public getAllPlatformsData(): CombinedPlatformData[] {
        return Array.from(this.platformData.values());
    }

    public getPlatformCount(): number {
        return this.platforms.length;
    }

    public getLoadedPlatformCount(): number {
        return this.platformData.size;
    }

    public getFailedPlatforms(): string[] {
        return Array.from(this.errorPlatforms);
    }

    public getOnlinePlatformCount(): number {
        let count = 0;
        for (const data of this.platformData.values()) {
            if (data.isOnline) count++;
        }
        return count;
    }

    public setContainer(container: HTMLElement | string): void {
        this.container = typeof container === 'string'
                ? document.querySelector(container)
                : container;
    }

    public destroy(): void {
        // Stop real-time updates
        if (this.realTimeInterval) {
            clearInterval(this.realTimeInterval);
            this.realTimeInterval = undefined;
        }

        // Destroy all chart instances
        this.chartInstances.forEach(chart => {
            if (chart && chart.destroy) {
                chart.destroy();
            }
        });
        this.chartInstances.clear();

        // Clear all data
        this.platforms = [];
        this.platformData.clear();
        this.errorPlatforms.clear();
        this.retryQueue.clear();

        // Clear container
        if (this.container) {
            this.container.innerHTML = '';
        }

        // Disconnect socket if connected
        if (this.socketClient) {
            this.socketClient.disconnect();
        }
    }

    // Start/Stop real-time updates
    public startRealTimeUpdates(): void {
        if (!this.options.realTimeUpdateInterval || this.options.realTimeUpdateInterval <= 0 || this.realTimeInterval) {
            console.warn('⚠️ Real-time updates not configured or already running');
            return;
        }

        console.log(`▶️ Starting real-time updates (interval: ${this.options.realTimeUpdateInterval}ms)...`);

        // Run immediate update
        this.updateAllPlatformData().then(() => {
            console.log('✅ Initial real-time update completed');
        }).catch(error => {
            console.error('❌ Initial real-time update failed:', error);
        });

        // Set interval for periodic updates
        this.realTimeInterval = window.setInterval(async () => {
            try {
                console.log('🔄 Running scheduled real-time update...');
                await this.updateAllPlatformData();
                console.log('✅ Real-time update completed');
            } catch (error) {
                console.error('❌ Real-time update failed:', error);
            }
        }, this.options.realTimeUpdateInterval);
    }

    public stopRealTimeUpdates(): void {
        if (this.realTimeInterval) {
            console.log('⏸️ Stopping real-time updates...');
            clearInterval(this.realTimeInterval);
            this.realTimeInterval = undefined;
        }
    }

    // Check if real-time updates are active
    public isRealTimeActive(): boolean {
        return this.realTimeInterval !== undefined;
    }

    private async updateAllPlatformData(): Promise<void> {
        if (!this.options.platformDataEndpoint) {
            console.warn('⚠️ Platform data endpoint not configured');
            return;
        }

        const updatePromises: Promise<void>[] = [];
        const batchSize = this.options.batchLoadSize || 3;
        let updatedCount = 0;
        let failedCount = 0;

        // Process updates in batches to avoid overwhelming the server
        for (let i = 0; i < this.platforms.length; i += batchSize) {
            const batch = this.platforms.slice(i, i + batchSize);

            const batchPromises = batch.map(platform =>
                    this.updateSinglePlatformData(platform).then(() => {
                        updatedCount++;
                    }).catch(error => {
                        failedCount++;
                        console.error(`❌ Error updating ${platform.uid}:`, error);
                    })
            );

            await Promise.all(batchPromises);

            // Add small delay between batches to prevent server overload
            if (i + batchSize < this.platforms.length && this.options.loadingDelay) {
                await this.delay(this.options.loadingDelay / 2); // Use half the loading delay for updates
            }
        }

        console.log(`📊 Real-time update complete: ${updatedCount} updated, ${failedCount} failed`);

        // Update UI for changed data
        this.updateUI();

        // Notify data update
        if (this.options.onDataUpdate) {
            this.options.onDataUpdate(this.getAllPlatformsData());
        }
    }

    private async updateSinglePlatformData(platform: PlatformInfo): Promise<void> {
        if (!this.options.platformDataEndpoint) return;

        const uid = platform.uid;
        const url = this.options.platformDataEndpoint.replace('{uid}', uid);

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data: PlatformData = await response.json();

        // Check if data has actually changed
        const existingData = this.platformData.get(uid);
        const hasChanged = !existingData || this.hasDataChanged(existingData, data);

        if (hasChanged) {
            // Combine platform info with updated platform data
            const combinedData: CombinedPlatformData = {
                ...platform,
                ...data,
                lastUpdated: new Date()
            };

            this.platformData.set(uid, combinedData);
            console.log(`📝 Updated data for ${uid}`);
        }
    }

    private hasDataChanged(oldData: CombinedPlatformData, newData: PlatformData): boolean {
        // Check key fields for changes
        if (oldData.status !== newData.status) return true;
        if (oldData.isOnline !== newData.isOnline) return true;

        // Check metrics
        if (JSON.stringify(oldData.metrics) !== JSON.stringify(newData.metrics)) return true;

        // Check airIndex data length (simple check)
        if (oldData.airIndexData?.length !== newData.airIndexData?.length) return true;

        // Check last airIndex point if exists
        if (oldData.airIndexData && newData.airIndexData) {
            const oldLast = oldData.airIndexData[oldData.airIndexData.length - 1];
            const newLast = newData.airIndexData[newData.airIndexData.length - 1];
            if (oldLast?.timestamp !== newLast?.timestamp || oldLast?.value !== newLast?.value) {
                return true;
            }
        }

        return false;
    }

    private updateUI(): void {
        // Update each card's data without full re-render
        for (const [uid, data] of this.platformData) {
            const cardId = `card-${uid}-0`; // Assuming index 0 for now
            const cardElement = document.getElementById(cardId);

            if (cardElement) {
                this.updateCardUI(cardId, data);
            }
        }
    }

    private updateCardUI(cardId: string, data: CombinedPlatformData): void {
        const cardElement = document.getElementById(cardId);
        if (!cardElement) return;

        // Update status badge
        const badge = cardElement.querySelector('.status-badge');
        if (badge) {
            const emoji = badge.querySelector('div:first-child');
            const text = badge.querySelector('div:last-child');

            if (emoji) emoji.textContent = data.emoji || '🟢';
            if (text) text.textContent = data.status || 'Unknown';

            // Update color class
            const colorClass = data.colorCode || 'bg-gray-200';
            badge.className = badge.className.replace(/bg-\w+-\d+/g, colorClass);
        }

        // Update online status
        const onlineIndicator = cardElement.querySelector('.online-status-container .online, .online-status-container .offline');
        const onlineText = cardElement.querySelector('.online-status-container div:last-child');

        if (onlineIndicator) {
            onlineIndicator.className = data.isOnline ? 'online' : 'offline';
        }
        if (onlineText) {
            onlineText.textContent = data.isOnline ? 'Online' : 'Offline';
        }

        // Update metrics values if charts exist
        if (data.metrics) {
            this.updateChartValue(`${cardId}-pm25`, data.metrics.pm25?.value || 0);
            this.updateChartValue(`${cardId}-pm10`, data.metrics.pm10?.value || 0);
            this.updateChartValue(`${cardId}-tsp`, data.metrics.tsp?.value || 0);
            this.updateChartValue(`${cardId}-noise`, data.metrics.noise?.value || 0);
        }
    }

    private updateChartValue(chartId: string, newValue: number): void {
        const chart = this.chartInstances.get(chartId);
        if (chart && chart.series && chart.series[0]) {
            chart.series[0].setData([newValue], true);
        }
    }

    // Filter methods
    public filterPlatforms(predicate: (data: CombinedPlatformData) => boolean): CombinedPlatformData[] {
        const filtered: CombinedPlatformData[] = [];

        for (const data of this.platformData.values()) {
            if (predicate(data)) {
                filtered.push(data);
            }
        }

        return filtered;
    }

    public renderFiltered(platforms: CombinedPlatformData[]): void {
        if (!this.container) return;

        this.container.innerHTML = '';

        if (platforms.length === 0) {
            this.showNoData();
            return;
        }

        const cardContainer = this.createElement('div', 'grid md:grid-cols-2 sm:grid-cols-1 grid-cols-3 gap-4');

        platforms.forEach((data, index) => {
            const card = this.createSingleCard(data, index);
            cardContainer.appendChild(card);
        });

        this.container.appendChild(cardContainer);
    }

    // Search functionality
    public search(query: string): void {
        const lowercaseQuery = query.toLowerCase().trim();

        const filtered = this.filterPlatforms(data => {
            return data.uid.toLowerCase().includes(lowercaseQuery) ||
                    data.uid_alias.toLowerCase().includes(lowercaseQuery) ||
                    (data.siteName && data.siteName.toLowerCase().includes(lowercaseQuery)) ||
                    (data.location && data.location.toLowerCase().includes(lowercaseQuery));
        });

        this.renderFiltered(filtered);
    }

    // Get specific platform by UID
    public getPlatformByUID(uid: string): CombinedPlatformData | undefined {
        return this.platformData.get(uid);
    }

    // Check if platform exists
    public hasPlatform(uid: string): boolean {
        return this.platformData.has(uid);
    }

    // Get loading state
    public isLoading(): boolean {
        return this.loadingState.platforms ||
                Array.from(this.loadingState.platformData.values()).some(loading => loading);
    }

    // Get connection status
    public getConnectionStatus(): 'connected' | 'disconnected' | 'error' {
        return this.connectionStatus;
    }

    // Export data
    public exportData(): {
        platforms: PlatformInfo[],
        data: CombinedPlatformData[],
        errorPlatforms: string[]
    } {
        return {
            platforms: this.platforms,
            data: this.getAllPlatformsData(),
            errorPlatforms: this.getFailedPlatforms()
        };
    }

    // Batch update platform data
    public async updatePlatformBatch(uids: string[]): Promise<void> {
        const platforms = this.platforms.filter(p => uids.includes(p.uid));

        const updatePromises = platforms.map(platform =>
                this.loadPlatformData(platform).catch(error => {
                    console.error(`Error updating ${platform.uid}:`, error);
                })
        );

        await Promise.all(updatePromises);
        this.updateUI();
    }
}

export {
    PlatformAirQualityManager,
    type PlatformInfo,
    type PlatformData,
    type CombinedPlatformData,
    type CameraData,
    type MetricsData,
    type PlatformManagerOptions
};
