import { Box, Typography } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { Line } from "react-chartjs-2";
import { toDate } from "../../../src/utils/index";

export const Chart = (datasetLabel: string, dataChart: any, _dataLength: number) => {
  if (dataChart) {
    let labels: string[] = [];
    let datasets: { data: any, backgroundColor: string, borderColor: string, label: string }[] = [];
    if (Array.isArray(dataChart)) {
      labels = dataChart.map((e: any) => toDate(e.date));
      datasets = [
        {
          data: dataChart.map((e: any) => e.value),
          backgroundColor: "rgba(53, 162, 235, 0.5)",
          borderColor: "rgb(53, 162, 235)",
          label: datasetLabel,
        },
      ]
    } else if (typeof (dataChart) === 'object') {
      const colorList = ['red', 'blue', 'yellow', 'lime', 'pink', 'black', 'orange', 'green'];
      datasets = Object.keys(dataChart).map((item: string, idx: number) => {
        if (labels.length === 0) {
          labels = dataChart[item].map((e: any) => toDate(e.date));
        }
        return ({
          data: dataChart[item].map((e: any) => e.value),
          backgroundColor: colorList[idx],
          borderColor: colorList[idx],
          label: item
        })
      })

    } else {
      return null;
    }
    const chartData = {
      labels,
      datasets: datasets,
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
                },
              },
              x: {
                grid: {
                  display: false,
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
              },
            },
          }}
        />
      </Box>
    );
  }
  return null;
};
