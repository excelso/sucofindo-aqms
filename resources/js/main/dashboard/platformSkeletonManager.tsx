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
import moment from "moment";

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

        history.pushState = function(...args) {
            originalPushState.apply(history, args);
            setTimeout(() => {
                console.log('🔄 URL changed via pushState');
                // Trigger URL change handling jika diperlukan
            }, 100);
        };

        history.replaceState = function(...args) {
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

        // Skeleton metrics section
        const metricsContainer = this.createElement('div', 'mt-4');
        const metricsGrid = this.createElement('div', 'grid grid-cols-4 gap-2');

        const metricTypes = ['PM2.5', 'PM10', 'TSP', 'Noise'];
        metricTypes.forEach(metricTitle => {
            const metricCard = this.createElement('div', 'border rounded-md');
            const titleDiv = this.createElement('div', 'font-bold text-[12px] m-2 mb-2', metricTitle);
            const skeletonChart = this.createElement('div', 'skeleton-box skeleton-metric w-[78px] h-16 bg-gray-200 animate-pulse rounded mx-2 mb-2');

            metricCard.appendChild(titleDiv);
            metricCard.appendChild(skeletonChart);
            metricsGrid.appendChild(metricCard);
        });

        metricsContainer.appendChild(metricsGrid);

        // Skeleton AirIndex section
        const airIndexSection = this.createElement('div', 'mt-4');
        const airIndexTitle = this.createElement('div', 'font-bold text-[14px]', 'Air Quality Index');
        const airIndexSubTitle = this.createElement('div', 'text-[11px] mb-4 flex items-center gap-2');
        const skeletonDropdown = this.createElement('div', 'skeleton-box w-32 h-4 rounded bg-gray-200 animate-pulse');
        airIndexSubTitle.appendChild(skeletonDropdown);

        const skeletonAirIndexChart = this.createElement('div', 'skeleton-box w-full h-32 bg-gray-200 animate-pulse rounded');

        airIndexSection.appendChild(airIndexTitle);
        airIndexSection.appendChild(airIndexSubTitle);
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
                unit: 'dbA'
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
                    this.createGaugeChart(data.uid, chartDiv, metric.title, metric.type, metric.bml_min, metric.bml_max, metric.value, cardId, metricCard as HTMLElement);
                }, 100);
            }
        });
    }
    // endregion

    // region Update Air Index From Skeleton
    private updateAirIndexFromSkeleton(cardElement: HTMLElement, data: PlatformData, cardId: string): void {
        // Update dropdown
        const skeletonDropdown = cardElement.querySelector('.skeleton-box.w-32.h-4');
        if (skeletonDropdown) {
            const ddWrap = this.createElement('div', 'relative');
            const ddButton = this.createElement('button', 'inline-flex items-center gap-1 text-xs hover:bg-gray-50 dark:hover:bg-gray-800') as HTMLButtonElement;
            ddButton.id = `${cardId}-dropdownButton`;
            ddButton.type = 'button';
            ddButton.innerHTML = `
                <span class="subText">Based on TSP</span>
                <svg class="w-3 h-3" aria-hidden="true" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clip-rule="evenodd"/>
                </svg>
            `;

            const ddMenu = this.createElement('div', 'z-10 hidden bg-white divide-y divide-gray-100 rounded-lg shadow w-44 dark:bg-gray-700') as HTMLDivElement;
            ddMenu.id = `${cardId}-dropdownMenu`;
            ddMenu.setAttribute('aria-labelledby', ddButton.id);

            const menuList = document.createElement('ul');
            menuList.className = 'py-2 text-sm text-gray-700 dark:text-gray-200';
            menuList.setAttribute('role', 'menu');

            const makeItem = (label: string, value: 'pm25_pm10' | 'tsp') => {
                const li = document.createElement('li');
                const a = document.createElement('a');
                a.href = '#';
                a.className = 'block px-4 py-2 text-[12px] hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white';
                a.textContent = label;
                a.addEventListener('click', (e) => {
                    e.preventDefault();
                    const subText = ddButton.querySelector('.subText');
                    if (value === 'pm25_pm10') subText!.textContent = 'Based on PM 2.5 / PM 10';
                    if (value === 'tsp') subText!.textContent = 'Based on TSP';

                    this.filterAirIndexSource(cardId, value);
                    dropdown.hide();
                });
                li.appendChild(a);
                return li;
            };

            menuList.appendChild(makeItem('PM 2.5 / PM 10', 'pm25_pm10'));
            menuList.appendChild(makeItem('TSP', 'tsp'));
            ddMenu.appendChild(menuList);

            ddWrap.appendChild(ddButton);
            ddWrap.appendChild(ddMenu);

            const ddOptions: DropdownOptions = {
                placement: 'bottom-end',
                triggerType: 'click',
                offsetSkidding: 100,
                offsetDistance: 8,
                delay: 150,
            };

            const instanceOptions: InstanceOptions = {
                id: ddMenu.id,
                override: true
            };

            const dropdown: DropdownInterface = new Dropdown(ddMenu, ddButton, ddOptions, instanceOptions);

            skeletonDropdown.parentNode?.replaceChild(ddWrap, skeletonDropdown);
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
                this.createAirIndexChart(airIndexChart, data.airIndexData || [], cardId);
                this.updateAirIndexChart(cardId, data.airIndexData || [])
            }, 200);
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
        const metricCharts = cardElement.querySelectorAll('.chart-pm25, .chart-pm10, .chart-tsp, .chart-noise');
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
        const chartKeys = [`${cardId}-pm25`, `${cardId}-pm10`, `${cardId}-tsp`, `${cardId}-noise`, `${cardId}-airIndex`];
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
                }
            };
        }

        // Update air index data if provided
        if (loggerData.airIndexData) {
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

        console.log(`📊 Updated platform ${loggerData.uid} with real-time logger data`);
    }
    // endregion

    // region Handle Bulk Data Update
    private handleBulkDataUpdate(bulkData: PlatformData[]): void {
        bulkData.forEach(newData => {
            const platform = this.platforms.find(p => p.uid === newData.uid);
            if (platform && platform.data) {
                const oldData = {...platform.data};
                platform.data = {
                    ...newData,
                    lastUpdated: newData.lastUpdated ? new Date(newData.lastUpdated) : new Date()
                };

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

        console.log(`🎨 Updating card UI for ${uid}`, { oldData, newData });

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
            const cardId = `card-${uid}-${this.getPlatformIndex(uid)}`;

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
        }

        // Update air index chart if data has changed
        if (this.hasAirIndexDataChanged(oldData.airIndexData, newData.airIndexData)) {
            const cardId = `card-${uid}-${this.getPlatformIndex(uid)}`;
            this.updateAirIndexChart(cardId, newData.airIndexData || []);
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
    private createGaugeChart(uid: string, element: HTMLElement, title: string, type: 'pm10' | 'pm25' | 'tsp' | 'noise', bml_min: number, bml_max: number, initialValue: number, cardId: string, metricCard: HTMLElement): void {
        if (!this.options.enableCharts || typeof Highcharts === 'undefined') {
            return;
        }

        const stops: [number, string][] = [
            [0, '#4CAF50'],
            [0.2, '#8BC34A'],
            [0.4, '#FFC107'],
            [0.6, '#FF9800'],
            [0.8, '#FF5722'],
            [1, '#F44336']
        ];

        const unitMap = {
            pm10: 'µg/m³',
            pm25: 'µg/m³',
            tsp: 'µg/m³',
            noise: 'dBA'
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
                min: 0,
                max: 100,
                lineWidth: 0,
                tickPosition: 'inside',
                tickColor: '#FFFFFF',
                tickWidth: 2,
                minorTickInterval: null,
                labels: {enabled: false},
                plotBands: [{
                    from: 0,
                    to: 100,
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

    private getTickIntervalByDuration(startTimestamp: number, endTimestamp: number): number {
        const durationHours = (endTimestamp - startTimestamp) / (1000 * 60 * 60);

        if (durationHours <= 2) {
            return 15 * 60 * 1000; // 15 menit untuk data <= 2 jam
        } else if (durationHours <= 6) {
            return 30 * 60 * 1000; // 30 menit untuk data <= 6 jam
        } else if (durationHours <= 12) {
            return 60 * 60 * 1000; // 1 jam untuk data <= 12 jam
        } else if (durationHours <= 24) {
            return 3600 * 3000; // 3 jam untuk data <= 24 jam
        } else if (durationHours <= 48) {
            return 4 * 60 * 60 * 1000; // 4 jam untuk data <= 48 jam
        } else {
            return 6 * 60 * 60 * 1000; // 6 jam untuk data > 48 jam
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
                    const {aqi_from} = this as any;
                    const timestampMs = this.x;
                    const timestampSeconds = timestampMs / 1000;
                    const formattedTime = managerInstance.safeFormatTimestamp(timestampSeconds, 'datetime', platformTimezone, platformLocale, true);
                    const timezoneShort = platformTimezone.split('/')[1] || platformTimezone;
                    return `<b>Time (${timezoneShort}):</b> ${formattedTime}<br><b>AQI:</b> ${this.y} (${aqi_from})`;
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

    private updateChartValue(cardId: string, chartType: 'pm10' | 'pm25' | 'tsp' | 'noise', newValue: number): void {
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
    }>): void {
        const chartKey = `${cardId}-airIndex`;
        const chart = this.chartInstances.get(chartKey);

        if (chart && chart.series && chart.series[0]) {
            const currentSource = this.currentAQISource.get(cardId) || 'tsp';

            const chartData = airIndexData.map((item, index) => {
                const markerColor = this.getAQIColor(item.value);
                const isLastPoint = index === airIndexData.length - 1;
                const isHighValue = item.value > 50;
                const linkVideoPoint = this.getVideoLinkForPoint(cardId, item.timestamp * 1000);
                const aqiFrom = currentSource === 'tsp' ? `TSP: ${item.tsp} µg/m³` : item.aqi_from;

                console.log('xxxx', currentSource)

                if (linkVideoPoint.linkVideoRecorded) {
                    if (currentSource === 'tsp') {
                        return {
                            x: item.timestamp * 1000,
                            y: item.value_tsp,
                            timestamp: item.timestamp,
                            aqi_from: aqiFrom,
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
                            aqi_from: aqiFrom,
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
                        aqi_from: aqiFrom,
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

            const series = chart.series[0];
            series.update({
                name: currentSource === 'pm25_pm10' ? 'AQI (PM2.5/PM10)' : 'AQI (TSP)',
                data: chartData,
                fillColor: newGradient
            }, true);

            chart.yAxis[0].setExtremes(minY, maxY, true);
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
