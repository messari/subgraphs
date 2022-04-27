import "./App.css";
import { Button, CircularProgress, Grid, MenuItem, Paper, Select, SelectChangeEvent, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tabs, TextField, Typography } from "@mui/material";
import TabPanel from '@mui/lab/TabPanel';
import { ApolloClient, ApolloError, DocumentNode, gql, InMemoryCache, useLazyQuery, useQuery } from "@apollo/client";
import { Line } from "react-chartjs-2";
import { Box } from "@mui/system";

import { Chart as ChartJS, registerables } from "chart.js";
import React, { useEffect, useMemo, useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import moment from "moment";
import { schema } from "./queries/schema";
import { PoolName, PoolNames, Versions } from "./constants";
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
  const [schemaVersion, setSchemaVersion] = useState<string>("");

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
  if (!schemaVersion && data2?.protocols[0].schemaVersion) {
    setSchemaVersion(data2?.protocols[0].schemaVersion);
  }
  const {
    entitiesData,
    entities,
    poolData,
    query: graphQuery,
    events,
  } = schema(data2?.protocols[0].type, schemaVersion);
  let queryMain = gql`
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
        console.log('DATA', data)
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
                  <p>Schema Version - {schemaVersion}</p>
                  <p>Subgraph Version - {data.protocols[0].subgraphVersion}</p>
                  {data?.protocols[0]?.methodologyVersion ? (
                    <p>Methodology Version - {data.protocols[0].methodologyVersion}</p>
                  ) : null}

                  {entitiesData.map((item, i) => {
                    const entity = entities[i];
                    return (
                    <Grid container>
                      {item.map((name) => {

                        // 'name' values listed here do not need a graph
                        if (name === 'timestamp') {
                          return null;
                        }
                        // console.log('ENTITY', i, item, entity)
                        
                        // This expression takes the data sources of each chart and filters out values/y coordinates that are not numeric
                        // The values that are generally filtered out are objects/arrays where multiple values are held in one entity field
                        const currentData = data[entity].filter((e: { [x: string]: any }) => {
                          return !isNaN(Number(e[name]))
                        });

                        // If the data set for a graph is 0, return
                        if (currentData.length < 1) {
                          return null;
                        }
                        // The following entities are displayed on a different tab
                        if (entity.includes("market") || entity.includes("vault") || entity.includes("pool")) {
                          return null;
                        }

                        // The sum of all y coordinate values
                        // This is used to detect erroneous outputs on a graph (ie all 0 vals)
                        let sum = 0;
                        const dataChart = currentData.map((e: { [x: string]: any }) => {
                          // Later on will put functions to detect error patterns in the data
                          sum += Number(e[name]);
                          return { date: Number(e.timestamp), value: Number(e[name])}
                        });

                        const length = currentData.length;
                        
                        // The label on the graph. 
                        const label = entity + '-' + name;

                          return (
                            <>
                            {sum ? null: <h4 style={{color: 'red'}}>ALL VALUES ARE ZERO. Evaluate how data is collected for the {name} field on {entity}</h4>}
                            <Grid id={label} item xs={8}>
                              {Chart(label, dataChart, length)}
                            </Grid>
                            <Grid item xs={4} marginY={4}>
                              {TableChart(label, dataChart, length)}
                            </Grid>
                          </>
                        );
                      })}
                    </Grid>
                  )})}
                </TabPanel>
                <TabPanel value="2">
                  {poolDropDown()}
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
                  {poolDropDown()}

                      {
                        events.map((e,i)=>{
                          console.log('e', e, i, data[e])
                          let eventError = null;
                          if (!poolId && data[e].length > 0) {
                            eventError = <h3 style={{color: "red"}}>A pool has not been selected, there should not be events</h3>
                          }
                          if (poolId && data[e].length === 0) {
                            eventError = <h3 style={{color: "red"}}>No {e} events on pool {poolId}</h3>
                          }
                          return <React.Fragment>{eventError}{TableEvents(e, data[e])}</React.Fragment>;
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

      <Box marginTop={1}>
        <Button onClick={() => {
          setSchemaVersion("");
          setSubgraphUrl(urlTextField);
        }}>Show Graphs</Button>
      </Box>
      {(loading2 || loading) && !!subgraphUrl ? <CircularProgress sx={{ margin: 6 }} size={50} /> : null}
      {(error2 || error) && (!loading2 || loading) && !!subgraphUrl ? <h2>Error Please check if you entered the correct URL</h2> : null}
      {(error2 || error) && (!loading2 || loading) && !data ? <h2>Detected schema type {(data2?.protocols[0].type)} and version {data2?.protocols[0].schemaVersion}</h2>: null}
      {(error2 || error) && (!loading2 || loading) && !data ? (
      <Box marginTop={1}>
        <h3>If this is not the expected schema version, select a different version from the following list:</h3>
        {Versions.SchemaVersions.map((version: string) => {
          if (version === data2?.protocols[0].schemaVersion) {
            return null;
          }
          return <Button onClick={() => setSchemaVersion(version)}>Schema {version}</Button>
        })
        }
        <h4>If the version is incorrect, update "schemaVersion" field on the protocol entity in the mapping file.</h4>
      </Box>): null}
      {AllData()}
    </div>
  );
}

export default App;
