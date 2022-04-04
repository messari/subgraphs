import "./App.css";
import { Button, CircularProgress, Grid, TextField, Typography } from "@mui/material";
import { ApolloClient, gql, InMemoryCache, useQuery } from "@apollo/client";
import { Line } from "react-chartjs-2";
import { Box } from "@mui/system";

import { Chart as ChartJS, registerables } from "chart.js";
import { useEffect, useMemo, useState } from "react";

export const Chart = (datasetLabel: string, dataChart: any, dataLength: number) => {
  if (dataChart) {
    const labels = Array<string>(dataLength).fill("");
    const chartData = {
      labels,
      datasets: [
        {
          data: dataChart,
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
function App() {
  const [subgraphUrl, setSubgraphUrl] = useState<string>("");
  const [urlTextField, setTextField] = useState<string>("");

  const chartData = [
    [
      "totalValueLockedUSD",
      "totalVolumeUSD",
      "protocolSideRevenueUSD",
      "supplySideRevenueUSD",
      "protocolControlledValueUSD",
      "protocolTreasuryUSD",
      "feesUSD",
    ],
    [
      "totalUniqueUsers",
      "dailyTransactionCount",
      "activeUsers"
    ]
  ];
  const entities = ["financialsDailySnapshots","usageMetricsDailySnapshots"];
  ChartJS.register(...registerables);

  const client = useMemo(
    () =>
      new ApolloClient({
        uri: subgraphUrl,
        cache: new InMemoryCache(),
      }),
    [subgraphUrl],
  );
  const subscription = gql`
    {
      protocols {
        name
        type
      }
      financialsDailySnapshots {
        totalValueLockedUSD
        totalVolumeUSD
        protocolSideRevenueUSD
        supplySideRevenueUSD
        protocolControlledValueUSD
        protocolTreasuryUSD
        feesUSD
      }
      usageMetricsDailySnapshots {
        totalUniqueUsers
        dailyTransactionCount
        activeUsers
      }
    }
  `;
  const { data, loading, error, refetch } = useQuery(subscription, { client });

  useEffect(() => {
    refetch();
  }, [subgraphUrl, refetch]);

  const AllData = () =>
    useMemo(() => {
      if (data) {
        return (
          <>
            <Typography>
              <p>Name - {data.protocols[0].name}</p>
              <p>Type - {data.protocols[0].type}</p>
            </Typography>
            {chartData.map((item, i) => (
              <Grid container>
                {item.map((name) => {
                  const dataChart = data[entities[i]].map((e: { [x: string]: any }) => Number(e[name]));
                  const length = data[entities[i]].length;
                  return (
                    <Grid item xs={6}>
                      {Chart(name, dataChart, length)}
                    </Grid>
                  );
                })}
              </Grid>
            ))}
          </>
        );
      }
      return null;
    }, [data]);
  return (
    <div className="App">
      <TextField sx={{ maxWidth: 800, marginY: 2 }} fullWidth onChange={(event) => setTextField(event.target.value)} />

      <Box marginTop={1}>
        <Button onClick={() => setSubgraphUrl(urlTextField)}>Show Graphs</Button>
      </Box>
      {loading && !!subgraphUrl ? <CircularProgress sx={{ margin: 6 }} size={50} /> : null}
      {error && !!subgraphUrl ? "Error Please check if you enter correct URL" : null}
      {AllData()}
    </div>
  );
}

export default App;
