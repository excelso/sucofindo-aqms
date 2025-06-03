interface AirQualityCardConfig {
    id: string;
    status: 'Good' | 'Moderate' | 'Unhealthy' | 'Hazardous';
    isOnline: boolean;
    cctvIconPath?: string;
}

class AirQualityCardCreator {
    private config: AirQualityCardConfig;

    constructor(config: AirQualityCardConfig) {
        this.config = config;
    }

    private getStatusConfig(status: string) {
        const statusConfigs = {
            'Good': { emoji: '😊', bgColor: 'bg-green-200' },
            'Moderate': { emoji: '😞', bgColor: 'bg-orange-200' },
            'Unhealthy': { emoji: '😷', bgColor: 'bg-red-200' },
            'Hazardous': { emoji: '💀', bgColor: 'bg-purple-200' }
        };
        return statusConfigs[status] || statusConfigs['Moderate'];
    }

    private createElement(tag: string, className?: string, textContent?: string): HTMLElement {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (textContent) element.textContent = textContent;
        return element;
    }

    private createStatusBadge(): HTMLElement {
        const statusConfig = this.getStatusConfig(this.config.status);

        const badge = this.createElement('div', `inline-flex items-center rounded-full gap-1 px-[4px] py-[3px] ${statusConfig.bgColor} text-[12px] font-bold`);

        const emoji = this.createElement('div');
        emoji.textContent = statusConfig.emoji;

        const statusText = this.createElement('div', 'mr-1', this.config.status);

        badge.appendChild(emoji);
        badge.appendChild(statusText);

        return badge;
    }

    private createOnlineStatus(): HTMLElement {
        const container = this.createElement('div', 'flex items-center gap-2');

        const indicator = this.createElement('div',
            `h-[10px] w-[10px] rounded-full ${this.config.isOnline ? 'bg-green-500' : 'bg-red-500'}`
        );

        const text = this.createElement('div', 'text-[14px]',
            this.config.isOnline ? 'Online' : 'Offline'
        );

        container.appendChild(indicator);
        container.appendChild(text);

        return container;
    }

    private createCctvIcon(): HTMLElement {
        const link = this.createElement('a', 'cursor-pointer') as HTMLAnchorElement;

        const img = document.createElement('img');
        img.src = this.config.cctvIconPath || '/images/vector/icons8-cctv-100.png';
        img.width = 24;
        img.alt = 'cctv';

        link.appendChild(img);
        return link;
    }

    private createMetricCard(title: string, chartClass: string): HTMLElement {
        const card = this.createElement('div', 'border rounded-md');

        const titleDiv = this.createElement('div', 'font-bold text-[12px] m-2 mb-2', title);
        const chartDiv = this.createElement('div', chartClass);

        card.appendChild(titleDiv);
        card.appendChild(chartDiv);

        return card;
    }

    private createMetricsGrid(): HTMLElement {
        const grid = this.createElement('div', 'grid grid-cols-4 gap-2');

        const metrics = [
            { title: 'PM10', chartClass: 'chart-p10' },
            { title: 'PM2.5', chartClass: 'chart-p25' },
            { title: 'PM1.0', chartClass: 'chart-p1' },
            { title: 'Noise', chartClass: 'chart-noise' }
        ];

        metrics.forEach(metric => {
            const card = this.createMetricCard(metric.title, metric.chartClass);
            grid.appendChild(card);
        });

        return grid;
    }

    private createForecastSection(): HTMLElement {
        const section = this.createElement('div', 'mt-4');

        const title = this.createElement('div', 'font-bold text-[14px]', 'Air Quality Forcast');
        const chart = this.createElement('div', 'chart-one');

        section.appendChild(title);
        section.appendChild(chart);

        return section;
    }

    create(): HTMLElement {
        // Main card container
        const card = this.createElement('div', 'card');
        const cardBody = this.createElement('div', 'card-body');

        // Header section
        const headerFlex = this.createElement('div', 'flex items-center');

        // Left side of header
        const leftSection = this.createElement('div', 'flex-1');
        const idTitle = this.createElement('div', 'text-[20px] font-bold', this.config.id);

        const statusContainer = this.createElement('div', 'flex items-center gap-4');
        const statusBadge = this.createStatusBadge();
        const onlineStatus = this.createOnlineStatus();

        statusContainer.appendChild(statusBadge);
        statusContainer.appendChild(onlineStatus);

        leftSection.appendChild(idTitle);
        leftSection.appendChild(statusContainer);

        // Right side of header
        const rightSection = this.createElement('div', 'flex justify-end');
        const cctvIcon = this.createCctvIcon();
        rightSection.appendChild(cctvIcon);

        headerFlex.appendChild(leftSection);
        headerFlex.appendChild(rightSection);

        // Metrics section
        const metricsContainer = this.createElement('div', 'mt-4');
        const metricsGrid = this.createMetricsGrid();
        metricsContainer.appendChild(metricsGrid);

        // Forecast section
        const forecastSection = this.createForecastSection();

        // Assemble the card
        cardBody.appendChild(headerFlex);
        cardBody.appendChild(metricsContainer);
        cardBody.appendChild(forecastSection);
        card.appendChild(cardBody);

        return card;
    }

    // Helper method to append to DOM
    appendTo(parent: HTMLElement | string): HTMLElement {
        const element = this.create();
        const parentElement = typeof parent === 'string'
            ? document.querySelector(parent) as HTMLElement
            : parent;

        if (parentElement) {
            parentElement.appendChild(element);
        }

        return element;
    }
}

export { AirQualityCardCreator, type AirQualityCardConfig };
