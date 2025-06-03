import {AirQualityCardManager, AirQualityData} from "@/js/main/dashboard/airQualityCardManager";

document.addEventListener('DOMContentLoaded', function () {
    const manager = new AirQualityCardManager({
        containerSelector: '.airQualityParent',
        batchSize: 50,
        enableLazyLoading: true,
        enableCharts: true,
        chartUpdateInterval: 5000, // Update every 5 seconds
        onCardClick: (data) => console.log('Card clicked:', data)
    });

    function generateMockData(count: number): AirQualityData[] {
        const statuses: Array<'Very Good' | 'Good' | 'Moderate' | 'Unhealthy'> = ['Very Good', 'Good', 'Moderate', 'Unhealthy'];

        return Array.from({ length: count }, (_, i) => ({
            id: `AQ-BC-${String(i + 1).padStart(3, '0')}`,
            status: statuses[Math.floor(Math.random() * statuses.length)],
            isOnline: Math.random() > 0.1, // 90% online
            metrics: {
                pm10: Math.floor(Math.random() * 100),
                pm25: Math.floor(Math.random() * 50),
                pm1: Math.floor(Math.random() * 25),
                noise: Math.floor(Math.random() * 80) + 20
            },
            lastUpdated: new Date(Date.now() - Math.random() * 86400000) // Random time in last 24h
        }));
    }

    const mockData = generateMockData(6);
    manager.loadData(mockData).then(() => {
        manager.renderAll();
    });
})
