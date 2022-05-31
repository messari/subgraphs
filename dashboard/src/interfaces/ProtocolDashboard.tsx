import { CircularProgress } from "@mui/material";
import { ApolloClient, ApolloError, gql, HttpLink, InMemoryCache, useLazyQuery, useQuery } from "@apollo/client";

import { Chart as ChartJS, registerables } from "chart.js";
import React, { useEffect, useMemo, useState } from "react";
import { poolOverview, schema } from "../queries/schema";
import { PoolNames, SubgraphBaseUrl } from "../constants";
import ErrorDisplay from "./ErrorDisplay";
import { useSearchParams } from "react-router-dom";
import { useNavigate } from "react-router";
import { isValidHttpUrl, NewClient } from "../utils";
import AllDataTabs from "./AllDataTabs";
import { DashboardHeader } from "../graphs/DashboardHeader";

function ProtocolDashboard() {
  const [searchParams] = useSearchParams();
  const subgraphParam = searchParams.get("endpoint");
  const tabString = searchParams.get("tab") || "";
  const poolIdString = searchParams.get("poolId") || "";
  const scrollToView = searchParams.get("view") || "";
  const protocolIdString = searchParams.get("protocolId") || "";
  const skipAmtParam = Number(searchParams.get("skipAmt")) || 0;

  const navigate = useNavigate();

  const [subgraphToQuery, setSubgraphToQuery] = useState({ url: "", version: "" });
  const [poolId, setPoolId] = useState<string>(poolIdString);
  const [protocolId, setprotocolId] = useState<string>(protocolIdString);
  const [skipAmt, paginate] = useState<number>(skipAmtParam);

  ChartJS.register(...registerables);
  const client = useMemo(() => {
    return new ApolloClient({
      link: new HttpLink({
        uri: subgraphToQuery.url,
      }),
      cache: new InMemoryCache(),
    });
  }, [subgraphToQuery.url]);
  const query = gql`
    {
      protocols {
        type
        schemaVersion
        subgraphVersion
        methodologyVersion
        name
        id
        network
      }
    }
  `;

  // This query is to fetch data about the protocol. This helps select the proper schema to make the full query
  const {
    data: protocolSchemaData,
    loading: protocolSchemaQueryLoading,
    error: protocolSchemaQueryError,
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
  const [getData, { data, loading, error }] = useLazyQuery(queryMain, { variables: { poolId, protocolId }, client });

  let tabNum = "1";
  if (tabString.toUpperCase() === "POOL" || tabString.toUpperCase() === "MARKET") {
    tabNum = "2";
  } else if (tabString.toUpperCase() === "EVENTS") {
    tabNum = "3";
  } else if (tabString.toUpperCase() === "POOLOVERVIEW") {
    tabNum = "4";
  }

  const [tabValue, setTabValue] = useState(tabNum);

  const handleTabChange = (event: any, newValue: string) => {
    let tabName = "protocol";
    const href = new URL(window.location.href);
    const p = new URLSearchParams(href.search);
    const poolIdFromParam = p.get("poolId");
    let protocolParam = "";
    if (protocolId) {
      protocolParam = `&protocolId=${protocolId}`;
    }
    let skipAmtParam = "";
    let poolParam = "";
    if (newValue === "2") {
      poolParam = `&poolId=${poolIdFromParam || poolId}`;
      tabName = "pool";
    } else if (newValue === "3") {
      poolParam = `&poolId=${poolIdFromParam || poolId}`;
      tabName = "events";
    } else if (newValue === "4") {
      tabName = "poolOverview";
      if (skipAmt > 0) {
        skipAmtParam = `&skipAmt=${skipAmt}`;
      }
    }
    navigate(`?endpoint=${subgraphParam}&tab=${tabName}${protocolParam}${poolParam}${skipAmtParam}`);
    setTabValue(newValue);
  };

  const queryPoolOverview = gql`
    ${poolOverview(protocolSchemaData?.protocols[0].type, schemaVersion)}
  `;

  const clientPoolOverview = useMemo(() => NewClient(subgraphToQuery.url), [subgraphToQuery.url]);
  const {
    data: dataPools,
    error: poolOverviewError,
    loading: poolOverviewLoading,
  } = useQuery(queryPoolOverview, {
    client: clientPoolOverview,
    variables: { skipAmt },
  });

  let pools: { [x: string]: any }[] = [];
  if (dataPools && data) {
    pools = dataPools[PoolNames[data?.protocols[0]?.type]];
  }

  useEffect(() => {
    // If the schema query request was successful, make the full data query
    if (protocolSchemaData) {
      getData();
    }
  }, [protocolSchemaData, getData]);

  useEffect(() => {
    if (!subgraphToQuery.url && subgraphParam) {
      let queryURL = `${SubgraphBaseUrl}${subgraphParam}`;
      const parseCheck = isValidHttpUrl(subgraphParam);
      if (parseCheck) {
        queryURL = subgraphParam;
      }
      setSubgraphToQuery({ url: queryURL, version: subgraphToQuery.version });
    }
  }, [subgraphToQuery.url, subgraphParam, subgraphToQuery.version]);

  useEffect(() => {
    document.getElementById(scrollToView)?.scrollIntoView();
  });

  // Error logging in case the full data request throws an error
  useEffect(() => {
    console.log("--------------------Error Start-------------------------");
    console.log(error, error ? Object.values(error) : null);
    console.log(protocolSchemaQueryError ? Object.values(protocolSchemaQueryError) : null);
    console.log("--------------------Error End---------------------------");
  }, [error, protocolSchemaQueryError]);

  // errorRender is the element to be rendered to display the error
  let errorDisplayProps = null;
  // Conditionals for calling the errorDisplay() function for the various types of errors
  // Bottom to top priority an 'protocolSchemaQueryError' will override 'warning'

  if (protocolSchemaQueryError && !protocolSchemaQueryLoading) {
    // ...includes('has no field') checks if the error is describing a discrepancy between the protocol query and the fields in the protocol entity on the schema
    if (!protocolSchemaData && !protocolSchemaQueryError.message.includes("has no field")) {
      errorDisplayProps = new ApolloError({
        errorMessage: `DEPLOYMENT UNREACHABLE - ${subgraphToQuery.url} is not a valid subgraph endpoint URL. If a subgraph namestring was used, make sure that the namestring points to a hosted service deployment named using the standard naming convention (for example 'messari/uniswap-v3-ethereum').`,
      });
    } else {
      errorDisplayProps = protocolSchemaQueryError;
    }
  }
  if (error && !loading) {
    errorDisplayProps = error;
  }

  return (
    <div className="ProtocolDashboard">
      <DashboardHeader
        protocolData={protocolSchemaData}
        protocolId={protocolId}
        subgraphToQueryURL={subgraphToQuery.url}
        schemaVersion={schemaVersion}
      />
      {(protocolSchemaQueryLoading || loading) && !!subgraphToQuery.url ? (
        <CircularProgress sx={{ margin: 6 }} size={50} />
      ) : null}
      <ErrorDisplay
        errorObject={errorDisplayProps}
        setSubgraphToQuery={(x) => setSubgraphToQuery(x)}
        protocolData={data}
        subgraphToQuery={subgraphToQuery}
      />
      {!!data && (
        <AllDataTabs
          data={data}
          entities={entities}
          entitiesData={entitiesData}
          tabValue={tabValue}
          protocolFields={protocolFields}
          poolNames={PoolNames[data.protocols[0].type]}
          poolId={poolId}
          poolData={poolData}
          events={events}
          setPoolId={(x) => setPoolId(x)}
          handleTabChange={(x, y) => handleTabChange(x, y)}
          subgraphToQueryURL={subgraphToQuery.url}
          pools={pools}
          paginate={(x) => paginate(x)}
          skipAmt={skipAmt}
          setProtocolId={(x) => setprotocolId(x)}
          poolOverviewRequest={{ poolOverviewError, poolOverviewLoading }}
        />
      )}
    </div>
  );
}

export default ProtocolDashboard;
