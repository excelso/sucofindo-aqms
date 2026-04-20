import Highcharts from 'highcharts'
import "highcharts/highcharts-more";
import "highcharts/modules/solid-gauge";
import "highcharts/modules/no-data-to-display";
import {io, Socket} from 'socket.io-client';
import {SocketClient, SocketEventCallbacks, SocketOptions} from "@/js/plugins/SocketClient";
import {createSmoothGradient} from "@/js/main/be-aqms/dashboard/chartHelper";
import {Dropdown} from 'flowbite';
import type {DropdownOptions, DropdownInterface} from 'flowbite';
import type {InstanceOptions} from 'flowbite';
import moment from "moment";

//region Handle Interface
interface PlatformInfo {
    uid: string;
    uid_alias: string;
    siteName: string;
    location?: string;
    cctvLink1?: string | null;
    cctvLink2?: string | null;
    cctv1IsSupportPTZ?: number;
    cctv2IsSupportPTZ?: number;
    cctvIconPath?: string;
    timezone?: string;
    locale?: string;
    lat?: number;
    lng?: number;
}

interface FilterOptions {
    date?: string; // Format: YYYY-MM-DD
    status?: string;
    siteName?: string;
    location?: string;
    isOnline?: boolean;
    uid?: string;
}

interface PlatformData {
    uid: string;
    status: string;
    emoji?: string;
    colorCode?: string;
    isOnline: boolean;
    metrics?: {
        pm10?: {
            value?: number,
            bml_min?: number,
            bml_min_buffer?: number,
            bml_max_buffer?: number,
            bml_max?: number
        };
        pm25?: {
            value?: number,
            bml_min?: number,
            bml_min_buffer?: number,
            bml_max_buffer?: number,
            bml_max?: number
        };
        tsp?: {
            value?: number,
            bml_min?: number,
            bml_min_buffer?: number,
            bml_max_buffer?: number,
            bml_max?: number
        };
        noise?: {
            value?: number,
            bml_min?: number,
            bml_min_buffer?: number,
            bml_max_buffer?: number,
            bml_max?: number
        };
        temp?: {
            value?: number,
            bml_min?: number,
            bml_min_buffer?: number,
            bml_max_buffer?: number,
            bml_max?: number
        };
        mmhg?: {
            value?: number,
            bml_min?: number,
            bml_min_buffer?: number,
            bml_max_buffer?: number,
            bml_max?: number
        };
        humidity?: {
            value?: number,
            bml_min?: number,
            bml_min_buffer?: number,
            bml_max_buffer?: number,
            bml_max?: number
        };
        pm25_raw?: {
            value?: number,
            bml_min?: number,
            bml_min_buffer?: number,
            bml_max_buffer?: number,
            bml_max?: number
        };
        pm10_raw?: {
            value?: number,
            bml_min?: number,
            bml_min_buffer?: number,
            bml_max_buffer?: number,
            bml_max?: number
        };
        tsp_raw?: {
            value?: number,
            bml_min?: number,
            bml_min_buffer?: number,
            bml_max_buffer?: number,
            bml_max?: number
        };
    };
    airIndexData?: Array<{
        timestamp: number;
        value: number;
        value_tsp: number;
        pm25: number;
        pm10: number;
        tsp: number;
        link_video_id?: string;
        link_video_status?: string;
        link_video_recorded?: string;
        aqi_from: string;
    }>;
    lastUpdated?: Date;
}

interface CombinedPlatformData extends PlatformInfo {
    data?: PlatformData;
    isDataLoaded?: boolean;
    loadingError?: string;
}

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
    bml_min_buffer: number,
    bml_max_buffer: number,
    bml_max: number,
    unit: string
}

interface LoggerEventData {
    uid: string;
    pm_10: number;
    pm_25: number;
    tsp: number;
    pm_10_raw?: number;
    pm_25_raw?: number;
    tsp_raw?: number;
    humidity?: number;
    noise: number;
    temp?: number;
    datetime_unix: number;
    link_video_id?: string;
    airIndexData?: Array<{
        timestamp: number;
        value: number;
        value_tsp: number;
        pm25: number;
        pm10: number;
        tsp: number;
        aqi_from: string
    }>;
    aqi_value?: number;
    aqi_from?: string;
}

interface PlatformSkeletonManagerOptions {
    containerSelector?: string;
    apiEndpoint?: string; // '/dashboard/platforms'
    apiEndpointData?: string; // '/dashboard/platform/{uid}/data'
    apiEndpointForecast?: string; // '/dashboard/platform/{uid}/forecast'
    enableForecast?: boolean;
    enableCharts?: boolean;
    realTimeUpdateInterval?: number;
    enableSocketIO?: boolean;
    socketIOUrl?: string;
    socketInstanceName?: string;
    socketIOOptions?: SocketOptions;
    onStatusClick?: (id: string) => void;
    onCctvClick?: (id: string, cctvData: Array<CameraData>) => void;
    onMetricsClick?: (id: string, metrics: MetricsData) => void;
    onDataUpdate?: (updatedData: CombinedPlatformData[]) => void;
    onConnectionStatus?: (status: 'connected' | 'disconnected' | 'error') => void;
    onClickAirIndexPoint?: (events: any, pointData: {
        cardId: string;
        timestamp: number;
        value: number;
        pointIndex: number;
        isLastPoint: boolean;
        isHighValue?: boolean;
        formattedDate: string;
        formattedTime: string;
        linkVideo?: any;
    }) => void;
    onHeartbeatStatusClick?: (id: string) => void;
    onSiteLocationClick?: (id: string, lat: number, lng: number) => void;
    onLoadingStateChange?: (isLoading: boolean, uid?: string) => void;
}

interface ForecastData {
    timestamp: number;
    value: number;
    value_tsp: number;
    pm25: number;
    pm10: number;
    tsp: number;
    aqi_from: string;
    category?: string;
}

//endregion

class PlatformSkeletonManager {

    // region Properties
    private platforms: CombinedPlatformData[] = [];
    private container: HTMLElement | null = null;
    private options: PlatformSkeletonManagerOptions;
    private chartInstances: Map<string, any> = new Map();
    private realTimeInterval?: number;
    private isRealTimeActive: boolean = false;
    private socket?: Socket;
    private connectionStatus: 'connected' | 'disconnected' | 'error' = 'disconnected';
    private lastUpdateTime: Date = new Date();
    private dataCache: Map<string, PlatformData> = new Map();
    private socketClient: SocketClient;
    private currentAQISource: Map<string, 'pm25_pm10' | 'tsp'> = new Map();
    private loadingStates: Map<string, boolean> = new Map();

    private currentDataMode: Map<string, 'realtime' | 'forecast'> = new Map();
    private forecastCache: Map<string, ForecastData[]> = new Map();
    private currentForecastDays: Map<string, number> = new Map();
    // endregion

    // region Constructor
    constructor(options: PlatformSkeletonManagerOptions = {}) {
        this.options = {
            apiEndpoint: '/aqms/dashboard/platforms',
            apiEndpointData: '/aqms/dashboard/platform/{uid}/data',
            enableCharts: true,
            realTimeUpdateInterval: 30000, // 30 seconds
            enableSocketIO: false,
            socketInstanceName: 'platform-skeleton-default',
            socketIOOptions: {
                autoConnect: true,
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionAttempts: 5,
                timeout: 20000,
            },
            apiEndpointForecast: '/aqms/dashboard/platform/{uid}/forecast',
            enableForecast: true,
            ...options
        };

        if (options.containerSelector) {
            this.container = document.querySelector(options.containerSelector);
        }

        this.setupURLChangeListener();

        // Autoload platforms and start the process
        this.initialize();
    }

    // endregion

    // region Initialize
    private async initialize(): Promise<void> {
        try {
            // Step 1: Load all platforms (skeleton)
            await this.loadPlatforms();

            // Step 2: Render all skeleton cards immediately
            this.renderAllSkeletonCards();

            // Step 3: Load data for each platform
            await this.loadAllPlatformData();

            // Step 4: Initialize real-time updates if configured
            if (this.options.realTimeUpdateInterval) {
                this.startRealTimeUpdates();
            }

            // Step 5: Initialize Socket.IO if configured
            if (this.options.enableSocketIO && this.options.socketIOUrl) {
                this.initSocketIO();
            }

        } catch (error) {
            console.error('Failed to initialize Platform Skeleton Manager:', error);
            this.showError('Failed to initialize platform manager');
        }
    }

    // endregion

    //region Handle Setup URL Change Listener
    private setupURLChangeListener(): void {
        // Listen untuk popstate (browser back/forward)
        window.addEventListener('popstate', () => {
            console.log('🔄 URL changed via browser navigation');
            this.handleURLChange();
        });

        // Optional: Listen untuk pushState/replaceState jika diperlukan
        const originalPushState = history.pushState;
        const originalReplaceState = history.replaceState;

        history.pushState = function (...args) {
            originalPushState.apply(history, args);
            setTimeout(() => {
                console.log('🔄 URL changed via pushState');
                // Trigger URL change handling jika diperlukan
            }, 100);
        };

        history.replaceState = function (...args) {
            originalReplaceState.apply(history, args);
            setTimeout(() => {
                console.log('🔄 URL changed via replaceState');
                // Trigger URL change handling jika diperlukan
            }, 100);
        };
    }

    //endregion

    // region Load Platforms
    private async loadPlatforms(): Promise<void> {
        if (!this.options.apiEndpoint) {
            throw new Error('apiEndpoint is required');
        }

        try {
            console.log('🔄 Loading platforms from API...');

            const response = await fetch(this.options.apiEndpoint);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            const platformList: PlatformInfo[] = Array.isArray(result) ? result : (result.data || []);

            // Convert to CombinedPlatformData with skeleton structure
            this.platforms = platformList.map(platform => ({
                ...platform,
                isDataLoaded: false,
                data: undefined,
                loadingError: undefined
            }));

            console.log(`✅ Loaded ${this.platforms.length} platforms for skeleton display`);

        } catch (error) {
            console.error('❌ Error loading platforms:', error);
            throw error;
        }
    }

    // endregion

    // region Render All Skeleton Cards
    private renderAllSkeletonCards(): void {
        if (!this.container) {
            console.error('Container not found');
            return;
        }

        this.container.innerHTML = '';

        if (this.platforms.length === 0) {
            this.showNoData();
            return;
        }

        const fragment = document.createDocumentFragment();
        const cardContainer = this.createElement('div', 'grid md:grid-cols-2 sm:grid-cols-1 grid-cols-3 gap-4');

        this.platforms.forEach((platform, index) => {
            const card = this.createSkeletonCard(platform, index);
            cardContainer.appendChild(card);
        });

        fragment.appendChild(cardContainer);
        this.container.appendChild(fragment);

        console.log(`🎨 Rendered ${this.platforms.length} skeleton cards`);
    }

    // endregion

    // region Load All Platform Data
    private async loadAllPlatformData(): Promise<void> {
        console.log('🔄 Loading data for all platforms...');

        // Load all platform data simultaneously
        const dataPromises = this.platforms.map(platform =>
                this.loadPlatformData(platform.uid)
        );

        try {
            await Promise.allSettled(dataPromises);
            console.log('✅ Finished loading all platform data');

            if (this.options.onDataUpdate) {
                this.options.onDataUpdate(this.platforms);
            }

        } catch (error) {
            console.error('❌ Error loading platform data:', error);
        }
    }

    // endregion

    // region Load Platform Data
    private async loadPlatformData(uid: string, filterOptions?: FilterOptions): Promise<void> {
        if (!this.options.apiEndpointData) {
            console.warn('apiEndpointData is not configured');
            return;
        }

        const platform = this.platforms.find(p => p.uid === uid);
        if (!platform) {
            console.warn(`Platform ${uid} not found`);
            return;
        }

        try {
            this.loadingStates.set(uid, true);

            if (this.options.onLoadingStateChange) {
                this.options.onLoadingStateChange(true, uid);
            }

            const endpoint = this.options.apiEndpointData.replace('{uid}', uid);
            const url = new URL(endpoint, window.location.origin);

            if (filterOptions) {
                if (filterOptions.date) {
                    url.searchParams.set('date', filterOptions.date);
                }
            } else {
                const searchParams = new URLSearchParams(window.location.search);
                if (searchParams.size !== 0) {
                    url.searchParams.set('date', searchParams.get('date'));
                }
            }

            const response = await fetch(url.toString());

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            const platformData: PlatformData = result.data || result;

            const oldData = platform.data ? {...platform.data} : null;

            // Update platform with actual data
            platform.data = {
                ...platformData,
                lastUpdated: platformData.lastUpdated ? new Date(platformData.lastUpdated) : new Date()
            };
            platform.isDataLoaded = true;
            platform.loadingError = undefined;

            // Cache the data
            this.dataCache.set(uid, platform.data);

            // Update the card UI with real data
            const cardElement = document.getElementById(`card-${uid}-${this.getPlatformIndex(uid)}`);
            if (cardElement) {
                const hasSkeletonElements = cardElement.querySelectorAll('.skeleton-box').length > 0;

                if (hasSkeletonElements) {
                    // Card is still skeleton, convert to data
                    this.updateCardFromSkeletonToData(uid, platform);
                } else {
                    // Card already has data, just update the values
                    if (oldData) {
                        this.updateCardUI(uid, oldData, platform.data);
                    } else {
                        // Force full update if no old data
                        this.updateCardFromSkeletonToData(uid, platform);
                    }
                }
            }

        } catch (error) {
            console.error(`❌ Error loading data for platform ${uid}:`, error);

            platform.loadingError = error.message || 'Failed to load data';
            platform.isDataLoaded = false;

            // Update card to show error state
            this.updateCardToErrorState(uid, platform.loadingError);

        } finally {
            this.loadingStates.set(uid, false);

            if (this.options.onLoadingStateChange) {
                this.options.onLoadingStateChange(false, uid);
            }
        }
    }

    // endregion

    //region Handle Load Platform Forecast
    private async loadPlatformForecast(uid: string, days: number = 3): Promise<void> {
        if (!this.options.apiEndpointForecast) {
            console.warn('apiEndpointForecast is not configured');
            return;
        }

        try {
            const endpoint = this.options.apiEndpointForecast.replace('{uid}', uid);
            const url = `${endpoint}?days=${days}`;

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            const forecastData: ForecastData[] = result.forecastData || [];

            // Cache the forecast data
            this.forecastCache.set(uid, forecastData);

            console.log(`✅ Loaded ${days}-day forecast data for ${uid} (${forecastData.length} data points)`);

        } catch (error) {
            console.error(`❌ Error loading forecast for ${uid}:`, error);
        }
    }
    //endregion

    // region Create Skeleton Card
    private createSkeletonCard(platform: CombinedPlatformData, index: number): HTMLElement {
        const cardId = `card-${platform.uid}-${index}`;

        const card = this.createElement('div', 'card !mb-0 cursor-pointer');
        card.dataset.index = index.toString();
        card.id = cardId;

        const cardBody = this.createElement('div', 'card-body');

        // Header section - skeleton version
        const headerFlex = this.createElement('div', 'card-dashboard-header');
        const leftSection = this.createElement('div', 'left-section');
        const idTitle = this.createElement('div', 'idle-title', platform.uid_alias);

        if (platform.location) {
            const locationDiv = this.createElement('div', 'text-[12px] text-gray-500', platform.location);
            leftSection.appendChild(locationDiv);
        }

        const statusContainer = this.createElement('div', 'status');

        // Skeleton status badge
        const skeletonBadge = this.createElement('div', 'skeleton-box w-20 h-6 rounded-full bg-gray-200 animate-pulse');

        // Skeleton online status
        const skeletonOnline = this.createElement('div', 'skeleton-box skeleton-online w-20 h-6 rounded-full bg-gray-200 animate-pulse');

        // Site info
        const siteContainer = this.createElement('div', 'flex items-center gap-2 text-[14px]');
        const siteIcon = this.createElement('i', 'fas fa-location-dot');
        const siteText = this.createElement('div');
        siteText.textContent = platform.siteName;
        siteContainer.appendChild(siteIcon);
        siteContainer.appendChild(siteText);

        statusContainer.appendChild(skeletonBadge);
        statusContainer.appendChild(skeletonOnline);
        statusContainer.appendChild(siteContainer);
        leftSection.appendChild(idTitle);
        leftSection.appendChild(statusContainer);

        // Right side - CCTV icon
        const rightSection = this.createElement('div', 'right-section');
        const cctvLink = this.createElement('a', 'cursor-pointer') as HTMLAnchorElement;
        const cctvImg = document.createElement('img');
        if (!platform.cctvLink1) {
            cctvImg.src = platform.cctvIconPath || '/images/vector/icons8-cctv-disabled-100.png';
            cctvLink.className = 'cursor-not-allowed'
        } else {
            cctvImg.src = platform.cctvIconPath || '/images/vector/icons8-cctv-100.png';
            cctvLink.className = 'cursor-pointer'
        }

        cctvImg.width = 24;
        cctvImg.alt = 'cctv';
        cctvLink.appendChild(cctvImg);
        rightSection.appendChild(cctvLink);

        if (platform.cctvLink1) {
            if (this.options.onCctvClick) {
                cctvLink.addEventListener('click', () => {
                    this.options.onCctvClick!(platform.uid, [
                        {
                            cameraName: "Camera 1",
                            videoLink: platform.cctvLink1,
                            supportPTZ: platform.cctv1IsSupportPTZ === 1
                        },
                        {
                            cameraName: "Camera 2",
                            videoLink: platform.cctvLink2,
                            supportPTZ: platform.cctv2IsSupportPTZ === 1
                        }
                    ])
                });
            }
        }

        headerFlex.appendChild(leftSection);
        headerFlex.appendChild(rightSection);

        // Skeleton metrics section - carousel (4 per page)
        const METRICS_PER_PAGE = 4;
        const metricTypes = ['PM2.5', 'PM10', 'TSP', 'Noise', 'Temp', 'Pressure', 'Humidity', 'PM2.5 (Real)', 'PM10 (Real)', 'TSP (Real)'];
        const totalMetricPages = Math.ceil(metricTypes.length / METRICS_PER_PAGE);

        const metricsContainer = this.createElement('div', 'metrics-carousel mt-4');

        const prevBtn = this.createElement('button', 'carousel-prev bg-white border rounded-full w-6 h-6 flex items-center justify-center shadow text-gray-500 text-sm leading-none transition-opacity duration-200 disabled:opacity-30') as HTMLButtonElement;
        prevBtn.textContent = '‹';
        prevBtn.disabled = true;

        const nextBtn = this.createElement('button', 'carousel-next bg-white border rounded-full w-6 h-6 flex items-center justify-center shadow text-gray-500 text-sm leading-none transition-opacity duration-200 disabled:opacity-30') as HTMLButtonElement;
        nextBtn.textContent = '›';
        if (totalMetricPages <= 1) nextBtn.disabled = true;

        const viewport = this.createElement('div', 'overflow-hidden');
        const track = this.createElement('div', 'carousel-track flex transition-transform duration-300') as HTMLElement;
        track.style.transform = 'translateX(0%)';

        for (let p = 0; p < totalMetricPages; p++) {
            const pageDiv = this.createElement('div', 'min-w-full grid grid-cols-4 gap-2');
            const pageItems = metricTypes.slice(p * METRICS_PER_PAGE, (p + 1) * METRICS_PER_PAGE);
            pageItems.forEach(metricTitle => {
                const metricCard = this.createElement('div', 'border rounded-md overflow-hidden');
                const titleDiv = this.createElement('div', 'font-bold text-[12px] m-2 mb-2 truncate', metricTitle);
                titleDiv.title = metricTitle;
                const skeletonChart = this.createElement('div', 'skeleton-box skeleton-metric w-[85px] h-16 bg-gray-200 animate-pulse rounded mx-2 mb-2');
                metricCard.appendChild(titleDiv);
                metricCard.appendChild(skeletonChart);
                pageDiv.appendChild(metricCard);
            });
            track.appendChild(pageDiv);
        }

        const dotsContainer = this.createElement('div', 'flex justify-center items-center mt-2 gap-2');
        dotsContainer.appendChild(prevBtn);
        for (let i = 0; i < totalMetricPages; i++) {
            const dot = this.createElement('div', `carousel-dot w-1.5 h-1.5 rounded-full ${i === 0 ? 'bg-gray-600' : 'bg-gray-300'}`);
            dotsContainer.appendChild(dot);
        }
        dotsContainer.appendChild(nextBtn);

        viewport.appendChild(track);
        metricsContainer.appendChild(viewport);
        metricsContainer.appendChild(dotsContainer);

        this.initCarouselNavigation(metricsContainer as HTMLElement, totalMetricPages);

        // Skeleton AirIndex section
        const airIndexSection = this.createElement('div', 'mt-4');

        // Title and dropdown area skeleton
        const titleDropdownArea = this.createElement('div', 'flex justify-between items-center mb-4');
        const skeletonTitle = this.createElement('div', 'skeleton-box w-40 h-6 rounded bg-gray-200 animate-pulse');
        const skeletonDropdown = this.createElement('div', 'skeleton-box w-32 h-4 rounded bg-gray-200 animate-pulse');

        titleDropdownArea.appendChild(skeletonTitle);
        titleDropdownArea.appendChild(skeletonDropdown);

        const skeletonAirIndexChart = this.createElement('div', 'skeleton-box w-full h-32 bg-gray-200 animate-pulse rounded');

        airIndexSection.appendChild(titleDropdownArea);
        airIndexSection.appendChild(skeletonAirIndexChart);

        // Skeleton last updated
        const skeletonLastUpdated = this.createElement('div', 'skeleton-box w-48 h-3 bg-gray-200 animate-pulse rounded mt-4');
        airIndexSection.appendChild(skeletonLastUpdated);

        // Assemble card
        cardBody.appendChild(headerFlex);
        cardBody.appendChild(metricsContainer);
        cardBody.appendChild(airIndexSection);
        card.appendChild(cardBody);

        return card;
    }

    // endregion

    // region Update Card From Skeleton To Data
    private updateCardFromSkeletonToData(uid: string, platform: CombinedPlatformData): void {
        const cardElement = document.getElementById(`card-${uid}-${this.getPlatformIndex(uid)}`);
        if (!cardElement || !platform.data) return;

        const cardId = cardElement.id;

        // Update status badge
        this.updateStatusBadgeFromSkeleton(cardElement, platform.data);

        // Update online status
        this.updateOnlineStatusFromSkeleton(cardElement, platform.data);

        // Update metrics with actual charts
        this.updateMetricsFromSkeleton(cardElement, platform.data, cardId, platform);

        // Update air index chart
        this.updateAirIndexFromSkeleton(cardElement, platform.data, cardId);

        // Update last updated
        this.updateLastUpdatedFromSkeleton(cardElement, platform.data, platform);

        console.log(`🎨 Updated card ${uid} from skeleton to data`);
    }

    // endregion

    // region Update Status Badge From Skeleton
    private updateStatusBadgeFromSkeleton(cardElement: HTMLElement, data: PlatformData): void {
        const skeletonBadge = cardElement.querySelector('.skeleton-box.w-20.h-6');
        if (!skeletonBadge) return;

        const badge = this.createElement('div', `status-badge inline-flex items-center rounded-full gap-1 px-[4px] py-[3px] ${data.colorCode || 'bg-green-200'} text-[12px] font-bold`);
        const emoji = this.createElement('div');
        emoji.textContent = data.emoji || '✅';
        const statusText = this.createElement('div', 'mr-1', data.status || 'Unknown');
        badge.appendChild(emoji);
        badge.appendChild(statusText);

        if (this.options.onStatusClick) {
            badge.addEventListener('click', () => this.options.onStatusClick!(data.uid));
        }

        skeletonBadge.parentNode?.replaceChild(badge, skeletonBadge);
    }

    // endregion

    // region Update Online Status From Skeleton
    private updateOnlineStatusFromSkeleton(cardElement: HTMLElement, data: PlatformData): void {
        const skeletonOnline = cardElement.querySelector('.skeleton-online');
        if (!skeletonOnline) return;

        const onlineContainer = this.createElement('div', 'online-status-container');
        const indicator = this.createElement('div', `${data.isOnline ? 'online' : 'offline'}`);
        const onlineText = this.createElement('div', 'text-[14px]', data.isOnline ? 'Online' : 'Offline');
        onlineContainer.appendChild(indicator);
        onlineContainer.appendChild(onlineText);

        if (this.options.onHeartbeatStatusClick) {
            onlineContainer.addEventListener('click', () => this.options.onHeartbeatStatusClick!(data.uid));
        }

        skeletonOnline.parentNode?.replaceChild(onlineContainer, skeletonOnline);
    }

    // endregion

    // region Update Metrics From Skeleton
    private updateMetricsFromSkeleton(cardElement: HTMLElement, data: PlatformData, cardId: string, platform: CombinedPlatformData): void {
        const skeletonCharts = cardElement.querySelectorAll('.skeleton-metric');

        const metrics = [
            {
                title: 'PM2.5',
                type: 'pm25' as const,
                value: data.metrics?.pm25?.value || 0,
                bml_min: data.metrics?.pm25?.bml_min || 0,
                bml_min_buffer: data.metrics?.pm25?.bml_min_buffer || 0,
                bml_max_buffer: data.metrics?.pm25?.bml_max_buffer || 100,
                bml_max: data.metrics?.pm25?.bml_max || 100,
                unit: 'µg/m³'
            },
            {
                title: 'PM10',
                type: 'pm10' as const,
                value: data.metrics?.pm10?.value || 0,
                bml_min: data.metrics?.pm10?.bml_min || 0,
                bml_min_buffer: data.metrics?.pm10?.bml_min_buffer || 0,
                bml_max_buffer: data.metrics?.pm10?.bml_max_buffer || 100,
                bml_max: data.metrics?.pm10?.bml_max || 100,
                unit: 'µg/m³'
            },
            {
                title: 'TSP',
                type: 'tsp' as const,
                value: data.metrics?.tsp?.value || 0,
                bml_min: data.metrics?.tsp?.bml_min || 0,
                bml_min_buffer: data.metrics?.tsp?.bml_min_buffer || 0,
                bml_max_buffer: data.metrics?.tsp?.bml_max_buffer || 100,
                bml_max: data.metrics?.tsp?.bml_max || 100,
                unit: 'µg/m³'
            },
            {
                title: 'Noise',
                type: 'noise' as const,
                value: data.metrics?.noise?.value || 0,
                bml_min: data.metrics?.noise?.bml_min || 0,
                bml_min_buffer: data.metrics?.noise?.bml_min_buffer || 0,
                bml_max_buffer: data.metrics?.noise?.bml_max_buffer || 100,
                bml_max: data.metrics?.noise?.bml_max || 100,
                unit: 'dBA'
            },
            {
                title: 'Temp',
                type: 'temp' as const,
                value: data.metrics?.temp?.value || 0,
                bml_min: data.metrics?.temp?.bml_min || 0,
                bml_min_buffer: data.metrics?.temp?.bml_min_buffer || 0,
                bml_max_buffer: data.metrics?.temp?.bml_max_buffer || 40,
                bml_max: data.metrics?.temp?.bml_max || 50,
                unit: '°C'
            },
            {
                title: 'Pressure',
                type: 'mmhg' as const,
                value: data.metrics?.mmhg?.value || 0,
                bml_min: data.metrics?.mmhg?.bml_min || 0,
                bml_min_buffer: data.metrics?.mmhg?.bml_min_buffer || 0,
                bml_max_buffer: data.metrics?.mmhg?.bml_max_buffer || 800,
                bml_max: data.metrics?.mmhg?.bml_max || 1000,
                unit: 'mmHg'
            },
            {
                title: 'Humidity',
                type: 'humidity' as const,
                value: data.metrics?.humidity?.value || 0,
                bml_min: data.metrics?.humidity?.bml_min || 0,
                bml_min_buffer: data.metrics?.humidity?.bml_min_buffer || 0,
                bml_max_buffer: data.metrics?.humidity?.bml_max_buffer || 80,
                bml_max: data.metrics?.humidity?.bml_max || 100,
                unit: '%'
            },
            {
                title: 'PM2.5 (Real)',
                type: 'pm25_raw' as const,
                value: data.metrics?.pm25_raw?.value || 0,
                bml_min: data.metrics?.pm25_raw?.bml_min || 0,
                bml_min_buffer: data.metrics?.pm25_raw?.bml_min_buffer || 0,
                bml_max_buffer: data.metrics?.pm25_raw?.bml_max_buffer || 100,
                bml_max: data.metrics?.pm25_raw?.bml_max || 100,
                unit: 'µg/m³'
            },
            {
                title: 'PM10 (Real)',
                type: 'pm10_raw' as const,
                value: data.metrics?.pm10_raw?.value || 0,
                bml_min: data.metrics?.pm10_raw?.bml_min || 0,
                bml_min_buffer: data.metrics?.pm10_raw?.bml_min_buffer || 0,
                bml_max_buffer: data.metrics?.pm10_raw?.bml_max_buffer || 100,
                bml_max: data.metrics?.pm10_raw?.bml_max || 100,
                unit: 'µg/m³'
            },
            {
                title: 'TSP (Real)',
                type: 'tsp_raw' as const,
                value: data.metrics?.tsp_raw?.value || 0,
                bml_min: data.metrics?.tsp_raw?.bml_min || 0,
                bml_min_buffer: data.metrics?.tsp_raw?.bml_min_buffer || 0,
                bml_max_buffer: data.metrics?.tsp_raw?.bml_max_buffer || 100,
                bml_max: data.metrics?.tsp_raw?.bml_max || 100,
                unit: 'µg/m³'
            }
        ];

        skeletonCharts.forEach((skeletonChart, index) => {
            if (index >= metrics.length) return;

            const metric = metrics[index];
            const chartDiv = this.createElement('div', `chart-${metric.type}`);
            chartDiv.id = `${cardId}-${metric.type}`;

            const metricCard = skeletonChart.parentElement;
            if (metricCard) {
                if (this.options.onMetricsClick) {
                    metricCard.addEventListener('click', () => this.options.onMetricsClick!(data.uid, metric));
                }

                skeletonChart.parentNode?.replaceChild(chartDiv, skeletonChart);

                // Create gauge chart
                setTimeout(() => {
                    this.createGaugeChart(data.uid, chartDiv, metric.title, metric.type, metric.bml_min, metric.bml_min_buffer, metric.bml_max_buffer, metric.bml_max, metric.value, cardId, metricCard as HTMLElement);
                }, 100);
            }
        });

        // Re-init carousel navigation after skeleton → data transition
        const carouselContainer = cardElement.querySelector('.metrics-carousel') as HTMLElement;
        if (carouselContainer) {
            this.initCarouselNavigation(carouselContainer, Math.ceil(metrics.length / 4));
        }
    }

    // endregion

    // region Carousel Navigation
    private initCarouselNavigation(container: HTMLElement, totalPages: number): void {
        const track = container.querySelector('.carousel-track') as HTMLElement;
        const prevBtn = container.querySelector('.carousel-prev') as HTMLButtonElement;
        const nextBtn = container.querySelector('.carousel-next') as HTMLButtonElement;
        const dots = container.querySelectorAll('.carousel-dot');
        if (!track || !prevBtn || !nextBtn) return;

        let currentPage = 0;

        const goToPage = (page: number) => {
            currentPage = page;
            track.style.transition = 'transform 300ms ease';
            track.style.transform = `translateX(-${page * 100}%)`;
            prevBtn.disabled = page === 0;
            nextBtn.disabled = page === totalPages - 1;
            dots.forEach((dot, i) => {
                dot.className = `carousel-dot w-1.5 h-1.5 rounded-full ${i === currentPage ? 'bg-gray-600' : 'bg-gray-300'}`;
            });
        };

        prevBtn.onclick = () => { if (currentPage > 0) goToPage(currentPage - 1); };
        nextBtn.onclick = () => { if (currentPage < totalPages - 1) goToPage(currentPage + 1); };

        // Mouse drag support
        let isDragging = false;
        let dragStartX = 0;

        track.style.cursor = 'grab';

        track.addEventListener('mousedown', (e) => {
            isDragging = true;
            dragStartX = e.clientX;
            track.style.cursor = 'grabbing';
            track.style.transition = 'none';
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const diff = e.clientX - dragStartX;
            track.style.transform = `translateX(calc(-${currentPage * 100}% + ${diff}px))`;
        });

        document.addEventListener('mouseup', (e) => {
            if (!isDragging) return;
            isDragging = false;
            track.style.cursor = 'grab';
            const diff = e.clientX - dragStartX;
            if (diff < -50 && currentPage < totalPages - 1) {
                goToPage(currentPage + 1);
            } else if (diff > 50 && currentPage > 0) {
                goToPage(currentPage - 1);
            } else {
                goToPage(currentPage);
            }
        });

        // Touch swipe support
        let touchStartX = 0;

        track.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            track.style.transition = 'none';
        }, { passive: true });

        track.addEventListener('touchmove', (e) => {
            const diff = e.touches[0].clientX - touchStartX;
            track.style.transform = `translateX(calc(-${currentPage * 100}% + ${diff}px))`;
        }, { passive: true });

        track.addEventListener('touchend', (e) => {
            const diff = e.changedTouches[0].clientX - touchStartX;
            if (diff < -50 && currentPage < totalPages - 1) {
                goToPage(currentPage + 1);
            } else if (diff > 50 && currentPage > 0) {
                goToPage(currentPage - 1);
            } else {
                goToPage(currentPage);
            }
        });
    }

    // endregion

    // region Update Air Index From Skeleton
    private updateAirIndexFromSkeleton(cardElement: HTMLElement, data: PlatformData, cardId: string): void {
        // Update title and dropdown area
        const skeletonDropdown = cardElement.querySelector('.skeleton-box.w-32.h-4');
        if (skeletonDropdown) {
            const titleAndDropdownWrap = this.createElement('div', 'flex justify-between items-center mb-4');

            // Left side - Title dropdown (Air Quality Index / Air Forecast Index)
            const titleDropdown = this.createTitleDropdown(cardId);

            // Right side container - untuk source dropdown dan forecast period dropdown
            const rightContainer = this.createElement('div', 'flex items-center gap-2');

            // Source dropdown (Based on TSP / Based on PM2.5/PM10)
            const sourceDropdown = this.createSourceDropdown(cardId);

            // Forecast period dropdown (3 Day, 2 Day, 1 Day) - hidden by default
            const forecastPeriodDropdown = this.createForecastPeriodDropdown(cardId);

            rightContainer.appendChild(sourceDropdown);
            rightContainer.appendChild(forecastPeriodDropdown);

            titleAndDropdownWrap.appendChild(titleDropdown);
            titleAndDropdownWrap.appendChild(rightContainer);

            // Replace the skeleton subtitle with the new structure
            const airIndexSubTitle = skeletonDropdown.parentElement;
            if (airIndexSubTitle) {
                airIndexSubTitle.parentNode?.replaceChild(titleAndDropdownWrap, airIndexSubTitle);
            }
        }

        // Update chart
        const skeletonAirChart = cardElement.querySelector('.skeleton-box.w-full.h-32');
        if (skeletonAirChart) {
            const airIndexChart = this.createElement('div', 'chart-one');
            airIndexChart.id = `${cardId}-airIndex`;

            skeletonAirChart.parentNode?.replaceChild(airIndexChart, skeletonAirChart);

            // Create air index chart
            setTimeout(() => {
                this.currentAQISource.set(cardId, 'tsp');
                this.currentDataMode.set(cardId, 'realtime');
                this.currentForecastDays.set(cardId, 3); // ✅ Default 3 hari
                this.createAirIndexChart(airIndexChart, data.airIndexData || [], cardId);
                this.updateAirIndexChart(cardId, data.airIndexData || []);
            }, 200);
        }
    }
    // endregion

    // region Create Title Dropdown (Air Quality Index / Air Forecast Index)
    private createTitleDropdown(cardId: string): HTMLElement {
        const ddWrap = this.createElement('div', 'relative');
        const ddButton = this.createElement('button', 'inline-flex items-center gap-1 font-bold text-[14px] hover:bg-gray-50 dark:hover:bg-gray-800 px-2 py-1 rounded') as HTMLButtonElement;
        ddButton.id = `${cardId}-titleDropdownButton`;
        ddButton.type = 'button';
        ddButton.innerHTML = `
            <span class="titleText">AQI Realtime</span>
            <svg class="w-3 h-3" aria-hidden="true" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clip-rule="evenodd"/>
            </svg>
        `;

        const ddMenu = this.createElement('div', 'z-10 hidden bg-white divide-y divide-gray-100 rounded-lg shadow w-52 dark:bg-gray-700') as HTMLDivElement;
        ddMenu.id = `${cardId}-titleDropdownMenu`;

        const menuList = document.createElement('ul');
        menuList.className = 'py-2 text-sm text-gray-700 dark:text-gray-200';

        // Initialize Flowbite dropdown first
        const dropdownOptions: DropdownOptions = {
            placement: 'bottom-start',
            triggerType: 'click',
            offsetDistance: 8,
        };

        const instanceOptions: InstanceOptions = {
            id: ddMenu.id,
            override: true
        };

        const dropdown: DropdownInterface = new Dropdown(ddMenu, ddButton, dropdownOptions, instanceOptions);

        const makeItem = (label: string, value: 'realtime' | 'forecast') => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = '#';
            a.className = 'block px-4 py-2 text-[12px] hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white';
            a.textContent = label;
            a.addEventListener('click', async (e) => {
                e.preventDefault();

                // Update text
                const titleText = ddButton.querySelector('.titleText');
                if (titleText) {
                    titleText.textContent = label;
                }

                // Close dropdown immediately
                dropdown.hide();

                // Switch mode
                await this.switchDataMode(cardId, value);
            });
            li.appendChild(a);
            return li;
        };

        menuList.appendChild(makeItem('AQI Realtime', 'realtime'));

        if (this.options.enableForecast) {
            menuList.appendChild(makeItem('AQI Forecast', 'forecast'));
        }

        ddMenu.appendChild(menuList);
        ddWrap.appendChild(ddButton);
        ddWrap.appendChild(ddMenu);

        return ddWrap;
    }

    // endregion

    // region Create Source Dropdown (Based on TSP / Based on PM2.5/PM10)
    private createSourceDropdown(cardId: string): HTMLElement {
        const ddWrap = this.createElement('div', 'relative source-dropdown-wrap');
        const ddButton = this.createElement('button', 'inline-flex items-center gap-1 text-xs hover:bg-gray-50 dark:hover:bg-gray-800 px-2 py-1 rounded border') as HTMLButtonElement;
        ddButton.id = `${cardId}-sourceDropdownButton`;
        ddButton.type = 'button';
        ddButton.innerHTML = `
            <span class="sourceText">Based on TSP</span>
            <svg class="w-3 h-3" aria-hidden="true" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clip-rule="evenodd"/>
            </svg>
        `;

        const ddMenu = this.createElement('div', 'z-10 hidden bg-white divide-y divide-gray-100 rounded-lg shadow w-44 dark:bg-gray-700') as HTMLDivElement;
        ddMenu.id = `${cardId}-sourceDropdownMenu`;

        const menuList = document.createElement('ul');
        menuList.className = 'py-2 text-sm text-gray-700 dark:text-gray-200';

        // Initialize Flowbite dropdown first
        const dropdownOptions: DropdownOptions = {
            placement: 'bottom-end',
            triggerType: 'click',
            offsetDistance: 8,
        };

        const instanceOptions: InstanceOptions = {
            id: ddMenu.id,
            override: true
        };

        const dropdown: DropdownInterface = new Dropdown(ddMenu, ddButton, dropdownOptions, instanceOptions);

        const makeItem = (label: string, value: 'pm25_pm10' | 'tsp') => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = '#';
            a.className = 'block px-4 py-2 text-[12px] hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white';
            a.textContent = label;
            a.addEventListener('click', (e) => {
                e.preventDefault();

                // Update text
                const subText = ddButton.querySelector('.sourceText');
                if (subText) {
                    subText.textContent = value === 'pm25_pm10' ? 'Based on PM 2.5 / PM 10' : 'Based on TSP';
                }

                // Close dropdown immediately
                dropdown.hide();

                // Filter source
                this.filterAirIndexSource(cardId, value);
            });
            li.appendChild(a);
            return li;
        };

        menuList.appendChild(makeItem('PM 2.5 / PM 10', 'pm25_pm10'));
        menuList.appendChild(makeItem('TSP', 'tsp'));
        ddMenu.appendChild(menuList);

        ddWrap.appendChild(ddButton);
        ddWrap.appendChild(ddMenu);

        return ddWrap;
    }

    // endregion

    // region Create Forecast Period Dropdown (3 Day, 2 Day, 1 Day)
    private createForecastPeriodDropdown(cardId: string): HTMLElement {
        const ddWrap = this.createElement('div', 'relative forecast-period-dropdown-wrap');
        ddWrap.style.display = 'none'; // Hidden by default (shown in forecast mode)

        const ddButton = this.createElement('button', 'inline-flex items-center gap-1 text-xs hover:bg-gray-50 dark:hover:bg-gray-800 px-2 py-1 rounded border') as HTMLButtonElement;
        ddButton.id = `${cardId}-forecastPeriodDropdownButton`;
        ddButton.type = 'button';
        ddButton.innerHTML = `
            <span class="periodText">3 Day</span>
            <svg class="w-3 h-3" aria-hidden="true" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clip-rule="evenodd"/>
            </svg>
        `;

        const ddMenu = this.createElement('div', 'z-10 hidden bg-white divide-y divide-gray-100 rounded-lg shadow w-32 dark:bg-gray-700') as HTMLDivElement;
        ddMenu.id = `${cardId}-forecastPeriodDropdownMenu`;

        const menuList = document.createElement('ul');
        menuList.className = 'py-2 text-sm text-gray-700 dark:text-gray-200';

        // Initialize Flowbite dropdown
        const dropdownOptions: DropdownOptions = {
            placement: 'bottom-end',
            triggerType: 'click',
            offsetDistance: 8,
        };

        const instanceOptions: InstanceOptions = {
            id: ddMenu.id,
            override: true
        };

        const dropdown: DropdownInterface = new Dropdown(ddMenu, ddButton, dropdownOptions, instanceOptions);

        const makeItem = (label: string, days: number) => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = '#';
            a.className = 'block px-4 py-2 text-[12px] hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white';
            a.textContent = label;
            a.addEventListener('click', async (e) => {
                e.preventDefault();

                // Update text
                const periodText = ddButton.querySelector('.periodText');
                if (periodText) {
                    periodText.textContent = label;
                }

                // Close dropdown immediately
                dropdown.hide();

                // Update forecast dengan days baru
                await this.changeForecastPeriod(cardId, days);
            });
            li.appendChild(a);
            return li;
        };

        menuList.appendChild(makeItem('3 Day', 3));
        menuList.appendChild(makeItem('2 Day', 2));
        menuList.appendChild(makeItem('1 Day', 1));

        ddMenu.appendChild(menuList);
        ddWrap.appendChild(ddButton);
        ddWrap.appendChild(ddMenu);

        return ddWrap;
    }
    // endregion

    // region Change Forecast Period
    private async changeForecastPeriod(cardId: string, days: number): Promise<void> {
        this.currentForecastDays.set(cardId, days);

        const platform = this.platforms.find(p => `card-${p.uid}-${this.getPlatformIndex(p.uid)}` === cardId);
        if (!platform) return;

        const cardElement = document.getElementById(cardId);

        // Show skeleton
        if (cardElement) {
            this.showChartSkeleton(cardElement, cardId);
        }

        // Clear cached forecast untuk platform ini
        this.forecastCache.delete(platform.uid);

        // Load forecast dengan days baru
        await this.loadPlatformForecast(platform.uid, days);

        const forecastData = this.forecastCache.get(platform.uid) || [];

        // Remove skeleton and update chart
        setTimeout(() => {
            this.removeChartSkeleton(cardElement, cardId);
            this.updateAirIndexChart(cardId, forecastData);
        }, 500);

        console.log(`📅 Changed forecast period for ${cardId} to ${days} days`);
    }
    // endregion

    // region Switch Data Mode (Realtime vs Forecast)
    private async switchDataMode(cardId: string, mode: 'realtime' | 'forecast'): Promise<void> {
        this.currentDataMode.set(cardId, mode);

        const platform = this.platforms.find(p => `card-${p.uid}-${this.getPlatformIndex(p.uid)}` === cardId);
        if (!platform) return;

        // Get elements
        const cardElement = document.getElementById(cardId);
        const sourceDropdownWrap = cardElement?.querySelector('.source-dropdown-wrap') as HTMLElement;
        const forecastPeriodDropdownWrap = cardElement?.querySelector('.forecast-period-dropdown-wrap') as HTMLElement;
        const chartElement = cardElement?.querySelector(`#${cardId}-airIndex`) as HTMLElement;

        // Show skeleton on chart
        if (chartElement) {
            this.showChartSkeleton(cardElement, cardId);
        }

        if (mode === 'forecast') {
            // Hide source dropdown, show forecast period dropdown
            if (sourceDropdownWrap) {
                sourceDropdownWrap.style.display = 'none';
            }
            if (forecastPeriodDropdownWrap) {
                forecastPeriodDropdownWrap.style.display = 'block';
            }

            // Get current selected days (default 3)
            const days = this.currentForecastDays.get(cardId) || 3;

            // Load forecast if not cached
            const cacheKey = `${platform.uid}-${days}`;
            if (!this.forecastCache.has(platform.uid)) {
                await this.loadPlatformForecast(platform.uid, days);
            }

            const forecastData = this.forecastCache.get(platform.uid) || [];

            // Remove skeleton and update chart
            setTimeout(() => {
                this.removeChartSkeleton(cardElement, cardId);
                this.updateAirIndexChart(cardId, forecastData);
            }, 500);

            console.log(`🔮 Switched ${cardId} to forecast mode (${days} days)`);
        } else {
            // Show source dropdown, hide forecast period dropdown
            if (sourceDropdownWrap) {
                sourceDropdownWrap.style.display = 'block';
            }
            if (forecastPeriodDropdownWrap) {
                forecastPeriodDropdownWrap.style.display = 'none';
            }

            // Use realtime data
            const realtimeData = platform.data?.airIndexData || [];

            // Remove skeleton and update chart
            setTimeout(() => {
                this.removeChartSkeleton(cardElement, cardId);
                this.updateAirIndexChart(cardId, realtimeData);
            }, 500);

            console.log(`📊 Switched ${cardId} to realtime mode`);
        }
    }
    // endregion

    // region Show Chart Skeleton
    private showChartSkeleton(cardElement: HTMLElement, cardId: string): void {
        const chartElement = cardElement?.querySelector(`#${cardId}-airIndex`) as HTMLElement;
        if (!chartElement) return;

        // Hide chart
        chartElement.style.display = 'none';

        // Create skeleton
        const skeleton = this.createElement('div', 'skeleton-box w-full h-32 bg-gray-200 animate-pulse rounded chart-skeleton');

        // Insert skeleton after chart
        chartElement.parentNode?.insertBefore(skeleton, chartElement.nextSibling);
    }

    // endregion

    // region Remove Chart Skeleton
    private removeChartSkeleton(cardElement: HTMLElement, cardId: string): void {
        const skeleton = cardElement?.querySelector('.chart-skeleton');
        const chartElement = cardElement?.querySelector(`#${cardId}-airIndex`) as HTMLElement;

        if (skeleton) {
            skeleton.remove();
        }

        if (chartElement) {
            chartElement.style.display = 'block';
        }
    }

    // endregion

    // region Update Last Updated From Skeleton
    private updateLastUpdatedFromSkeleton(cardElement: HTMLElement, data: PlatformData, platform: CombinedPlatformData): void {
        const skeletonLastUpdated = cardElement.querySelector('.skeleton-box.w-48.h-3');
        if (skeletonLastUpdated && data.lastUpdated) {
            const platformTimezone = platform.timezone || 'Asia/Jakarta';
            const platformLocale = platform.locale || 'id-ID';

            const formattedLastUpdated = this.safeFormatDate(data.lastUpdated, platformTimezone, platformLocale);
            const timezoneShort = platformTimezone.split('/')[1] || platformTimezone;

            const lastUpdatedDiv = this.createElement('div', 'text-[10px] text-gray-400 mt-4 last-updated',
                    `Last updated: ${formattedLastUpdated} (${timezoneShort})`);

            skeletonLastUpdated.parentNode?.replaceChild(lastUpdatedDiv, skeletonLastUpdated);
        }
    }

    // endregion

    //region Handle Convert Card to Skeleton
    private convertCardToSkeleton(uid: string): void {
        const cardElement = document.getElementById(`card-${uid}-${this.getPlatformIndex(uid)}`);
        if (!cardElement) return;

        console.log(`🦴 Converting card ${uid} to skeleton state`);

        // Convert status badge to skeleton
        const statusBadge = cardElement.querySelector('.status-badge');
        if (statusBadge) {
            const skeletonBadge = this.createElement('div', 'skeleton-box w-20 h-6 rounded-full bg-gray-200 animate-pulse');
            statusBadge.parentNode?.replaceChild(skeletonBadge, statusBadge);
        }

        // Convert online status to skeleton
        const onlineContainer = cardElement.querySelector('.online-status-container');
        if (onlineContainer) {
            const skeletonOnline = this.createElement('div', 'skeleton-box skeleton-online w-20 h-6 rounded-full bg-gray-200 animate-pulse');
            onlineContainer.parentNode?.replaceChild(skeletonOnline, onlineContainer);
        }

        // Convert metrics charts to skeleton
        const metricCharts = cardElement.querySelectorAll('.chart-pm25, .chart-pm10, .chart-tsp, .chart-noise, .chart-temp, .chart-mmhg, .chart-humidity, .chart-pm25_raw, .chart-pm10_raw, .chart-tsp_raw');
        metricCharts.forEach(chart => {
            const skeletonChart = this.createElement('div', 'skeleton-box skeleton-metric w-[78px] h-16 bg-gray-200 animate-pulse rounded mx-2 mb-2');
            chart.parentNode?.replaceChild(skeletonChart, chart);
        });

        // Convert air index chart to skeleton
        const airIndexChart = cardElement.querySelector('.chart-one');
        if (airIndexChart) {
            const skeletonAirChart = this.createElement('div', 'skeleton-box w-full h-32 bg-gray-200 animate-pulse rounded');
            airIndexChart.parentNode?.replaceChild(skeletonAirChart, airIndexChart);
        }

        // Convert dropdown to skeleton
        const dropdown = cardElement.querySelector('.relative');
        if (dropdown) {
            const skeletonDropdown = this.createElement('div', 'skeleton-box w-32 h-4 rounded bg-gray-200 animate-pulse');
            dropdown.parentNode?.replaceChild(skeletonDropdown, dropdown);
        }

        // Convert last updated to skeleton
        const lastUpdated = cardElement.querySelector('.last-updated');
        if (lastUpdated) {
            const skeletonLastUpdated = this.createElement('div', 'skeleton-box w-48 h-3 bg-gray-200 animate-pulse rounded mt-4');
            lastUpdated.parentNode?.replaceChild(skeletonLastUpdated, lastUpdated);
        }

        // Clear chart instances for this card
        const cardId = `card-${uid}-${this.getPlatformIndex(uid)}`;
        const chartKeys = [`${cardId}-pm25`, `${cardId}-pm10`, `${cardId}-tsp`, `${cardId}-noise`, `${cardId}-temp`, `${cardId}-mmhg`, `${cardId}-humidity`, `${cardId}-pm25_raw`, `${cardId}-pm10_raw`, `${cardId}-tsp_raw`, `${cardId}-airIndex`];
        chartKeys.forEach(key => {
            const chart = this.chartInstances.get(key);
            if (chart && chart.destroy) {
                chart.destroy();
            }
            this.chartInstances.delete(key);
        });
    }

    //endregion

    //region Handle Convert All Card to Skeleton
    private convertAllCardsToSkeleton(): void {
        this.platforms.forEach(platform => {
            if (platform.isDataLoaded) {
                this.convertCardToSkeleton(platform.uid);
                // Reset data loaded state
                platform.isDataLoaded = false;
            }
        });
    }

    //endregion

    // region Update Card To Error State
    private updateCardToErrorState(uid: string, errorMessage: string): void {
        const cardElement = document.getElementById(`card-${uid}-${this.getPlatformIndex(uid)}`);
        if (!cardElement) return;

        // Replace skeletons with error indicators
        const skeletonElements = cardElement.querySelectorAll('.skeleton-box');
        skeletonElements.forEach(skeleton => {
            const errorDiv = this.createElement('div', 'text-red-500 text-xs p-2 bg-red-50 rounded', 'Error loading data');
            skeleton.parentNode?.replaceChild(errorDiv, skeleton);
        });

        console.log(`❌ Updated card ${uid} to error state: ${errorMessage}`);
    }

    // endregion

    //region Kondisi apakah Realtime Update harus di Enable?
    private shouldEnableRealTimeUpdates(): boolean {
        const urlParams = new URLSearchParams(window.location.search);
        const dateParam = urlParams.get('date');

        // Jika tidak ada date parameter, aktifkan real-time
        if (!dateParam) {
            console.log('🔄 No date filter, enabling real-time updates');
            return true;
        }

        // Bandingkan dengan tanggal hari ini
        const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
        const isToday = dateParam === today;

        console.log(`📅 Date filter: ${dateParam}, Today: ${today}, Is Today: ${isToday}`);

        if (isToday) {
            console.log('✅ Filtering by today\'s date, real-time updates enabled');
        } else {
            console.log('⏸️ Filtering by past/future date, real-time updates disabled');
        }

        return isToday;
    }

    //endregion

    // region Start Real Time Updates
    private startRealTimeUpdates(): void {
        if (!this.options.realTimeUpdateInterval) return;

        // Cek apakah real-time updates harus aktif
        if (!this.shouldEnableRealTimeUpdates()) {
            console.log('⏸️ Real-time updates skipped due to date filter');
            return;
        }

        const updateData = async () => {
            try {
                // Double check saat akan update - mungkin URL sudah berubah
                if (!this.shouldEnableRealTimeUpdates()) {
                    console.log('⏸️ Stopping real-time updates - date filter detected');
                    this.stopRealTimeUpdates();
                    return;
                }

                console.log('🔄 Real-time update cycle started...');

                // Update data for all loaded platforms
                const updatePromises = this.platforms
                        .filter(platform => platform.isDataLoaded)
                        .map(platform => this.loadPlatformData(platform.uid));

                await Promise.allSettled(updatePromises);

                this.lastUpdateTime = new Date();
                this.updateConnectionStatus('connected');

                console.log('✅ Real-time update cycle completed');

            } catch (error) {
                console.error('❌ Error during real-time update:', error);
                this.updateConnectionStatus('error');
            }
        };

        console.log(`⏰ Starting real-time updates every ${this.options.realTimeUpdateInterval}ms`);
        this.isRealTimeActive = true;
        this.realTimeInterval = window.setInterval(updateData, this.options.realTimeUpdateInterval);
    }

    // endregion

    // region Stop Real Time Updates
    private stopRealTimeUpdates(): void {
        if (this.realTimeInterval) {
            clearInterval(this.realTimeInterval);
            this.realTimeInterval = undefined;
            this.isRealTimeActive = false;
            console.log('⏹️ Real-time updates stopped');
        }
    }

    // endregion

    //region Handle URL Change
    private handleURLChange(): void {
        // Stop current real-time updates
        this.stopRealTimeUpdates();

        // Restart berdasarkan kondisi URL saat ini
        setTimeout(() => {
            this.startRealTimeUpdates();
        }, 500);
    }

    //endregion

    // region Initialize Socket IO
    private initSocketIO(): void {
        if (!this.options.socketIOUrl || !this.options.socketInstanceName) return;

        try {
            const socketCallbacks: SocketEventCallbacks = {
                onConnect: (socketId) => {
                    this.updateConnectionStatus('connected');
                    console.log(`🔌 Socket.IO connected: ${socketId}`);
                },
                onDisconnect: (reason) => {
                    this.updateConnectionStatus('disconnected');
                    console.log(`🔌 Socket.IO disconnected: ${reason}`);
                },
                onConnectError: (error) => {
                    this.updateConnectionStatus('error');
                    console.error('🔌 Socket.IO connection error:', error);
                },
                onReconnect: (attemptNumber) => {
                    this.updateConnectionStatus('connected');
                    console.log(`🔌 Socket.IO reconnected after ${attemptNumber} attempts`);
                },
                onReconnectError: (error) => {
                    this.updateConnectionStatus('error');
                    console.error('🔌 Socket.IO reconnection error:', error);
                },
                onReconnectFailed: () => {
                    this.updateConnectionStatus('error');
                    console.error('🔌 Socket.IO reconnection failed');
                },
                onLoggerData: (loggerData) => {
                    this.handleLoggerDataUpdate(loggerData);
                },
                onBulkDataUpdate: (bulkData) => {
                    this.handleBulkDataUpdate(bulkData);
                },
                onStationStatusChange: (data) => {
                    this.updateStationStatus(data.uid, data.status, data.isOnline);
                },
                onHeartbeat: () => {
                    this.lastUpdateTime = new Date();
                    console.log('💓 Heartbeat received');
                },
                onNotification: (data) => {
                    console.log('📢 Notification:', data);
                },
                onConnectionStatusChange: (status) => {
                    this.connectionStatus = status;
                    if (this.options.onConnectionStatus) {
                        this.options.onConnectionStatus(status);
                    }
                }
            };

            this.socketClient = SocketClient.getInstance(
                    this.options.socketInstanceName,
                    this.options.socketIOUrl,
                    this.options.socketIOOptions,
                    socketCallbacks
            );

            console.log(`🔌 Socket.IO initialized for Platform Skeleton Manager with instance: ${this.options.socketInstanceName}`);

        } catch (error) {
            console.error('❌ Failed to initialize Socket.IO for Platform Skeleton Manager:', error);
            this.updateConnectionStatus('error');
        }
    }

    // endregion

    // region Handle Logger Data Update
    private handleLoggerDataUpdate(loggerData: LoggerEventData): void {
        const platform = this.platforms.find(p => p.uid === loggerData.uid);
        if (!platform || !platform.data) {
            console.warn(`⚠️ Platform ${loggerData.uid} not found or data not loaded`);
            return;
        }

        const cardId = `card-${loggerData.uid}-${this.getPlatformIndex(loggerData.uid)}`;
        const currentMode = this.currentDataMode.get(cardId) || 'realtime';

        const oldData = {...platform.data};

        // Update metrics
        if (platform.data.metrics) {
            platform.data.metrics = {
                ...platform.data.metrics,
                pm10: {
                    ...platform.data.metrics.pm10,
                    value: loggerData.pm_10
                },
                pm25: {
                    ...platform.data.metrics.pm25,
                    value: loggerData.pm_25
                },
                tsp: {
                    ...platform.data.metrics.tsp,
                    value: loggerData.tsp
                },
                noise: {
                    ...platform.data.metrics.noise,
                    value: loggerData.noise
                },
                temp: {
                    ...platform.data.metrics.temp,
                    value: loggerData.temp ?? 0
                },
                mmhg: {
                    ...platform.data.metrics.mmhg,
                    value: 0
                },
                humidity: {
                    ...platform.data.metrics.humidity,
                    value: loggerData.humidity ?? 0
                },
                pm25_raw: {
                    ...platform.data.metrics.pm25_raw,
                    value: loggerData.pm_25_raw ?? platform.data.metrics.pm25_raw?.value ?? 0
                },
                pm10_raw: {
                    ...platform.data.metrics.pm10_raw,
                    value: loggerData.pm_10_raw ?? platform.data.metrics.pm10_raw?.value ?? 0
                },
                tsp_raw: {
                    ...platform.data.metrics.tsp_raw,
                    value: loggerData.tsp_raw ?? platform.data.metrics.tsp_raw?.value ?? 0
                }
            };
        }

        // Update air index data if provided (only for realtime mode)
        if (loggerData.airIndexData && currentMode === 'realtime') {
            platform.data.airIndexData = loggerData.airIndexData;
        }

        platform.data.lastUpdated = new Date(loggerData.datetime_unix * 1000);
        platform.data.isOnline = true;

        // Update cache
        this.dataCache.set(loggerData.uid, platform.data);

        // Update UI
        this.updateCardUI(loggerData.uid, oldData, platform.data);

        if (this.options.onDataUpdate) {
            this.options.onDataUpdate(this.platforms);
        }

        console.log(`📊 Updated platform ${loggerData.uid} with real-time logger data (mode: ${currentMode})`);
    }

    // endregion

    // region Handle Bulk Data Update
    private handleBulkDataUpdate(bulkData: PlatformData[]): void {
        bulkData.forEach(newData => {
            const platform = this.platforms.find(p => p.uid === newData.uid);
            if (platform && platform.data) {
                const cardId = `card-${newData.uid}-${this.getPlatformIndex(newData.uid)}`;
                const currentMode = this.currentDataMode.get(cardId) || 'realtime';

                const oldData = {...platform.data};

                // ✅ TAMBAHAN: Preserve airIndexData jika dalam forecast mode
                if (currentMode === 'forecast') {
                    // Simpan data forecast yang sedang ditampilkan
                    const preservedAirIndexData = platform.data.airIndexData;

                    platform.data = {
                        ...newData,
                        airIndexData: preservedAirIndexData, // Keep forecast data
                        lastUpdated: newData.lastUpdated ? new Date(newData.lastUpdated) : new Date()
                    };
                } else {
                    platform.data = {
                        ...newData,
                        lastUpdated: newData.lastUpdated ? new Date(newData.lastUpdated) : new Date()
                    };
                }

                this.dataCache.set(newData.uid, platform.data);
                this.updateCardUI(newData.uid, oldData, platform.data);
            }
        });

        if (this.options.onDataUpdate) {
            this.options.onDataUpdate(this.platforms);
        }

        console.log(`📊 Bulk updated ${bulkData.length} platforms`);
    }

    // endregion

    // region Update Station Status
    private updateStationStatus(uid: string, status: string, isOnline: boolean): void {
        const platform = this.platforms.find(p => p.uid === uid);
        if (platform && platform.data) {
            const oldData = {...platform.data};
            platform.data.status = status;
            platform.data.isOnline = isOnline;
            platform.data.lastUpdated = new Date();

            this.updateCardUI(uid, oldData, platform.data);
        }
    }

    // endregion

    // region Update Card UI
    private updateCardUI(uid: string, oldData: PlatformData, newData: PlatformData): void {
        const cardElement = document.getElementById(`card-${uid}-${this.getPlatformIndex(uid)}`);
        if (!cardElement) {
            console.warn(`Card element not found for UID: ${uid}`);
            return;
        }

        const cardId = `card-${uid}-${this.getPlatformIndex(uid)}`;
        const currentMode = this.currentDataMode.get(cardId) || 'realtime';

        console.log(`🎨 Updating card UI for ${uid}`, {oldData, newData, currentMode});

        // Update status if changed
        if (oldData.status !== newData.status) {
            this.updateStatusBadge(cardElement, newData);
        }

        // Update online status if changed
        if (oldData.isOnline !== newData.isOnline) {
            this.updateOnlineStatus(cardElement, newData.isOnline);
        }

        // Update metrics if changed - check each metric individually
        if (newData.metrics) {
            // Update PM2.5
            const oldPm25 = oldData.metrics?.pm25?.value;
            const newPm25 = newData.metrics?.pm25?.value;
            if (oldPm25 !== newPm25 && newPm25 !== undefined) {
                this.updateChartValue(cardId, 'pm25', newPm25);
            }

            // Update PM10
            const oldPm10 = oldData.metrics?.pm10?.value;
            const newPm10 = newData.metrics?.pm10?.value;
            if (oldPm10 !== newPm10 && newPm10 !== undefined) {
                this.updateChartValue(cardId, 'pm10', newPm10);
            }

            // Update TSP
            const oldTsp = oldData.metrics?.tsp?.value;
            const newTsp = newData.metrics?.tsp?.value;
            if (oldTsp !== newTsp && newTsp !== undefined) {
                this.updateChartValue(cardId, 'tsp', newTsp);
            }

            // Update Noise
            const oldNoise = oldData.metrics?.noise?.value;
            const newNoise = newData.metrics?.noise?.value;
            if (oldNoise !== newNoise && newNoise !== undefined) {
                this.updateChartValue(cardId, 'noise', newNoise);
            }

            // Update Temp
            const oldTemp = oldData.metrics?.temp?.value;
            const newTemp = newData.metrics?.temp?.value;
            if (oldTemp !== newTemp && newTemp !== undefined) {
                this.updateChartValue(cardId, 'temp', newTemp);
            }

            // Update Pressure (mmhg)
            const oldMmgh = oldData.metrics?.mmhg?.value;
            const newMmgh = newData.metrics?.mmhg?.value;
            if (oldMmgh !== newMmgh && newMmgh !== undefined) {
                this.updateChartValue(cardId, 'mmhg', newMmgh);
            }

            // Update Humidity
            const oldHumidity = oldData.metrics?.humidity?.value;
            const newHumidity = newData.metrics?.humidity?.value;
            if (oldHumidity !== newHumidity && newHumidity !== undefined) {
                this.updateChartValue(cardId, 'humidity', newHumidity);
            }

            // Update PM2.5 (Real)
            const oldPm25Raw = oldData.metrics?.pm25_raw?.value;
            const newPm25Raw = newData.metrics?.pm25_raw?.value;
            if (oldPm25Raw !== newPm25Raw && newPm25Raw !== undefined) {
                this.updateChartValue(cardId, 'pm25_raw', newPm25Raw);
            }

            // Update PM10 Raw
            const oldPm10Raw = oldData.metrics?.pm10_raw?.value;
            const newPm10Raw = newData.metrics?.pm10_raw?.value;
            if (oldPm10Raw !== newPm10Raw && newPm10Raw !== undefined) {
                this.updateChartValue(cardId, 'pm10_raw', newPm10Raw);
            }

            // Update TSP Raw
            const oldTspRaw = oldData.metrics?.tsp_raw?.value;
            const newTspRaw = newData.metrics?.tsp_raw?.value;
            if (oldTspRaw !== newTspRaw && newTspRaw !== undefined) {
                this.updateChartValue(cardId, 'tsp_raw', newTspRaw);
            }
        }

        // ✅ TAMBAHAN: Hanya update air index chart jika dalam mode realtime
        if (currentMode === 'realtime') {
            // Update air index chart if data has changed
            if (this.hasAirIndexDataChanged(oldData.airIndexData, newData.airIndexData)) {
                this.updateAirIndexChart(cardId, newData.airIndexData || []);
            }
        } else {
            console.log(`⏸️ Skipping air index chart update for ${uid} - currently in forecast mode`);
        }

        // Update last updated time
        this.updateLastUpdatedTime(cardElement, newData, uid);

        console.log(`✅ Card UI updated for ${uid}`);
    }

    private hasAirIndexDataChanged(oldData: any[], newData: any[]): boolean {
        if (!oldData && !newData) return false;
        if (!oldData || !newData) return true;
        if (oldData.length !== newData.length) return true;

        // Check if the last data point has changed
        const oldLast = oldData[oldData.length - 1];
        const newLast = newData[newData.length - 1];

        if (!oldLast && !newLast) return false;
        if (!oldLast || !newLast) return true;

        return (
                oldLast.timestamp !== newLast.timestamp ||
                oldLast.value !== newLast.value ||
                oldLast.value_tsp !== newLast.value_tsp
        );
    }

    private updateLastUpdatedTime(cardElement: HTMLElement, data: PlatformData, uid: string): void {
        const lastUpdatedElement = cardElement.querySelector('.last-updated');
        if (lastUpdatedElement && data.lastUpdated) {
            const platform = this.platforms.find(p => p.uid === uid);
            if (platform) {
                const platformTimezone = platform.timezone || 'Asia/Jakarta';
                const platformLocale = platform.locale || 'id-ID';
                const formattedLastUpdated = this.safeFormatDate(data.lastUpdated, platformTimezone, platformLocale);
                const timezoneShort = platformTimezone.split('/')[1] || platformTimezone;
                lastUpdatedElement.textContent = `Last updated: ${formattedLastUpdated} (${timezoneShort})`;
            }
        }
    }

    // endregion

    // region Update Status Badge
    private updateStatusBadge(cardElement: HTMLElement, data: PlatformData): void {
        const badge = cardElement.querySelector('.status-badge');
        if (!badge) return;

        const emoji = badge.querySelector('div:first-child');
        const text = badge.querySelector('div:last-child');

        if (emoji) emoji.textContent = data.emoji || '✅';
        if (text) text.textContent = data.status || 'Unknown';

        // Update color classes
        badge.className = badge.className.replace(/bg-\w+-\d+/g, data.colorCode || 'bg-green-200');
    }

    // endregion

    // region Update Online Status
    private updateOnlineStatus(cardElement: HTMLElement, isOnline: boolean): void {
        const indicator = cardElement.querySelector('.online-indicator');
        const text = cardElement.querySelector('.online-text');

        if (indicator) {
            indicator.className = indicator.className.replace(/bg-(green|red)-500/g, isOnline ? 'bg-green-500' : 'bg-red-500');
        }

        if (text) {
            text.textContent = isOnline ? 'Online' : 'Offline';
        }
    }

    // endregion

    // region Update Connection Status
    private updateConnectionStatus(status: 'connected' | 'disconnected' | 'error'): void {
        this.connectionStatus = status;

        if (this.options.onConnectionStatus) {
            this.options.onConnectionStatus(status);
        }

        console.log(`🔗 Connection status: ${status}`);
    }

    // endregion

    // region Get Platform Index
    private getPlatformIndex(uid: string): number {
        return this.platforms.findIndex(platform => platform.uid === uid);
    }

    // endregion

    // region Create Element
    private createElement(tag: string, className?: string, textContent?: string): HTMLElement {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (textContent) element.textContent = textContent;
        return element;
    }

    // endregion

    // region Show No Data
    private showNoData(): void {
        if (!this.container) return;

        const noDataElement = this.createElement('div', 'flex justify-center items-center p-16');
        noDataElement.innerHTML = `
            <div class="text-center">
                <div class="text-6xl text-gray-300 mb-4">📊</div>
                <h3 class="text-lg font-medium text-gray-900 mb-2">No Platforms Available</h3>
                <p class="text-gray-500">No platforms found in the system.</p>
            </div>
        `;

        this.container.innerHTML = '';
        this.container.appendChild(noDataElement);
    }

    // endregion

    // region Show Error
    private showError(message: string): void {
        if (!this.container) return;

        const errorElement = this.createElement('div', 'flex justify-center items-center p-16');
        errorElement.innerHTML = `
            <div class="text-center">
                <div class="text-6xl text-red-300 mb-4">⚠️</div>
                <h3 class="text-lg font-medium text-gray-900 mb-2">Error Loading Platforms</h3>
                <p class="text-red-500 mb-4">${message}</p>
                <button class="btn btn-primary retry-btn">Retry</button>
            </div>
        `;

        const retryBtn = errorElement.querySelector('.retry-btn');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => {
                this.initialize();
            });
        }

        this.container.innerHTML = '';
        this.container.appendChild(errorElement);
    }

    // endregion

    // region Chart Creation and Update Methods (Same as original AirQualityCardManager)
    private createGaugeChart(uid: string, element: HTMLElement, title: string, type: 'pm10' | 'pm25' | 'tsp' | 'noise' | 'temp' | 'mmhg' | 'humidity' | 'pm25_raw' | 'pm10_raw' | 'tsp_raw', bml_min: number, bml_min_buffer: number, bml_max_buffer: number, bml_max: number, initialValue: number, cardId: string, metricCard: HTMLElement): void {
        if (!this.options.enableCharts || typeof Highcharts === 'undefined') {
            return;
        }

        const axisMin = bml_min ?? 0;
        // Extend axis to 1.5× bml_max so red zone is always visible on the arc
        const axisMax = bml_max > 0 ? bml_max * 1.5 : 100;
        const range = axisMax - axisMin;

        let stops: [number, string][];
        if (bml_max > 0 && range > 0) {
            const bufferStop = bml_max_buffer > 0
                ? Math.min(0.88, Math.max(0.1, (bml_max_buffer - axisMin) / range))
                : Math.min(0.55, (bml_max - axisMin) / range * 0.6);
            const limitStop = Math.min(0.95, (bml_max - axisMin) / range);

            // Spread intermediate colors evenly across 0 → bufferStop so they're always visible
            stops = [
                [0,                          '#4CAF50'],  // green at start
                [bufferStop * 0.35,          '#66BB6A'],  // medium green
                [bufferStop * 0.65,          '#CDDC39'],  // yellow-green
                [bufferStop,                 '#FFC107'],  // yellow at buffer threshold
                [bufferStop + (limitStop - bufferStop) * 0.45, '#FF9800'],  // orange
                [limitStop,                  '#F44336'],  // red at bml_max
                [1,                          '#B71C1C']   // dark red beyond limit
            ];
        } else {
            stops = [
                [0,    '#4CAF50'],
                [0.25, '#66BB6A'],
                [0.45, '#CDDC39'],
                [0.60, '#FFC107'],
                [0.75, '#FF9800'],
                [0.88, '#F44336'],
                [1,    '#B71C1C']
            ];
        }

        const unitMap = {
            pm10: 'µg/m³',
            pm25: 'µg/m³',
            tsp: 'µg/m³',
            noise: 'dBA',
            temp: '°C',
            mmhg: 'mmHg',
            humidity: '%',
            pm25_raw: 'µg/m³',
            pm10_raw: 'µg/m³',
            tsp_raw: 'µg/m³'
        };

        const managerRef = this;

        const chart = Highcharts.chart({
            chart: {
                renderTo: element,
                type: 'gauge',
                backgroundColor: 'transparent',
                height: 75,
                events: {
                    render: function () {
                        const chart = this as any;
                        const value = chart.series[0].points[0].y;
                        const axis = chart.yAxis[0];
                        const pane = chart.pane[0];

                        const [centerX, centerY, size] = pane.center;
                        const absCenterX = chart.plotLeft + centerX;
                        const absCenterY = chart.plotTop + centerY;
                        const radius = (size / 2) * 0.9;

                        const min = axis.min || 0;
                        const max = axis.max || 100;
                        const clampedValue = Math.max(min, Math.min(value, max));
                        const valuePct = (clampedValue - min) / (max - min);

                        const startAngle = pane.options.startAngle || -100;
                        const endAngle = pane.options.endAngle || 100;
                        const angleDeg = startAngle + valuePct * (endAngle - startAngle);
                        const angleRad = (angleDeg - 90) * Math.PI / 180;

                        const cx = absCenterX + radius * Math.cos(angleRad);
                        const cy = absCenterY + radius * Math.sin(angleRad);
                        const fillColor = managerRef.getGradientColor(valuePct, stops);

                        if (!chart.customCircle) {
                            chart.customCircle = chart.renderer.circle(cx, cy, 5)
                                    .attr({
                                        fill: '#fff',
                                        stroke: fillColor,
                                        'stroke-width': 3,
                                        zIndex: 10
                                    })
                                    .add();
                        } else {
                            chart.customCircle.attr({
                                cx,
                                cy,
                                stroke: fillColor
                            });
                        }
                    }
                }
            },
            accessibility: {enabled: false},
            title: {text: null},
            credits: {enabled: false},
            tooltip: {enabled: false},
            pane: {
                center: ['50%', '70%'],
                size: '150%',
                startAngle: -120,
                endAngle: 120,
                background: [{
                    backgroundColor: {
                        linearGradient: {x1: 0, y1: 0, x2: 0, y2: 1},
                        stops: [[0, '#EEE'], [1, '#FFF']]
                    },
                    borderRadius: 20,
                    borderWidth: 0,
                    outerRadius: '100%',
                    innerRadius: '80%',
                    shape: 'arc'
                }]
            },
            yAxis: {
                min: axisMin,
                max: axisMax,
                lineWidth: 0,
                tickPosition: 'inside',
                tickColor: '#FFFFFF',
                tickWidth: 2,
                minorTickInterval: null,
                labels: {enabled: false},
                plotBands: [{
                    from: axisMin,
                    to: axisMax,
                    innerRadius: '80%',
                    outerRadius: '100%',
                    color: {
                        linearGradient: {x1: 0, y1: 0, x2: 1, y2: 0},
                        stops: stops
                    },
                    borderRadius: '50%'
                }]
            },
            series: [{
                name: type.toUpperCase(),
                type: 'gauge',
                data: [initialValue],
                dial: {
                    radius: '0%',
                    backgroundColor: '#5cd4ff',
                    borderColor: '#41a6d9',
                    borderWidth: 0,
                    baseWidth: 0,
                    topWidth: 1,
                    baseLength: '0%',
                    rearLength: '0%',
                },
                pivot: {
                    backgroundColor: '#41a6d9',
                    radius: 0
                },
                dataLabels: {
                    formatter: function () {
                        const decimals = type === 'noise' ? 2 : 1;
                        const format = new Intl.NumberFormat('en-EN', {
                            style: 'decimal',
                            minimumFractionDigits: decimals,
                            maximumFractionDigits: decimals
                        });
                        return `
                          <div class="font-bold text-[14px] leading-[2px]">${format.format(this.y)}</div><br>
                          <div class="font-normal text-[10px] leading-[2px] mb-2">${unitMap[type]}</div>
                        `;
                    },
                    borderWidth: 0,
                    color: '#333',
                    useHTML: true,
                    y: 5
                }
            }]
        });

        this.chartInstances.set(`${cardId}-${type}`, chart);
    }

    private getTickIntervalByDuration(startTimestamp: number, endTimestamp: number, dataPointCount?: number): number {
        const durationHours = (endTimestamp - startTimestamp) / (1000 * 60 * 60);

        console.log("durationHours", durationHours);
        console.log("dataPointCount", dataPointCount);

        // Untuk data forecast (biasanya 24 data point untuk 24 jam)
        // Kita ingin menampilkan sekitar 4-8 label di x-axis

        if (durationHours <= 2) {
            return 15 * 60 * 1000; // 15 menit untuk data <= 2 jam
        } else if (durationHours <= 6) {
            return 30 * 60 * 1000; // 30 menit untuk data <= 6 jam
        } else if (durationHours <= 12) {
            // Untuk forecast 12 jam, interval 3 jam
            // Akan ada 4 label: 0h, 3h, 6h, 9h, 12h
            return 3 * 60 * 60 * 1000; // 3 jam
        } else if (durationHours <= 24) {
            // Untuk data 24 jam, interval 3 jam
            // Akan ada 8 label: 0h, 3h, 6h, 9h, 12h, 15h, 18h, 21h, 24h
            return 3 * 60 * 60 * 1000; // 3 jam
        } else if (durationHours <= 48) {
            // Untuk data 48 jam, interval 6 jam
            // Akan ada 8 label
            return 6 * 60 * 60 * 1000; // 6 jam
        } else {
            // Untuk data > 48 jam, interval 12 jam
            return 12 * 60 * 60 * 1000; // 12 jam
        }
    }

    private createAirIndexChart(element: HTMLElement, data: Array<{
        timestamp: number;
        value: number;
        value_tsp: number;
        pm25: number;
        pm10: number;
        tsp: number;
        aqi_from: string;
        category?: string;
    }>, cardId: string): void {
        if (!this.options.enableCharts || typeof Highcharts === 'undefined') {
            return;
        }

        const managerInstance = this;
        const platform = this.platforms.find(p => `card-${p.uid}-${this.getPlatformIndex(p.uid)}` === cardId);
        const platformTimezone = platform?.timezone || 'Asia/Jakarta';
        const platformLocale = platform?.locale || 'id-ID';

        // Default Metric Data TSP
        const currentSource = this.currentAQISource.get(cardId) || 'tsp';
        const currentMode = this.currentDataMode.get(cardId) || 'realtime';

        const processedData = data.map(item => {
            const aqiValue = currentSource === 'pm25_pm10' ? item.value : item.value_tsp;
            return {
                x: item.timestamp * 1000,
                y: aqiValue,
                timestamp: item.timestamp,
                marker: {
                    lineWidth: 2,
                    lineColor: 'white',
                    fillColor: this.getAQIColor(aqiValue),
                    radius: 0,
                    symbol: 'circle'
                },
                aqi_from: currentSource === 'tsp' ? `TSP: ${item.tsp} µg/m³` : item.aqi_from,
                category: item.category ?? 'Unknown'
            };
        });

        const yValues = processedData.map(point => point.y);
        const dataMinY = Math.min(...yValues);
        const dataMaxY = Math.max(...yValues);

        const minY = Math.min(0, dataMinY);
        let maxY: number;
        if (dataMaxY <= 50) {
            maxY = Math.max(50, dataMaxY + 5);
        } else if (dataMaxY <= 100) {
            maxY = Math.max(100, dataMaxY + 10);
        } else if (dataMaxY <= 150) {
            maxY = Math.max(150, dataMaxY + 10);
        } else {
            maxY = Math.max(300, dataMaxY + 20);
        }

        const gradient = createSmoothGradient(minY, maxY);

        let tickInterval = 3600 * 1000; // Default 1 jam
        if (processedData.length > 0) {
            const timestamps = processedData.map(point => point.x).sort((a, b) => a - b);
            const startTime = timestamps[0];
            const endTime = timestamps[timestamps.length - 1];
            tickInterval = this.getTickIntervalByDuration(startTime, endTime);
        }

        const chart = Highcharts.chart({
            chart: {
                renderTo: element,
                type: 'areaspline',
                marginLeft: 45,
                height: 150,
                style: {
                    fontFamily: 'Arial, sans-serif'
                }
            },
            title: {text: null},
            lang: {
                noData: "No AQI data available"
            },
            credits: {enabled: false},
            xAxis: {
                type: 'datetime',
                labels: {
                    formatter: function () {
                        const timestampMs = this.value as number;
                        const timestampSeconds = timestampMs / 1000;
                        return managerInstance.safeFormatTimestamp(timestampSeconds, 'time', platformTimezone, platformLocale);
                    },
                    style: {
                        fontSize: '10px',
                        color: '#999'
                    }
                },
                lineWidth: 0,
                tickWidth: 0,
                gridLineWidth: 0,
                gridLineColor: '#eee',
                gridLineDashStyle: 'Dash',
                tickInterval: tickInterval,
            },
            yAxis: {
                title: {
                    text: null
                },
                labels: {
                    enabled: true,
                    style: {
                        fontSize: '10px',
                        color: '#666'
                    }
                },
                gridLineWidth: 1,
                gridLineColor: '#eee',
                gridLineDashStyle: 'Dash',
                min: minY,
                max: dataMaxY,
            },
            legend: {enabled: false},
            tooltip: {
                backgroundColor: 'white',
                borderWidth: 0,
                borderRadius: 8,
                shadow: true,
                style: {fontSize: '12px'},
                formatter: function () {
                    const {aqi_from, options} = this as any;
                    const timestampMs = this.x;
                    const timestampSeconds = timestampMs / 1000;
                    const formattedTime = managerInstance.safeFormatTimestamp(timestampSeconds, 'datetime', platformTimezone, platformLocale, true);
                    const timezoneShort = platformTimezone.split('/')[1] || platformTimezone;

                    if (currentMode === 'realtime') {
                        return `<b>Time (${timezoneShort}):</b> ${formattedTime}<br><b>AQI:</b> ${this.y} (${aqi_from})`;
                    } else {
                        return `<b>Time (${timezoneShort}):</b> ${formattedTime}<br><b>AQI:</b> ${this.y} (${aqi_from})<br>${options.category}`;
                    }
                }
            },
            plotOptions: {
                areaspline: {
                    lineWidth: 1,
                    lineColor: 'transparent',
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
                    },
                    threshold: minY
                }
            },
            series: [{
                type: 'areaspline',
                name: currentSource === 'pm25_pm10' ? 'AQI (PM2.5/PM10)' : 'AQI (TSP)',
                data: processedData,
                fillColor: gradient,
            }]
        });

        this.chartInstances.set(`${cardId}-airIndex`, chart);
    }

    private updateChartValue(cardId: string, chartType: 'pm10' | 'pm25' | 'tsp' | 'noise' | 'temp' | 'mmhg' | 'humidity' | 'pm25_raw' | 'pm10_raw' | 'tsp_raw', newValue: number): void {
        const chartKey = `${cardId}-${chartType}`;
        const chart = this.chartInstances.get(chartKey);

        if (chart && chart.series && chart.series[0]) {
            const series = chart.series[0];
            const currentValue = series.points[0].y;
            let step = 0;
            const steps = 30;

            const interval = setInterval(() => {
                step++;
                const interpolated = currentValue + (newValue - currentValue) * (step / steps);
                series.points[0].update(interpolated, true, false);

                if (step >= steps) {
                    clearInterval(interval);
                    series.setData([newValue], true, {duration: 0});
                }
            }, 1000 / steps);
        }
    }

    private updateAirIndexChart(cardId: string, airIndexData: Array<{
        timestamp: number;
        value: number;
        value_tsp: number;
        pm25: number;
        pm10: number;
        tsp: number;
        aqi_from: string;
        link_video_recorded?: string;
        category?: string;
    }>): void {
        const chartKey = `${cardId}-airIndex`;
        const chart = this.chartInstances.get(chartKey);

        if (chart && chart.series && chart.series[0]) {
            const currentSource = this.currentAQISource.get(cardId) || 'tsp';
            const currentMode = this.currentDataMode.get(cardId) || 'realtime';

            // ✅ Simpan reference untuk digunakan di formatter
            const managerInstance = this;
            const platform = this.platforms.find(p => `card-${p.uid}-${this.getPlatformIndex(p.uid)}` === cardId);
            const platformTimezone = platform?.timezone || 'Asia/Jakarta';
            const platformLocale = platform?.locale || 'id-ID';

            const chartData = airIndexData.map((item, index) => {
                const markerColor = this.getAQIColor(item.value);
                const isLastPoint = index === airIndexData.length - 1;
                const isHighValue = item.value > 50;
                const linkVideoPoint = this.getVideoLinkForPoint(cardId, item.timestamp * 1000);

                let aqiFromText = '';
                if (currentMode === 'forecast') {
                    // For forecast mode, use dominant pollutant info
                    aqiFromText = item.aqi_from || 'PM2.5';
                } else {
                    // For realtime mode, use existing logic
                    aqiFromText = currentSource === 'tsp' ? `TSP: ${item.tsp} µg/m³` : item.aqi_from;
                }

                if (linkVideoPoint.linkVideoRecorded) {
                    if (currentSource === 'tsp') {
                        return {
                            x: item.timestamp * 1000,
                            y: item.value_tsp,
                            timestamp: item.timestamp,
                            aqi_from: aqiFromText,
                            category: item.category ?? 'Unknown',
                            marker: (isHighValue && linkVideoPoint.linkVideoRecorded) ? {
                                enabled: true,
                                radius: 6,
                                fillColor: markerColor,
                                lineWidth: 2,
                                lineColor: 'white'
                            } : {
                                enabled: false,
                                radius: 0
                            },
                            events: {
                                click: (event: any) => {
                                    if (isHighValue) {
                                        if (this.options.onClickAirIndexPoint) {
                                            this.options.onClickAirIndexPoint(event, {
                                                cardId,
                                                timestamp: item.timestamp,
                                                value: item.value_tsp,
                                                pointIndex: index,
                                                isLastPoint,
                                                isHighValue,
                                                formattedDate: new Date(item.timestamp * 1000).toLocaleDateString(),
                                                formattedTime: new Date(item.timestamp * 1000).toLocaleTimeString(),
                                                linkVideo: linkVideoPoint
                                            });
                                        }
                                    }
                                }
                            }
                        };
                    } else {
                        return {
                            x: item.timestamp * 1000,
                            y: currentSource === 'pm25_pm10' ? item.value : item.value_tsp,
                            timestamp: item.timestamp,
                            aqi_from: aqiFromText,
                            category: item.category ?? 'Unknown',
                            marker: {
                                enabled: false,
                                radius: 0
                            }
                        }
                    }
                } else {
                    return {
                        x: item.timestamp * 1000,
                        y: currentSource === 'pm25_pm10' ? item.value : item.value_tsp,
                        timestamp: item.timestamp,
                        aqi_from: aqiFromText,
                        category: item.category ?? 'Unknown',
                        marker: {
                            enabled: false,
                            radius: 0
                        }
                    }
                }
            });

            const yValues = chartData.map(item => item.y);
            const minY = Math.min(0, Math.min(...yValues));
            const maxY = Math.max(100, Math.max(...yValues));
            const newGradient = createSmoothGradient(minY, maxY);

            // ✅ Update tickInterval
            let newTickInterval = 3600 * 1000; // Default 1 jam
            if (chartData.length > 0) {
                const timestamps = chartData.map(point => point.x).sort((a, b) => a - b);
                const startTime = timestamps[0];
                const endTime = timestamps[timestamps.length - 1];
                newTickInterval = this.getTickIntervalByDuration(startTime, endTime);
            }

            const seriesName = currentMode === 'forecast'
                    ? 'AQI Forecast'
                    : (currentSource === 'pm25_pm10' ? 'AQI (PM2.5/PM10)' : 'AQI (TSP)');

            // ✅ Update chart dengan satu kali redraw
            chart.update({
                tooltip: {
                    backgroundColor: 'white',
                    borderWidth: 0,
                    borderRadius: 8,
                    shadow: true,
                    style: { fontSize: '12px' },
                    formatter: function () {
                        const point = this as any;
                        const timestampMs = this.x;
                        const timestampSeconds = timestampMs / 1000;
                        const formattedTime = managerInstance.safeFormatTimestamp(
                                timestampSeconds,
                                'datetime',
                                platformTimezone,
                                platformLocale,
                                true
                        );
                        const timezoneShort = platformTimezone.split('/')[1] || platformTimezone;

                        // Build tooltip content
                        let tooltipContent = `<b>Time (${timezoneShort}):</b> ${formattedTime}<br>`;
                        tooltipContent += `<b>AQI:</b> ${this.y}`;

                        // Add pollutant info
                        if (point.aqi_from) {
                            tooltipContent += ` (${point.aqi_from})`;
                        }

                        // Add category if in forecast mode
                        if (currentMode === 'forecast' && point.options) {
                            tooltipContent += `<br><b>Category:</b> ${point.options.category}`;
                        }

                        return tooltipContent;
                    }
                },
                xAxis: {
                    tickInterval: newTickInterval
                }
            }, false); // false = jangan redraw dulu

            // Update series
            const series = chart.series[0];
            series.update({
                name: seriesName,
                data: chartData,
                fillColor: newGradient
            }, false); // false = jangan redraw dulu

            // Update yAxis
            chart.yAxis[0].setExtremes(minY, maxY, false); // false = jangan redraw dulu

            chart.redraw();
        }
    }

    // region Get Video Link for Point
    private getVideoLinkForPoint(cardId: string, timestamp: number): {
        uid: string,
        linkVideoId: string,
        linkVideoStatus: string,
        linkVideoRecorded: string
    } {
        const cardData = this.platforms.find(p => `card-${p.uid}-${this.getPlatformIndex(p.uid)}` === cardId);
        const cardDataPoint = cardData.data.airIndexData?.find(point => point.timestamp === (timestamp / 1000))
        return {
            uid: cardData?.uid,
            linkVideoId: cardDataPoint?.link_video_id,
            linkVideoStatus: cardDataPoint?.link_video_status,
            linkVideoRecorded: cardDataPoint?.link_video_recorded
        };
    }

    // endregion

    private filterAirIndexSource(cardId: string, sourceType: 'pm25_pm10' | 'tsp'): void {
        this.currentAQISource.set(cardId, sourceType);

        const platform = this.platforms.find(p => `card-${p.uid}-${this.getPlatformIndex(p.uid)}` === cardId);
        if (!platform || !platform.data || !platform.data.airIndexData) return;

        this.updateAirIndexChart(cardId, platform.data.airIndexData);
        console.log(`🔄 Updated AQI chart for ${cardId} to use ${sourceType} source`);
    }

    private getGradientColor(valuePct: number, stops: [number, string][]): string {
        for (let i = 1; i < stops.length; i++) {
            const [prevStop, prevColor] = stops[i - 1];
            const [nextStop, nextColor] = stops[i];
            if (valuePct <= nextStop) {
                const ratio = (valuePct - prevStop) / (nextStop - prevStop);
                return this.interpolateColor(prevColor, nextColor, ratio);
            }
        }
        return stops[stops.length - 1][1];
    }

    private interpolateColor(color1: string, color2: string, factor: number): string {
        const c1 = this.hexToRgb(color1);
        const c2 = this.hexToRgb(color2);
        const r = Math.round(c1.r + (c2.r - c1.r) * factor);
        const g = Math.round(c1.g + (c2.g - c1.g) * factor);
        const b = Math.round(c1.b + (c2.b - c1.b) * factor);
        return `rgb(${r}, ${g}, ${b})`;
    }

    private hexToRgb(hex: string): { r: number; g: number; b: number } {
        const value = hex.replace('#', '');
        const bigint = parseInt(value, 16);
        return {
            r: (bigint >> 16) & 255,
            g: (bigint >> 8) & 255,
            b: bigint & 255
        };
    }

    private getAQIColor(aqiValue: number): string {
        const categories = [
            {min: 0, max: 49, color: '#22C55E'},      // Baik
            {min: 50, max: 100, color: '#EAB308'},    // Sedang
            {min: 101, max: 150, color: '#F97316'},   // Tidak sehat sensitif
            {min: 151, max: 200, color: '#EF4444'},   // Tidak sehat
            {min: 201, max: 300, color: '#DC2626'},   // Sangat tidak sehat
            {min: 301, max: 500, color: '#B91C1C'},   // Berbahaya
        ];

        const category = categories.find(cat => aqiValue >= cat.min && aqiValue <= cat.max);
        return category ? category.color : '#7F1D1D'; // Default untuk >500
    }

    private isValidTimestamp(timestamp: number | undefined | null): boolean {
        return timestamp !== undefined &&
                timestamp !== null &&
                !isNaN(timestamp) &&
                isFinite(timestamp) &&
                timestamp > 0;
    }

    private isValidDate(date: Date | undefined | null): boolean {
        return date instanceof Date &&
                !isNaN(date.getTime()) &&
                isFinite(date.getTime());
    }

    private safeFormatTimestamp(timestamp: number | undefined | null, format: 'time' | 'datetime' = 'time', timezone: string = 'Asia/Jakarta', locale: string = 'id-ID', useSecond: boolean = false): string {
        if (!this.isValidTimestamp(timestamp)) {
            return format === 'time' ? '--:--' : 'Invalid Date';
        }

        try {
            const date = new Date(timestamp! * 1000);

            if (!this.isValidDate(date)) {
                return format === 'time' ? '--:--' : 'Invalid Date';
            }

            if (format === 'time') {
                const dateOptions: Intl.DateTimeFormatOptions = {
                    timeZone: timezone,
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                };

                if (useSecond) {
                    dateOptions.second = '2-digit';
                }

                return new Intl.DateTimeFormat(locale, dateOptions).format(date);
            } else {
                const dateOptions: Intl.DateTimeFormatOptions = {
                    timeZone: timezone,
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                };

                if (useSecond) {
                    dateOptions.second = '2-digit';
                }

                return new Intl.DateTimeFormat(locale, dateOptions).format(date);
            }
        } catch (error) {
            console.warn('Error formatting timestamp:', error);
            return format === 'time' ? '--:--' : 'Invalid Date';
        }
    }

    private safeFormatDate(date: Date | undefined | null, timezone: string = 'Asia/Jakarta', locale: string = 'id-ID'): string {
        if (!this.isValidDate(date)) {
            return 'Invalid Date';
        }

        try {
            return new Intl.DateTimeFormat(locale, {
                timeZone: timezone,
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            }).format(date!);
        } catch (error) {
            console.warn('Error formatting date:', error);
            return 'Invalid Date';
        }
    }

    // endregion

    // region Public API Methods
    public async filter(options: FilterOptions) {

        this.stopRealTimeUpdates();
        this.convertAllCardsToSkeleton();
        const dataPromises = this.platforms.map(platform =>
                this.loadPlatformData(platform.uid, options)
        );

        try {
            await Promise.allSettled(dataPromises);
            console.log('✅ Finished loading all platform data');

            if (this.options.onDataUpdate) {
                this.options.onDataUpdate(this.platforms);
            }

        } catch (error) {
            console.error('❌ Error loading platform data:', error);
        } finally {
            this.startRealTimeUpdates();
        }
    }

    public async refreshAllData(): Promise<void> {
        console.log('🔄 Refreshing all platform data...');
        await this.loadAllPlatformData();
    }

    public async refreshPlatformData(uid: string): Promise<void> {
        console.log(`🔄 Refreshing data for platform ${uid}...`);
        await this.loadPlatformData(uid);
    }

    public restartRealTimeUpdates(): void {
        console.log('🔄 Restarting real-time updates...');

        // Stop existing real-time updates
        this.stopRealTimeUpdates();

        // Start again dengan pengecekan kondisi terbaru
        if (this.options.realTimeUpdateInterval) {
            setTimeout(() => {
                this.startRealTimeUpdates();
            }, 1000); // Delay 1 detik untuk memastikan URL sudah terupdate
        }
    }

    public checkAndRestartRealTime(): void {
        console.log('🔍 Manual check for real-time updates condition');

        if (this.shouldEnableRealTimeUpdates()) {
            if (!this.isRealTimeActive) {
                console.log('✅ Starting real-time updates');
                this.startRealTimeUpdates();
            } else {
                console.log('ℹ️ Real-time updates already active');
            }
        } else {
            if (this.isRealTimeActive) {
                console.log('⏸️ Stopping real-time updates');
                this.stopRealTimeUpdates();
            } else {
                console.log('ℹ️ Real-time updates already inactive');
            }
        }
    }

    public startRealTimeMode(): void {
        if (this.options.realTimeUpdateInterval) {
            this.startRealTimeUpdates();
        }

        if (this.options.enableSocketIO && this.options.socketIOUrl) {
            this.initSocketIO();
        }
    }

    public stopRealTimeMode(): void {
        this.stopRealTimeUpdates();

        if (this.socket) {
            this.socket.disconnect();
            this.socket = undefined;
        }
    }

    public getConnectionStatus(): 'connected' | 'disconnected' | 'error' {
        return this.connectionStatus;
    }

    public getLastUpdateTime(): Date {
        return this.lastUpdateTime;
    }

    public getPlatformCount(): number {
        return this.platforms.length;
    }

    public getLoadedPlatformCount(): number {
        return this.platforms.filter(p => p.isDataLoaded).length;
    }

    public getPlatformInfo(uid: string): CombinedPlatformData | undefined {
        return this.platforms.find(p => p.uid === uid);
    }

    public getAllPlatforms(): CombinedPlatformData[] {
        return [...this.platforms];
    }

    public emitToServer(event: string, data: any): void {
        if (this.socket && this.socket.connected) {
            this.socket.emit(event, data);
            console.log(`📤 Emitted event '${event}' to server:`, data);
        } else {
            console.warn(`⚠️ Socket.IO not connected. Cannot emit event: ${event}`);
        }
    }

    public getSocketId(): string | undefined {
        return this.socket?.id;
    }

    public isSocketConnected(): boolean {
        return this.socket?.connected || false;
    }

    public setContainer(container: HTMLElement | string): void {
        this.container = typeof container === 'string'
                ? document.querySelector(container)
                : container;
    }

    public destroy(): void {
        console.log('🗑️ Destroying Platform Skeleton Manager...');

        this.stopRealTimeMode();

        // Clear all chart instances
        this.chartInstances.forEach(chart => {
            if (chart && chart.destroy) {
                chart.destroy();
            }
        });
        this.chartInstances.clear();

        // Clear container
        if (this.container) {
            this.container.innerHTML = '';
        }

        // Clear data
        this.platforms = [];
        this.dataCache.clear();
        this.loadingStates.clear();
        this.currentAQISource.clear();

        console.log('✅ Platform Skeleton Manager destroyed');
    }

    // endregion
}

export {
    PlatformSkeletonManager,
    type PlatformInfo,
    type PlatformData,
    type CombinedPlatformData,
    type CameraData,
    type MetricsData,
    type LoggerEventData,
    type PlatformSkeletonManagerOptions
};
