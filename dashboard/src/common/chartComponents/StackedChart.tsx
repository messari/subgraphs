import React from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

export function StackedChart(token1: string, token2: string, tokenWeight1: number, tokenWeight2: number, poolTitle: string) {
    const options = {
        plugins: {
            title: {
                display: true,
                text: poolTitle,
            },
        },
        responsive: false,
        scales: {
            x: {
                stacked: true,
            },
            y: {
                stacked: true,
            },
        },
    };
    const labels = ['Token Weights'];
    const data = {
        labels,
        datasets: [
            {
                label: token1 || "Token [0]",
                data: [tokenWeight1],
                backgroundColor: 'rgb(255, 99, 132)',
            },
            {
                label: token2 || "Token [1]",
                data: [tokenWeight2],
                backgroundColor: 'rgb(75, 192, 192)',
            },
        ],
    };
    const element = <><Bar options={options} data={data} /></>
    return element;
}
