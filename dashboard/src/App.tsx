import "./App.css";
import { Button, CircularProgress, Grid, Paper, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tabs, TextField, Typography } from "@mui/material";
import TabPanel from '@mui/lab/TabPanel';
import { ApolloClient, ApolloError,gql, InMemoryCache, useLazyQuery, useQuery } from "@apollo/client";
import { Box } from "@mui/system";

import { Chart as ChartJS, registerables } from "chart.js";
import React, { useEffect, useMemo, useState } from "react";
import moment from "moment";
import { schema } from "./queries/schema";
import { PoolName, PoolNames, Versions } from "./constants";
import { TabContext } from "@mui/lab";
import { Chart } from "./chartComponents/Chart";
import { TableChart } from "./chartComponents/TableChart";
import { TableEvents } from "./chartComponents/TableEvents";
import { poolDropDown } from "./utilComponents/PoolDropDown";

export const toDate = (timestamp: number) => {
  return moment.unix(timestamp).format("YYYY-MM-DD");
};

function isValidHttpUrl(s: string) {
  let url;
  try {
    url = new URL(s);
  } catch (_) {
    return false;  
  }

  return url.protocol === "http:" || url.protocol === "https:";
}

function App() {
  const [subgraphToQuery, setSubgraphToQuery] = useState({url: "", version: ""});
  const [urlTextField, setTextField] = useState<string>("");
  const [poolId, setPoolId] = useState<string>("");
  const [manualError, setManualError] = useState<ApolloError | undefined>(undefined);

  ChartJS.register(...registerables);

  const client = useMemo(
    () =>
      new ApolloClient({
        uri: subgraphToQuery.url,
        cache: new InMemoryCache(),
      }),
    [subgraphToQuery.url],
  );
  const query = gql`
    {
      protocols {
        type
        schemaVersion
      }
    }
  `;

  // This query is to fetch data about the protocol. This helps select the proper schema to make the full query
  const { data: protocolSchemaData, loading: protocolSchemaQueryLoading, error: protocolSchemaQueryError, refetch: protocolSchemaQueryRefetch } = useQuery(query, { client });
  
  // By default, set the schema version to the user selected. If user has not selected, go to the version on the protocol entity
  let schemaVersion = subgraphToQuery.version;
  if (!schemaVersion && protocolSchemaData?.protocols[0].schemaVersion) {
    schemaVersion = protocolSchemaData?.protocols[0].schemaVersion;
  }

  // The following section fetches the full data from the subgraph. It routes to query selection and then makes the request
  const {
    entitiesData,
    entities,
    poolData,
    query: graphQuery,
    events,
  } = schema(protocolSchemaData?.protocols[0].type, schemaVersion);
  let queryMain = gql`
    ${graphQuery}
  `;
  
  const [getData, { data, loading, error, refetch }] = useLazyQuery(queryMain, { variables: { poolId }, client });
  const [tabValue, setTabValue] = useState('1');

  // Error logging in case the full data request throws an error
  useEffect(() => {
    console.log("--------------------Error Start-------------------------");
    console.log(error, error ? Object.values(error) : null);
    console.log("--------------------Error End---------------------------");
  }, [error]);

  useEffect(() => {
    // If the schema query request was successful, make the full data query
    if (protocolSchemaData) {
      getData();
    }
  }, [subgraphToQuery.url, refetch, protocolSchemaData]);

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

  // AllData() is what renders the tabs and all of the data within them. This is also were data is mapped to call functions for the compoenents to be rendered
  // Chart/Table components are called as functions within here, they are imported from the chartComponents directory
  const AllData = () =>
    useMemo(() => {
      if (data) {
        // Data is the entity of the data in the subgraph. It is returned as an object with each entity as a key, and each value is an array with every instance of that entity
        console.log('DATA', data)

        // Mapping for the entities to be displayed on the protocol tab
        const protocolEntityElements = entities.map((entityName: string) => {
          // Exclude the following entities because they are not on the protocol tab
          if (
            entityName === "liquidityPoolHourlySnapshots" || 
            entityName === "liquidityPoolDailySnapshots" || 
            entityName === "marketHourlySnapshots" || 
            entityName === "marketDailySnapshots" || 
            entityName === "vaultHourlySnapshots" ||
            entityName === "vaultDailySnapshots") {
            return null;
          }
          const currentEntityData = data[entityName];
          // If the current entity has no instances, return the following
          if (currentEntityData.length === 0) {
            return <Grid style={{borderTop: "black 2px solid"}}><h2>ENTITY: {entityName}</h2><h3 style={{color: "red"}}>{entityName} HAS NO INSTANCES.</h3></Grid>
          }
          // dataFields object has corresponding key:value pairs. Key is the field name and value is an array with an object holding the coordinates to be plotted on the chart for that entity field.
          const dataFields: {[dataField: string]: [{date: number, value: number}]} = {};
          // dataFieldMetrics is used to store sums, expressions, etc calculated upon certain certain datafields to check for irregularities in the data
          const dataFieldMetrics: {[dataField: string]: {[metric: string]: number}} = {}
          // For the current entity, loop through all instances of that entity
          currentEntityData.forEach((entityInstance: {[x: string]: any }) => {
            // On the entity instance, loop through all of the entity fields within it
            Object.keys(entityInstance).forEach((entityFieldName: string) => {
              // skip the timestamp field on each entity instance
              if (entityFieldName === 'timestamp') {
                return;
              }
              // The following section determines whether or not the current field on the entity is a numeric value or an array that contains numeric values
              const currentInstanceField = entityInstance[entityFieldName];
              if (!isNaN(currentInstanceField)) {
                // If the entity field is a numeric value, push it to the array corresponding to the field name in the dataFields array
                // Add the value to the sum field on the entity field name in the dataFieldMetrics obj
                if (!dataFields[entityFieldName]) {
                  dataFields[entityFieldName] = [{value: Number(currentInstanceField), date: Number(entityInstance.timestamp)}];
                  dataFieldMetrics[entityFieldName] = {sum: Number(currentInstanceField)};
                } else {
                  dataFields[entityFieldName].push({value: Number(currentInstanceField), date: Number(entityInstance.timestamp)});
                  dataFieldMetrics[entityFieldName].sum += Number(currentInstanceField);
                }
              } else if (Array.isArray(currentInstanceField)) {
                // if the current entity field is an array, loop through it and create separate dataField keys for each index of the array
                // This way, each index on the field will have its own chart (ie rewardTokenEmissions[0] and rewardTokenEmissions[1] have their own charts)
                currentInstanceField.forEach((val: string, arrayIndex: number) => {
                  const dataFieldKey = entityFieldName + ' [' + arrayIndex + ']';
                  if (!dataFields[dataFieldKey]) {
                    dataFields[dataFieldKey] = [{value: Number(val), date: Number(entityInstance.timestamp)}];
                    dataFieldMetrics[dataFieldKey] = {sum: Number(val)};
                  } else {
                    dataFields[dataFieldKey].push({value: Number(val), date: Number(entityInstance.timestamp)});
                    dataFieldMetrics[dataFieldKey].sum += Number(val);
                  }
                });
              }
            });
          });

          // For each entity field/key in the dataFields object, create a chart and tableChart component
          // If the sum of all values for a chart is 0, display a warning that the entity is not properly collecting data
          return (<Grid style={{borderTop: "black 2px solid"}} container><h2>ENTITY: {entityName}</h2>{          
            Object.keys(dataFields).map((field: string) => {
              const label = entityName + '-' + field;
              return (<>
                {dataFieldMetrics[field].sum !== 0 ? null : <h4 style={{color: "red"}}>All values in {label} are zero. Verify that this data is being mapped correctly.</h4>}
                <Grid id={label} item xs={8}>
                  {Chart(label, dataFields[field], currentEntityData.length)}
                </Grid>
                <Grid item xs={4} marginY={4}>
                  {TableChart(label, dataFields[field], currentEntityData.length)}
                </Grid>
              </>)
            })
          }</Grid>)
        })

        // Mapping for the entities to be displayed on the pool tab
        // See documentation for the above mapping, it works the same except only for entities that pertain to a specific pool rather than the entire protocol
        const poolEntityElements = entities.map((entityName: string) => {
          if (!poolId) {
            return null;
          }
          if (
            entityName !== "liquidityPoolHourlySnapshots" &&
            entityName !== "liquidityPoolDailySnapshots" &&
            entityName !== "marketHourlySnapshots" &&
            entityName !== "marketDailySnapshots" &&
            entityName !== "vaultHourlySnapshots" &&
            entityName !== "vaultDailySnapshots") {
            return null;
          }
          const currentEntityData = data[entityName];
          if (currentEntityData.length === 0) {
            return <Grid style={{borderTop: "black 2px solid"}}><h2>ENTITY: {entityName}</h2><h3 style={{color: "red"}}>{entityName} HAS NO INSTANCES.</h3></Grid>
          }
          const dataFields: {[dataField: string]: [{date: number, value: number}]} = {};
          // dataFieldMetrics is used to store sums, expressions, etc calculated upon certain certain datafields to check for irregularities in the data
          const dataFieldMetrics: {[dataField: string]: {[metric: string]: number}} = {}
          currentEntityData.forEach((entityInstance: {[x: string]: any }) => {
            Object.keys(entityInstance).forEach((entityFieldName: string) => {
              if (entityFieldName === 'timestamp') {
                return;
              }
              const currentInstanceField = entityInstance[entityFieldName];
              if (!isNaN(currentInstanceField)) {
                if (!dataFields[entityFieldName]) {
                  dataFields[entityFieldName] = [{value: Number(currentInstanceField), date: Number(entityInstance.timestamp)}];
                  dataFieldMetrics[entityFieldName] = {sum: Number(currentInstanceField)};
                } else {
                  dataFields[entityFieldName].push({value: Number(currentInstanceField), date: Number(entityInstance.timestamp)});
                  dataFieldMetrics[entityFieldName].sum += Number(currentInstanceField);
                }
              } else if (Array.isArray(currentInstanceField)) {
                currentInstanceField.forEach((val: string, arrayIndex: number) => {
                  const dataFieldKey = entityFieldName + ' [' + arrayIndex + ']';
                  if (!dataFields[dataFieldKey]) {
                    dataFields[dataFieldKey] = [{value: Number(val), date: Number(entityInstance.timestamp)}];
                    dataFieldMetrics[dataFieldKey] = {sum: Number(val)};
                  } else {
                    dataFields[dataFieldKey].push({value: Number(val), date: Number(entityInstance.timestamp)});
                    dataFieldMetrics[dataFieldKey].sum += Number(val);
                  }
                });
              }
            });
          });

          return (<Grid style={{borderTop: "black 2px solid"}} container><h2>ENTITY: {entityName} - {poolId}</h2>{          
            Object.keys(dataFields).map((field: string) => {
              const label = entityName + '-' + field;
              return (<>
                {dataFieldMetrics[field].sum !== 0 ? null : <h4 style={{color: "red"}}>All values in {label} are zero. Verify that this data is being mapped correctly.</h4>}
                <Grid id={label} item xs={8}>
                  {Chart(label, dataFields[field], currentEntityData.length)}
                </Grid>
                <Grid item xs={4} marginY={4}>
                  {TableChart(label, dataFields[field], currentEntityData.length)}
                </Grid>
              </>)
            })
          }</Grid>)
        })

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
                  <p>Type - {data.protocols[0].type}</p>
                  <p>Schema Version - {schemaVersion}</p>
                  <p>Subgraph Version - {data.protocols[0].subgraphVersion}</p>
                  {data?.protocols[0]?.methodologyVersion ? (
                    <p>Methodology Version - {data.protocols[0].methodologyVersion}</p>
                  ) : null}
                <TabPanel value="1"><p>Name - {data.protocols[0].name}</p>

                  {/* PROTOCOL TAB */}

                  

                  {protocolEntityElements}

                </TabPanel>
                <TabPanel value="2">

                  {/* POOL TAB */}

                  {poolDropDown(poolId, setPoolId, data, PoolNames)}
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
                                <TableRow key={item}>
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

                  {poolEntityElements}

                </TabPanel>
                <TabPanel value="3">
                  
                  {/* EVENTS TAB */}

                  {poolDropDown(poolId, setPoolId, data, PoolNames)}
                      {
                        events.map((eventName)=>{
                          let eventError = null;
                          if (!poolId && data[eventName].length > 0) {
                            eventError = <h3 style={{color: "red"}}>A pool has not been selected, there should not be events</h3>
                          }
                          if (poolId && data[eventName].length === 0) {
                            eventError = <h3 style={{color: "red"}}>No {eventName} on pool {poolId}</h3>
                          }
                          return <React.Fragment>{eventError}{TableEvents(eventName, data[eventName])}</React.Fragment>;
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
  
  // The error display function takes the error object passed in and creates the elements/messages to be rendered
  const errorDisplay = (errorObject: ApolloError) => {
    const errorMsgs = []
    if (errorObject.graphQLErrors.length > 0) {
      // query errors
      for (let x = 0; x < 3; x++) {
        // Take up to the first 3 query error messages and push them to the errorMsgs array
        if (!errorObject.graphQLErrors[x]) {
          break;
        }
        errorMsgs.push(<h4>{errorObject.graphQLErrors[x].message}</h4>);
      }
      if (errorObject.graphQLErrors.length <=3) {
        // If there are less or eq to 3 query errors, reccomend comparing the subgraph schema to the common schema for discrepancies
        errorMsgs.push(<h2>The listed fields were expected in schema version {subgraphToQuery.version} but are not present in this subgraph. Verify that your schema has all of the fields that are in the common {protocolSchemaData?.protocols[0].type} {subgraphToQuery.version} schema.</h2>);
      } else {
        // If there are more than 3 query errors, it is possible the schemaVersion on the protocol entity was not updated. Allow the user to select querying on a different schema version
        errorMsgs.push(<><h2>Because of properties in the Protocol entity, {protocolSchemaData?.protocols[0].type} schema {protocolSchemaData?.protocols[0].schemaVersion} was queried. If this is not correct, select the correct schema version below</h2>
          {/* Create a button for every other schema version */}
          {Versions.SchemaVersions.map((version: string) => {
            if (version === protocolSchemaData?.protocols[0].schemaVersion) {
              return null;
            }
            return <Button onClick={() => setSubgraphToQuery({url: urlTextField, version: version})}>Schema {version}</Button>
          })}
        </>);
      }
    }

    if (errorObject.networkError || errorMsgs.length === 0) {
      // Default error message
      errorMsgs.push(<h4>Is the provided URL a subgraph query endpoint? Double check that this URL is correct and try again.</h4>)
    }
    console.log(errorMsgs);
    return (<><h2>ERROR: </h2>{errorMsgs}</>);
  }

  // errorRender is the element to be rendered to display the error
  let errorRender = null;
  // Conditionals for calling the errorDisplay() function for the various types of errors
  // Bottom to top priority an 'protocolSchemaQueryError' will override 'manualError'
  if (manualError) {
    errorRender = errorDisplay(manualError);
  }
  if (protocolSchemaQueryError) {
    errorRender = errorDisplay(protocolSchemaQueryError);
  }
  if (error) {
    errorRender = errorDisplay(error);
  }
  

  return (
    <div className="App">
      <TextField
        sx={{ maxWidth: 1000, margin: 2 }}
        label="Graph Url"
        fullWidth
        onChange={(event) => {
          setManualError(undefined);
          setTextField(event.target.value)
        }}
      />

      <Box marginTop={1}>
        <Button onClick={() => {
          if (!isValidHttpUrl(urlTextField)) {
            // If the provided URL is not a valid Http URL, set a manual error
            setManualError(new ApolloError({networkError: new Error("INVALID URL")}));
            return;
          }
          setSubgraphToQuery({url: urlTextField, version: ""});
        }}>Show Graphs</Button>
      </Box>
      {(protocolSchemaQueryLoading || loading) && !!subgraphToQuery.url ? <CircularProgress sx={{ margin: 6 }} size={50} /> : null}

      {AllData()}
      {errorRender}
    </div>
  );
}

export default App;
