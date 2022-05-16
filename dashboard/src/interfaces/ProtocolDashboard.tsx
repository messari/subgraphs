import "./ProtocolDashboard.css";
import { Button, CircularProgress, Tab, Tabs, Typography } from "@mui/material";
import TabPanel from "@mui/lab/TabPanel";
import { ApolloClient, gql, HttpLink, InMemoryCache, useLazyQuery, useQuery } from "@apollo/client";
import { Box } from "@mui/system";

import { Chart as ChartJS, registerables } from "chart.js";
import React, { useEffect, useMemo, useState } from "react";
import moment from "moment";
import { schema } from "../queries/schema";
import { PoolNames, ProtocolTypeEntity, SubgraphBaseUrl } from "../constants";
import { TabContext } from "@mui/lab";
import { TableEvents } from "../common/chartComponents/TableEvents";
import { PoolDropDown } from "../common/utilComponents/PoolDropDown";
import ProtocolTab from "./tabs/ProtocolTab";
import PoolTab from "./tabs/PoolTab";
import ErrorDisplay from "./ErrorDisplay";
import WarningDisplay from "./WarningDisplay";
import { useSearchParams } from "react-router-dom";
import { useNavigate } from "react-router";
import { isValidHttpUrl, parseSubgraphName } from "../utils";

export const toDate = (timestamp: number) => {
  return moment.unix(timestamp).format("YYYY-MM-DD");
};

function ProtocolDashboard() {
  const [searchParams] = useSearchParams();
  const subgraphParam = searchParams.get("subgraph");
  const tabString = searchParams.get("tab") || "";
  const poolIdString = searchParams.get("poolId") || "";
  const scrollToView = searchParams.get("view") || "";
  const navigate = useNavigate();

  const [subgraphToQuery, setSubgraphToQuery] = useState({ url: "", version: "" });
  const [poolId, setPoolId] = useState<string>(poolIdString);
  const [warning, setWarning] = useState<{ message: string; type: string }[]>([]);
  if (!subgraphToQuery.url && subgraphParam) {
    let queryURL = `${SubgraphBaseUrl}${subgraphParam}`;
    const parseCheck = isValidHttpUrl(subgraphParam);
    if (parseCheck) {
      queryURL = subgraphParam;
    }
    setSubgraphToQuery({ url: queryURL, version: subgraphToQuery.version });
  }
  ChartJS.register(...registerables);
  const link = new HttpLink({
    uri: subgraphToQuery.url,
    // fetchOptions: {
    //   mode: 'no-cors',
    // }
  });
  const client = useMemo(
    () =>
      new ApolloClient({
        link,
        cache: new InMemoryCache(),
      }),
    [subgraphToQuery.url],
  );
  const query = gql`
    {
      protocols {
        type
        schemaVersion
        subgraphVersion
        name
        id
      }
    }
  `;

  // This query is to fetch data about the protocol. This helps select the proper schema to make the full query
  const {
    data: protocolSchemaData,
    loading: protocolSchemaQueryLoading,
    error: protocolSchemaQueryError
  } = useQuery(query, { client });

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
    protocolFields,
  } = schema(protocolSchemaData?.protocols[0].type, schemaVersion);
  const queryMain = gql`
    ${graphQuery}
  `;

  const [getData, { data, loading, error, refetch }] = useLazyQuery(queryMain, { variables: { poolId }, client });

  let tabNum = "1";
  if (tabString.toUpperCase() === "POOL" || tabString.toUpperCase() === "MARKET") {
    tabNum = "2";
  } else if (tabString.toUpperCase() === "EVENTS") {
    tabNum = "3";
  }

  const [tabValue, setTabValue] = useState(tabNum);

  // Error logging in case the full data request throws an error
  useEffect(() => {
    console.log("--------------------Error Start-------------------------");
    console.log(error, error ? Object.values(error) : null);
    console.log(protocolSchemaQueryError ? Object.values(protocolSchemaQueryError) : null);
    console.log("--------------------Error End---------------------------");
  }, [error]);

  useEffect(() => {
    // If the schema query request was successful, make the full data query
    if (protocolSchemaData) {
      getData();
    }
  }, [subgraphToQuery.url, refetch, protocolSchemaData]);


  useEffect(() => {
    document.getElementById(scrollToView)?.scrollIntoView();
  })

  const handleTabChange = (event: any, newValue: string) => {
    setWarning([]);
    let tabName = "protocol";
    if (newValue === "2") {
      tabName = "pool";
    } else if (newValue === "3") {
      tabName = "events";
    }
    navigate('?subgraph=' + subgraphParam + '&poolId=' + poolId + '&tab=' + tabName);
    setTabValue(newValue);
  };

  // AllData() is what renders the tabs and all of the data within them. This is also were data is mapped to call functions for the compoenents to be rendered
  // Chart/Table components are called as functions within here, they are imported from the chartComponents directory
  const AllData = () =>
    useMemo(() => {
      if (data) {
        // Data is the entity of the data in the subgraph. It is returned as an object with each entity as a key, and each value is an array with every instance of that entity
        const issues: { message: string; type: string }[] = warning;
        const poolNames = PoolNames[data.protocols[0].type];
        const protocolEntityName = ProtocolTypeEntity[data.protocols[0].type];
        console.log("DATA", data, data[protocolEntityName][0]?.lendingType);
        if (data[protocolEntityName][0]?.lendingType === "CDP") {
          protocolFields.mintedTokens += '!';
          protocolFields.mintedTokenSupplies += '!';
        }

        return (
          <>
            <Typography>
              <TabContext value={tabValue}>
                <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                  <Tabs centered value={tabValue} onChange={handleTabChange}>
                    <Tab label="Protocol" value="1" />
                    <Tab label="Pool" value="2" />
                    <Tab label="Events" value="3" />
                  </Tabs>
                </Box>
                <TabPanel value="1">
                  {/* PROTOCOL TAB */}

                  {ProtocolTab(data, entities, entitiesData, protocolFields, setWarning, warning)}
                </TabPanel>
                <TabPanel value="2">
                  {/* POOL TAB */}
                  <PoolTab
                    data={data}
                    entities={entities}
                    entitiesData={entitiesData}
                    poolId={poolId}
                    setPoolId={(x) => setPoolId(x)}
                    poolData={poolData}
                    setWarning={(x) => setWarning(x)}
                    warning={warning}
                  />
                </TabPanel>
                <TabPanel value="3">
                  {/* EVENTS TAB */}

                  {setWarning(issues)}
                  <PoolDropDown poolId={poolId} setPoolId={(x) => setPoolId(x)} setWarning={(x) => setWarning(x)} markets={data[poolNames]} />
                  {events.map((eventName) => {
                    if (!poolId && data[eventName].length > 0) {
                      const message = 'No pool selected, there should not be "' + eventName + '" events';
                      if (issues.filter((x) => x.message === message).length === 0) {
                        issues.push({ message, type: "NOEV" });
                      }
                    }
                    if (poolId && data[eventName].length === 0) {
                      const message = "No " + eventName + " on pool " + poolId;
                      if (issues.filter((x) => x.message === message).length === 0) {
                        issues.push({ message, type: "EVENT" });
                      }
                    }
                    return <React.Fragment>{TableEvents(eventName, data, eventName, poolId)}</React.Fragment>;
                  })}
                </TabPanel>
              </TabContext>
            </Typography>
          </>
        );
      }
      return null;
    }, [data, tabValue]);

  // errorRender is the element to be rendered to display the error
  let errorDisplayProps = null;
  // Conditionals for calling the errorDisplay() function for the various types of errors
  // Bottom to top priority an 'protocolSchemaQueryError' will override 'warning'

  if (protocolSchemaQueryError && !loading) {
    errorDisplayProps = protocolSchemaQueryError;
  }
  if (error && !loading) {
    errorDisplayProps = error;
  }

  let protocolInfo = null;
  if (protocolSchemaData?.protocols.length > 0) {
    protocolInfo = (
      <div style={{ padding: "6px 24px" }}>
        <h3>
          {protocolSchemaData.protocols[0].name} - {protocolSchemaData.protocols[0].id}
        </h3>
        <p>
          <a href={subgraphToQuery.url}>Subgraph Query Endpoint - {subgraphToQuery.url}</a>
        </p>
        <p>Type - {protocolSchemaData.protocols[0].type}</p>
        <p>Schema Version - {schemaVersion}</p>
        <p>Subgraph Version - {protocolSchemaData?.protocols[0]?.subgraphVersion}</p>
        {protocolSchemaData?.protocols[0]?.methodologyVersion ? (
          <p>Methodology Version - {protocolSchemaData.protocols[0].methodologyVersion}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="ProtocolDashboard">
      <Button
        style={{ margin: "24px" }}
        onClick={(name) => {
          navigate(`/`);
        }}
      >
        RETURN TO DEPLOYMENTS
      </Button>
      {protocolInfo}
      <ErrorDisplay
        errorObject={errorDisplayProps}
        setSubgraphToQuery={(x) => setSubgraphToQuery(x)}
        protocolSchemaData={protocolSchemaData}
        subgraphToQuery={subgraphToQuery}
      />
      <WarningDisplay warningArray={warning} />
      {(protocolSchemaQueryLoading || loading) && !!subgraphToQuery.url ? (
        <CircularProgress sx={{ margin: 6 }} size={50} />
      ) : null}
      {AllData()}
    </div>
  );
}

export default ProtocolDashboard;