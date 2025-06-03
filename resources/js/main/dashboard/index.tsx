import {AirQualityCardManager, AirQualityData} from "@/js/main/dashboard/airQualityCardManager";

document.addEventListener('DOMContentLoaded', function () {
    const manager = new AirQualityCardManager({
        containerSelector: '.airQualityParent',
        batchSize: 50,
        enableLazyLoading: true,
        enableCharts: true,
        chartUpdateInterval: 5000, // Update every 5 seconds
        onCctvClick: (cctvLink) => console.log('Card clicked:', cctvLink)
    });

    function generateMockData(count: number): AirQualityData[] {
        const statuses: Array<'Very Good' | 'Good' | 'Moderate' | 'Unhealthy'> = ['Very Good', 'Good', 'Moderate', 'Unhealthy'];
        return Array.from({ length: count }, (_, i) => {
            const now = Math.floor(Date.now() / 1000); // Current Unix timestamp
            const ids = `AQ-BC-${String(i + 1).padStart(3, '0')}`;

            return {
                id: ids,
                status: statuses[Math.floor(Math.random() * statuses.length)],
                isOnline: Math.random() > 0.1,
                metrics: {
                    pm10: Math.floor(Math.random() * 50) + 20,
                    pm25: Math.floor(Math.random() * 40) + 15,
                    pm1: Math.floor(Math.random() * 30) + 10,
                    noise: Math.floor(Math.random() * 60) + 40
                },
                lastUpdated: new Date(Date.now() - Math.random() * 86400000),
                forecastData: Array.from({ length: 6 }, (_, j) => ({
                    timestamp: now + (j * 3600), // Add 1 hour intervals
                    value: Math.floor(Math.random() * 50) + 20
                })),
                cctvLink: `rstp://xxx.com/${ids}`
            };
        });
    }

    const mockData = generateMockData(6);
    manager.loadData(mockData).then(() => {
        manager.renderAll();
    });
})
