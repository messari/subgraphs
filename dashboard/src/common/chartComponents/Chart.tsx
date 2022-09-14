import { Box } from "@mui/material";
import { Line } from "react-chartjs-2";
import { toDate } from "../../utils";

interface ChartProps {
  datasetLabel: string;
  dataChart: any;
}

export const Chart = ({ datasetLabel, dataChart }: ChartProps) => {
  if (dataChart) {
    let labels: string[] = [];
    let datasets: { data: any; backgroundColor: string; borderColor: string; label: string }[] = [];
    if (Array.isArray(dataChart)) {
      labels = dataChart.map((e: any) => toDate(e.date));
      datasets = [
        {
          data: dataChart.map((e: any) => e.value),
          backgroundColor: "rgba(53, 162, 235, 0.5)",
          borderColor: "rgb(53, 162, 235)",
          label: datasetLabel,
        },
      ];
    } else if (typeof dataChart === "object") {
      const colorList = ["red", "blue", "yellow", "lime", "pink", "black", "orange", "green"];
      datasets = Object.keys(dataChart).map((item: string, idx: number) => {
        if (labels.length === 0) {
          labels = dataChart[item].map((e: any) => toDate(e.date));
        }
        return {
          data: dataChart[item].map((e: any) => e.value),
          backgroundColor: colorList[idx],
          borderColor: colorList[idx],
          label: item,
        };
      });
    } else {
      return null;
    }
    const chartData = {
      labels,
      datasets: datasets,
    };
    return (
      <Box padding={2} sx={{ border: 1 }}>
        <Line
          data={chartData}
          options={{
            scales: {
              y: {
                grid: {
                  display: true,
                  color: "rgba(255, 255, 255, 0.1)",
                },
                ticks: {
                  color: "#fff",
                },
              },
              x: {
                grid: {
                  display: false,
                },
                ticks: {
                  color: "#fff",
                },
              },
            },
            elements: {
              point: {
                radius: 0,
              },
            },

            plugins: {
              legend: {
                display: true,
                labels: {
                  color: "#fff",
                },
              },
              tooltip: {
                enabled: true,
                position: "nearest",
              },
            },
          }}
        />
      </Box>
    );
  }
  return null;
};
