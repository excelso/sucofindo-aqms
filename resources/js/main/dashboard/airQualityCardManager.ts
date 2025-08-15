import Highcharts from 'highcharts'
import "highcharts/highcharts-more";
import "highcharts/modules/solid-gauge";
import "highcharts/modules/no-data-to-display";
import {io, Socket} from 'socket.io-client';
import {SocketClient, SocketEventCallbacks, SocketOptions} from "@/js/plugins/SocketClient";
import {createSmoothGradient} from "@/js/main/dashboard/chartHelper";
import { Dropdown } from 'flowbite';
import type { DropdownOptions, DropdownInterface } from 'flowbite';
import type { InstanceOptions } from 'flowbite';

interface AirQualityData {
    uid: string;
    siteName: string;
    status: string;
    emoji?: string;
    colorCode?: string;
    isOnline: boolean;
    cctvIconPath?: string;
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
    location?: string;
    lastUpdated?: Date;
    airIndexData?: Array<{
        timestamp: number;
        value: number;
        value_tsp: number;
        link_video_id?: string;
        link_video_status?: string;
        link_video_recorded?: string;
        aqi_from: string;
    }>; // Unix timestamp
    cctvLink?: string;
    timezone?: string; // Timezone untuk platform ini (e.g., 'Asia/Jakarta', 'Asia/Makassar')
    locale?: string;   // Locale untuk platform ini (optional, default 'id-ID')
    lat?: number;
    lng?: number;
}

interface MetricsData {
    title: string;
    type: string;
    value: number;
    bml_min: number;
    bml_min_buffer: number,
    bml_max_buffer: number,
    bml_max: number
}

interface CardManagerOptions {
    containerSelector?: string;
    batchSize?: number;
    enableVirtualization?: boolean;
    enableLazyLoading?: boolean;
    enableCharts?: boolean;
    chartUpdateInterval?: number;
    realTimeUpdateInterval?: number;
    autoLoadInitialData?: boolean;
    apiEndpoint?: string;
    enableSocketIO?: boolean;
    socketIOUrl?: string;
    socketInstanceName?: string; // Unique name for socket instance
    socketIOOptions?: SocketOptions;
    onCctvClick?: (id: string, cctvLink: string) => void;
    onMetricsClick?: (id: string, metrics: MetricsData) => void;
    onDataUpdate?: (updatedData: AirQualityData[]) => void;
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
    // Optional airIndex data untuk update chart airIndex
    airIndexData?: Array<{ timestamp: number; value: number; value_tsp: number; aqi_from: string }>;
    // Atau bisa menggunakan AQI value untuk generate airIndex point baru
    aqi_value?: number;
    aqi_from?: string;
}

class AirQualityCardManager {
    private data: AirQualityData[] = [];
    private container: HTMLElement | null = null;
    private options: CardManagerOptions;
    private visibleCards: Set<number> = new Set();
    private observer?: IntersectionObserver;
    private chartInstances: Map<string, any> = new Map();
    private chartIntervals: Map<string, any> = new Map();
    private realTimeInterval?: number;
    private socket?: Socket;
    private connectionStatus: 'connected' | 'disconnected' | 'error' = 'disconnected';
    private lastUpdateTime: Date = new Date();
    private dataCache: Map<string, AirQualityData> = new Map();
    private socketClient: SocketClient;
    private currentAQISource: Map<string, 'pm25_pm10' | 'tsp'> = new Map();

    // region Constructor
    constructor(options: CardManagerOptions = {}) {
        this.options = {
            batchSize: 20,
            enableVirtualization: false,
            enableLazyLoading: true,
            enableCharts: true,
            chartUpdateInterval: 0, // Disable auto-update, use real-time instead
            realTimeUpdateInterval: 0, // Disable when using Socket.IO
            autoLoadInitialData: true,
            enableSocketIO: false,
            socketInstanceName: 'air-quality-default',
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

        // Auto-load initial data if API endpoint is provided
        if (this.options.apiEndpoint) {
            this.loadInitialData().catch((error) => {
                console.error(error);
            });
        }

        // Initialize Socket.IO if configured (for real-time updates)
        if (this.options.enableSocketIO && this.options.socketIOUrl) {
            this.initSocketIO();
        }

        // Initialize periodic updates only if Socket.IO is disabled
        if (this.options.apiEndpoint && this.options.realTimeUpdateInterval && !this.options.enableSocketIO) {
            this.startRealTimeUpdates().catch((error) => {
                console.error(error);
            });
        }
    }

    // endregion

    // region Chart Helper Functions
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

    // endregion

    // region Color Interpolation
    private interpolateColor(color1: string, color2: string, factor: number): string {
        const c1 = this.hexToRgb(color1);
        const c2 = this.hexToRgb(color2);
        const r = Math.round(c1.r + (c2.r - c1.r) * factor);
        const g = Math.round(c1.g + (c2.g - c1.g) * factor);
        const b = Math.round(c1.b + (c2.b - c1.b) * factor);
        return `rgb(${r}, ${g}, ${b})`;
    }

    // endregion

    // region Hex to RGB Conversion
    private hexToRgb(hex: string): { r: number; g: number; b: number } {
        const value = hex.replace('#', '');
        const bigint = parseInt(value, 16);
        return {
            r: (bigint >> 16) & 255,
            g: (bigint >> 8) & 255,
            b: bigint & 255
        };
    }

    // endregion

    // region Create Gauge Chart
    private createGaugeChart(id: string, element: HTMLElement, title: string, type: 'pm10' | 'pm25' | 'tsp' | 'noise', bml: number, buffer: number, initialValue: number, cardId: string, metricCard: HTMLElement): void {
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

        const suffixMap = {
            pm10: ' PM10',
            pm25: ' PM2.5',
            tsp: ' TSP',
            noise: ' dBA'
        };

        // Store reference to manager methods for use in chart events
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
            tooltip: {
                enabled: false
            },
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

        // Store chart instance
        this.chartInstances.set(`${cardId}-${type}`, chart);
    }

    // endregion

    // region Get AQI Color
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

    // endregion

    // region Helper Functions for Date Validation

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
                // Untuk format datetime
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

    // region Create AirIndex Chart dengan Adaptive Range
    private createAirIndexChart(element: HTMLElement, data: Array<{
        timestamp: number;
        value: number;
        value_tsp: number;
        aqi_from: string;
    }>, cardId: string): void {
        if (!this.options.enableCharts || typeof Highcharts === 'undefined') {
            return;
        }

        const managerInstance = this;

        const platformData = this.data.find(item => item.uid === cardId.replace(/card-|-\d+$/g, ''));
        const platformTimezone = platformData?.timezone || 'Asia/Jakarta';
        const platformLocale = platformData?.locale || 'id-ID';

        const currentSource = this.currentAQISource.get(cardId) || 'pm25_pm10';

        // Default data with Unix timestamps
        const now = Math.floor(new Date().setHours(0, 1, 0, 0) / 1000);
        const defaultData = data || Array.from({length: 144}, (_, i) => ({
            timestamp: now + (i * 300),
            value: Math.floor(Math.random() * 50) + 20,
            aqi_from: null
        }));

        // Prepare chart data
        const chartData = data.map(item => {
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
                aqi_from: currentSource === 'tsp' ? 'TSP' : item.aqi_from,
            };
        });

        const yValues = chartData.map(point => point.y);
        const dataMinY = Math.min(...yValues);
        const dataMaxY = Math.max(...yValues);

        // Set range berdasarkan nilai maksimal data
        const minY = Math.min(0, dataMinY); // Selalu mulai dari 0 atau lebih rendah
        let maxY: number;
        if (dataMaxY <= 50) {
            maxY = Math.max(50, dataMaxY + 5); // Tambah sedikit padding
        } else if (dataMaxY <= 100) {
            maxY = Math.max(100, dataMaxY + 10);
        } else if (dataMaxY <= 150) {
            maxY = Math.max(150, dataMaxY + 10);
        } else {
            maxY = Math.max(300, dataMaxY + 20);
        }

        // Gunakan helper function dengan range adaptif
        const gradient = createSmoothGradient(minY, maxY);
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
                tickInterval: 3600 * 2000,
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
                max: maxY, // Gunakan maxY yang adaptif
            },
            legend: {enabled: false},
            tooltip: {
                backgroundColor: 'white',
                borderWidth: 0,
                borderRadius: 8,
                shadow: true,
                style: {fontSize: '12px'},
                formatter: function () {
                    const {aqi_from} = this as any

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
                data: chartData,
                fillColor: gradient,
            }]
        }, function (chart: any) {
            // Handle markers untuk point dengan nilai tinggi
            if (data && data.length > 0) {
                const series = chart.series[0];
                const lastPoint = series.data[series.data.length - 1];

                if (lastPoint) {
                    if (lastPoint.aqi_from === 'TSP') {
                        const linkVideoPoint = this.getVideoLinkForPoint(cardId, lastPoint.x)
                        const aqiValue = lastPoint.y;
                        const markerColor = this.getAQIColor(aqiValue);

                        if (linkVideoPoint.linkVideoRecorded) {
                            lastPoint.update({
                                marker: {
                                    enabled: true,
                                    radius: 6,
                                    fillColor: markerColor,
                                    lineWidth: 2,
                                    lineColor: 'white'
                                },
                                events: {
                                    click: (event: any) => {
                                        if (lastPoint.y > 50) {
                                            if (this.options.onClickAirIndexPoint) {
                                                this.options.onClickAirIndexPoint(event, {
                                                    cardId: cardId || 'unknown',
                                                    timestamp: lastPoint.x ? lastPoint.x / 1000 : Date.now() / 1000,
                                                    value: lastPoint.y,
                                                    pointIndex: series.data.length - 1,
                                                    isLastPoint: true,
                                                    formattedDate: new Date(lastPoint.x || Date.now()).toLocaleDateString(),
                                                    formattedTime: new Date(lastPoint.x || Date.now()).toLocaleTimeString(),
                                                    linkVideo: linkVideoPoint
                                                });
                                            }
                                        }
                                    }
                                }
                            }, false);
                        } else {
                            lastPoint.update({
                                marker: {
                                    enabled: true,
                                    radius: 6,
                                    fillColor: markerColor,
                                    lineWidth: 2,
                                    lineColor: 'white'
                                },
                            }, false);
                        }
                    }
                    chart.redraw();
                }

                // Update markers untuk semua point dengan nilai tinggi
                series.data.forEach((item: any, index: number) => {
                    const linkVideoPoint = this.getVideoLinkForPoint(cardId, item.x);
                    if (item.aqi_from === 'TSP') {
                        const markerColor = this.getAQIColor(item.y);
                        if (linkVideoPoint.linkVideoRecorded) {
                            item.update({
                                marker: {
                                    enabled: true,
                                    radius: 6,
                                    fillColor: markerColor,
                                    lineWidth: 2,
                                    lineColor: 'white'
                                },
                                events: {
                                    click: (event: any) => {
                                        if (this.options.onClickAirIndexPoint) {
                                            this.options.onClickAirIndexPoint(event, {
                                                cardId: cardId || 'unknown',
                                                timestamp: item.x ? item.x / 1000 : Date.now() / 1000,
                                                value: item.y,
                                                pointIndex: index,
                                                isLastPoint: false,
                                                isHighValue: true,
                                                formattedDate: new Date(item.x || Date.now()).toLocaleDateString(),
                                                formattedTime: new Date(item.x || Date.now()).toLocaleTimeString(),
                                                linkVideo: linkVideoPoint
                                            });
                                        }
                                    }
                                }
                            }, false);
                            chart.redraw();
                        }
                    }
                })
            }
        }.bind(this))

        this.chartInstances.set(`${cardId}-airIndex`, chart);
    }

    // endregion

    // region Load Initial Data
    private async loadInitialData(): Promise<void> {
        try {
            console.log('🔄 Loading initial data from API...');
            const response = await fetch(this.options.apiEndpoint!);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();

            // Handle both a direct array and object with data property
            const initialData: AirQualityData[] = Array.isArray(result) ? result : result.data || [];

            // Set initial data and cache
            this.data = initialData.map(item => ({
                ...item,
                lastUpdated: item.lastUpdated || new Date()
            }));

            // Update cache
            this.data.forEach(item => {
                this.dataCache.set(item.uid, item);
            });

            this.lastUpdateTime = new Date();
            this.updateConnectionStatus('connected');

            console.log(`✅ Loaded ${this.data.length} stations successfully`);

            // Auto-render if container is available
            if (this.container) {
                this.renderAll();
            }

            // Trigger callback if provided
            if (this.options.onDataUpdate) {
                this.options.onDataUpdate(this.data);
            }

        } catch (error) {
            console.error('❌ Error loading initial data:', error);
            this.updateConnectionStatus('error');
            this.data = [];
        }
    }

    // endregion

    // region Handle Start RealTime Updates
    private async startRealTimeUpdates(): Promise<void> {
        if (!this.options.apiEndpoint) return;

        const updateData = async () => {
            try {
                console.log('🔄 Fetching real-time data...');
                const response = await fetch(this.options.apiEndpoint!);

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const {data} = await response.json();
                const newData: AirQualityData[] = data;
                await this.updateExistingData(newData);

                this.lastUpdateTime = new Date();
                this.updateConnectionStatus('connected');

                // console.log(`✅ Data updated successfully at ${this.lastUpdateTime.toLocaleTimeString()}`);

            } catch (error) {
                console.error('❌ Error fetching real-time data:', error);
                this.updateConnectionStatus('error');
            }
        };

        // Initial load
        await updateData();

        // Setup periodic updates
        this.realTimeInterval = window.setInterval(updateData, this.options.realTimeUpdateInterval!);
    }

    // endregion

    // region Update Existing Data
    private async updateExistingData(newData: AirQualityData[]): Promise<void> {
        const updatedCards: string[] = [];

        newData.forEach(newItem => {
            // Find existing data index
            const existingIndex = this.data.findIndex(item => item.uid === newItem.uid);

            if (existingIndex !== -1) {
                const oldItem = this.data[existingIndex];

                // Update data array
                this.data[existingIndex] = {...newItem, lastUpdated: newItem.lastUpdated};

                // Update cache
                this.dataCache.set(newItem.uid, this.data[existingIndex]);

                // Update UI elements for this card
                this.updateCardUI(newItem.uid, oldItem, this.data[existingIndex]);
                updatedCards.push(newItem.uid);
            } else {
                // Add new card if not exists
                this.data.push({...newItem, lastUpdated: new Date()});
                this.dataCache.set(newItem.uid, newItem);
            }
        });

        // Trigger callback if provided
        if (this.options.onDataUpdate) {
            this.options.onDataUpdate(this.data);
        }

        // console.log(`📊 Updated ${updatedCards.length} cards: ${updatedCards.join(', ')}`);
    }

    // endregion

    // region Update Card UI
    private updateCardUI(cardId: string, oldData: AirQualityData, newData: AirQualityData): void {
        const cardElement = document.getElementById(`card-${cardId}-${this.getCardIndex(cardId)}`);
        if (!cardElement) return;

        // Update status badge if changed
        if (oldData.status !== newData.status) {
            console.log(newData)
            this.updateStatusBadge(cardElement, newData);
        }

        // Update online status if changed
        if (oldData.isOnline !== newData.isOnline) {
            this.updateOnlineStatus(cardElement, newData.isOnline);
        }

        // Update charts with new metric values
        if (newData.metrics) {
            Object.entries(newData.metrics).forEach(([metric, data]) => {
                if (data !== undefined && oldData.metrics?.[metric as keyof typeof oldData.metrics] !== data) {
                    this.updateChartValue(`card-${cardId}-${this.getCardIndex(cardId)}`, metric as any, data.value);
                }
            });
        }

        // Update airIndex chart if data changed
        if (newData.airIndexData && JSON.stringify(oldData.airIndexData) !== JSON.stringify(newData.airIndexData)) {
            this.updateAirIndexChart(`card-${cardId}-${this.getCardIndex(cardId)}`, newData.airIndexData);
        }

        // Update last updated timestamp
        const lastUpdatedElement = cardElement.querySelector('.last-updated');
        if (lastUpdatedElement && newData.lastUpdated) {
            const platformTimezone = newData.timezone || 'Asia/Jakarta';
            const platformLocale = newData.locale || 'id-ID';

            const formattedLastUpdated = this.safeFormatDate(new Date(newData.lastUpdated.toLocaleString()), platformTimezone, platformLocale);
            const timezoneShort = platformTimezone.split('/')[1] || platformTimezone;

            lastUpdatedElement.textContent = `Last updated: ${formattedLastUpdated} (${timezoneShort})`;
        }
    }

    // endregion

    // region Get Card Index
    private getCardIndex(cardId: string): number {
        return this.data.findIndex(item => item.uid === cardId);
    }

    // endregion

    // region Update Status Badge
    private updateStatusBadge(cardElement: HTMLElement, data: AirQualityData): void {
        const badge = cardElement.querySelector('.status-badge');
        console.log(badge)
        if (!badge) return;

        const emoji = badge.querySelector('div:first-child');
        const text = badge.querySelector('div:last-child');

        if (emoji) emoji.textContent = data.emoji;
        if (text) text.textContent = data.status;

        let colorCode = 'bg-green-200';
        if (data.colorCode === 'bg-yellow-200') {
            colorCode = 'bg-yellow-200';
        } else if (data.colorCode === 'bg-orange-200') {
            colorCode = 'bg-orange-200';
        } else if (data.status === 'bg-red-200') {
            colorCode = 'bg-red-200';
        } else if (data.status === 'bg-red-300') {
            colorCode = 'bg-red-300';
        } else if (data.status === 'bg-red-400') {
            colorCode = 'bg-red-400';
        }

        // Update background color
        badge.className = badge.className.replace(/bg-\w+-200/g, colorCode);
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

    // region Update AirIndex Chart
    private updateAirIndexChart(cardId: string, airIndexData: Array<{ timestamp: number; value: number; aqi_from: string }>): void {
        const chartKey = `${cardId}-airIndex`;
        const chart = this.chartInstances.get(chartKey);

        if (chart && chart.series && chart.series[0]) {
            const yValues = airIndexData.map(item => item.value);
            const minY = Math.min(0, Math.min(...yValues));
            const maxY = Math.max(100, Math.max(...yValues));
            const newGradient = createSmoothGradient(minY, maxY);

            // Convert airIndex data to Highcharts format
            const chartData = airIndexData.map((item, index) => {
                const markerColor = this.getAQIColor(item.value);
                const isLastPoint = index === airIndexData.length - 1;
                const isHighValue = item.value > 50;
                const linkVideoPoint = this.getVideoLinkForPoint(cardId, item.timestamp * 1000);

                if (linkVideoPoint.linkVideoRecorded) {
                    if (item.aqi_from === 'TSP') {
                        return {
                            x: item.timestamp * 1000,
                            y: item.value,
                            timestamp: item.timestamp,
                            aqi_from: item.aqi_from,
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
                                                value: item.value,
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
                            y: item.value,
                            timestamp: item.timestamp,
                            aqi_from: item.aqi_from,
                        }
                    }
                } else {
                    return {
                        x: item.timestamp * 1000,
                        y: item.value,
                        timestamp: item.timestamp,
                        aqi_from: item.aqi_from,
                    }
                }
            });

            // Update series dengan data dan gradient baru
            const series = chart.series[0];
            const currentSource = this.currentAQISource.get(cardId) || 'pm25_pm10';

            series.update({
                name: currentSource === 'pm25_pm10' ? 'AQI (PM2.5/PM10)' : 'AQI (TSP)',
                data: chartData,
                fillColor: newGradient
            }, true);

            // Update Y-axis range
            chart.yAxis[0].setExtremes(minY, maxY, true);

            // Update x-axis range
            if (chartData.length > 0) {
                chart.xAxis[0].setExtremes(
                    chartData[0].x,
                    chartData[chartData.length - 1].x,
                    true
                );
            }
        }
    }

    // endregion

    private getVideoLinkForPoint(cardId: string, timestamp: number): {
        uid: string,
        linkVideoId: string,
        linkVideoStatus: string,
        linkVideoRecorded: string
    } {
        const cardData = this.data.find(item => item.uid === cardId.replace(/card-|-\d+$/g, ''));
        const cardDataPoint = cardData?.airIndexData?.find(point => point.timestamp === (timestamp / 1000))
        return {
            uid: cardData?.uid,
            linkVideoId: cardDataPoint?.link_video_id,
            linkVideoStatus: cardDataPoint?.link_video_status,
            linkVideoRecorded: cardDataPoint?.link_video_recorded
        };
    }

    // region Socket.IO Implementation
    private initSocketIO(): void {
        if (!this.options.socketIOUrl || !this.options.socketInstanceName) return;

        try {
            // Setup callbacks for socket events
            const socketCallbacks: SocketEventCallbacks = {
                onConnect: (socketId) => {
                    this.updateConnectionStatus('connected');
                },
                onDisconnect: (reason) => {
                    this.updateConnectionStatus('disconnected');
                },
                onConnectError: (error) => {
                    this.updateConnectionStatus('error');
                },
                onReconnect: (attemptNumber) => {
                    this.updateConnectionStatus('connected');
                },
                onReconnectError: (error) => {
                    this.updateConnectionStatus('error');
                },
                onReconnectFailed: () => {
                    this.updateConnectionStatus('error');
                },
                onLoggerData: (loggerData) => {
                    this.handleLoggerDataUpdate(loggerData);
                },
                onBulkDataUpdate: (bulkData) => {
                    this.updateExistingData(bulkData);
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
                    this.updateConnectionIndicator(status);
                }
            };

            // Get or create socket instance
            this.socketClient = SocketClient.getInstance(
                this.options.socketInstanceName,
                this.options.socketIOUrl,
                this.options.socketIOOptions,
                socketCallbacks
            );

            console.log(`🔌 Socket.IO initialized for Air Quality Manager with instance: ${this.options.socketInstanceName}`);

        } catch (error) {
            console.error('❌ Failed to initialize Socket.IO for Air Quality Manager:', error);
            this.updateConnectionStatus('error');
        }
    }

    // endregion

    // region Handle Logger Data Update
    private handleLoggerDataUpdate(loggerData: LoggerEventData): void {
        // Find the corresponding air quality data
        const existingIndex = this.data.findIndex(item => item.uid === loggerData.uid);

        if (existingIndex !== -1) {
            const oldData = {...this.data[existingIndex]};

            // Calculate AQI from PM2.5 if not provided
            const aqiValue = loggerData.aqi_value || this.calculateAQIFromPM25(loggerData.pm_25);
            const aqiValueTsp = loggerData.airIndexData[0].value_tsp || this.calculateAQIFromTSP(loggerData.tsp);

            // Update airIndex data with new point
            const updatedAirIndexData = this.updateAirIndexData(
                oldData.airIndexData || [],
                loggerData.datetime_unix,
                aqiValue,
                aqiValueTsp,
                loggerData.link_video_id
            );

            // Update metrics with new logger data
            const updatedData: AirQualityData = {
                ...this.data[existingIndex],
                metrics: {
                    ...this.data[existingIndex].metrics,
                    pm10: {
                        ...this.data[existingIndex].metrics?.pm10,
                        value: loggerData.pm_10
                    },
                    pm25: {
                        ...this.data[existingIndex].metrics?.pm25,
                        value: loggerData.pm_25
                    },
                    tsp: {
                        ...this.data[existingIndex].metrics?.tsp,
                        value: loggerData.tsp
                    },
                    noise: {
                        ...this.data[existingIndex].metrics?.noise,
                        value: loggerData.noise
                    }
                },
                airIndexData: loggerData.airIndexData || updatedAirIndexData,
                lastUpdated: new Date(loggerData.datetime_unix * 1000),
                isOnline: true // Update online status when receiving data
            };

            // Update data array
            this.data[existingIndex] = updatedData;

            // Update cache
            this.dataCache.set(loggerData.uid, updatedData);

            // Update UI for this specific card (including airIndex chart)
            this.updateCardUI(loggerData.uid, oldData, updatedData);

            // Trigger callback if provided
            if (this.options.onDataUpdate) {
                this.options.onDataUpdate([updatedData]);
            }

            console.log(`📊 Updated station ${loggerData.uid} with real-time logger data and airIndex`);
        } else {
            console.warn(`⚠️ Station ${loggerData.uid} not found in current data`);
        }
    }

    // endregion

    // region Calculate AQI from PM2.5
    private calculateAQIFromPM25(pm25: number): number {
        // AQI calculation based on PM2.5 concentration
        // Based on a US EPA standard
        const breakpoints = [
            {cLow: 0, cHigh: 12, aqiLow: 0, aqiHigh: 50},      // Good
            {cLow: 12.1, cHigh: 35.4, aqiLow: 51, aqiHigh: 100}, // Moderate
            {cLow: 35.5, cHigh: 55.4, aqiLow: 101, aqiHigh: 150}, // Unhealthy for Sensitive
            {cLow: 55.5, cHigh: 150.4, aqiLow: 151, aqiHigh: 200}, // Unhealthy
            {cLow: 150.5, cHigh: 250.4, aqiLow: 201, aqiHigh: 300}, // Very Unhealthy
            {cLow: 250.5, cHigh: 350.4, aqiLow: 301, aqiHigh: 400}, // Hazardous
            {cLow: 350.5, cHigh: 500.4, aqiLow: 401, aqiHigh: 500}  // Hazardous
        ];

        for (const bp of breakpoints) {
            if (pm25 >= bp.cLow && pm25 <= bp.cHigh) {
                const aqi = ((bp.aqiHigh - bp.aqiLow) / (bp.cHigh - bp.cLow)) * (pm25 - bp.cLow) + bp.aqiLow;
                return Math.round(aqi);
            }
        }

        // If concentration is above the highest breakpoint
        return 500;
    }

    // endregion

    private calculateAQIFromTSP(tsp: number): number {
        // Implementasi perhitungan AQI dari TSP
        // Sesuaikan dengan standar yang digunakan di sistem Anda
        if (tsp <= 230) return Math.round((50 / 230) * tsp);
        if (tsp <= 400) return Math.round(50 + ((100 - 50) / (400 - 230)) * (tsp - 230));
        if (tsp <= 520) return Math.round(100 + ((150 - 100) / (520 - 400)) * (tsp - 400));
        if (tsp <= 650) return Math.round(150 + ((200 - 150) / (650 - 520)) * (tsp - 520));
        if (tsp <= 800) return Math.round(200 + ((300 - 200) / (800 - 650)) * (tsp - 650));
        return Math.min(500, Math.round(300 + ((500 - 300) / (1200 - 800)) * (tsp - 800)));
    }

    // region Update AirIndex Data
    private updateAirIndexData(
        existingAirIndex: Array<{
            timestamp: number;
            value: number;
            value_tsp: number;
            link_video_id?: string;
            link_video_status?: string;
            link_video_recorded?: string;
            aqi_from: string;
        }>,
        newTimestamp: number,
        newValue: number,
        newValueTsp: number,
        linkVideoId?: string
    ): Array<{
        timestamp: number;
        value: number;
        value_tsp: number;
        link_video_id?: string;
        link_video_status?: string;
        link_video_recorded?: string;
        aqi_from: string;
    }> {

        // Create a copy of existing airIndex data
        let updatedAirIndex = [...existingAirIndex];

        // Add new data point with video information
        const newDataPoint = {
            timestamp: newTimestamp,
            value: newValue,
            value_tsp: newValueTsp,
            link_video_id: linkVideoId,
            link_video_status: linkVideoId ? 'pending' : undefined, // Set initial status jika ada video
            link_video_recorded: undefined, // Will be updated when recording completes
            aqi_from: "PM 2.5"
        };

        updatedAirIndex.push(newDataPoint);

        // Sort by timestamp
        updatedAirIndex.sort((a, b) => a.timestamp - b.timestamp);

        // Keep only last 144 points (12 hours with 5-minute intervals)
        const maxPoints = 144;
        if (updatedAirIndex.length > maxPoints) {
            updatedAirIndex = updatedAirIndex.slice(-maxPoints);
        }

        // Remove duplicates based on timestamp
        return updatedAirIndex.filter((item, index, array) =>
            index === 0 || item.timestamp !== array[index - 1].timestamp
        );
    }

    // endregion

    // region Handle Update Single Station
    private updateSingleStation(stationData: AirQualityData): void {
        const existingIndex = this.data.findIndex(item => item.uid === stationData.uid);

        if (existingIndex !== -1) {
            const oldData = this.data[existingIndex];
            this.data[existingIndex] = {...stationData, lastUpdated: new Date()};
            this.updateCardUI(stationData.uid, oldData, this.data[existingIndex]);
        }
    }

    // endregion

    // region Update Station Status
    private updateStationStatus(stationId: string, status: string, isOnline: boolean): void {
        const stationIndex = this.data.findIndex(item => item.uid === stationId);

        if (stationIndex !== -1) {
            const oldData = this.data[stationIndex];
            this.data[stationIndex] = {
                ...this.data[stationIndex],
                status: status as any,
                isOnline,
                lastUpdated: new Date()
            };

            this.updateCardUI(stationId, oldData, this.data[stationIndex]);
        }
    }

    // endregion

    // region Update Connection Status
    private updateConnectionStatus(status: 'connected' | 'disconnected' | 'error'): void {
        this.connectionStatus = status;

        if (this.options.onConnectionStatus) {
            this.options.onConnectionStatus(status);
        }

        // Update UI indicator if exists
        this.updateConnectionIndicator(status);
    }

    // endregion

    // region Update Connection Indicator
    private updateConnectionIndicator(status: 'connected' | 'disconnected' | 'error'): void {
        const indicator = document.querySelector('.connection-status');
        if (!indicator) return;

        const statusConfig = {
            connected: {color: 'bg-green-500', text: 'Connected'},
            disconnected: {color: 'bg-yellow-500', text: 'Disconnected'},
            error: {color: 'bg-red-500', text: 'Error'}
        };

        const config = statusConfig[status];
        indicator.className = `connection-status flex items-center gap-2 ${config.color}`;
        indicator.textContent = config.text;
    }

    // endregion

    // region Public API Methods
    public startRealTimeMode(): void {
        // Start Socket.IO for real-time updates if configured
        if (this.options.enableSocketIO && this.options.socketIOUrl) {
            this.initSocketIO();
        }

        // Start periodic polling only if Socket.IO is not enabled
        if (this.options.apiEndpoint && this.options.realTimeUpdateInterval) {
            this.startRealTimeUpdates().catch((error) => {
                console.error(error);
            })
        }
    }

    public stopRealTimeMode(): void {
        if (this.realTimeInterval) {
            clearInterval(this.realTimeInterval);
            this.realTimeInterval = undefined;
        }

        if (this.socket) {
            this.socket.disconnect();
            this.socket = undefined;
        }
    }

    public async refreshData(): Promise<void> {
        if (this.options.apiEndpoint) {
            await this.loadInitialData();
        }
    }

    public getConnectionStatus(): 'connected' | 'disconnected' | 'error' {
        return this.connectionStatus;
    }

    public getLastUpdateTime(): Date {
        return this.lastUpdateTime;
    }

    public async forceUpdate(): Promise<void> {
        if (this.options.apiEndpoint) {
            return fetch(this.options.apiEndpoint)
                .then(response => response.json())
                .then(result => {
                    const data = Array.isArray(result) ? result : result.data || [];
                    return this.updateExistingData(data);
                });
        }
        return Promise.resolve();
    }

    public emitToServer(event: string, data: any): void {
        if (this.socket && this.socket.connected) {
            this.socket.emit(event, data);
            console.log(`📤 Emitted event '${event}' to server:`, data);
        } else {
            console.warn('⚠️ Socket.IO not connected. Cannot emit event:', event);
        }
    }

    public getSocketId(): string | undefined {
        return this.socket?.id;
    }

    public isSocketConnected(): boolean {
        return this.socket?.connected || false;
    }

    public getStationCount(): number {
        return this.data.length;
    }

    public getOnlineStationCount(): number {
        return this.data.filter(station => station.isOnline).length;
    }

    // endregion

    // region Load Data
    async loadData(dataSource: AirQualityData[] | string | (() => Promise<AirQualityData[]>)): Promise<void> {
        try {
            if (Array.isArray(dataSource)) {
                this.data = dataSource;
            } else if (typeof dataSource === 'string') {
                const response = await fetch(dataSource);
                const {data} = await response.json()
                this.data = data
            } else if (typeof dataSource === 'function') {
                this.data = await dataSource();
            }
        } catch (error) {
            console.error('Error loading data:', error);
            this.data = [];
        }
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

    // region Filter AirIndex Source (Updated untuk menggunakan data dari database)
    private filterAirIndexSource(cardId: string, sourceType: 'pm25_pm10' | 'tsp'): void {
        // Update current source tracking
        this.currentAQISource.set(cardId, sourceType);

        // Get card data
        const cardData = this.data.find(item => item.uid === cardId.replace(/card-|-\d+$/g, ''));
        if (!cardData || !cardData.airIndexData) return;

        // Convert data untuk chart berdasarkan source yang dipilih
        const chartData = this.convertAirIndexDataForChart(cardData.airIndexData, sourceType);

        // Update chart dengan data baru
        this.updateAirIndexChart(cardId, chartData);

        console.log(`🔄 Updated AQI chart for ${cardId} to use ${sourceType} source`);
    }
    // endregion

    // region Convert AirIndex Data For Chart
    private convertAirIndexDataForChart(
        airIndexData: Array<{
            timestamp: number;
            value: number;
            value_tsp: number;
            link_video_id?: string;
            link_video_status?: string;
            link_video_recorded?: string;
            aqi_from: string;
        }>,
        sourceType: 'pm25_pm10' | 'tsp'
    ): Array<{ timestamp: number; value: number; aqi_from: string; link_video_id?: string; link_video_status?: string; link_video_recorded?: string }> {

        return airIndexData.map(item => ({
            timestamp: item.timestamp,
            value: sourceType === 'pm25_pm10' ? item.value : item.value_tsp,
            aqi_from: sourceType === 'tsp' ? 'TSP' : item.aqi_from,
            link_video_id: item.link_video_id,
            link_video_status: item.link_video_status,
            link_video_recorded: item.link_video_recorded
        }));
    }
    // endregion

    // region Create Single Card
    private createSingleCard(data: AirQualityData, index: number): HTMLElement {
        const cardId = `card-${data.uid}-${index}`;

        // Main card container
        const card = this.createElement('div', 'card !mb-0 cursor-pointer');
        card.dataset.index = index.toString();
        card.id = cardId;

        const cardBody = this.createElement('div', 'card-body');

        // Header section
        const headerFlex = this.createElement('div', 'card-dashboard-header');
        const leftSection = this.createElement('div', 'left-section');
        const idTitle = this.createElement('div', 'idle-title', data.uid);

        if (data.location) {
            const locationDiv = this.createElement('div', 'text-[12px] text-gray-500', data.location);
            leftSection.appendChild(locationDiv);
        }

        const statusContainer = this.createElement('div', 'status');

        // Status badge
        const badge = this.createElement('div', `status-badge inline-flex items-center rounded-full gap-1 px-[4px] py-[3px] ${data.colorCode} text-[12px] font-bold`);
        const emoji = this.createElement('div');
        emoji.textContent = data.emoji;
        const statusText = this.createElement('div', 'mr-1', data.status);
        badge.appendChild(emoji);
        badge.appendChild(statusText);

        // Online status
        const onlineContainer = this.createElement('div', 'online-status-container');
        const indicator = this.createElement('div', `${data.isOnline ? 'online' : 'offline'}`);
        const onlineText = this.createElement('div', 'text-[14px]', data.isOnline ? 'Online' : 'Offline');
        onlineContainer.appendChild(indicator);
        onlineContainer.appendChild(onlineText);

        // Site
        const siteContainer = this.createElement('div', 'flex items-center gap-2 text-[14px]')
        const siteIcon = this.createElement('i', 'fas fa-location-dot')
        const siteText = this.createElement('div')
        siteText.textContent = data.siteName
        siteContainer.appendChild(siteIcon)
        siteContainer.appendChild(siteText)

        statusContainer.appendChild(badge);
        statusContainer.appendChild(onlineContainer);
        statusContainer.appendChild(siteContainer);
        leftSection.appendChild(idTitle);
        leftSection.appendChild(statusContainer);

        // Right side - CCTV icon
        const rightSection = this.createElement('div', 'right-section');
        const cctvLink = this.createElement('a', 'cursor-pointer') as HTMLAnchorElement;
        const cctvImg = document.createElement('img');
        if (!data.cctvLink) {
            cctvImg.src = data.cctvIconPath || '/images/vector/icons8-cctv-disabled-100.png';
            cctvLink.className = 'cursor-not-allowed'
        } else {
            cctvImg.src = data.cctvIconPath || '/images/vector/icons8-cctv-100.png';
            cctvLink.className = 'cursor-pointer'
        }

        cctvImg.width = 24;
        cctvImg.alt = 'cctv';
        cctvLink.appendChild(cctvImg);
        rightSection.appendChild(cctvLink);

        if (data.cctvLink) {
            if (this.options.onCctvClick) {
                cctvLink.addEventListener('click', () => this.options.onCctvClick!(data.uid, data.cctvLink));
            }
        }

        if (this.options.onHeartbeatStatusClick) {
            onlineContainer.addEventListener('click', () => this.options.onHeartbeatStatusClick!(data.uid));
        }

        if (this.options.onSiteLocationClick) {
            siteContainer.addEventListener('click', () => this.options.onSiteLocationClick!(data.uid, data.lat, data.lng));
        }

        headerFlex.appendChild(leftSection);
        headerFlex.appendChild(rightSection);

        // Metrics section with charts
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
                bml_max: data.metrics?.pm25?.bml_max
            },
            {
                title: 'PM10',
                type: 'pm10' as const,
                value: data.metrics?.pm10?.value || 0,
                bml_min: data.metrics?.pm10?.bml_min,
                bml_min_buffer: data.metrics?.pm10?.bml_min_buffer,
                bml_max_buffer: data.metrics?.pm10?.bml_max_buffer,
                bml_max: data.metrics?.pm10?.bml_max
            },
            {
                title: 'TSP',
                type: 'tsp' as const,
                value: data.metrics?.tsp?.value || 0,
                bml_min: data.metrics?.tsp?.bml_min,
                bml_min_buffer: data.metrics?.tsp?.bml_min_buffer,
                bml_max_buffer: data.metrics?.tsp?.bml_max_buffer,
                bml_max: data.metrics?.tsp?.bml_max
            },
            {
                title: 'Noise',
                type: 'noise' as const,
                value: data.metrics?.noise?.value || 0,
                bml_min: data.metrics?.noise?.bml_min,
                bml_min_buffer: data.metrics?.noise?.bml_min_buffer,
                bml_max_buffer: data.metrics?.noise?.bml_max_buffer,
                bml_max: data.metrics?.noise?.bml_max
            }
        ];

        metrics.forEach(metric => {
            const metricCard: HTMLElement = this.createElement('div', 'border rounded-md');
            const titleDiv = this.createElement('div', 'font-bold text-[12px] m-2 mb-2', metric.title);
            const chartDiv = this.createElement('div', `chart-${metric.type}`);
            chartDiv.id = `${cardId}-${metric.type}`;

            metricCard.appendChild(titleDiv);
            metricCard.appendChild(chartDiv);
            metricsGrid.appendChild(metricCard);

            if (this.options.onMetricsClick) {
                metricCard.addEventListener('click', () => this.options.onMetricsClick!(data.uid, metric));
            }

            // Create gauge chart after DOM insertion
            setTimeout(() => {
                this.createGaugeChart(data.uid, chartDiv, metric.title, metric.type, metric.bml_min, metric.bml_max, metric.value, cardId, metricCard);
            }, 100);
        });

        metricsContainer.appendChild(metricsGrid);

        // AirIndex section
        const airIndexSection = this.createElement('div', 'mt-4');
        const airIndexTitle = this.createElement('div', 'font-bold text-[14px]', 'Air Quality Index');
        const airIndexSubTitle = this.createElement('div', 'text-[11px] mb-4 flex items-center gap-2');
        // const subText = this.createElement('span', '', 'Based on PM 2.5 / PM 10');
        const ddWrap = this.createElement('div', 'relative');
        const ddButton = this.createElement('button', 'inline-flex items-center gap-1 text-xs hover:bg-gray-50 dark:hover:bg-gray-800') as HTMLButtonElement;
        ddButton.id = `${cardId}-dropdownButton`;
        ddButton.type = 'button';
        ddButton.innerHTML = `
            <span class="subText">Based on PM 2.5 / PM 10</span>
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
                if (value === 'pm25_pm10') subText.textContent = 'Based on PM 2.5 / PM 10';
                if (value === 'tsp') subText.textContent = 'Based on TSP';

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

        // airIndexSubTitle.appendChild(subText);
        airIndexSubTitle.appendChild(ddWrap);

        const airIndexChart = this.createElement('div', 'chart-one');
        airIndexChart.id = `${cardId}-airIndex`;

        airIndexSection.appendChild(airIndexTitle);
        airIndexSection.appendChild(airIndexSubTitle);
        airIndexSection.appendChild(airIndexChart);

        // Create airIndex chart after DOM insertion
        setTimeout(() => {
            this.createAirIndexChart(airIndexChart, data.airIndexData, cardId);
        }, 200);

        const ddOptions: DropdownOptions = {
            placement: 'bottom-end',
            triggerType: 'click',
            offsetSkidding: 100,
            offsetDistance: 8,
            delay: 150,
            onShow: () => console.log(`[${cardId}] dropdown shown`),
            onHide: () => console.log(`[${cardId}] dropdown hidden`),
            onToggle: () => console.log(`[${cardId}] dropdown toggled`),
        };

        const instanceOptions: InstanceOptions = {
            id: ddMenu.id,
            override: true
        };

        const dropdown: DropdownInterface = new Dropdown(
            ddMenu,
            ddButton,
            ddOptions,
            instanceOptions
        );

        if (data.lastUpdated) {
            const platformTimezone = data.timezone || 'Asia/Jakarta';
            const platformLocale = data.locale || 'id-ID';

            const formattedLastUpdated = this.safeFormatDate(data.lastUpdated, platformTimezone, platformLocale);
            const timezoneShort = platformTimezone.split('/')[1] || platformTimezone;

            const lastUpdatedDiv = this.createElement('div', 'text-[10px] text-gray-400 mt-4 last-updated',
                `Last updated: ${formattedLastUpdated} (${timezoneShort})`);
            airIndexSection.appendChild(lastUpdatedDiv);
        }

        // Assemble card
        cardBody.appendChild(headerFlex);
        cardBody.appendChild(metricsContainer);
        cardBody.appendChild(airIndexSection);
        card.appendChild(cardBody);

        return card;
    }

    // endregion

    // region Update Chart Value
    updateChartValue(cardId: string, chartType: 'pm10' | 'pm25' | 'pm1' | 'noise', newValue: number): void {
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

    // endregion

    // region Render Batch
    renderBatch(batch: AirQualityData[], startIndex: number): void {
        if (!this.container) return;

        const fragment = document.createDocumentFragment();
        batch.forEach((data, i) => {
            const card = this.createSingleCard(data, startIndex + i);
            fragment.appendChild(card);
        });

        this.container.appendChild(fragment);
    }

    // endregion

    // region Render All
    renderAll(): void {
        if (!this.container) {
            console.error('Container not found. Please set container or use setContainer()');
            return;
        }

        this.container.innerHTML = '';

        const batchSize = this.options.batchSize || 20;
        const initialBatch = this.data.slice(0, batchSize);
        this.renderBatch(initialBatch, 0);

        if (this.data.length > batchSize && this.options.enableLazyLoading) {
            this.setupInfiniteScroll();
        } else if (this.data.length > batchSize) {
            const remainingBatch = this.data.slice(batchSize);
            this.renderBatch(remainingBatch, batchSize);
        }
    }

    // endregion

    // region Setup Infinite Scroll
    private setupInfiniteScroll(): void {
        let currentBatch = 1;
        const batchSize = this.options.batchSize || 20;

        const sentinel = this.createElement('div', 'h-4 w-full');
        this.container!.appendChild(sentinel);

        const sentinelObserver = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                const start = currentBatch * batchSize;
                const end = start + batchSize;
                const nextBatch = this.data.slice(start, end);

                if (nextBatch.length > 0) {
                    this.renderBatch(nextBatch, start);
                    currentBatch++;
                } else {
                    sentinelObserver.disconnect();
                    sentinel.remove();
                }
            }
        });

        sentinelObserver.observe(sentinel);
    }

    // endregion

    // region Set Container
    setContainer(container: HTMLElement | string): void {
        this.container = typeof container === 'string'
            ? document.querySelector(container)
            : container;
    }

    // endregion

    // region Destroy
    destroy(): void {
        // Stop real-time updates
        this.stopRealTimeMode();

        // Clear all chart intervals
        this.chartIntervals.forEach(interval => clearInterval(interval));
        this.chartIntervals.clear();

        // Destroy all chart instances
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

        this.data = [];
        this.dataCache.clear();
        this.visibleCards.clear();
    }

    // endregion

    // region Filter
    filter(predicate: (data: AirQualityData) => boolean): void {
        const filteredData = this.data.filter(predicate);
        const originalData = [...this.data];
        this.data = filteredData;
        this.renderAll();
        this.data = originalData;
    }

    // endregion

    // region Search
    search(query: string): void {
        const searchResults = this.data.filter(item =>
            item.uid.toLowerCase().includes(query.toLowerCase()) ||
            item.location?.toLowerCase().includes(query.toLowerCase()) ||
            item.status.toLowerCase().includes(query.toLowerCase())
        );

        const originalData = [...this.data];
        this.data = searchResults;
        this.renderAll();
        this.data = originalData;
    }

    // endregion

    // region Get Data Count
    getDataCount(): number {
        return this.data.length;
    }

    // endregion
}

export {AirQualityCardManager, type AirQualityData, type CardManagerOptions, type MetricsData, type LoggerEventData};
