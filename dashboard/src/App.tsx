import "./App.css";
import { Button, CircularProgress, Grid, MenuItem, Paper, Select, SelectChangeEvent, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tabs, TextField, Typography } from "@mui/material";
import TabPanel from '@mui/lab/TabPanel';
import { ApolloClient, gql, InMemoryCache, useLazyQuery, useQuery } from "@apollo/client";
import { Line } from "react-chartjs-2";
import { Box } from "@mui/system";

import { Chart as ChartJS, registerables } from "chart.js";
import { useEffect, useMemo, useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import moment from "moment";
import { schema } from "./queries/schema";
import { PoolName, PoolNames } from "./constants";
import { TabContext } from "@mui/lab";
export const toDate = (timestamp: number) => {
  return moment.unix(timestamp).format("YYYY-MM-DD");
};
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

export const TableChart = (_datasetLabel: string, dataTable: any, _dataLength: number) => {
  if (dataTable) {
    const columns = [
      { field: "date", headerName: "Date", width: 150 },
      {
        field: "value",
        headerName: "Value",
        width: 150,
      },
    ];
    const tableData = dataTable.map((val: any, i: any) => ({
      id: i,
      date: toDate(val.date),
      value: val.value.toLocaleString(),
    }));
    return (
      <DataGrid
        initialState={{
          sorting: {
            sortModel: [{ field: "date", sort: "desc" }],
          },
        }}
        rows={tableData}
        columns={columns}
      />
    );
  }
  return null;
};


export const TableEvents = (_datasetLabel: string, dataTable: any) => {
  if (dataTable && dataTable[0]) {
    const tableData = dataTable.map((val:any,i:any) => { return {id:i ,date: toDate(val.timestamp),...val}})
    const columns = Object.entries(dataTable[0]).filter(function([k, val]) {
      if(k.includes("typename")){
        return false 
      }
      return true;
    }).map(([k, val])=> {
      
      return { field: k, headerName: k, width: 250 }
    })
    columns.push({ field: 'date', headerName: 'date', width: 250 })


    return (
      <Box height={750} margin={6}>
      <Typography fontSize={20}><b>{_datasetLabel.toUpperCase()}</b></Typography>
      <DataGrid
        pageSize={10}
        initialState={{
          sorting: {
            sortModel: [{ field: "timestamp", sort: "desc" }],
          },
        }}
        rows={tableData}
        columns={columns}
      />
      </Box>
    );
  }
  return null;
};
function App() {
  const [subgraphUrl, setSubgraphUrl] = useState<string>("");
  const [urlTextField, setTextField] = useState<string>("");
  const [poolId, setPoolId] = useState<string>("");

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
  const { data: data2, loading: loading2, error: error2, refetch: refetch2 } = useQuery(query, { client });
  const {
    entitiesData,
    entities,
    poolData,
    query: graphQuery,
    events,
  } = schema(data2?.protocols[0].type, data2?.protocols[0].schemaVersion);
  const queryMain = gql`
    ${graphQuery}
  `;

  const [getData, { data, loading, error, refetch }] = useLazyQuery(queryMain, { variables: { poolId }, client });
  const [tabValue, setTabValue] = useState('1');

  useEffect(() => {
    console.log("--------------------Error Start-------------------------");
    console.log(error);
    console.log("--------------------Error End---------------------------");
  }, [error]);

  useEffect(() => {
    if (data2) {
      getData();
    }
  }, [subgraphUrl, refetch, data2]);
  const handleTabChange = (event: any, newValue: string) => {
    setTabValue(newValue);
  };

  const parseMetaData = (value: any, item: string,poolValues:any) =>{
    
    if (item.includes("Tokens")) {
      return value.map((token: any, i: number) => {
        let returnVal = token.name;
        if (i < value.length - 1) {
          returnVal += ", ";
        }
        return returnVal;
      })
    }
    if (item.includes("Token")) {
      return value.name
    }

    if (item.includes("fees")) {
      return value.map((val: any,i:number) => {
        let returnVal = val.feeType + "=" + val.feePercentage + "%";
        if (i < value.length - 1) {
          returnVal += ", ";
        }
        return returnVal;
      });
    }
    if(item.includes("Balances")){
      return value.map((val: any,i:number) => {
        const balance = Number(val) / (10 ** Number(poolValues.inputTokens[i].decimals))
        let returnVal = poolValues.inputTokens[i].name + "=" + balance;
        if (i < value.length - 1) {
          returnVal += ", ";
        }
        return returnVal;
      });
    }

    return value
  }
  const poolDropDown  = () =>{
    
      return (
        <Select
        
        fullWidth
        sx={{ maxWidth: 1000, margin: 2 }}
          labelId="demo-simple-select-filled-label"
          id="demo-simple-select-filled"
          value={poolId}
          onChange={(event: SelectChangeEvent) => {setPoolId(event.target.value);}}
        >

          <MenuItem value="">
                <em>No Pool Selected</em>
              </MenuItem>
          {
            data[PoolNames[data.protocols[0].type]].map((e:any)=>{
              return (
                <MenuItem value={e.id}>
                <em>{e.id} - {e.name}</em>
              </MenuItem>
              )
            })
          }
        </Select>
      )
  }
  const AllData = () =>
    useMemo(() => {
      if (data) {
        return (
          <>
            <Typography>


              <TabContext value={tabValue}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                  <Tabs centered value={tabValue} onChange={handleTabChange} >
                    <Tab label="Protocol" value="1" />
                    <Tab label="Pool" value="2" />
                    <Tab label="Events" value="3" />
                  </Tabs>
                </Box>
                <TabPanel value="1"><p>Name - {data.protocols[0].name}</p>
                  <p>Type - {data.protocols[0].type}</p>
                  <p>Schema Version - {data.protocols[0].schemaVersion}</p>
                  <p>Subgraph Version - {data.protocols[0].subgraphVersion}</p>
                  {data?.protocols[0]?.methodologyVersion ? (
                    <p>Methodology Version - {data.protocols[0].methodologyVersion}</p>
                  ) : null}

                  {entitiesData.map((item, i) => (
                    <Grid container>
                      {item.map((name) => {
                        let dataName = name;
                        if (data[entities[i]].length < 1) {
                          return null;
                        }
                        if (entities[i].includes("market") || entities[i].includes("vault") || entities[i].includes("pool")) {
                          return null
                        }

                        const dataChart = data[entities[i]].map((e: { [x: string]: any }) => ({
                          date: Number(e.timestamp),
                          value: Number(e[name]),
                        }));
                        const length = data[entities[i]].length;
                        if (!data[entities[i]][0][name]) {
                          return null;
                        }

                        return (
                          <>
                            <Grid id={dataName} item xs={8}>
                              {Chart(dataName, dataChart, length)}
                            </Grid>
                            <Grid item xs={4} marginY={4}>
                              {TableChart(dataName, dataChart, length)}
                            </Grid>
                          </>
                        );
                      })}
                    </Grid>
                  ))}
                </TabPanel>
                <TabPanel value="2">
                  {poolId
                    ?
                    <TableContainer component={Paper} sx={{justifyContent:"center", display:"flex", alignItems:"center"}}>
                      <Table sx={{ maxWidth: 800 }} aria-label="simple table">

                        <TableBody>

                          {
                            poolData.map((item) => {
                              const val = String(data.protocols[0].type);
                              const poolName = PoolName[val];
                              const poolValues = data[poolName];
                              let value = poolValues[item];
                              if (value === "" || !value) {
                                return null;
                              }
              
                              return (
                                <TableRow
                                  key={item}
                                >
                                  <TableCell component="th" scope="row">
                                    {item}
                                  </TableCell>
                                  <TableCell align="right">{parseMetaData(value, item,poolValues)}</TableCell>

                                </TableRow>
                              );
                            })
                          }
                        </TableBody>
                      </Table>
                    </TableContainer>

                    : null}


                  {entitiesData.map((item, i) => (
                    <Grid container>
                      {item.map((name) => {
                        let dataName = name;
                        if (data[entities[i]].length < 1) {
                          return null;
                        }
                        if (!(entities[i].includes("market") || entities[i].includes("vault") || entities[i].includes("pool"))) {
                          return null;
                        }

                        const dataChart = data[entities[i]].map((e: { [x: string]: any }) => ({
                          date: Number(e.timestamp),
                          value: Number(e[name]),
                        }));
                        const length = data[entities[i]].length;
                        if (!data[entities[i]][0][name]) {
                          return null;
                        }

                        return (
                          <>
                            <Grid id={dataName} item xs={8}>
                              {Chart(dataName, dataChart, length)}
                            </Grid>
                            <Grid item xs={4} marginY={4}>
                              {TableChart(dataName, dataChart, length)}
                            </Grid>
                          </>
                        );
                      })}
                    </Grid>
                  ))}
                </TabPanel>
                <TabPanel value="3">
                      
                      {
                        events.map((e,i)=>{
                          return TableEvents(e, data[e])
                      
                        })
                      }
                </TabPanel>
              </TabContext>

            </Typography>

          </>
        );
      }
      return null;
    }, [data, tabValue]);
  return (
    <div className="App">
      <TextField
        sx={{ maxWidth: 1000, margin: 2 }}
        label="Graph Url"
        fullWidth
        onChange={(event) => setTextField(event.target.value)}
      />
      {
        data 
        ?
        poolDropDown()
        :(<TextField
        sx={{ maxWidth: 1000, margin: 2 }}
        label="Pool Id(Optional)"
        fullWidth
        onChange={(event) => setPoolId(event.target.value)}
      />)

      }

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
