import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
import { Bar } from "react-chartjs-2";
import moment from "moment";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface BridgeOutboundChartProps {
    dayVolByChain: any[];
    title: string;
    dates: number[]
}

export function BridgeOutboundChart({ dayVolByChain, dates, title }: BridgeOutboundChartProps) {
    let chains: string[] = [];
    if (dayVolByChain.length > 0) {
        chains = Object.keys(dayVolByChain);
    }

    const options = {
        plugins: {
            title: {
                display: true,
                text: title,
            },
        },
        responsive: true,
        scales: {
            x: {
                stacked: true,
            },
            y: {
                stacked: true,
            },
        },
    };
    const colorList = ["red", "blue", "yellow", "lime", "pink", "white", "purple"];
    const labels = dates.map((ts: number) => moment(ts * 1000).format('MM-DD-YYYY'));

    const datasets = Object.keys(dayVolByChain).map((chain: any, idx: number) => {
        return { data: dayVolByChain[chain], label: chain, backgroundColor: colorList[idx] };
    });
    const data = {
        labels,
        datasets,
    };
    const element = <Bar options={options} data={data} />;
    return element;
}
