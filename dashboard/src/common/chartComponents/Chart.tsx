import { Box, CircularProgress } from "@mui/material";
import { Line } from "react-chartjs-2";
import { toDate } from "../../utils";

interface ChartProps {
  datasetLabel: string;
  dataChart: any;
  chartRef: any;
}

export const Chart = ({ datasetLabel, dataChart, chartRef }: ChartProps) => {
  if (dataChart) {
    let labels: string[] = [];
    let datasets: { data: any; backgroundColor: string; borderColor: string; label: string }[] = [];
    if (Array.isArray(dataChart)) {
      labels = dataChart.map((e: { [x: string]: any }) => toDate(e.date));
      datasets = [
        {
          data: dataChart.map((e: { [x: string]: any }) => e.value),
          backgroundColor: "rgba(53, 162, 235, 0.5)",
          borderColor: "rgb(53, 162, 235)",
          label: datasetLabel,
        },
      ];
    } else if (typeof dataChart === "object") {
      const colorList = ["red", "blue", "yellow", "lime", "pink", "black", "orange", "green"];
      datasets = Object.keys(dataChart).map((label: string, idx: number) => {
        if (labels.length === 0) {
          labels = dataChart[label].map((e: { [x: string]: any }) => toDate(e.date));
        }
        return {
          data: dataChart[label].map((e: { [x: string]: any }) => e.value),
          backgroundColor: colorList[idx],
          borderColor: colorList[idx],
          label: label,
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
      <>
        <Box padding={2} sx={{ border: 1 }}>
          <Line
            data={chartData}
            ref={chartRef}
            options={{
              responsive: true,
              maintainAspectRatio: true,
              interaction: {
                mode: "nearest",
                axis: "x",
                intersect: false,
              },
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
                  hoverRadius: 5,
                  hoverBorderWidth: 4,
                  hoverBorderColor: "white",
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
      </>
    );
  }
  return <CircularProgress sx={{ my: 5 }} size={40} />;
};
