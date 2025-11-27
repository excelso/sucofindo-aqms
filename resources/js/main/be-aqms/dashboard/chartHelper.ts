export function createSmoothGradient(minY: number, maxY: number) {
    // Definisi semua titik warna berdasarkan standar AQI
    const allColorPoints = [
        {value: 0, color: '#22C55E'},     // Hijau (Baik 0-50)
        {value: 51, color: '#EAB308'},    // Kuning (Sedang 51-100)
        {value: 100, color: '#F97316'},   // Orange (Tidak sehat sensitif 101-150)
        {value: 150, color: '#EF4444'},   // Merah (Tidak sehat 151-200)
    ];

    // Filter color points berdasarkan nilai maksimal data
    let relevantColorPoints = [];
    if (maxY <= 50) {
        // Jika maxY <= 50, hanya gunakan hijau sampai kuning
        relevantColorPoints = [
            {value: 0, color: '#22C55E'},     // Hijau
            {value: 50, color: '#84CC16'},    // Hijau muda
            // {value: 50, color: '#EAB308'}     // Kuning
        ];
    } else if (maxY <= 100) {
        // Jika maxY <= 100, gunakan hijau sampai orange
        relevantColorPoints = [
            {value: 0, color: '#22C55E'},     // Hijau
            {value: 50, color: '#84CC16'},    // Hijau muda
            {value: 100, color: '#EAB308'},    // Kuning
            // {value: 100, color: '#F97316'}    // Orange
        ];
    } else if (maxY <= 150) {
        // Jika maxY <= 150, gunakan hijau sampai merah
        relevantColorPoints = [
            {value: 0, color: '#22C55E'},     // Hijau
            {value: 50, color: '#84CC16'},    // Kuning
            {value: 100, color: '#EAB308'},    // Kuning
            {value: 150, color: '#EF4444'}    // Merah
        ];
    } else {
        // Gunakan semua warna untuk nilai tinggi
        relevantColorPoints = allColorPoints;
    }

    const stops = [];

    // Gunakan range sesuai dengan data, bukan range absolut
    const effectiveMaxY = Math.max(maxY, relevantColorPoints[relevantColorPoints.length - 1].value);
    const yRange = effectiveMaxY - minY;

    if (yRange === 0) {
        // Jika semua nilai sama, return gradient default sesuai range
        if (maxY <= 50) {
            return {
                linearGradient: {x1: 0, y1: 0, x2: 0, y2: 1},
                stops: [
                    [0, '#EAB308'],  // Atas kuning
                    [1, '#22C55E']   // Bawah hijau
                ]
            };
        } else {
            return {
                linearGradient: {x1: 0, y1: 0, x2: 0, y2: 1},
                stops: [
                    [0, '#F97316'],  // Atas orange
                    [0.5, '#EAB308'], // Tengah kuning
                    [1, '#22C55E']   // Bawah hijau
                ]
            };
        }
    }

    // Buat stops berdasarkan relevant color points
    relevantColorPoints.forEach(point => {
        if (point.value <= effectiveMaxY && point.value >= minY) {
            // Hitung posisi dalam gradient (0 = atas/maxY, 1 = bawah/minY)
            const position = 1 - ((point.value - minY) / yRange);
            const clampedPosition = Math.max(0, Math.min(1, position));
            stops.push([clampedPosition, point.color]);
        }
    });

    // Tambahkan interpolasi untuk batas atas dan bawah jika diperlukan
    if (minY > 0 && minY < relevantColorPoints[0].value) {
        const minColor = interpolateColorForValue(minY, relevantColorPoints);
        stops.push([1, minColor]); // Bawah
    }

    if (maxY < effectiveMaxY) {
        const maxColor = interpolateColorForValue(maxY, relevantColorPoints);
        stops.unshift([0, maxColor]); // Atas
    }

    // Remove duplicates dan sort
    const uniqueStops = stops.filter((stop, index, array) =>
        index === 0 || stop[0] !== array[index - 1][0]
    );
    uniqueStops.sort((a, b) => a[0] - b[0]);

    // Pastikan ada minimal 2 stops
    if (uniqueStops.length < 2) {
        const maxColor = interpolateColorForValue(maxY, relevantColorPoints);
        const minColor = interpolateColorForValue(minY, relevantColorPoints);

        return {
            linearGradient: {x1: 0, y1: 0, x2: 0, y2: 1},
            stops: [
                [0, maxColor],
                [1, minColor]
            ]
        };
    }

    return {
        linearGradient: {x1: 0, y1: 0, x2: 0, y2: 1},
        stops: uniqueStops
    };
}

// region Interpolasi Warna untuk Nilai Tertentu
function interpolateColorForValue(value: number, colorPoints: Array<{ value: number, color: string }>): string {
    // Cari dua titik terdekat
    for (let i = 0; i < colorPoints.length - 1; i++) {
        const point1 = colorPoints[i];
        const point2 = colorPoints[i + 1];

        if (value >= point1.value && value <= point2.value) {
            // Interpolasi linear antara kedua warna
            const ratio = (value - point1.value) / (point2.value - point1.value);
            return interpolateHexColors(point1.color, point2.color, ratio);
        }
    }

    // Jika di luar range, return warna terdekat
    if (value < colorPoints[0].value) return colorPoints[0].color;
    return colorPoints[colorPoints.length - 1].color;
}

// region Interpolasi Hex Colors
function interpolateHexColors(color1: string, color2: string, ratio: number): string {
    const hex1 = color1.replace('#', '');
    const hex2 = color2.replace('#', '');

    const r1 = parseInt(hex1.substr(0, 2), 16);
    const g1 = parseInt(hex1.substr(2, 2), 16);
    const b1 = parseInt(hex1.substr(4, 2), 16);

    const r2 = parseInt(hex2.substr(0, 2), 16);
    const g2 = parseInt(hex2.substr(2, 2), 16);
    const b2 = parseInt(hex2.substr(4, 2), 16);

    const r = Math.round(r1 + (r2 - r1) * ratio);
    const g = Math.round(g1 + (g2 - g1) * ratio);
    const b = Math.round(b1 + (b2 - b1) * ratio);

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// endregion
