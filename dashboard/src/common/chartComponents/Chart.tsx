import { Box } from "@mui/material";
import { Line } from "react-chartjs-2";
import { toDate } from "../../utils";

export const Chart = (datasetLabel: string, dataChart: any, _dataLength: number) => {
  if (!dataChart) return null;
  const labels = dataChart.map((e: any) => toDate(e.date));
  const chartData = {
    labels,
    datasets: [
      {
        data: dataChart.map((e: any) => e.value),
        backgroundColor: "rgba(53, 162, 235, 0.5)",
        borderColor: "rgb(53, 162, 235)",
        label: datasetLabel,
      },
    ],
  };
  return (
    <Box margin={5} padding={2} sx={{ border: 1 }}>
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
          },
        }}
      />
    </Box>
  );
};
