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
import { getPendingSubgraphId } from "../queries/subgraphStatusQuery";
import { styled } from "../styled";

const BackBanner = styled("div")`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1)};
  padding-left: ${({ theme }) => theme.spacing(2)};
  padding-right: ${({ theme }) => theme.spacing(2)};
  padding-top: ${({ theme }) => theme.spacing(1)};
  padding-bottom: ${({ theme }) => theme.spacing(1)};
  background: #20252c;
  cursor: pointer;
`;

function ProtocolDashboard() {
  const [searchParams] = useSearchParams();
  const subgraphParam = searchParams.get("endpoint") || "";
  const tabString = searchParams.get("tab") || "";
  const poolIdString = searchParams.get("poolId") || "";
  const scrollToView = searchParams.get("view") || "";
  const skipAmtParam = Number(searchParams.get("skipAmt")) || 0;
  const version = searchParams.get("version") || "current";

  const navigate = useNavigate();
  let queryURL = `${SubgraphBaseUrl}${subgraphParam}`;
  let subgraphName = subgraphParam;
  if (subgraphParam) {
    const parseCheck = isValidHttpUrl(subgraphParam);
    if (parseCheck) {
      queryURL = subgraphParam;
      if (queryURL.includes("name/") && !searchParams.get("name")) {
        subgraphName = queryURL.split("name/")[1];
      } else if (searchParams.get("name")) {
        subgraphName = searchParams.get("name") || "";
      } else {
        subgraphName = "";
      }
    }
  }

  const [subgraphToQuery, setSubgraphToQuery] = useState({ url: queryURL, version: "" });
  const endpointObject: { [x: string]: string } = { current: "", pending: "" };
  endpointObject[version] = queryURL;
  if (subgraphName && !endpointObject.current) {
    endpointObject.current = "https://api.thegraph.com/subgraphs/name/" + subgraphName;
  }
  const [endpoints, setEndpoints] = useState(endpointObject);
  const [isCurrentVersion, setIsCurrentVersion] = useState(version == "current" ? true : false);
  const [poolId, setPoolId] = useState<string>(poolIdString);
  const [skipAmt, paginate] = useState<number>(skipAmtParam);

  const clientIndexing = useMemo(() => NewClient("https://api.thegraph.com/index-node/graphql"), [subgraphParam]);

  const [getPendingSubgraph, { data: pendingVersion, error: errorSubId, loading: subIdLoading }] = useLazyQuery(
    getPendingSubgraphId,
    {
      variables: { subgraphName },
      client: clientIndexing,
    },
  );

  const [positionSnapshots, setPositionSnapshots] = useState();
  const [positionsLoading, setPositionsLoading] = useState(false);
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
  const protocolIdString = searchParams.get("protocolId") || protocolSchemaData?.protocols[0].id;
  const [protocolId, setprotocolId] = useState<string>(protocolIdString);

  // The following section fetches the full data from the subgraph. It routes to query selection and then makes the request
  const {
    entitiesData,
    poolData,
    query: graphQuery,
    events,
    protocolFields,
    financialsQuery,
    dailyUsageQuery,
    hourlyUsageQuery,
    protocolTableQuery,
    poolsQuery,
    poolTimeseriesQuery,
    positionsQuery = "",
  } = schema(protocolSchemaData?.protocols[0].type, schemaVersion);

  const queryMain = gql`
    ${graphQuery}
  `;
  const [getData, { data, loading, error }] = useLazyQuery(queryMain, { variables: { poolId, protocolId }, client });

  const [
    getFinancialsData,
    { data: financialsData, loading: financialsLoading, error: financialsError, refetch: financialsRefetch },
  ] = useLazyQuery(
    gql`
      ${financialsQuery}
    `,
    { client },
  );
  const [
    getDailyUsageData,
    { data: dailyUsageData, loading: dailyUsageLoading, error: dailyUsageError, refetch: dailyUsageRefetch },
  ] = useLazyQuery(
    gql`
      ${dailyUsageQuery}
    `,
    { client },
  );
  const [
    getHourlyUsageData,
    { data: hourlyUsageData, loading: hourlyUsageLoading, error: hourlyUsageError, refetch: hourlyUsageRefetch },
  ] = useLazyQuery(
    gql`
      ${hourlyUsageQuery}
    `,
    { client },
  );

  const [getProtocolTableData, { data: protocolTableData, loading: protocolTableLoading, error: protocolTableError }] =
    useLazyQuery(
      gql`
        ${protocolTableQuery}
      `,
      { client, variables: { protocolId: protocolIdString } },
    );

  const [
    getPoolsListData,
    { data: poolsListData, loading: poolListLoading, error: poolsListError, refetch: poolsListRefetch },
  ] = useLazyQuery(
    gql`
      ${poolsQuery}
    `,
    { client },
  );
  const [
    getPoolTimeseriesData,
    {
      data: poolTimeseriesData,
      loading: poolTimeseriesLoading,
      error: poolTimeseriesError,
      refetch: poolTimeseriesRefetch,
    },
  ] = useLazyQuery(
    gql`
      ${poolTimeseriesQuery}
    `,
    { variables: { poolId }, client },
  );

  const queryPoolOverview = gql`
    ${poolOverview(protocolSchemaData?.protocols[0].type, schemaVersion)}
  `;

  const [
    getPoolsOverviewData,
    { data: dataPools, error: poolOverviewError, loading: poolOverviewLoading, refetch: poolOverviewRefetch },
  ] = useLazyQuery(queryPoolOverview, { client: client, variables: { skipAmt } });

  let tabNum = "1";
  if (tabString.toUpperCase() === "POOLOVERVIEW") {
    tabNum = "2";
  } else if (tabString.toUpperCase() === "POOL") {
    tabNum = "3";
  } else if (tabString.toUpperCase() === "EVENTS") {
    tabNum = "4";
  } else if (tabString.toUpperCase() === "POSITIONS") {
    tabNum = "5";
  }

  const [tabValue, setTabValue] = useState(tabNum);

  const handleTabChange = (event: any, newValue: string) => {
    let tabName = "protocol";
    const href = new URL(window.location.href);
    const p = new URLSearchParams(href.search);
    const poolIdFromParam = p.get("poolId");
    let deploymentVersionParam = "";
    if (!isCurrentVersion) {
      deploymentVersionParam = "&version=pending";
    }
    let nameParam = "";
    if (subgraphName) {
      nameParam = "&name=" + subgraphName;
    }
    let protocolParam = "";
    if (protocolId) {
      protocolParam = `&protocolId=${protocolId}`;
    }
    let skipAmtParam = "";
    let poolParam = "";
    if (newValue === "2") {
      tabName = "poolOverview";
      if (skipAmt > 0) {
        skipAmtParam = `&skipAmt=${skipAmt}`;
      }
    } else if (newValue === "3") {
      poolParam = `&poolId=${poolIdFromParam || poolId}`;
      tabName = "pool";
    } else if (newValue === "4") {
      poolParam = `&poolId=${poolIdFromParam || poolId}`;
      tabName = "events";
    } else if (newValue === "5") {
      poolParam = `&poolId=${poolIdFromParam || poolId}`;
      tabName = "positions";
    }
    navigate(
      `?endpoint=${subgraphParam}&tab=${tabName}${protocolParam}${poolParam}${skipAmtParam}${deploymentVersionParam}`,
    );
    setTabValue(newValue);
  };

  useEffect(() => {
    if (
      !endpoints?.pending &&
      pendingVersion?.indexingStatusForPendingVersion?.subgraph &&
      pendingVersion?.indexingStatusForPendingVersion?.health === "healthy"
    ) {
      setEndpoints({
        current: endpoints.current,
        pending: "https://api.thegraph.com/subgraphs/id/" + pendingVersion?.indexingStatusForPendingVersion?.subgraph,
      });
    }
  }, [pendingVersion, errorSubId]);

  useEffect(() => {
    // If the schema query request was successful, make the full data query
    if (protocolSchemaData) {
      getData();
      getProtocolTableData();
      getPendingSubgraph();
    }
  }, [protocolSchemaData, getData, getProtocolTableData, getPendingSubgraph]);

  useEffect(() => {
    if (protocolTableData && tabValue === "1") {
      getFinancialsData();
    }
  }, [protocolTableData, getFinancialsData, tabValue]);

  useEffect(() => {
    if (financialsData) {
      getDailyUsageData();
    }
  }, [financialsData, getDailyUsageData]);

  useEffect(() => {
    if (dailyUsageData) {
      getHourlyUsageData();
    }
  }, [dailyUsageData, getHourlyUsageData]);

  useEffect(() => {
    if (poolId) {
      getPoolTimeseriesData();
    }
  }, [poolId]);

  useEffect(() => {
    if (financialsError) {
      financialsRefetch();
    }
  }, [financialsError]);

  useEffect(() => {
    if (dailyUsageError) {
      dailyUsageRefetch();
    }
  }, [dailyUsageError]);

  useEffect(() => {
    if (hourlyUsageError) {
      hourlyUsageRefetch();
    }
  }, [hourlyUsageError]);

  useEffect(() => {
    if (poolsListError) {
      poolsListRefetch();
    }
  }, [poolsListError]);

  useEffect(() => {
    if (poolTimeseriesError) {
      poolTimeseriesRefetch();
    }
  }, [poolTimeseriesError]);

  useEffect(() => {
    if (poolOverviewError) {
      poolOverviewRefetch();
    }
  }, [poolOverviewError]);

  useEffect(() => {
    if (tabValue === "2") {
      getPoolsOverviewData();
    } else if (tabValue === "3" || tabValue === "4" || tabValue === "5") {
      getPoolsListData();
    }
  }, [tabValue, getPoolsOverviewData, getPoolsListData]);

  useEffect(() => {
    document.getElementById(scrollToView)?.scrollIntoView();
  });

  // Error logging in case the full data request throws an error
  useEffect(() => {
    if (error || protocolSchemaQueryError) {
      console.log("--------------------Error Start-------------------------");
      console.log(error, protocolSchemaQueryError);
      console.log("--------------------Error End---------------------------");
    }
  }, [error, protocolSchemaQueryError]);

  // errorRender is the element to be rendered to display the error
  let errorDisplayProps = null;
  // Conditionals for calling the errorDisplay() function for the various types of errors

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

  let pools: { [x: string]: any }[] = [];
  if (dataPools && data) {
    pools = dataPools[PoolNames[data?.protocols[0]?.type]];
  }

  let toggleVersion = null;

  if (endpoints?.pending) {
    let pendingStyle: { [x: string]: any } = {
      color: "#20252c",
      backgroundColor: "white",
      padding: "8px 10px",
      borderRadius: "25px",
      margin: "4px 6px",
    };
    let currentStyle: { [x: string]: any } = {};
    if (isCurrentVersion) {
      pendingStyle = {};
      currentStyle = {
        color: "#20252c",
        backgroundColor: "white",
        padding: "8px 10px",
        borderRadius: "25px",
        margin: "4px 6px",
      };
    }
    let currentToggle = null;
    if (endpoints?.current) {
      currentToggle = (
        <span
          style={currentStyle}
          onClick={() => {
            const href = new URL(window.location.href);
            const p = new URLSearchParams(href.search);
            p.set("version", "current");
            p.set("endpoint", endpoints?.current);
            p.set("name", subgraphName);
            p.delete("view");
            p.delete("poolId");
            p.delete("protocolId");
            navigate("?" + p.toString().split("%2F").join("/"));
            setSubgraphToQuery({ url: endpoints?.current, version: "" });
            setIsCurrentVersion(true);
          }}
        >
          CURRENT VERSION
        </span>
      );
    }
    let pendingToggle = null;
    if (endpoints?.pending) {
      pendingToggle = (
        <span
          style={pendingStyle}
          onClick={() => {
            const href = new URL(window.location.href);
            const p = new URLSearchParams(href.search);
            p.set("version", "pending");
            p.set("endpoint", endpoints?.pending);
            p.set("name", subgraphName);
            p.delete("view");
            p.delete("poolId");
            p.delete("protocolId");
            navigate("?" + p.toString().split("%2F").join("/"));
            setSubgraphToQuery({ url: endpoints?.pending, version: "" });
            setIsCurrentVersion(false);
          }}
        >
          PENDING VERSION
        </span>
      );
    }
    toggleVersion = (
      <BackBanner>
        {currentToggle}
        {pendingToggle}
      </BackBanner>
    );
  }

  return (
    <div className="ProtocolDashboard">
      <DashboardHeader
        protocolData={protocolSchemaData}
        protocolId={protocolId}
        subgraphToQueryURL={subgraphToQuery.url}
        schemaVersion={schemaVersion}
      />
      {toggleVersion}
      {(protocolSchemaQueryLoading || loading) && !!subgraphToQuery.url ? (
        <CircularProgress sx={{ margin: 6 }} size={50} />
      ) : null}
      <ErrorDisplay
        errorObject={errorDisplayProps}
        protocolData={data}
        subgraphToQuery={subgraphToQuery}
        setSubgraphToQuery={(x) => setSubgraphToQuery(x)}
      />
      {!!data && (
        <AllDataTabs
          data={data}
          entitiesData={entitiesData}
          tabValue={tabValue}
          events={events}
          pools={pools}
          poolsListData={poolsListData}
          poolListLoading={poolListLoading}
          poolsListError={poolsListError}
          poolNames={PoolNames[data.protocols[0].type]}
          poolId={poolId}
          poolData={poolData}
          protocolFields={protocolFields}
          protocolTableData={protocolTableData}
          subgraphToQueryURL={subgraphToQuery.url}
          skipAmt={skipAmt}
          poolOverviewRequest={{ poolOverviewError, poolOverviewLoading }}
          poolTimeseriesRequest={{ poolTimeseriesData, poolTimeseriesError, poolTimeseriesLoading }}
          positionsQuery={positionsQuery}
          protocolTimeseriesData={{
            financialsDailySnapshots: financialsData?.financialsDailySnapshots,
            usageMetricsDailySnapshots: dailyUsageData?.usageMetricsDailySnapshots,
            usageMetricsHourlySnapshots: hourlyUsageData?.usageMetricsHourlySnapshots,
          }}
          protocolTimeseriesLoading={{
            financialsDailySnapshots: financialsLoading,
            usageMetricsDailySnapshots: dailyUsageLoading,
            usageMetricsHourlySnapshots: hourlyUsageLoading,
          }}
          protocolTimeseriesError={{
            financialsDailySnapshots: financialsError,
            usageMetricsDailySnapshots: dailyUsageError,
            usageMetricsHourlySnapshots: hourlyUsageError,
          }}
          setPoolId={(x) => setPoolId(x)}
          handleTabChange={(x, y) => handleTabChange(x, y)}
          setProtocolId={(x) => setprotocolId(x)}
          paginate={(x) => paginate(x)}
        />
      )}
    </div>
  );
}

export default ProtocolDashboard;
