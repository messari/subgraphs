import "./ProtocolDashboard.css";
import { Button, CircularProgress, Grid, Paper, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tabs, TextField, Typography } from "@mui/material";
import TabPanel from '@mui/lab/TabPanel';
import { ApolloClient, gql, InMemoryCache, useLazyQuery, useQuery } from "@apollo/client";
import { Box } from "@mui/system";

import { Chart as ChartJS, registerables } from "chart.js";
import React, { useEffect, useMemo, useState } from "react";
import moment from "moment";
import { schema } from "../queries/schema";
import { PoolNames } from "../constants";
import { TabContext } from "@mui/lab";
import { TableEvents } from "../chartComponents/TableEvents";
import { poolDropDown } from "../utilComponents/PoolDropDown";
import ProtocolTab from "./tabs/ProtocolTab";
import PoolTab from "./tabs/PoolTab";
import ErrorDisplay from "./ErrorDisplay";
import WarningDisplay from "./WarningDisplay";

export const toDate = (timestamp: number) => {
  return moment.unix(timestamp).format("YYYY-MM-DD");
};

function ProtocolDashboard(subgraphUrl: string, selectSubgraph: React.Dispatch<React.SetStateAction<string>>, urlTextField: string) {
  const [subgraphToQuery, setSubgraphToQuery] = useState({url: "", version: ""});
  const [poolId, setPoolId] = useState<string>("");
  const [warning, setWarning] = useState<{message: string, type: string}[]>([]);
  if (!subgraphToQuery.url && subgraphUrl) {
    setSubgraphToQuery({url: subgraphUrl, version: subgraphToQuery.version});
  }
  ChartJS.register(...registerables);

  const client = useMemo(
    () =>
      new ApolloClient({
        uri: subgraphToQuery.url,
        cache: new InMemoryCache()
      }),
    [subgraphToQuery.url],
  );
  const query = gql`
    {
      protocols {
        type
        schemaVersion
        subgraphVersion
        methodologyVersion
        name
        id
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
    protocolFields
  } = schema(protocolSchemaData?.protocols[0].type, schemaVersion);
  const queryMain = gql`
    ${graphQuery}
  `;
  
  const [getData, { data, loading, error, refetch }] = useLazyQuery(queryMain, { variables: { poolId }, client });
  const [tabValue, setTabValue] = useState('1');

  // Error logging in case the full data request throws an error
  useEffect(() => {
    console.log("--------------------Error Start-------------------------");
    console.log(error, error ? Object.values(error) : null);
    console.log(protocolSchemaQueryError);
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

  const parseMetaData = (value: any, item: string, poolValues: any) =>{
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
        const balance = Number(val) / (10 ** Number(poolValues.inputTokens[i].decimals));
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
                <TabPanel value="1">

                  {/* PROTOCOL TAB */}
                  
                  {ProtocolTab(data, entities, entitiesData, protocolFields, setWarning)}

                </TabPanel>
                <TabPanel value="2">

                  {/* POOL TAB */}

                  {PoolTab(data, entities, entitiesData, poolId, setPoolId, poolData, parseMetaData, setWarning)}

                </TabPanel>
                <TabPanel value="3">
                  
                  {/* EVENTS TAB */}

                  {poolDropDown(poolId, setPoolId, data.markets, PoolNames)}
                  {
                    events.map((eventName)=>{
                      // let eventError = null;
                      // if (!poolId && data[eventName].length > 0) {
                      //   eventError = <h3 style={{color: "red"}}>A pool has not been selected, there should not be events</h3>
                      // }
                      // if (poolId && data[eventName].length === 0) {
                      //   eventError = <h3 style={{color: "red"}}>No {eventName} on pool {poolId}</h3>
                      // }
                      return <React.Fragment>{TableEvents(eventName, data[eventName])}</React.Fragment>;
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

  // errorRender is the element to be rendered to display the error
  let errorRender = null;
  // Conditionals for calling the errorDisplay() function for the various types of errors
  // Bottom to top priority an 'protocolSchemaQueryError' will override 'warning'
  if (warning && !loading) {
    errorRender = WarningDisplay(warning);
  }
  if (protocolSchemaQueryError && !loading) {
    errorRender = ErrorDisplay(protocolSchemaQueryError, setSubgraphToQuery, protocolSchemaData, subgraphToQuery);
  }
  if (error && !loading) {
    errorRender = ErrorDisplay(error, setSubgraphToQuery, protocolSchemaData, subgraphToQuery);
  }  
  
  let protocolInfo = null;
  if (protocolSchemaData?.protocols.length > 0) {
    protocolInfo = (
      <div style={{padding: "6px 24px"}}>
        <h3>{protocolSchemaData.protocols[0].name} - {protocolSchemaData.protocols[0].id}</h3>
        <p>Type - {protocolSchemaData.protocols[0].type}</p>
        <p>Schema Version - {schemaVersion}</p>
        <p>Subgraph Version - {protocolSchemaData?.protocols[0]?.subgraphVersion}</p>
        {protocolSchemaData?.protocols[0]?.methodologyVersion ? (
          <p>Methodology Version - {protocolSchemaData.protocols[0].methodologyVersion}</p>
        ) : null}
    </div>);
  }

  return (
    <div className="ProtocolDashboard">
      <Button style={{margin: "24px"}} onClick={() => {
        client.resetStore();
        setSubgraphToQuery({url: "", version: ""})
        selectSubgraph("")
      }}>RETURN TO DEPLOYMENTS</Button>
      {protocolInfo}
      {errorRender}
      {(protocolSchemaQueryLoading || loading) && !!subgraphToQuery.url ? <CircularProgress sx={{ margin: 6 }} size={50} /> : null}
      {AllData()}
    </div>
  );
}

export default ProtocolDashboard;
