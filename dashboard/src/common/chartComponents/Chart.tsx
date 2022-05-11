import { Box, Typography } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { Line } from "react-chartjs-2";
import { toDate } from "../../../src/utils/index";

export const Chart = (datasetLabel: string, dataChart: any, _dataLength: number) => {
    if (dataChart) {
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
