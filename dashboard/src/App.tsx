import "./App.css";
import { Button, CircularProgress, Grid, TextField, Typography } from "@mui/material";
import { ApolloClient, gql, InMemoryCache, useLazyQuery, useQuery } from "@apollo/client";
import { Line } from "react-chartjs-2";
import { Box } from "@mui/system";

import { Chart as ChartJS, registerables } from "chart.js";
import { useEffect, useMemo, useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import moment from "moment";
import { schema } from "./queries/schema";
export const toDate = (timestamp: number) =>{
  // console.log(moment.unix(Number(timestamp)).format("YYYY-MM-DD"))
  return moment.unix(timestamp).format("YYYY-MM-DD")
}
export const Chart = (datasetLabel: string, dataChart: any, dataLength: number) => {
  if (dataChart) {
    const labels = dataChart.map((e:any) =>toDate(e.date));
    const chartData = {
      labels,
      datasets: [
        {
          data: dataChart.map((e:any) =>e.value),
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

export const Table = (datasetLabel: string, dataTable: any, dataLength: number) => {
  if (dataTable) {
    const columns = [
      { field: 'date', headerName: 'Date', width: 150 },
      {
        field: 'value',
        headerName: 'Value',
        width: 150,
      },
    ]
    const tableData = dataTable.map((val: any, i: any)=>({id: i, date: toDate(val.date), value: val.value.toLocaleString()}));
    // console.log(tableData)
    return (
        <DataGrid  initialState={{
          sorting: {
            sortModel: [{ field: 'date', sort: 'desc' }],
          },
        }}       rows={tableData}
      columns={columns}/>
    );
  }
  return null;
};
function App() {
  const [subgraphUrl, setSubgraphUrl] = useState<string>("");
  const [urlTextField, setTextField] = useState<string>("");

  ChartJS.register(...registerables);

  const client = useMemo(
    () =>
      new ApolloClient({
        uri: subgraphUrl,
        cache: new InMemoryCache(),
      }),
    [subgraphUrl],
  );
  const query = gql`
    {
      protocols {
        type
        schemaVersion
      }
    }
  `;
  const { data: data2, loading: loading2, error: error2, refetch : refetch2 } = useQuery(query, { client });
    const schemaData = schema(data2?.protocols[0].type,data2?.protocols[0].schemaVersion)
  const queryMain = gql`${schemaData.query}`
  const entitiesData = schemaData.entititesData
  const entities = schemaData.entities
  const [getData, {data, loading, error, refetch}] = useLazyQuery(queryMain, { client });

  useEffect(() => {
    console.log("--------------------Error Start-------------------------")
    console.log(error)
    console.log("--------------------Error End---------------------------")

  }, [error])
  // useEffect(() => {
  //   first
  
  //   return () => {
  //     second
  //   }
  // }, [])
  
  useEffect(() => {
    if(data2){
      getData()
    }
  }, [subgraphUrl, refetch, data2]);

  const AllData = () =>
    useMemo(() => {
      if (data) {
        return (
          <>
            <Typography>
              <p>Name - {data.protocols[0].name}</p>
              <p>Type - {data.protocols[0].type}</p>
              <p>Schema Version - {data.protocols[0].schemaVersion}</p>
              <p>Subgraph Version - {data.protocols[0].subgraphVersion}</p>
              {data?.protocols[0]?.methodologyVersion ? <p>Methodology Version - {data.protocols[0].methodologyVersion}</p>: null} 
            </Typography>
            {entitiesData.map((item, i) => (
              <Grid container>
                {item.map((name) => {
                  const dataChart = data[entities[i]].map((e: { [x: string]: any }) => 
                  ({date: Number(e.timestamp), value: Number(e[name])})
                  );
                  const length = data[entities[i]].length;
                  if(!data[entities[i]][0][name]){
                    return null
                  }
                  return <>
                  <Grid id={name} item xs={8}>
                      {Chart(name, dataChart, length)}
                    </Grid>
                    <Grid item xs={4} marginY={4}>
                      {Table(name, dataChart, length)}
                    </Grid>
                  </>
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
      {(loading2 || loading) && !!subgraphUrl ? <CircularProgress sx={{ margin: 6 }} size={50} /> : null}
      {(error2 || error) && !!subgraphUrl ? "Error Please check if you enter correct URL" : null}
      {AllData()}
    </div>
  );
}

export default App;
