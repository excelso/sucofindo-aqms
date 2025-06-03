import Highcharts from 'highcharts'
import "highcharts/highcharts-more";
import "highcharts/modules/solid-gauge";

interface AirQualityData {
    id: string;
    status: 'Very Good' | 'Good' | 'Moderate' | 'Unhealthy';
    isOnline: boolean;
    cctvIconPath?: string;
    metrics?: {
        pm10?: number;
        pm25?: number;
        pm1?: number;
        noise?: number;
    };
    location?: string;
    lastUpdated?: Date;
    forecastData?: Array<{ time: string; value: number }>;
}

interface CardManagerOptions {
    containerSelector?: string;
    batchSize?: number;
    enableVirtualization?: boolean;
    enableLazyLoading?: boolean;
    enableCharts?: boolean;
    chartUpdateInterval?: number;
    onCardClick?: (data: AirQualityData) => void;
}

class AirQualityCardManager {
    private data: AirQualityData[] = [];
    private container: HTMLElement | null = null;
    private options: CardManagerOptions;
    private visibleCards: Set<number> = new Set();
    private observer?: IntersectionObserver;
    private chartInstances: Map<string, any> = new Map();
    private chartIntervals: Map<string, any> = new Map();

    constructor(options: CardManagerOptions = {}) {
        this.options = {
            batchSize: 20,
            enableVirtualization: false,
            enableLazyLoading: true,
            enableCharts: true,
            chartUpdateInterval: 5000,
            ...options
        };

        if (options.containerSelector) {
            this.container = document.querySelector(options.containerSelector);
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
    private createGaugeChart(element: HTMLElement, type: 'pm10' | 'pm25' | 'pm1' | 'noise', initialValue: number, cardId: string): void {
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
            pm1: 'µg/m³',
            noise: 'db'
        };

        const suffixMap = {
            pm10: ' PM10',
            pm25: ' PM2.5',
            pm1: ' PM1.0',
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
                tooltip: {valueSuffix: suffixMap[type]},
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

        // Setup auto-update interval
        if (this.options.chartUpdateInterval && this.options.chartUpdateInterval > 0) {
            const interval = setInterval(() => {
                if (chart && chart.series && chart.series[0]) {
                    const series = chart.series[0];
                    const newValue = Math.random() * (75.5 - 20.5) + 20.5;

                    const currentValue = series.points[0].y;
                    let step = 0;
                    const steps = 30;

                    const animationInterval = setInterval(() => {
                        step++;
                        const interpolated = currentValue + (newValue - currentValue) * (step / steps);
                        series.points[0].update(interpolated, true, false);

                        if (step >= steps) {
                            clearInterval(animationInterval);
                            series.setData([newValue], true, {duration: 0});
                        }
                    }, 1000 / steps);
                }
            }, this.options.chartUpdateInterval);

            this.chartIntervals.set(`${cardId}-${type}`, interval);
        }
    }

    // Create Forecast Chart
    private createForecastChart(element: HTMLElement, data: Array<{
        time: string;
        value: number
    }>, cardId: string): void {
        if (!this.options.enableCharts || typeof Highcharts === 'undefined') {
            return;
        }

        const defaultData = data || [
            {time: '04:00', value: 25},
            {time: '05:00', value: 47},
            {time: '06:00', value: 25},
            {time: '07:00', value: 50},
            {time: '08:00', value: 25},
            {time: '09:00', value: 32}
        ];

        const chart = Highcharts.chart({
            chart: {
                renderTo: element,
                type: 'spline',
                marginLeft: 0,
                marginRight: 10,
                height: 150,
                style: {
                    fontFamily: 'Arial, sans-serif'
                }
            },
            title: {text: null},
            credits: {enabled: false},
            xAxis: {
                categories: defaultData.map(d => d.time),
                labels: {
                    style: {
                        fontSize: '10px',
                        color: '#999'
                    }
                },
                lineWidth: 0,
                tickWidth: 0,
                gridLineWidth: 1,
                gridLineColor: '#eee',
                gridLineDashStyle: 'Dash'
            },
            yAxis: {
                title: {text: null},
                labels: {enabled: false},
                gridLineWidth: 0,
                min: 0
            },
            legend: {enabled: false},
            tooltip: {
                backgroundColor: 'white',
                borderWidth: 0,
                borderRadius: 8,
                shadow: true,
                style: {fontSize: '12px'},
                headerFormat: '',
                pointFormat: '<b>Time:</b> {point.category}<br><b>AQI:</b> {point.y}'
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
                name: 'AQI',
                data: defaultData.map(d => d.value),
                color: {
                    linearGradient: {x1: 0, x2: 1, y1: 0, y2: 0},
                    stops: [
                        [0, '#4CAF50'],
                        [1, '#FFC107']
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
            const lastPoint = chart.series[0].points[chart.series[0].points.length - 1];
            lastPoint.update({
                marker: {
                    enabled: true,
                    radius: 6,
                    fillColor: '#4CAF50',
                    lineWidth: 2,
                    lineColor: 'white'
                }
            }, false);
            chart.redraw();
        });

        this.chartInstances.set(`${cardId}-forecast`, chart);
    }

    // Load data methods (same as before)
    async loadData(dataSource: AirQualityData[] | string | (() => Promise<AirQualityData[]>)): Promise<void> {
        try {
            if (Array.isArray(dataSource)) {
                this.data = dataSource;
            } else if (typeof dataSource === 'string') {
                const response = await fetch(dataSource);
                this.data = await response.json();
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
            'Very Good': {emoji: '😊', bgColor: 'bg-green-400/50'},
            'Good': {emoji: '😊', bgColor: 'bg-green-200'},
            'Moderate': {emoji: '😞', bgColor: 'bg-orange-200'},
            'Unhealthy': {emoji: '😷', bgColor: 'bg-red-200'},
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
        const statusConfig = this.getStatusConfig(data.status);
        const cardId = `card-${data.id}-${index}`;

        // Main card container
        const card = this.createElement('div', 'card mb-4 cursor-pointer');
        card.dataset.index = index.toString();
        card.id = cardId;

        if (this.options.onCardClick) {
            card.addEventListener('click', () => this.options.onCardClick!(data));
        }

        const cardBody = this.createElement('div', 'card-body');

        // Header section
        const headerFlex = this.createElement('div', 'flex items-center');
        const leftSection = this.createElement('div', 'flex-1');
        const idTitle = this.createElement('div', 'text-[20px] font-bold', data.id);

        if (data.location) {
            const locationDiv = this.createElement('div', 'text-[12px] text-gray-500', data.location);
            leftSection.appendChild(locationDiv);
        }

        const statusContainer = this.createElement('div', 'flex items-center gap-4');

        // Status badge
        const badge = this.createElement('div', `inline-flex items-center rounded-full gap-1 px-[4px] py-[3px] ${statusConfig.bgColor} text-[12px] font-bold`);
        const emoji = this.createElement('div');
        emoji.textContent = statusConfig.emoji;
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

        headerFlex.appendChild(leftSection);
        headerFlex.appendChild(rightSection);

        // Metrics section with charts
        const metricsContainer = this.createElement('div', 'mt-4');
        const metricsGrid = this.createElement('div', 'grid grid-cols-4 gap-2');

        const metrics = [
            {title: 'PM10', type: 'pm10' as const, value: data.metrics?.pm10 || Math.random() * 50 + 20},
            {title: 'PM2.5', type: 'pm25' as const, value: data.metrics?.pm25 || Math.random() * 40 + 15},
            {title: 'PM1.0', type: 'pm1' as const, value: data.metrics?.pm1 || Math.random() * 30 + 10},
            {title: 'Noise', type: 'noise' as const, value: data.metrics?.noise || Math.random() * 60 + 40}
        ];

        metrics.forEach(metric => {
            const metricCard = this.createElement('div', 'border rounded-md');
            const titleDiv = this.createElement('div', 'font-bold text-[12px] m-2 mb-2', metric.title);
            const chartDiv = this.createElement('div', `chart-${metric.type}`);
            chartDiv.id = `${cardId}-${metric.type}`;

            metricCard.appendChild(titleDiv);
            metricCard.appendChild(chartDiv);
            metricsGrid.appendChild(metricCard);

            // Create gauge chart after DOM insertion
            setTimeout(() => {
                this.createGaugeChart(chartDiv, metric.type, metric.value, cardId);
            }, 100);
        });

        metricsContainer.appendChild(metricsGrid);

        // Forecast section
        const forecastSection = this.createElement('div', 'mt-4');
        const forecastTitle = this.createElement('div', 'font-bold text-[14px]', 'Air Quality Forecast');
        const forecastChart = this.createElement('div', 'chart-one');
        forecastChart.id = `${cardId}-forecast`;

        forecastSection.appendChild(forecastTitle);
        forecastSection.appendChild(forecastChart);

        // Create forecast chart after DOM insertion
        setTimeout(() => {
            this.createForecastChart(forecastChart, data.forecastData, cardId);
        }, 200);

        if (data.lastUpdated) {
            const lastUpdatedDiv = this.createElement('div', 'text-[10px] text-gray-400 mt-2',
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
            item.id.toLowerCase().includes(query.toLowerCase()) ||
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

export {AirQualityCardManager, type AirQualityData, type CardManagerOptions};
