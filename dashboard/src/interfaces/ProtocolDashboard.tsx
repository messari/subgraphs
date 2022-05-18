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
import ProtocolTab from "./tabs/ProtocolTab";
import PoolTab from "./tabs/PoolTab";
import ErrorDisplay from "./ErrorDisplay";
import WarningDisplay from "./WarningDisplay";
import { useSearchParams } from "react-router-dom";
import { useNavigate } from "react-router";
import { isValidHttpUrl, parseSubgraphName } from "../utils";
import EventsTab from "./tabs/EventsTab";
import AllDataTabs from "./AllDataTabs";
import ProtocolInfo from "./ProtocolInfo";

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

  ChartJS.register(...registerables);
  const link = new HttpLink({
    uri: subgraphToQuery.url
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
    if (!subgraphToQuery.url && subgraphParam) {
      let queryURL = `${SubgraphBaseUrl}${subgraphParam}`;
      const parseCheck = isValidHttpUrl(subgraphParam);
      if (parseCheck) {
        queryURL = subgraphParam;
      }
      setSubgraphToQuery({ url: queryURL, version: subgraphToQuery.version });
    }
  }, [subgraphToQuery.url, subgraphParam]);

  useEffect(() => {
    document.getElementById(scrollToView)?.scrollIntoView();
  }, [scrollToView])

  const handleTabChange = (event: any, newValue: string) => {
    setWarning([]);
    let tabName = "protocol";
    if (newValue === "2") {
      tabName = "pool";
    } else if (newValue === "3") {
      tabName = "events";
    }
    navigate(`?subgraph=${subgraphParam}&poolId=${poolId}&tab=${tabName}`);
    setTabValue(newValue);
  };

  // AllData() is what renders the tabs and all of the data within them. This is also were data is mapped to call functions for the compoenents to be rendered
  // Chart/Table components are called as functions within here, they are imported from the chartComponents directory



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
    protocolInfo = <ProtocolInfo protocolSchemaData={protocolSchemaData} subgraphToQueryURL={subgraphToQuery.url} schemaVersion={schemaVersion} />
  }

  let allDataTabs = null;
  if (data) {
    allDataTabs = <AllDataTabs
      data={data}
      entities={entities}
      entitiesData={entitiesData}
      tabValue={tabValue}
      protocolFields={protocolFields}
      issues={warning}
      poolNames={PoolNames[data.protocols[0].type]}
      poolId={poolId}
      poolData={poolData}
      events={events}
      setWarning={(x) => setWarning(x)}
      setPoolId={(x) => setPoolId(x)}
      handleTabChange={(x, y) => handleTabChange(x, y)}
    />
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
      {allDataTabs}
    </div>
  );
}

export default ProtocolDashboard;