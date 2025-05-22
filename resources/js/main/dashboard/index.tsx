import Highcharts from 'highcharts'
import "highcharts/highcharts-more";
import "highcharts/modules/solid-gauge";

document.addEventListener('DOMContentLoaded', function () {
    const chartOne: NodeListOf<HTMLElement> = document.querySelectorAll('.chart-one');
    const chartTwo: NodeListOf<HTMLElement> = document.querySelectorAll('.chart-two');

    handleChartGauge();
    handleCharts();

    //region Handle Chart
    function handleCharts() {
        chartOne.forEach((elm) => {

            // Data for the chart
            const data = [
                { time: '04:00', value: 25 },
                { time: '05:00', value: 47 },
                { time: '06:00', value: 25 },
                { time: '07:00', value: 50 },
                { time: '08:00', value: 25 },
                { time: '09:00', value: 32 }
            ];

            // Create the chart
            Highcharts.chart({
                chart: {
                    renderTo: elm,
                    type: 'spline',
                    marginLeft: 0,
                    marginRight: 10,
                    height: 150,
                    style: {
                        fontFamily: 'Arial, sans-serif'
                    }
                },
                title: {
                    text: null
                },
                credits: {
                    enabled: false
                },
                xAxis: {
                    categories: data.map(d => d.time),
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
                    title: {
                        text: null
                    },
                    labels: {
                        enabled: false
                    },
                    gridLineWidth: 0,
                    min: 0
                },
                legend: {
                    enabled: false
                },
                tooltip: {
                    backgroundColor: 'white',
                    borderWidth: 0,
                    borderRadius: 8,
                    shadow: true,
                    style: {
                        fontSize: '12px'
                    },
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
                            hover: {
                                lineWidth: 3
                            }
                        }
                    }
                },
                series: [{
                    type: 'areaspline',
                    name: 'AQI',
                    data: data.map(d => d.value),
                    color: {
                        linearGradient: { x1: 0, x2: 1, y1: 0, y2: 0 },
                        stops: [
                            [0, '#4CAF50'], // green
                            [1, '#FFC107'] // yellow
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
            }, function(chart) {
                // Add the last marker point after chart is loaded
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

        })
    }
    //endregion

    //region Handle Chart Gauge
    function getGradientColor(valuePct: number, stops: [number, string][]) {
        for (let i = 1; i < stops.length; i++) {
            const [prevStop, prevColor] = stops[i - 1];
            const [nextStop, nextColor] = stops[i];
            if (valuePct <= nextStop) {
                const ratio = (valuePct - prevStop) / (nextStop - prevStop);
                return interpolateColor(prevColor, nextColor, ratio);
            }
        }
        return stops[stops.length - 1][1]; // default to last
    }

    function interpolateColor(color1: string, color2: string, factor: number) {
        const c1 = hexToRgb(color1);
        const c2 = hexToRgb(color2);
        const r = Math.round(c1.r + (c2.r - c1.r) * factor);
        const g = Math.round(c1.g + (c2.g - c1.g) * factor);
        const b = Math.round(c1.b + (c2.b - c1.b) * factor);
        return `rgb(${r}, ${g}, ${b})`;
    }

    function hexToRgb(hex: string) {
        const value = hex.replace('#', '');
        const bigint = parseInt(value, 16);
        return {
            r: (bigint >> 16) & 255,
            g: (bigint >> 8) & 255,
            b: bigint & 255
        };
    }

    function handleChartGauge() {
        const stops: [number, string][] = [
            [0, '#4CAF50'],
            [0.2, '#8BC34A'],
            [0.4, '#FFC107'],
            [0.6, '#FF9800'],
            [0.8, '#FF5722'],
            [1, '#F44336']
        ];

        chartTwo.forEach((elm) => {
            Highcharts.chart({
                chart: {
                    renderTo: elm,
                    type: 'gauge',
                    backgroundColor: 'transparent',
                    height: 95,
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
                            const fillColor = getGradientColor(valuePct, stops);

                            if (!chart.customCircle) {
                                chart.customCircle = chart.renderer.circle(cx, cy, 7)
                                        .attr({
                                            fill: '#fff',
                                            stroke: fillColor,
                                            'stroke-width': 4,
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
                accessibility: { enabled: false },
                title: { text: null },
                credits: { enabled: false },
                pane: {
                    center: ['75%', '75%'],
                    size: '130%',
                    startAngle: -120,
                    endAngle: 120,
                    background: [{
                        backgroundColor: {
                            linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
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
                    tickColor: Highcharts.defaultOptions.chart.backgroundColor || '#FFFFFF',
                    tickWidth: 2,
                    minorTickInterval: null,
                    labels: { enabled: false },
                    plotBands: [{
                        from: 0,
                        to: 100,
                        innerRadius: '80%',
                        outerRadius: '100%',
                        color: {
                            linearGradient: { x1: 0, y1: 0, x2: 1, y2: 0 },
                            stops: stops
                        },
                        borderRadius: '50%'
                    }]
                },
                series: [{
                    name: 'AQI',
                    type: 'gauge',
                    data: [Math.floor(Math.random() * (75 - 20) + 20)],
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
                    tooltip: { valueSuffix: ' AQI' },
                    dataLabels: {
                        formatter: function () {
                            return `${Math.round(this.y)}<br>AQI`;
                        },
                        borderWidth: 0,
                        color: '#333',
                        style: {
                            fontSize: '14px',
                            fontWeight: 'bold'
                        },
                        y: 0.5
                    }
                } as Highcharts.SeriesGaugeOptions]
            }, (chart) => {
                console.log('Gauge Oke');

                setInterval(() => {
                    const series = chart.series[0];
                    const value = Math.floor(Math.random() * (75 - 20) + 20);

                    let currentValue = series.points[0].y;
                    let step = 0;
                    const steps = 30;
                    const interval = setInterval(() => {
                        step++;
                        const interpolated = currentValue + (value - currentValue) * (step / steps);
                        series.points[0].update(interpolated, true, false);

                        if (step >= steps) {
                            clearInterval(interval);
                            series.setData([value], true, { duration: 0 });
                        }
                    }, 1000 / steps);
                }, 5000)
            });
        });
    }
    //endregion

})
