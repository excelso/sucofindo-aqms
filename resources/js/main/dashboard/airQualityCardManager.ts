import Highcharts from 'highcharts'
import "highcharts/highcharts-more";
import "highcharts/modules/solid-gauge";
import {data} from "autoprefixer";

interface AirQualityData {
    uid: string;
    status: string;
    emoji?: string;
    colorCode?: string;
    isOnline: boolean;
    cctvIconPath?: string;
    metrics?: {
        pm10?: {
            value?: number,
            bml?: number,
            buffer?: number
        };
        pm25?: {
            value?: number,
            bml?: number,
            buffer?: number
        };
        tsp?: {
            value?: number,
            bml?: number,
            buffer?: number
        };
        noise?: {
            value?: number,
            bml?: number,
            buffer?: number
        };
    };
    location?: string;
    lastUpdated?: Date;
    forecastData?: Array<{ timestamp: number; value: number }>; // Unix timestamp
    cctvLink?: string;
}

interface MetricsData {
    title: string;
    type: string;
    value: number;
    bml: number;
    buffer: number
}

interface CardManagerOptions {
    containerSelector?: string;
    batchSize?: number;
    enableVirtualization?: boolean;
    enableLazyLoading?: boolean;
    enableCharts?: boolean;
    chartUpdateInterval?: number;
    realTimeUpdateInterval?: number;
    apiEndpoint?: string;
    enableWebSocket?: boolean;
    webSocketUrl?: string;
    onCctvClick?: (id: string, cctvLink: string) => void;
    onMetricsClick?: (id: string, metrics: MetricsData) => void;
    onDataUpdate?: (updatedData: AirQualityData[]) => void;
    onConnectionStatus?: (status: 'connected' | 'disconnected' | 'error') => void;
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
    private webSocket?: WebSocket;
    private connectionStatus: 'connected' | 'disconnected' | 'error' = 'disconnected';
    private lastUpdateTime: Date = new Date();
    private dataCache: Map<string, AirQualityData> = new Map();

    constructor(options: CardManagerOptions = {}) {
        this.options = {
            batchSize: 20,
            enableVirtualization: false,
            enableLazyLoading: true,
            enableCharts: true,
            chartUpdateInterval: 0, // Disable auto-update, use real-time instead
            realTimeUpdateInterval: 120000, // 2 minutes default
            enableWebSocket: false,
            ...options
        };

        if (options.containerSelector) {
            this.container = document.querySelector(options.containerSelector);
        }

        // Initialize real-time updates if configured
        if (this.options.apiEndpoint && this.options.realTimeUpdateInterval) {
            this.startRealTimeUpdates();
        }

        // Initialize WebSocket if configured
        if (this.options.enableWebSocket && this.options.webSocketUrl) {
            this.initWebSocket();
        }
    }

    // Chart Helper Functions
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

    // Create Gauge Chart
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
            noise: 'db'
        };

        const suffixMap = {
            pm10: ' PM10',
            pm25: ' PM2.5',
            tsp: ' TSP',
            noise: ' dB'
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
                // tooltip: { valueSuffix: suffixMap[type] },
                dataLabels: {
                    formatter: function () {
                        const decimals = type === 'noise' ? 0 : 1;
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

        // region Setup auto-update interval (Testing Only)
        // if (this.options.chartUpdateInterval && this.options.chartUpdateInterval > 0) {
        //     const interval = setInterval(() => {
        //         if (chart && chart.series && chart.series[0]) {
        //             const series = chart.series[0];
        //             const newValue = Math.random() * (75.5 - 20.5) + 20.5;
        //
        //             const currentValue = series.points[0].y;
        //             let step = 0;
        //             const steps = 30;
        //
        //             const animationInterval = setInterval(() => {
        //                 step++;
        //                 const interpolated = currentValue + (newValue - currentValue) * (step / steps);
        //                 series.points[0].update(interpolated, true, false);
        //
        //                 if (step >= steps) {
        //                     clearInterval(animationInterval);
        //                     series.setData([newValue], true, {duration: 0});
        //
        //                     if (this.options.onMetricsClick) {
        //                         metricCard.addEventListener('click', () => this.options.onMetricsClick!(id, {
        //                             title: title,
        //                             type: type,
        //                             value: newValue,
        //                             bml: bml,
        //                             buffer: buffer
        //                         }));
        //                     }
        //                 }
        //             }, 1000 / steps);
        //         }
        //     }, this.options.chartUpdateInterval);
        //
        //     this.chartIntervals.set(`${cardId}-${type}`, interval);
        // }
        // endregion
    }

    // Create Forecast Chart
    private createForecastChart(element: HTMLElement, data: Array<{
        timestamp: number;
        value: number
    }>, cardId: string): void {
        if (!this.options.enableCharts || typeof Highcharts === 'undefined') {
            return;
        }

        const getAQIColor = (aqiValue) => {
            const categories = [
                {min: 0, max: 50, color: '#22C55E'},      // Baik
                {min: 51, max: 100, color: '#EAB308'},    // Sedang
                {min: 101, max: 150, color: '#F97316'},   // Tidak sehat sensitif
                {min: 151, max: 200, color: '#EF4444'},   // Tidak sehat
                {min: 201, max: 300, color: '#DC2626'},   // Sangat tidak sehat
                {min: 301, max: 500, color: '#B91C1C'},   // Berbahaya
            ];

            const category = categories.find(cat => aqiValue >= cat.min && aqiValue <= cat.max);
            return category ? category.color : '#7F1D1D'; // Default untuk >500
        };

        // Default data with Unix timestamps (current time and hourly intervals)
        const now = Math.floor(new Date().setHours(0, 1, 0, 0) / 1000);
        const defaultData = data || Array.from({length: 144}, (_, i) => ({
            timestamp: now + (i * 300), // Add 1-hour intervals
            value: Math.floor(Math.random() * 50) + 20
        }));

        // Helper function to format Unix timestamp for display
        const formatTimestamp = (timestamp: number, format: 'time' | 'datetime' = 'time'): string => {
            const date = new Date(timestamp * 1000);

            if (format === 'time') {
                return date.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                });
            } else {
                return date.toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                });
            }
        };

        // Prepare chart data
        const chartData = defaultData.map(item => ({
            x: item.timestamp * 1000, // Highcharts expects milliseconds
            y: item.value,
            timestamp: item.timestamp
        }));

        const chart = Highcharts.chart({
            chart: {
                renderTo: element,
                type: 'spline',
                marginLeft: 45,
                // marginRight: 10,
                height: 150,
                style: {
                    fontFamily: 'Arial, sans-serif'
                }
            },
            title: {text: null},
            credits: {enabled: false},
            xAxis: {
                type: 'datetime',
                labels: {
                    formatter: function () {
                        // Format as HH:MM for display
                        const value = (this as any).value as number;
                        return formatTimestamp(value / 1000, 'time');
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
                tickInterval: 3600 * 2000, // 1-hour intervals in milliseconds
                // min: chartData[0]?.x,
                // max: chartData[chartData.length - 1]?.x
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
                min: 0,
                // max: 500
            },
            legend: {enabled: false},
            tooltip: {
                backgroundColor: 'white',
                borderWidth: 0,
                borderRadius: 8,
                shadow: true,
                style: {fontSize: '12px'},
                formatter: function () {
                    const timestamp = this.x / 1000;
                    return `<b>Time:</b> ${formatTimestamp(timestamp, 'datetime')}<br><b>AQI:</b> ${this.y}`;
                }
            },
            plotOptions: {
                spline: {
                    lineWidth: 3,
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
                    }
                }
            },
            series: [{
                type: 'areaspline',
                name: 'AQI Forecast',
                data: chartData,
                color: {
                    linearGradient: {x1: 0, x2: 0, y1: 1, y2: 0}, // vertical gradient
                    stops: [
                        [0, '#22C55E'],
                        [0.1, '#EAB308'],
                        [0.2, '#F97316'],
                        [0.3, '#EF4444'],
                        [0.4, '#DC2626'],
                        [0.6, '#B91C1C'],
                        [1, '#7F1D1D']
                    ]
                },
                marker: {
                    lineWidth: 2,
                    lineColor: 'white',
                    fillColor: '#4CAF50',
                    radius: 0,
                    symbol: 'circle'
                }
            }]
        }, function (chart) {
            const series = chart.series[0];
            const lastPoint = series.data[series.data.length - 1];

            if (lastPoint) {
                const aqiValue = lastPoint.y;
                const markerColor = getAQIColor(aqiValue);

                lastPoint.update({
                    marker: {
                        enabled: true,
                        radius: 6,
                        fillColor: markerColor,
                        lineWidth: 2,
                        lineColor: 'white'
                    }
                }, false);
                chart.redraw();
            }
        });

        this.chartInstances.set(`${cardId}-forecast`, chart);
    }

    // Real-time Data Management
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

                console.log(`✅ Data updated successfully at ${this.lastUpdateTime.toLocaleTimeString()}`);

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

    private async updateExistingData(newData: AirQualityData[]): Promise<void> {
        const updatedCards: string[] = [];

        newData.forEach(newItem => {
            // Find existing data index
            const existingIndex = this.data.findIndex(item => item.uid === newItem.uid);

            if (existingIndex !== -1) {
                const oldItem = this.data[existingIndex];

                // Update data array
                this.data[existingIndex] = {...newItem, lastUpdated: new Date()};

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

        console.log(`📊 Updated ${updatedCards.length} cards: ${updatedCards.join(', ')}`);
    }

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
            // console.log(Object.entries(newData.metrics))
            Object.entries(newData.metrics).forEach(([metric, data]) => {
                if (data !== undefined && oldData.metrics?.[metric as keyof typeof oldData.metrics] !== data) {
                    this.updateChartValue(`card-${cardId}-${this.getCardIndex(cardId)}`, metric as any, data.value);
                }
            });
        }

        // Update forecast chart if data changed
        if (newData.forecastData && JSON.stringify(oldData.forecastData) !== JSON.stringify(newData.forecastData)) {
            this.updateForecastChart(`card-${cardId}-${this.getCardIndex(cardId)}`, newData.forecastData);
        }

        // Update last updated timestamp
        const lastUpdatedElement = cardElement.querySelector('.last-updated');
        if (lastUpdatedElement && newData.lastUpdated) {
            lastUpdatedElement.textContent = `Last updated: ${newData.lastUpdated.toLocaleString()}`;
        }
    }

    private getCardIndex(cardId: string): number {
        return this.data.findIndex(item => item.uid === cardId);
    }

    private updateStatusBadge(cardElement: HTMLElement, data: AirQualityData): void {
        const badge = cardElement.querySelector('.status-badge');
        console.log(badge)
        if (!badge) return;

        const emoji = badge.querySelector('div:first-child');
        const text = badge.querySelector('div:last-child');

        if (emoji) emoji.textContent = data.emoji;
        if (text) text.textContent = data.status;

        // Update background color
        badge.className = badge.className.replace(/bg-\w+-200/g, data.colorCode);
    }

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

    private updateForecastChart(cardId: string, forecastData: Array<{ timestamp: number; value: number }>): void {
        const chartKey = `${cardId}-forecast`;
        const chart = this.chartInstances.get(chartKey);

        if (chart && chart.series && chart.series[0]) {
            // Convert forecast data to Highcharts format
            const chartData = forecastData.map(item => ({
                x: item.timestamp * 1000, // Convert to milliseconds
                y: item.value,
                timestamp: item.timestamp
            }));

            // Update series data
            chart.series[0].setData(chartData, true);

            // Update x-axis range
            if (chartData.length > 0) {
                chart.xAxis[0].setExtremes(
                    chartData[0].x,
                    chartData[chartData.length - 1].x,
                    true
                );
            }

            // Highlight the last point
            setTimeout(() => {
                const series = chart.series[0];
                const lastPointIndex = series.data.length - 1;
                if (series.data[lastPointIndex]) {
                    series.data[lastPointIndex].update({
                        marker: {
                            enabled: true,
                            radius: 6,
                            fillColor: '#4CAF50',
                            lineWidth: 2,
                            lineColor: 'white'
                        }
                    }, false);
                    chart.redraw();
                }
            }, 100);
        }
    }

    // WebSocket Implementation
    private initWebSocket(): void {
        if (!this.options.webSocketUrl) return;

        try {
            this.webSocket = new WebSocket(this.options.webSocketUrl);

            this.webSocket.onopen = () => {
                console.log('🔌 WebSocket connected');
                this.updateConnectionStatus('connected');
            };

            this.webSocket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleWebSocketMessage(data);
                } catch (error) {
                    console.error('❌ Error parsing WebSocket message:', error);
                }
            };

            this.webSocket.onclose = () => {
                console.log('🔌 WebSocket disconnected');
                this.updateConnectionStatus('disconnected');

                // Auto-reconnect after 5 seconds
                setTimeout(() => {
                    if (this.options.enableWebSocket) {
                        this.initWebSocket();
                    }
                }, 5000);
            };

            this.webSocket.onerror = (error) => {
                console.error('❌ WebSocket error:', error);
                this.updateConnectionStatus('error');
            };

        } catch (error) {
            console.error('❌ Failed to initialize WebSocket:', error);
            this.updateConnectionStatus('error');
        }
    }

    private handleWebSocketMessage(message: any): void {
        switch (message.type) {
            case 'STATION_UPDATE':
                // Update single station
                this.updateSingleStation(message.data);
                break;

            case 'BULK_UPDATE':
                // Update multiple stations
                this.updateExistingData(message.data);
                break;

            case 'STATUS_CHANGE':
                // Handle status changes
                this.updateStationStatus(message.stationId, message.status, message.isOnline);
                break;

            case 'HEARTBEAT':
                // Handle heartbeat to keep the connection alive
                this.lastUpdateTime = new Date();
                break;

            default:
                console.warn('Unknown WebSocket message type:', message.type);
        }
    }

    private updateSingleStation(stationData: AirQualityData): void {
        const existingIndex = this.data.findIndex(item => item.uid === stationData.uid);

        if (existingIndex !== -1) {
            const oldData = this.data[existingIndex];
            this.data[existingIndex] = {...stationData, lastUpdated: new Date()};
            this.updateCardUI(stationData.uid, oldData, this.data[existingIndex]);
        }
    }

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

    private updateConnectionStatus(status: 'connected' | 'disconnected' | 'error'): void {
        this.connectionStatus = status;

        if (this.options.onConnectionStatus) {
            this.options.onConnectionStatus(status);
        }

        // Update UI indicator if exists
        this.updateConnectionIndicator(status);
    }

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

    // Public API Methods
    public startRealTimeMode(): void {
        if (this.options.apiEndpoint && this.options.realTimeUpdateInterval) {
            this.startRealTimeUpdates();
        }

        if (this.options.enableWebSocket && this.options.webSocketUrl) {
            this.initWebSocket();
        }
    }

    public stopRealTimeMode(): void {
        if (this.realTimeInterval) {
            clearInterval(this.realTimeInterval);
            this.realTimeInterval = undefined;
        }

        if (this.webSocket) {
            this.webSocket.close();
            this.webSocket = undefined;
        }
    }

    public getConnectionStatus(): 'connected' | 'disconnected' | 'error' {
        return this.connectionStatus;
    }

    public getLastUpdateTime(): Date {
        return this.lastUpdateTime;
    }

    public forceUpdate(): Promise<void> {
        if (this.options.apiEndpoint) {
            return fetch(this.options.apiEndpoint)
                .then(response => response.json())
                .then(data => this.updateExistingData(data));
        }
        return Promise.resolve();
    }

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

    private getStatusConfig(status: string) {
        const statusConfigs = {
            'Very Good': {emoji: '😍', bgColor: 'bg-green-400/50'},
            'Good': {emoji: '😊', bgColor: 'bg-green-200'},
            'Moderate': {emoji: '😞', bgColor: 'bg-orange-200'},
            'Unhealthy': {emoji: '😷', bgColor: 'bg-red-200'}
        };
        return statusConfigs[status] || statusConfigs['Moderate'];
    }

    private createElement(tag: string, className?: string, textContent?: string): HTMLElement {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (textContent) element.textContent = textContent;
        return element;
    }

    private createSingleCard(data: AirQualityData, index: number): HTMLElement {
        const cardId = `card-${data.uid}-${index}`;

        // Main card container
        const card = this.createElement('div', 'card mb-4 cursor-pointer');
        card.dataset.index = index.toString();
        card.id = cardId;

        const cardBody = this.createElement('div', 'card-body');

        // Header section
        const headerFlex = this.createElement('div', 'flex items-center');
        const leftSection = this.createElement('div', 'flex-1');
        const idTitle = this.createElement('div', 'text-[20px] font-bold', data.uid);

        if (data.location) {
            const locationDiv = this.createElement('div', 'text-[12px] text-gray-500', data.location);
            leftSection.appendChild(locationDiv);
        }

        const statusContainer = this.createElement('div', 'flex items-center gap-4');

        // Status badge
        const badge = this.createElement('div', `status-badge inline-flex items-center rounded-full gap-1 px-[4px] py-[3px] ${data.colorCode} text-[12px] font-bold`);
        const emoji = this.createElement('div');
        emoji.textContent = data.emoji;
        const statusText = this.createElement('div', 'mr-1', data.status);
        badge.appendChild(emoji);
        badge.appendChild(statusText);

        // Online status
        const onlineContainer = this.createElement('div', 'flex items-center gap-2');
        const indicator = this.createElement('div', `h-[10px] w-[10px] rounded-full ${data.isOnline ? 'bg-green-500' : 'bg-red-500'}`);
        const onlineText = this.createElement('div', 'text-[14px]', data.isOnline ? 'Online' : 'Offline');
        onlineContainer.appendChild(indicator);
        onlineContainer.appendChild(onlineText);

        statusContainer.appendChild(badge);
        statusContainer.appendChild(onlineContainer);
        leftSection.appendChild(idTitle);
        leftSection.appendChild(statusContainer);

        // Right side - CCTV icon
        const rightSection = this.createElement('div', 'flex justify-end');
        const cctvLink = this.createElement('a', 'cursor-pointer') as HTMLAnchorElement;
        const cctvImg = document.createElement('img');
        cctvImg.src = data.cctvIconPath || '/images/vector/icons8-cctv-100.png';
        cctvImg.width = 24;
        cctvImg.alt = 'cctv';
        cctvLink.appendChild(cctvImg);
        rightSection.appendChild(cctvLink);

        if (this.options.onCctvClick) {
            cctvLink.addEventListener('click', () => this.options.onCctvClick!(data.uid, data.cctvLink));
        }

        headerFlex.appendChild(leftSection);
        headerFlex.appendChild(rightSection);

        // Metrics section with charts
        const metricsContainer = this.createElement('div', 'mt-4');
        const metricsGrid = this.createElement('div', 'grid grid-cols-4 gap-2');

        const metrics = [
            {
                title: 'PM10',
                type: 'pm10' as const,
                value: data.metrics?.pm10?.value || Math.random() * 50 + 20,
                bml: data.metrics?.pm10?.bml,
                buffer: data.metrics?.pm10.buffer
            },
            {
                title: 'PM2.5',
                type: 'pm25' as const,
                value: data.metrics?.pm25?.value || Math.random() * 40 + 15,
                bml: data.metrics?.pm25?.bml,
                buffer: data.metrics?.pm25.buffer
            },
            {
                title: 'TSP',
                type: 'tsp' as const,
                value: data.metrics?.tsp?.value || Math.random() * 30 + 10,
                bml: data.metrics?.tsp?.bml,
                buffer: data.metrics?.tsp.buffer
            },
            {
                title: 'Noise',
                type: 'noise' as const,
                value: data.metrics?.noise?.value || Math.random() * 60 + 40,
                bml: data.metrics?.noise?.bml,
                buffer: data.metrics?.noise.buffer
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
                this.createGaugeChart(data.uid, chartDiv, metric.title, metric.type, metric.bml, metric.buffer, metric.value, cardId, metricCard);
            }, 100);
        });

        metricsContainer.appendChild(metricsGrid);

        // Forecast section
        const forecastSection = this.createElement('div', 'mt-4');
        const forecastTitle = this.createElement('div', 'font-bold text-[14px] mb-4', 'Air Quality Forecast');
        const forecastChart = this.createElement('div', 'chart-one');
        forecastChart.id = `${cardId}-forecast`;

        forecastSection.appendChild(forecastTitle);
        forecastSection.appendChild(forecastChart);

        // Create forecast chart after DOM insertion
        setTimeout(() => {
            this.createForecastChart(forecastChart, data.forecastData, cardId);
        }, 200);

        if (data.lastUpdated) {
            const lastUpdatedDiv = this.createElement('div', 'text-[10px] text-gray-400 mt-2 last-updated',
                `Last updated: ${data.lastUpdated.toLocaleString()}`);
            forecastSection.appendChild(lastUpdatedDiv);
        }

        // Assemble card
        cardBody.appendChild(headerFlex);
        cardBody.appendChild(metricsContainer);
        cardBody.appendChild(forecastSection);
        card.appendChild(cardBody);

        return card;
    }

    // Update chart value
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

    // Other methods remain the same...
    renderBatch(batch: AirQualityData[], startIndex: number): void {
        if (!this.container) return;

        const fragment = document.createDocumentFragment();
        batch.forEach((data, i) => {
            const card = this.createSingleCard(data, startIndex + i);
            fragment.appendChild(card);
        });

        this.container.appendChild(fragment);
    }

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

    setContainer(container: HTMLElement | string): void {
        this.container = typeof container === 'string'
            ? document.querySelector(container)
            : container;
    }

    // Cleanup method
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

    filter(predicate: (data: AirQualityData) => boolean): void {
        const filteredData = this.data.filter(predicate);
        const originalData = [...this.data];
        this.data = filteredData;
        this.renderAll();
        this.data = originalData;
    }

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

    getDataCount(): number {
        return this.data.length;
    }
}

export {AirQualityCardManager, type AirQualityData, type CardManagerOptions, type MetricsData};
