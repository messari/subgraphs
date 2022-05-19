import { Box, Typography } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { Line } from "react-chartjs-2";
import { toDate } from "../../utils/index";

export const MultChart = ( val : {[label: string]: any[]}) => {

    if (val) {
      let labels: string[] = [] ;
      Object.keys(val).forEach((field : string ) => {
        labels = val[field][0].map((e: any) => toDate(e.date));
      })
      let datasets: { data: any[]; backgroundColor: string; borderColor: string; label: string; }[] = []
      Object.keys(val).forEach((field: string) => {
        datasets.push({
          data: val[field][0].map((e: any) => e.value),
          backgroundColor: "rgba(53, 162, 235, 0.5)",
          borderColor: "rgb(53, 162, 235)",
          label: field,
        })
      })
      
      const chartData = {
        labels:labels,
        datasets:datasets
      }

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
