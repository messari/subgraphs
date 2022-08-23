import React from "react";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
import { Bar } from "react-chartjs-2";
import { toDate } from "../../utils";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface StackedChartProps {
  tokens: any[];
  tokenWeightsArray: any[];
  poolTitle: string;
}

export function StackedChart({ tokens, tokenWeightsArray, poolTitle }: StackedChartProps) {
  const dates: string[] = [];

  const tokenWeightsValues = tokenWeightsArray.map((x) => {
    const hourly = poolTitle.toUpperCase().includes("HOURLY");
    const currentTokenValues = x.map((weight: { [x: string]: any }) => {
      if (dates.length < x.length) {
        dates.push(toDate(weight.date, hourly));
      }
      return Number(weight.value);
    });
    return currentTokenValues;
  });

  const options = {
    plugins: {
      title: {
        display: true,
        text: poolTitle,
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
  const colorList = ["red", "blue", "yellow", "lime", "pink", "black", "purple"];
  const labels = dates;
  const datasets = tokenWeightsValues.map((valArr: any[], idx: number) => {
    return { data: valArr, label: tokens[idx].name || "Token [" + idx + "]", backgroundColor: colorList[idx] };
  });
  const data = {
    labels,
    datasets,
  };
  const element = <Bar options={options} data={data} />;
  return element;
}
