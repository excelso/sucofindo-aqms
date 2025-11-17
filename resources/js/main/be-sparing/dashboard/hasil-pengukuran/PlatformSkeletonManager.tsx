import Highcharts from 'highcharts'
import "highcharts/highcharts-more";
import "highcharts/modules/solid-gauge";
import "highcharts/modules/no-data-to-display";
import {Socket} from 'socket.io-client';
import type {DropdownInterface, DropdownOptions, InstanceOptions} from 'flowbite';
import {Dropdown} from 'flowbite';
import {getMetaContent, inArray} from "@/js/plugins/functions";

interface PaginationInfo {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    has_more: boolean;
}

interface PlatformInfo {
    uid: string;
    uid_alias: string;
    siteName: string;
    location?: string;
    timezone?: string;
    locale?: string;
    lat?: number;
    lng?: number;
    totalLogger?: number;
    tipeLogger?: number;
}

interface FilterOptions {
    date?: string; // Format: YYYY-MM-DD
    status_platform?: string;
    customer_lokasi_id?: string;
    isOnline?: boolean;
    uid?: string;
}

interface PlatformData {
    uid: string;
    status: string;
    tipe_logger: number;
    emoji?: string;
    colorCode?: string;
    isOnline: boolean;
    metrics?: {
        ph?: {
            value?: number,
            bml_min?: number,
            bml_min_buffer?: number,
            bml_max_buffer?: number,
            bml_max?: number
        };
        temperature?: {
            value?: number,
            bml_min?: number,
            bml_min_buffer?: number,
            bml_max_buffer?: number,
            bml_max?: number
        };
        tss?: {
            value?: number,
            bml_min?: number,
            bml_min_buffer?: number,
            bml_max_buffer?: number,
            bml_max?: number
        };
        debit?: {
            value?: number,
            bml_min?: number,
            bml_min_buffer?: number,
            bml_max_buffer?: number,
            bml_max?: number
        };
    };
    waterQualityData?: Array<{
        timestamp: number;
        ph?: number;
        temperature?: number;
        tss?: number;
        debit?: number;
        cod?: number;
        nh3n?: number;
    }>;
    lastUpdated?: Date;
}

interface CombinedPlatformData extends PlatformInfo {
    data?: PlatformData;
    isDataLoaded?: boolean;
    loadingError?: string;
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
    ph: number;
    temperature?: number;
    tss: number;
    debit: number;
    cod?: number;
    nh3n?: number;
    datetime_unix: number;
    waterQualityData?: Array<{
        timestamp: number;
        ph?: number;
        temperature?: number;
        tss?: number;
        debit?: number;
        cod?: number;
        nh3n?: number;
    }>;
}

interface PlatformSkeletonManagerOptions {
    containerSelector?: string;
    apiEndpoint?: string;
    apiEndpointData?: string;
    enableCharts?: boolean;
    realTimeUpdateInterval?: number;
    enablePagination?: boolean;
    itemsPerPage?: number;
    initialSkeletonCount?: number; // Jumlah skeleton saat pertama load
    onStatusClick?: (id: string) => void;
    onTableClick?: (id: string) => void;
    onMetricsClick?: (id: string, metrics: MetricsData) => void;
    onDataUpdate?: (updatedData: CombinedPlatformData[]) => void;
    onConnectionStatus?: (status: 'connected' | 'disconnected' | 'error') => void;
    onHeartbeatStatusClick?: (id: string) => void;
    onSiteLocationClick?: (id: string, lat: number, lng: number) => void;
    onLoadingStateChange?: (isLoading: boolean, uid?: string) => void;
}

type WaterQualitySourceType = 'ph_temp' | 'tss' | 'debit' | 'all';

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
    private currentWQSource: Map<string, WaterQualitySourceType> = new Map();
    private loadingStates: Map<string, boolean> = new Map();
    private paginationInfo: PaginationInfo | null = null;
    private currentPage: number = 1;
    private isLoadingMore: boolean = false;
    private observer: IntersectionObserver | null = null;
    private loadingElement: HTMLElement | null = null;
    private userLevel: string;
    // endregion

    // region Constructor
    constructor(options: PlatformSkeletonManagerOptions = {}) {
        this.options = {
            apiEndpoint: '/sparing/dashboard/hasil-pengukuran/data-platforms',
            apiEndpointData: '/sparing/dashboard/hasil-pengukuran/data-platforms/{uid}/data',
            enableCharts: true,
            realTimeUpdateInterval: 120000, // 2 Menit
            enablePagination: true,
            itemsPerPage: 10,
            initialSkeletonCount: 6, // 6 skeleton cards saat pertama load
            ...options
        };
        this.userLevel = getMetaContent('user-level');

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
            // Tampilkan 6 skeleton cards dulu
            this.renderInitialSkeletons();

            // Load platforms page 1 dengan pagination
            await this.loadPlatforms(1);

            // HANYA render ulang untuk page 1, jangan dipanggil lagi untuk page selanjutnya
            this.renderAllSkeletonCards();

            // Load data untuk setiap platform di page 1
            await this.loadAllPlatformData();

            // Setup Intersection Observer untuk pagination
            if (this.options.enablePagination) {
                this.setupIntersectionObserver();
            }

            // Start real-time updates
            if (this.options.realTimeUpdateInterval) {
                this.startRealTimeUpdates();
            }

        } catch (error) {
            console.error('Failed to initialize Platform Skeleton Manager:', error);
            this.showError('Failed to initialize platform manager');
        }
    }

    // endregion

    // region Render Initial Skeletons
    private renderInitialSkeletons(): void {
        if (!this.container) {
            console.error('Container not found');
            return;
        }

        this.container.innerHTML = '';

        const fragment = document.createDocumentFragment();
        const cardContainer = this.createElement('div', 'grid md:grid-cols-2 sm:grid-cols-1 grid-cols-3 gap-4');

        // Buat 6 skeleton placeholder
        const skeletonCount = this.options.initialSkeletonCount || 6;
        for (let i = 0; i < skeletonCount; i++) {
            const skeletonPlatform: CombinedPlatformData = {
                uid: `skeleton-${i}`,
                uid_alias: '...',
                siteName: '...',
                isDataLoaded: false
            };
            const card = this.createSkeletonCard(skeletonPlatform, i);
            cardContainer.appendChild(card);
        }

        fragment.appendChild(cardContainer);
        this.container.appendChild(fragment);

        console.log(`🎨 Rendered ${skeletonCount} initial skeleton cards`);
    }

    // endregion

    //region Handle Setup URL Change Listener
    private setupURLChangeListener(): void {
        window.addEventListener('popstate', () => {
            console.log('🔄 URL changed via browser navigation');
            this.handleURLChange();
        });

        const originalPushState = history.pushState;
        const originalReplaceState = history.replaceState;

        history.pushState = function (...args) {
            originalPushState.apply(history, args);
            setTimeout(() => {
                console.log('🔄 URL changed via pushState');
            }, 100);
        };

        history.replaceState = function (...args) {
            originalReplaceState.apply(history, args);
            setTimeout(() => {
                console.log('🔄 URL changed via replaceState');
            }, 100);
        };
    }

    //endregion

    // region Load Platforms
    private async loadPlatforms(page: number = 1, filterOptions?: FilterOptions): Promise<void> {
        if (!this.options.apiEndpoint) {
            throw new Error('apiEndpoint is required');
        }

        if (this.isLoadingMore && page > 1) {
            console.log('⏸️ Already loading more data...');
            return;
        }

        try {
            if (page > 1) {
                this.isLoadingMore = true;
                this.showLoadingIndicator();
            }

            console.log(`🔄 Loading platforms from API (Page ${page})...`);

            const url = new URL(this.options.apiEndpoint, window.location.origin);
            url.searchParams.set('page', page.toString());
            url.searchParams.set('per_page', (this.options.itemsPerPage || 10).toString());

            // ✅ Jika tidak ada filterOptions, baca dari URL params
            if (!filterOptions) {
                const urlParams = new URLSearchParams(window.location.search);

                // Konversi URL params ke FilterOptions
                filterOptions = {};

                if (urlParams.has('uid')) {
                    filterOptions.uid = urlParams.get('uid')!;
                }
                if (urlParams.has('date')) {
                    filterOptions.date = urlParams.get('date')!;
                }
                if (urlParams.has('status_platform')) {
                    filterOptions.status_platform = urlParams.get('status_platform')!;
                }
                if (urlParams.has('customer_lokasi_id')) {
                    filterOptions.customer_lokasi_id = urlParams.get('customer_lokasi_id')!;
                }
                if (urlParams.has('isOnline')) {
                    filterOptions.isOnline = urlParams.get('isOnline') === 'true';
                }
            }

            // ✅ Tambahkan filter parameters ke URL
            if (filterOptions) {
                if (filterOptions.uid) {
                    url.searchParams.set('uid', filterOptions.uid);
                }
                if (filterOptions.date) {
                    url.searchParams.set('date', filterOptions.date);
                }
                if (filterOptions.status_platform) {
                    url.searchParams.set('status_platform', filterOptions.status_platform);
                }
                if (filterOptions.customer_lokasi_id) {
                    url.searchParams.set('location', filterOptions.customer_lokasi_id);
                }
                if (filterOptions.isOnline !== undefined) {
                    url.searchParams.set('isOnline', filterOptions.isOnline.toString());
                }
            }

            console.log(`📡 API URL: ${url.toString()}`);

            const response = await fetch(url.toString());

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            const platformList: PlatformInfo[] = result.data || [];
            this.paginationInfo = result.pagination || null;

            // Jika page 1, replace semua platforms
            if (page === 1) {
                this.platforms = platformList.map(platform => ({
                    ...platform,
                    isDataLoaded: false,
                    data: undefined,
                    loadingError: undefined
                }));
            } else {
                // Jika page > 1, append ke existing platforms
                const newPlatforms = platformList.map(platform => ({
                    ...platform,
                    isDataLoaded: false,
                    data: undefined,
                    loadingError: undefined
                }));
                this.platforms = [...this.platforms, ...newPlatforms];
            }

            console.log(`✅ Loaded ${platformList.length} platforms (Total: ${this.platforms.length})`);

            if (this.paginationInfo) {
                console.log(`📄 Page ${this.paginationInfo.current_page} of ${this.paginationInfo.last_page}`);
            }

        } catch (error) {
            console.error('❌ Error loading platforms:', error);
            throw error;
        } finally {
            if (page > 1) {
                this.isLoadingMore = false;
                this.hideLoadingIndicator();
            }
        }
    }
    // endregion

    // region Render All Skeleton Cards
    private renderAllSkeletonCards(): void {
        if (!this.container) {
            console.error('Container not found');
            return;
        }

        // Clear container termasuk skeleton awal
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

        // ✅ Add loading indicator untuk pagination (tapi jangan panggil setupIntersectionObserver di sini)
        if (this.options.enablePagination && this.paginationInfo?.has_more) {
            this.addLoadingIndicator();
        }

        console.log(`🎨 Rendered ${this.platforms.length} skeleton cards`);
    }
    // endregion

    // region Setup Intersection Observer
    private setupIntersectionObserver(): void {
        console.log('🔧 Setting up Intersection Observer...');

        // ✅ Disconnect existing observer first
        if (this.observer) {
            console.log('🔌 Disconnecting existing observer');
            this.observer.disconnect();
            this.observer = null;
        }

        // ✅ Pastikan loading element sudah ada
        this.loadingElement = this.container?.querySelector('.loading') || null;

        if (!this.loadingElement) {
            console.log('📦 Loading element not found, creating new one');
            this.addLoadingIndicator();
            this.loadingElement = this.container?.querySelector('.loading') || null;
        }

        if (!this.loadingElement) {
            console.error('❌ Failed to create loading element for intersection observer');
            return;
        }

        console.log('✅ Loading element found:', this.loadingElement);

        // Setup observer
        const options: IntersectionObserverInit = {
            root: null,
            rootMargin: '100px',
            threshold: 0.1
        };

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    console.log('👁️ Loading element is visible, triggering loadMorePlatforms');
                    this.loadMorePlatforms();
                }
            });
        }, options);

        this.observer.observe(this.loadingElement);

        console.log('✅ Intersection Observer setup complete');
        console.log('📊 Pagination info:', this.paginationInfo);
    }
    // endregion

    // region Load More Platforms
    private async loadMorePlatforms(): Promise<void> {
        // Cek apakah masih ada data
        if (!this.paginationInfo || !this.paginationInfo.has_more) {
            console.log('📭 No more platforms to load');
            this.hideLoadingIndicator();
            return;
        }

        // Cek apakah sedang loading
        if (this.isLoadingMore) {
            console.log('⏸️ Already loading more platforms');
            return;
        }

        try {
            console.log('📥 Loading more platforms...');

            const nextPage = this.currentPage + 1;

            // Load platforms berikutnya
            await this.loadPlatforms(nextPage);

            // Update current page
            this.currentPage = nextPage;

            // JANGAN PANGGIL renderAllSkeletonCards() lagi!
            // Hanya append card baru saja
            this.appendNewSkeletonCards();

            // Load data untuk platform baru SAJA
            const startIndex = (nextPage - 1) * (this.options.itemsPerPage || 10);
            const endIndex = startIndex + (this.options.itemsPerPage || 10);
            const newPlatforms = this.platforms.slice(startIndex, endIndex);

            console.log(`📦 Loading data for ${newPlatforms.length} new platforms (index ${startIndex} to ${endIndex})`);

            const dataPromises = newPlatforms.map(platform =>
                    this.loadPlatformData(platform.uid)
            );

            await Promise.allSettled(dataPromises);

            console.log('✅ Finished loading more platforms');

        } catch (error) {
            console.error('❌ Error loading more platforms:', error);
        }
    }

    // endregion

    // region Append New Skeleton Cards
    private appendNewSkeletonCards(): void {
        const cardContainer = this.container?.querySelector('.grid');
        if (!cardContainer) {
            console.warn('⚠️ Card container not found');
            return;
        }

        const startIndex = (this.currentPage - 1) * (this.options.itemsPerPage || 10);
        const endIndex = Math.min(startIndex + (this.options.itemsPerPage || 10), this.platforms.length);

        console.log(`🎨 Appending skeleton cards for platforms ${startIndex} to ${endIndex - 1}`);

        for (let i = startIndex; i < endIndex; i++) {
            const platform = this.platforms[i];

            // PENTING: Cek apakah card dengan UID ini sudah ada
            const existingCard = document.getElementById(`card-${platform.uid}-${i}`);
            if (existingCard) {
                console.warn(`⚠️ Card for ${platform.uid} (index ${i}) already exists, skipping`);
                continue;
            }

            const card = this.createSkeletonCard(platform, i);
            cardContainer.appendChild(card);
            console.log(`✅ Appended card for ${platform.uid} at index ${i}`);
        }

        console.log(`✅ Appended ${endIndex - startIndex} new skeleton cards`);
    }

    // endregion

    // region Add Loading Indicator
    private addLoadingIndicator(): void {
        // ✅ Cek apakah sudah ada di DOM
        const existingLoading = this.container?.querySelector('.loading');
        if (existingLoading) {
            this.loadingElement = existingLoading as HTMLElement;
            console.log('📦 Loading element already exists');
            return;
        }

        // Buat baru jika belum ada
        this.loadingElement = this.createElement('div', 'loading mt-10');
        this.loadingElement.innerHTML = `
            <div class="flex justify-center items-center">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span class="ml-2">Loading more data...</span>
            </div>
        `;

        this.container?.appendChild(this.loadingElement);
        console.log('✅ Loading element created');
    }
    // endregion

    // region Show/Hide Loading Indicator
    private showLoadingIndicator(): void {
        if (this.loadingElement) {
            this.loadingElement.classList.remove('hidden');
        }
    }

    private hideLoadingIndicator(): void {
        if (this.loadingElement && !this.paginationInfo?.has_more) {
            this.loadingElement.classList.add('hidden');
        }
    }

    // endregion

    // region Load All Platform Data
    private async loadAllPlatformData(filterOptions?: FilterOptions): Promise<void> {
        console.log('🔄 Loading data for all platforms...');

        // HANYA load data untuk platforms yang belum loaded
        const platformsToLoad = this.platforms.filter(p => !p.isDataLoaded);

        console.log(`📦 Loading data for ${platformsToLoad.length} platforms`);

        const dataPromises = platformsToLoad.map(platform =>
                this.loadPlatformData(platform.uid, filterOptions)
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

            platform.data = {
                ...platformData,
                lastUpdated: platformData.lastUpdated ? new Date(platformData.lastUpdated) : new Date()
            };
            platform.isDataLoaded = true;
            platform.loadingError = undefined;

            this.dataCache.set(uid, platform.data);

            const cardElement = document.getElementById(`card-${uid}-${this.getPlatformIndex(uid)}`);
            if (cardElement) {
                const hasSkeletonElements = cardElement.querySelectorAll('.skeleton-box').length > 0;

                if (hasSkeletonElements) {
                    this.updateCardFromSkeletonToData(uid, platform);
                } else {
                    if (oldData) {
                        this.updateCardUI(uid, oldData, platform.data);
                    } else {
                        this.updateCardFromSkeletonToData(uid, platform);
                    }
                }
            }

        } catch (error) {
            console.error(`❌ Error loading data for platform ${uid}:`, error);

            platform.loadingError = error.message || 'Failed to load data';
            platform.isDataLoaded = false;

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

        // if (platform.location) {
        //     const locationDiv = this.createElement('div', 'text-[12px] text-gray-500', platform.location);
        //     leftSection.appendChild(locationDiv);
        // }

        const statusContainer = this.createElement('div', 'status');

        // Skeleton status badge
        const skeletonBadge = this.createElement('div', 'skeleton-box w-20 h-6 rounded-full bg-gray-200 animate-pulse');

        // Skeleton online status
        const skeletonOnline = this.createElement('div', 'skeleton-box skeleton-online w-20 h-6 rounded-full bg-gray-200 animate-pulse');

        // Site info
        const siteContainer = this.createElement('div', 'flex items-center gap-2 text-[14px]');
        const siteIcon = this.createElement('i', 'fas fa-location-dot');
        const siteText = this.createElement('div');
        siteText.textContent = platform.location;
        siteContainer.appendChild(siteIcon);
        siteContainer.appendChild(siteText);

        statusContainer.appendChild(skeletonBadge);
        statusContainer.appendChild(skeletonOnline);
        statusContainer.appendChild(siteContainer);
        leftSection.appendChild(idTitle);
        leftSection.appendChild(statusContainer);

        // Right side - Table icon instead of CCTV
        const rightSection = this.createElement('div', 'right-section');
        const tableLink = this.createElement('a', 'cursor-pointer') as HTMLAnchorElement;
        const tableIcon = this.createElement('i', 'fas fa-table text-xl text-gray-600');
        tableLink.appendChild(tableIcon);
        rightSection.appendChild(tableLink);

        if (this.options.onTableClick) {
            tableLink.addEventListener('click', () => {
                this.options.onTableClick!(platform.uid);
            });
        }

        headerFlex.appendChild(leftSection);
        headerFlex.appendChild(rightSection);

        // Skeleton metrics section
        const metricsContainer = this.createElement('div', 'mt-4');
        const metricsGrid = this.createElement('div', 'grid grid-cols-4 gap-2');

        const metricTypes = ['pH', 'Temp', 'TSS', 'Debit'];
        metricTypes.forEach(metricTitle => {
            const metricCard = this.createElement('div', 'border rounded-md');
            const titleDiv = this.createElement('div', 'font-bold text-[12px] m-2 mb-2', metricTitle);
            const skeletonChart = this.createElement('div', 'skeleton-box skeleton-metric w-[78px] h-16 bg-gray-200 animate-pulse rounded mx-2 mb-2');

            metricCard.appendChild(titleDiv);
            metricCard.appendChild(skeletonChart);
            metricsGrid.appendChild(metricCard);
        });

        metricsContainer.appendChild(metricsGrid);

        // Skeleton Water Quality section
        const waterQualitySection = this.createElement('div', 'mt-4');
        const waterQualityTitle = this.createElement('div', 'font-bold text-[14px]', 'Water Quality Index');
        const waterQualitySubTitle = this.createElement('div', 'text-[11px] mb-4 flex items-center gap-2');
        const skeletonDropdown = this.createElement('div', 'skeleton-box w-32 h-4 rounded bg-gray-200 animate-pulse');
        waterQualitySubTitle.appendChild(skeletonDropdown);

        const skeletonWaterQualityChart = this.createElement('div', 'skeleton-box w-full h-32 bg-gray-200 animate-pulse rounded');

        waterQualitySection.appendChild(waterQualityTitle);
        waterQualitySection.appendChild(waterQualitySubTitle);
        waterQualitySection.appendChild(skeletonWaterQualityChart);

        // Skeleton last updated
        const skeletonLastUpdated = this.createElement('div', 'skeleton-box w-48 h-3 bg-gray-200 animate-pulse rounded mt-4');
        waterQualitySection.appendChild(skeletonLastUpdated);

        // Assemble card
        cardBody.appendChild(headerFlex);
        cardBody.appendChild(metricsContainer);
        cardBody.appendChild(waterQualitySection);
        card.appendChild(cardBody);

        const cardFooter = this.createElement('div', 'card-footer !bg-white');
        if (inArray(['super_admin', 'admin'], this.userLevel)) {
            if (platform.totalLogger) {
                if (platform.totalLogger === 2) {
                    const footerPanel = this.createElement('div', 'grid grid-cols-2 gap-2');

                    const btnInt = document.createElement('a');
                    btnInt.className = 'py-2 !text-[12px]';
                    btnInt.textContent = 'Internal';
                    btnInt.href = `/sparing/dashboard/maps/summary/detail/${platform.uid}/1`;
                    const btnEks = document.createElement('a');
                    btnEks.className = 'py-2 !text-[12px]';
                    btnEks.textContent = 'KLHK';
                    btnEks.href = `/sparing/dashboard/maps/summary/detail/${platform.uid}/2`;

                    footerPanel.appendChild(btnInt);
                    footerPanel.appendChild(btnEks);
                    cardFooter.appendChild(footerPanel);
                    card.appendChild(cardFooter);
                } else {
                    const footerPanel = this.createElement('div', 'grid grid-cols-1');

                    const btnInt = document.createElement('a');
                    btnInt.className = 'py-2 !text-[12px]';
                    btnInt.textContent = 'View Details';
                    btnInt.href = `/sparing/dashboard/maps/summary/detail/${platform.uid}/${platform?.tipeLogger}`;

                    footerPanel.appendChild(btnInt);
                    cardFooter.appendChild(footerPanel);
                    card.appendChild(cardFooter);
                }
            }
        } else {
            const footerPanel = this.createElement('div', 'grid grid-cols-1');

            const btnInt = document.createElement('a');
            btnInt.className = 'py-2 !text-[12px]';
            btnInt.textContent = 'View Details';
            btnInt.href = `/sparing/dashboard/maps/summary/detail/${platform.uid}/${platform?.tipeLogger}`;

            footerPanel.appendChild(btnInt);
            cardFooter.appendChild(footerPanel);
            card.appendChild(cardFooter);
        }

        return card;
    }

    // endregion

    // region Update Card From Skeleton To Data
    private updateCardFromSkeletonToData(uid: string, platform: CombinedPlatformData): void {
        const cardElement = document.getElementById(`card-${uid}-${this.getPlatformIndex(uid)}`);
        if (!cardElement || !platform.data) {
            console.warn(`⚠️ Card element or platform data not found for ${uid}`);
            return;
        }

        const cardId = cardElement.id;

        console.log(`🎨 Starting update card ${uid} from skeleton to data`);

        // Update dengan delay untuk memastikan DOM sudah ready
        setTimeout(() => {
            this.updateStatusBadgeFromSkeleton(cardElement, platform.data!);
            this.updateOnlineStatusFromSkeleton(cardElement, platform.data!);
        }, 50);

        setTimeout(() => {
            this.updateMetricsFromSkeleton(cardElement, platform.data!, cardId, platform);
        }, 100);

        setTimeout(() => {
            this.updateWaterQualityFromSkeleton(cardElement, platform.data!, cardId);
        }, 150);

        setTimeout(() => {
            this.updateLastUpdatedFromSkeleton(cardElement, platform.data!, platform);
        }, 200);

        console.log(`✅ Updated card ${uid} from skeleton to data`);
    }

    // endregion

    // region Update Status Badge From Skeleton - FIXED
    private updateStatusBadgeFromSkeleton(cardElement: HTMLElement, data: PlatformData): void {
        // Cari skeleton badge dengan berbagai cara
        let skeletonBadge = cardElement.querySelector('.skeleton-box.w-20.h-6:not(.skeleton-online)');

        if (!skeletonBadge) {
            // Coba cari dengan cara lain
            const allSkeletons = cardElement.querySelectorAll('.skeleton-box');
            allSkeletons.forEach(skeleton => {
                if (skeleton.classList.contains('w-20') &&
                        skeleton.classList.contains('h-6') &&
                        !skeleton.classList.contains('skeleton-online')) {
                    skeletonBadge = skeleton;
                }
            });
        }

        if (!skeletonBadge) {
            console.warn('⚠️ Skeleton badge not found');
            return;
        }

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
        console.log('✅ Status badge updated');
    }

    // endregion

    // region Update Online Status From Skeleton - FIXED
    private updateOnlineStatusFromSkeleton(cardElement: HTMLElement, data: PlatformData): void {
        const skeletonOnline = cardElement.querySelector('.skeleton-online');

        if (!skeletonOnline) {
            console.warn('⚠️ Skeleton online status not found');
            return;
        }

        const onlineContainer = this.createElement('div', 'online-status-container');
        const indicator = this.createElement('div', `${data.isOnline ? 'online' : 'offline'}`);
        const onlineText = this.createElement('div', 'text-[14px]', data.isOnline ? 'Online' : 'Offline');
        onlineContainer.appendChild(indicator);
        onlineContainer.appendChild(onlineText);

        if (this.options.onHeartbeatStatusClick) {
            onlineContainer.addEventListener('click', () => this.options.onHeartbeatStatusClick!(data.uid));
        }

        skeletonOnline.parentNode?.replaceChild(onlineContainer, skeletonOnline);
        console.log('✅ Online status updated');
    }

    // endregion

    // region Update Metrics From Skeleton - FIXED
    private updateMetricsFromSkeleton(cardElement: HTMLElement, data: PlatformData, cardId: string, platform: CombinedPlatformData): void {
        const skeletonCharts = cardElement.querySelectorAll('.skeleton-metric');

        if (skeletonCharts.length === 0) {
            console.warn('⚠️ No skeleton metrics found');
            return;
        }

        console.log(`📊 Found ${skeletonCharts.length} skeleton metrics to update`);

        const metrics = [
            {
                title: 'pH',
                type: 'ph' as const,
                value: data.metrics?.ph?.value || 0,
                bml_min: data.metrics?.ph?.bml_min || 0,
                bml_min_buffer: data.metrics?.ph?.bml_min_buffer || 0,
                bml_max_buffer: data.metrics?.ph?.bml_max_buffer || 14,
                bml_max: data.metrics?.ph?.bml_max || 14,
                unit: 'pH'
            },
            {
                title: 'Temp',
                type: 'temperature' as const,
                value: data.metrics?.temperature?.value || 0,
                bml_min: data.metrics?.temperature?.bml_min || 0,
                bml_min_buffer: data.metrics?.temperature?.bml_min_buffer || 0,
                bml_max_buffer: data.metrics?.temperature?.bml_max_buffer || 100,
                bml_max: data.metrics?.temperature?.bml_max || 100,
                unit: '°C'
            },
            {
                title: 'TSS',
                type: 'tss' as const,
                value: data.metrics?.tss?.value || 0,
                bml_min: data.metrics?.tss?.bml_min || 0,
                bml_min_buffer: data.metrics?.tss?.bml_min_buffer || 0,
                bml_max_buffer: data.metrics?.tss?.bml_max_buffer || 100,
                bml_max: data.metrics?.tss?.bml_max || 100,
                unit: 'mg/L'
            },
            {
                title: 'Debit',
                type: 'debit' as const,
                value: data.metrics?.debit?.value || 0,
                bml_min: data.metrics?.debit?.bml_min || 0,
                bml_min_buffer: data.metrics?.debit?.bml_min_buffer || 0,
                bml_max_buffer: data.metrics?.debit?.bml_max_buffer || 100,
                bml_max: data.metrics?.debit?.bml_max || 100,
                unit: 'm³/min'
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

                // Replace skeleton dengan chart div
                skeletonChart.parentNode?.replaceChild(chartDiv, skeletonChart);

                // Create gauge chart dengan delay lebih lama
                setTimeout(() => {
                    this.createGaugeChart(data.uid, chartDiv, metric.title, metric.type, metric.bml_min, metric.bml_min_buffer, metric.bml_max_buffer, metric.bml_max, metric.value, cardId, metricCard as HTMLElement);
                    console.log(`✅ Metric ${metric.type} chart created`);
                }, 200 + (index * 50)); // Stagger chart creation
            }
        });
    }

    // endregion

    // region Update Water Quality From Skeleton - FIXED
    private updateWaterQualityFromSkeleton(cardElement: HTMLElement, data: PlatformData, cardId: string): void {
        // Update dropdown
        const skeletonDropdown = cardElement.querySelector('.skeleton-box.w-32.h-4');
        if (skeletonDropdown) {
            const ddWrap = this.createElement('div', 'relative');
            const ddButton = this.createElement('button', 'inline-flex items-center gap-1 text-xs hover:bg-gray-50 dark:hover:bg-gray-800') as HTMLButtonElement;
            ddButton.id = `${cardId}-dropdownButton`;
            ddButton.type = 'button';
            ddButton.innerHTML = `
                <span class="subText">All Parameter</span>
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

            const makeItem = (label: string, value: WaterQualitySourceType) => {
                const li = document.createElement('li');
                const a = document.createElement('a');
                a.href = '#';
                a.className = 'block px-4 py-2 text-[12px] hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white';
                a.textContent = label;
                a.addEventListener('click', (e) => {
                    e.preventDefault();
                    const subText = ddButton.querySelector('.subText');
                    if (subText) subText.textContent = label;

                    this.filterWaterQualitySource(cardId, value);
                    dropdown.hide();
                });
                li.appendChild(a);
                return li;
            };

            menuList.appendChild(makeItem('All Parameter', 'all'));
            menuList.appendChild(makeItem('pH & Temp', 'ph_temp'));
            menuList.appendChild(makeItem('TSS', 'tss'));
            menuList.appendChild(makeItem('Debit', 'debit'));
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
            console.log('✅ Dropdown updated');
        } else {
            console.warn('⚠️ Skeleton dropdown not found');
        }

        // Update chart
        const skeletonWQChart = cardElement.querySelector('.skeleton-box.w-full.h-32');
        if (skeletonWQChart) {
            const waterQualityChart = this.createElement('div', 'chart-one');
            waterQualityChart.id = `${cardId}-waterQuality`;

            skeletonWQChart.parentNode?.replaceChild(waterQualityChart, skeletonWQChart);

            setTimeout(() => {
                this.currentWQSource.set(cardId, 'all');
                this.createWaterQualityChart(waterQualityChart, data.waterQualityData || [], cardId);
                console.log('✅ Water quality chart created');
            }, 300);
        } else {
            console.warn('⚠️ Skeleton water quality chart not found');
        }
    }

    // endregion

    // region Update Last Updated From Skeleton - FIXED
    private updateLastUpdatedFromSkeleton(cardElement: HTMLElement, data: PlatformData, platform: CombinedPlatformData): void {
        const skeletonLastUpdated = cardElement.querySelector('.skeleton-box.w-48.h-3');

        if (!skeletonLastUpdated) {
            console.warn('⚠️ Skeleton last updated not found');
            return;
        }

        if (data.lastUpdated) {
            const platformTimezone = platform.timezone || 'Asia/Jakarta';
            const platformLocale = platform.locale || 'id-ID';

            const formattedLastUpdated = this.safeFormatDate(data.lastUpdated, platformTimezone, platformLocale);
            const timezoneShort = platformTimezone.split('/')[1] || platformTimezone;

            const lastUpdatedDiv = this.createElement('div', 'text-[10px] text-gray-400 mt-4 last-updated',
                    `Last updated: ${formattedLastUpdated} (${timezoneShort})`);

            skeletonLastUpdated.parentNode?.replaceChild(lastUpdatedDiv, skeletonLastUpdated);
            console.log('✅ Last updated time updated');
        }
    }

    // endregion

    //region Handle Convert Card to Skeleton
    private convertCardToSkeleton(uid: string): void {
        const cardElement = document.getElementById(`card-${uid}-${this.getPlatformIndex(uid)}`);
        if (!cardElement) return;

        console.log(`🦴 Converting card ${uid} to skeleton state`);

        const statusBadge = cardElement.querySelector('.status-badge');
        if (statusBadge) {
            const skeletonBadge = this.createElement('div', 'skeleton-box w-20 h-6 rounded-full bg-gray-200 animate-pulse');
            statusBadge.parentNode?.replaceChild(skeletonBadge, statusBadge);
        }

        const onlineContainer = cardElement.querySelector('.online-status-container');
        if (onlineContainer) {
            const skeletonOnline = this.createElement('div', 'skeleton-box skeleton-online w-20 h-6 rounded-full bg-gray-200 animate-pulse');
            onlineContainer.parentNode?.replaceChild(skeletonOnline, onlineContainer);
        }

        const metricCharts = cardElement.querySelectorAll('.chart-ph, .chart-temperature, .chart-tss, .chart-debit');
        metricCharts.forEach(chart => {
            const skeletonChart = this.createElement('div', 'skeleton-box skeleton-metric w-[78px] h-16 bg-gray-200 animate-pulse rounded mx-2 mb-2');
            chart.parentNode?.replaceChild(skeletonChart, chart);
        });

        const waterQualityChart = cardElement.querySelector('.chart-one');
        if (waterQualityChart) {
            const skeletonWQChart = this.createElement('div', 'skeleton-box w-full h-32 bg-gray-200 animate-pulse rounded');
            waterQualityChart.parentNode?.replaceChild(skeletonWQChart, waterQualityChart);
        }

        const dropdown = cardElement.querySelector('.relative');
        if (dropdown) {
            const skeletonDropdown = this.createElement('div', 'skeleton-box w-32 h-4 rounded bg-gray-200 animate-pulse');
            dropdown.parentNode?.replaceChild(skeletonDropdown, dropdown);
        }

        const lastUpdated = cardElement.querySelector('.last-updated');
        if (lastUpdated) {
            const skeletonLastUpdated = this.createElement('div', 'skeleton-box w-48 h-3 bg-gray-200 animate-pulse rounded mt-4');
            lastUpdated.parentNode?.replaceChild(skeletonLastUpdated, lastUpdated);
        }

        const cardId = `card-${uid}-${this.getPlatformIndex(uid)}`;
        const chartKeys = [`${cardId}-ph`, `${cardId}-temperature`, `${cardId}-tss`, `${cardId}-debit`, `${cardId}-waterQuality`];
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
                platform.isDataLoaded = false;
            }
        });
    }

    //endregion

    // region Update Card To Error State
    private updateCardToErrorState(uid: string, errorMessage: string): void {
        const cardElement = document.getElementById(`card-${uid}-${this.getPlatformIndex(uid)}`);
        if (!cardElement) return;

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

        if (!dateParam) {
            console.log('🔄 No date filter, enabling real-time updates');
            return true;
        }

        const today = new Date().toISOString().split('T')[0];
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

        if (!this.shouldEnableRealTimeUpdates()) {
            console.log('⏸️ Real-time updates skipped due to date filter');
            return;
        }

        const updateData = async () => {
            try {
                if (!this.shouldEnableRealTimeUpdates()) {
                    console.log('⏸️ Stopping real-time updates - date filter detected');
                    this.stopRealTimeUpdates();
                    return;
                }

                console.log('🔄 Real-time update cycle started...');

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
        this.stopRealTimeUpdates();

        setTimeout(() => {
            this.startRealTimeUpdates();
        }, 500);
    }

    //endregion

    // region Handle Logger Data Update
    private handleLoggerDataUpdate(loggerData: LoggerEventData): void {
        const platform = this.platforms.find(p => p.uid === loggerData.uid);
        if (!platform || !platform.data) {
            console.warn(`⚠️ Platform ${loggerData.uid} not found or data not loaded`);
            return;
        }

        const oldData = {...platform.data};

        if (platform.data.metrics) {
            platform.data.metrics = {
                ...platform.data.metrics,
                ph: {
                    ...platform.data.metrics.ph,
                    value: loggerData.ph
                },
                temperature: {
                    ...platform.data.metrics.temperature,
                    value: loggerData.temperature
                },
                tss: {
                    ...platform.data.metrics.tss,
                    value: loggerData.tss
                },
                debit: {
                    ...platform.data.metrics.debit,
                    value: loggerData.debit
                }
            };
        }

        if (loggerData.waterQualityData) {
            platform.data.waterQualityData = loggerData.waterQualityData;
        }

        platform.data.lastUpdated = new Date(loggerData.datetime_unix * 1000);
        platform.data.isOnline = true;

        this.dataCache.set(loggerData.uid, platform.data);
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

        console.log(`🎨 Updating card UI for ${uid}`, {oldData, newData});

        if (oldData.status !== newData.status) {
            this.updateStatusBadge(cardElement, newData);
        }

        if (oldData.isOnline !== newData.isOnline) {
            this.updateOnlineStatus(cardElement, newData.isOnline);
        }

        if (newData.metrics) {
            const cardId = `card-${uid}-${this.getPlatformIndex(uid)}`;

            // Update pH
            const oldPh = oldData.metrics?.ph?.value;
            const newPh = newData.metrics?.ph?.value;
            if (oldPh !== newPh && newPh !== undefined) {
                this.updateChartValue(cardId, 'ph', newPh);
            }

            // Update Temperature
            const oldTemp = oldData.metrics?.temperature?.value;
            const newTemp = newData.metrics?.temperature?.value;
            if (oldTemp !== newTemp && newTemp !== undefined) {
                this.updateChartValue(cardId, 'temperature', newTemp);
            }

            // Update TSS
            const oldTss = oldData.metrics?.tss?.value;
            const newTss = newData.metrics?.tss?.value;
            if (oldTss !== newTss && newTss !== undefined) {
                this.updateChartValue(cardId, 'tss', newTss);
            }

            // Update Debit
            const oldDebit = oldData.metrics?.debit?.value;
            const newDebit = newData.metrics?.debit?.value;
            if (oldDebit !== newDebit && newDebit !== undefined) {
                this.updateChartValue(cardId, 'debit', newDebit);
            }
        }

        if (this.hasWaterQualityDataChanged(oldData.waterQualityData, newData.waterQualityData)) {
            const cardId = `card-${uid}-${this.getPlatformIndex(uid)}`;
            this.updateWaterQualityChart(cardId, newData.waterQualityData || []);
        }

        this.updateLastUpdatedTime(cardElement, newData, uid);

        console.log(`✅ Card UI updated for ${uid}`);
    }

    private hasWaterQualityDataChanged(oldData: any[], newData: any[]): boolean {
        if (!oldData && !newData) return false;
        if (!oldData || !newData) return true;
        if (oldData.length !== newData.length) return true;

        const oldLast = oldData[oldData.length - 1];
        const newLast = newData[newData.length - 1];

        if (!oldLast && !newLast) return false;
        if (!oldLast || !newLast) return true;

        return (
                oldLast.timestamp !== newLast.timestamp ||
                oldLast.ph !== newLast.ph ||
                oldLast.temperature !== newLast.temperature ||
                oldLast.tss !== newLast.tss ||
                oldLast.debit !== newLast.debit
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

    // region Get Platform Index - IMPORTANT
    private getPlatformIndex(uid: string): number {
        return this.platforms.findIndex(platform => platform.uid === uid);
    }

    // endregion

    // region Create Element
    private createElement<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, textContent?: string): HTMLElement {
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

    // region Chart Creation and Update Methods
    private createGaugeChart(uid: string, element: HTMLElement, title: string, type: 'ph' | 'temperature' | 'tss' | 'debit', bml_min: number, bml_min_buffer: number, bml_max_buffer: number, bml_max: number, initialValue: number, cardId: string, metricCard: HTMLElement): void {
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

        // ✅ Buat multiple plotBands untuk zona warna
        const plotBands = this.createColorZonePlotBands(bml_min, bml_min_buffer, bml_max_buffer, bml_max);

        const unitMap = {
            ph: 'pH',
            temperature: '°C',
            tss: 'mg/L',
            debit: 'm³/min'
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
                        const fillColor = managerRef.getColorByValue(
                                value,
                                bml_min,
                                bml_min_buffer,
                                bml_max_buffer,
                                bml_max
                        );

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
                min: bml_min,
                max: bml_max,
                lineWidth: 0,
                tickPosition: 'inside',
                tickColor: '#FFFFFF',
                tickWidth: 2,
                minorTickInterval: null,
                labels: {enabled: false},
                plotBands: plotBands  // ✅ Gunakan multiple plotBands
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
                        const decimals = type === 'temperature' || type === 'tss' ? 1 : 2;
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

    private createColorZonePlotBands(
            bml_min: number,
            bml_min_buffer: number,
            bml_max_buffer: number,
            bml_max: number
    ): Array<any> {
        const range = bml_max - bml_min;
        const zones: Array<any> = [];

        // Zona 1: Merah sampai Kuning (bml_min ke bml_min_buffer)
        const lowRange = bml_min_buffer - bml_min;
        const lowSteps = 5;
        for (let i = 0; i < lowSteps; i++) {
            const from = bml_min + (lowRange / lowSteps) * i;
            const to = bml_min + (lowRange / lowSteps) * (i + 1);
            const ratio = i / (lowSteps - 1);
            const color = this.interpolateColor('#F44336', '#FFC107', ratio);

            zones.push({
                from: from,
                to: to,
                color: color,
                innerRadius: '80%',
                outerRadius: '100%'
            });
        }

        // Zona 2: Hijau (bml_min_buffer ke bml_max_buffer)
        zones.push({
            from: bml_min_buffer,
            to: bml_max_buffer,
            color: '#4CAF50',
            innerRadius: '80%',
            outerRadius: '100%'
        });

        // Zona 3: Kuning sampai Merah (bml_max_buffer ke bml_max)
        const highRange = bml_max - bml_max_buffer;
        const highSteps = 5;
        for (let i = 0; i < highSteps; i++) {
            const from = bml_max_buffer + (highRange / highSteps) * i;
            const to = bml_max_buffer + (highRange / highSteps) * (i + 1);
            const ratio = i / (highSteps - 1);
            const color = this.interpolateColor('#FFC107', '#F44336', ratio);

            zones.push({
                from: from,
                to: to,
                color: color,
                innerRadius: '80%',
                outerRadius: '100%'
            });
        }

        return zones;
    }

    private getTickIntervalByDuration(startTimestamp: number, endTimestamp: number): number {
        const durationHours = (endTimestamp - startTimestamp) / (1000 * 60 * 60);

        if (durationHours <= 2) {
            return 15 * 60 * 1000;
        } else if (durationHours <= 6) {
            return 30 * 60 * 1000;
        } else if (durationHours <= 12) {
            return 60 * 60 * 1000;
        } else if (durationHours <= 24) {
            return 3600 * 3000;
        } else if (durationHours <= 48) {
            return 4 * 60 * 60 * 1000;
        } else {
            return 6 * 60 * 60 * 1000;
        }
    }

    private createWaterQualityChart(element: HTMLElement, data: Array<{
        timestamp: number;
        ph?: number;
        temperature?: number;
        tss?: number;
        debit?: number;
    }>, cardId: string): void {
        if (!this.options.enableCharts || typeof Highcharts === 'undefined') {
            return;
        }

        const managerInstance = this;
        const platform = this.platforms.find(p => `card-${p.uid}-${this.getPlatformIndex(p.uid)}` === cardId);
        const platformTimezone = platform?.timezone || 'Asia/Jakarta';
        const platformLocale = platform?.locale || 'id-ID';

        const currentSource = this.currentWQSource.get(cardId) || 'all';

        let series: any[] = [];
        if (currentSource === 'ph_temp') {
            // Chart dengan 2 lines: pH dan Temperature
            const phData = data.map(item => ({
                x: item.timestamp * 1000,
                y: item.ph || null
            }));

            const tempData = data.map(item => ({
                x: item.timestamp * 1000,
                y: item.temperature || null
            }));

            series = [
                {
                    name: 'pH',
                    type: 'line',
                    data: phData,
                    color: '#3B82F6',
                },
                {
                    name: 'Temperature',
                    type: 'line',
                    data: tempData,
                    color: '#EF4444',
                }
            ];
        } else if (currentSource === 'tss') {
            const tssData = data.map(item => ({
                x: item.timestamp * 1000,
                y: item.tss || null
            }));

            series = [{
                name: 'TSS',
                type: 'line',
                data: tssData,
                color: '#10B981'
            }];
        } else if (currentSource === 'debit') {
            const debitData = data.map(item => ({
                x: item.timestamp * 1000,
                y: item.debit || null
            }));

            series = [{
                name: 'Debit',
                type: 'line',
                data: debitData,
                color: '#8B5CF6'
            }];
        } else if (currentSource === 'all') {
            // Chart dengan 3 lines: pH, TSS, Debit (tanpa Temperature)
            const phData = data.map(item => ({
                x: item.timestamp * 1000,
                y: item.ph || null
            }));

            const tssData = data.map(item => ({
                x: item.timestamp * 1000,
                y: item.tss || null
            }));

            const debitData = data.map(item => ({
                x: item.timestamp * 1000,
                y: item.debit || null
            }));

            series = [
                {
                    name: 'pH',
                    type: 'line',
                    data: phData,
                    color: '#3B82F6'
                },
                {
                    name: 'TSS',
                    type: 'line',
                    data: tssData,
                    color: '#10B981'
                },
                {
                    name: 'Debit',
                    type: 'line',
                    data: debitData,
                    color: '#8B5CF6'
                }
            ];
        }

        let tickInterval = 3600 * 1000;
        if (data.length > 0) {
            const timestamps = data.map(item => item.timestamp * 1000).sort((a, b) => a - b);
            const startTime = timestamps[0];
            const endTime = timestamps[timestamps.length - 1];
            tickInterval = this.getTickIntervalByDuration(startTime, endTime);
        }

        const chart = Highcharts.chart({
            chart: {
                renderTo: element,
                type: 'line',
                marginLeft: 45,
                height: 150,
                style: {
                    fontFamily: 'Arial, sans-serif'
                }
            },
            title: {text: null},
            lang: {
                noData: "No Water Quality data Available"
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
                }
            },
            legend: {
                enabled: true,
                align: 'center',
                verticalAlign: 'bottom',
                itemStyle: {
                    fontSize: '10px'
                }
            },
            tooltip: {
                shared: true,
                backgroundColor: 'white',
                borderWidth: 0,
                borderRadius: 8,
                shadow: true,
                style: {fontSize: '12px'},
                formatter: function () {
                    const timestampMs = this.x;
                    const timestampSeconds = timestampMs / 1000;
                    const formattedTime = managerInstance.safeFormatTimestamp(timestampSeconds, 'datetime', platformTimezone, platformLocale, true);
                    const timezoneShort = platformTimezone.split('/')[1] || platformTimezone;

                    let tooltipHTML = `<b>Time (${timezoneShort}):</b> ${formattedTime}<br>`;

                    this.points.forEach(point => {
                        tooltipHTML += `<span style="color:${point.color}">\u25CF</span> ${point.series.name}: <b>${point.y}</b><br>`;
                    });

                    return tooltipHTML;
                }
            },
            plotOptions: {
                line: {
                    lineWidth: 2,
                    marker: {
                        enabled: false,
                        states: {
                            hover: {
                                enabled: true,
                                lineWidth: 2,
                                lineColor: 'white',
                                radius: 5
                            }
                        }
                    }
                }
            },
            series: series
        });

        this.chartInstances.set(`${cardId}-waterQuality`, chart);
    }

    private updateChartValue(cardId: string, chartType: 'ph' | 'temperature' | 'tss' | 'debit', newValue: number): void {
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

    private updateWaterQualityChart(cardId: string, waterQualityData: Array<{
        timestamp: number;
        ph?: number;
        temperature?: number;
        tss?: number;
        debit?: number;
    }>): void {
        const chartKey = `${cardId}-waterQuality`;
        const chart = this.chartInstances.get(chartKey);

        if (!chart) return;

        const currentSource = this.currentWQSource.get(cardId) || 'all';

        if (currentSource === 'ph_temp') {
            const phData = waterQualityData.map(item => ({
                x: item.timestamp * 1000,
                y: item.ph || null
            }));

            const tempData = waterQualityData.map(item => ({
                x: item.timestamp * 1000,
                y: item.temperature || null
            }));

            if (chart.series[0]) chart.series[0].setData(phData, false);
            if (chart.series[1]) chart.series[1].setData(tempData, false);
        } else if (currentSource === 'tss') {
            const tssData = waterQualityData.map(item => ({
                x: item.timestamp * 1000,
                y: item.tss || null
            }));

            if (chart.series[0]) chart.series[0].setData(tssData, false);
        } else if (currentSource === 'debit') {
            const debitData = waterQualityData.map(item => ({
                x: item.timestamp * 1000,
                y: item.debit || null
            }));

            if (chart.series[0]) chart.series[0].setData(debitData, false);
        } else if (currentSource === 'all') {
            const phData = waterQualityData.map(item => ({
                x: item.timestamp * 1000,
                y: item.ph || null
            }));

            const tssData = waterQualityData.map(item => ({
                x: item.timestamp * 1000,
                y: item.tss || null
            }));

            const debitData = waterQualityData.map(item => ({
                x: item.timestamp * 1000,
                y: item.debit || null
            }));

            if (chart.series[0]) chart.series[0].setData(phData, false);
            if (chart.series[1]) chart.series[1].setData(tssData, false);
            if (chart.series[2]) chart.series[2].setData(debitData, false);
        }

        chart.redraw();
    }

    private filterWaterQualitySource(cardId: string, sourceType: WaterQualitySourceType): void {
        this.currentWQSource.set(cardId, sourceType);

        const platform = this.platforms.find(p => `card-${p.uid}-${this.getPlatformIndex(p.uid)}` === cardId);
        if (!platform || !platform.data || !platform.data.waterQualityData) return;

        // Destroy existing chart
        const chartKey = `${cardId}-waterQuality`;
        const existingChart = this.chartInstances.get(chartKey);
        if (existingChart && existingChart.destroy) {
            existingChart.destroy();
            this.chartInstances.delete(chartKey);
        }

        // Get chart element
        const chartElement = document.getElementById(`${cardId}-waterQuality`);
        if (chartElement) {
            // Recreate chart with new source
            this.createWaterQualityChart(chartElement, platform.data.waterQualityData, cardId);
        }

        console.log(`🔄 Updated water quality chart for ${cardId} to use ${sourceType} source`);
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

    private getColorByValue(
            value: number,
            bml_min: number,
            bml_min_buffer: number,
            bml_max_buffer: number,
            bml_max: number
    ): string {
        // Zona 1: Merah ke Kuning (nilai terlalu rendah)
        if (value < bml_min_buffer) {
            const ratio = (value - bml_min) / (bml_min_buffer - bml_min);
            const clampedRatio = Math.max(0, Math.min(1, ratio));
            return this.interpolateColor('#F44336', '#FFC107', clampedRatio);
        }

        // Zona 2: Hijau (zona aman)
        if (value >= bml_min_buffer && value <= bml_max_buffer) {
            return '#4CAF50';
        }

        // Zona 3: Kuning ke Merah (nilai terlalu tinggi)
        if (value > bml_max_buffer) {
            const ratio = (value - bml_max_buffer) / (bml_max - bml_max_buffer);
            const clampedRatio = Math.max(0, Math.min(1, ratio));
            return this.interpolateColor('#FFC107', '#F44336', clampedRatio);
        }

        return '#4CAF50'; // Default hijau
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
        console.log('🔍 Applying filters:', options);

        this.stopRealTimeUpdates();

        try {
            // ✅ Jika ada filter UID atau filter lain yang butuh reload platforms
            const needsReloadPlatforms = options.uid || options.status_platform || options.customer_lokasi_id || options.isOnline !== undefined;

            if (needsReloadPlatforms) {
                console.log('🔄 Reloading platforms with filters...');

                // ✅ Disconnect existing observer
                if (this.observer) {
                    this.observer.disconnect();
                    this.observer = null;
                }

                // Convert semua cards ke skeleton
                this.convertAllCardsToSkeleton();

                // Clear current platforms
                this.platforms = [];
                this.currentPage = 1;

                // Render initial skeletons
                this.renderInitialSkeletons();

                // Load platforms dengan filter
                await this.loadPlatforms(1, options);

                // Render skeleton cards untuk platforms yang baru
                this.renderAllSkeletonCards();

                // Load data untuk platforms yang baru
                await this.loadAllPlatformData(options);

                // ✅ Setup Intersection Observer lagi setelah render
                if (this.options.enablePagination && this.paginationInfo?.has_more) {
                    console.log('🔄 Re-setting up Intersection Observer after filter');
                    this.setupIntersectionObserver();
                }

            } else {
                // ✅ Jika hanya filter date, cukup reload data saja
                console.log('🔄 Reloading platform data with filters...');

                this.convertAllCardsToSkeleton();

                const dataPromises = this.platforms.map(platform =>
                        this.loadPlatformData(platform.uid, options)
                );

                await Promise.allSettled(dataPromises);
                console.log('✅ Finished loading all platform data');
            }

            if (this.options.onDataUpdate) {
                this.options.onDataUpdate(this.platforms);
            }

        } catch (error) {
            console.error('❌ Error applying filters:', error);
            this.showError('Failed to apply filters');
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
        this.stopRealTimeUpdates();

        if (this.options.realTimeUpdateInterval) {
            setTimeout(() => {
                this.startRealTimeUpdates();
            }, 1000);
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

        // Disconnect observer
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }

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
        this.currentWQSource.clear();
        this.paginationInfo = null;
        this.currentPage = 1;
        this.loadingElement = null;

        console.log('✅ Platform Skeleton Manager destroyed');
    }

    // endregion
}

export {
    PlatformSkeletonManager,
    type PlatformInfo,
    type PlatformData,
    type CombinedPlatformData,
    type MetricsData,
    type LoggerEventData,
    type PlatformSkeletonManagerOptions,
    type WaterQualitySourceType
};
