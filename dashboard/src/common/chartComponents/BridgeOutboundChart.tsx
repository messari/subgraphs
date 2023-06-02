import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
import { Bar } from "react-chartjs-2";
import moment from "moment";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

declare module "chart.js" {
  interface TooltipPositionerMap {
    posFunc: TooltipPositionerFunction<ChartType>;
  }
}

interface BridgeOutboundChartProps {
  dayVolByChain: { [x: string]: string };
  title: string;
  dates: number[];
  chartRef: any;
}

export function BridgeOutboundChart({ dayVolByChain, dates, title, chartRef }: BridgeOutboundChartProps) {
  const intMode: "nearest" | "x" | "y" | "index" | "dataset" | "point" | undefined = "nearest";
  const intAxis: "x" | "y" | "xy" | "r" | undefined = "x";
  const tooltipPos: "posFunc" = "posFunc";
  const xAlign: "left" = "left";
  const yAlign: "bottom" = "bottom";

  const posFunc = (elements: any, eventPosition: any) => {
    let model = elements[0]?.element;

    return {
      x: model.x + 20,
      y: eventPosition.y - 15,
    };
  };

  Tooltip.positioners.posFunc = posFunc;

  const options = {
    plugins: {
      title: {
        display: true,
        text: title,
      },
      tooltip: {
        xAlign,
        yAlign,
        position: tooltipPos,
        caretSize: 10,
      },
    },
    responsive: true,
    interaction: {
      mode: intMode,
      axis: intAxis,
      intersect: false,
    },
    scales: {
      x: {
        stacked: true,
      },
      y: {
        stacked: true,
      },
    },
  };
  const colorList = [
    "red",
    "blue",
    "yellow",
    "lime",
    "blueviolet",
    "orange",
    "purple",
    "maroon",
    "aqua",
    "olive",
    "deeppink",
  ];
  const labels = dates.map((date: number) => moment(date * 1000).format("MM-DD-YYYY"));

  const datasets = Object.keys(dayVolByChain).map((chain: string, idx: number) => {
    return {
      data: dayVolByChain[chain],
      label: chain,
      backgroundColor: colorList[idx],
      hoverBackgroundColor: "white",
      hoverBorderColor: "white",
      hoverBorderWidth: 10,
    };
  });
  const data = {
    labels,
    datasets,
  };
  const element = <Bar ref={chartRef} options={options} data={data} />;
  return element;
}
