import React, { useEffect, useState } from 'react';
import { Chart, ChartData, registerables } from 'chart.js';

Chart.register(...registerables);

export function ChartPage() {
    const [chartData, setChartData] = useState<ChartData<'line'> | null>(null);

    useEffect(() => {
        // Receive chart data from the main window
        window.api.receiveChartData((data) => setChartData(data));
    }, []);

    useEffect(() => {
        if (!chartData) return;

        const ctx = document.getElementById('chartCanvas') as HTMLCanvasElement;
        new Chart(ctx, {
            type: 'line',
            data: chartData,
            options: {
                responsive: true,
            },
        });
    }, [chartData]);

    return <canvas id="chartCanvas"></canvas>;
}
