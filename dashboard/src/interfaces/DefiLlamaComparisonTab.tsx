import React, { useEffect, useMemo, useState } from "react";
import IssuesDisplay from "./IssuesDisplay";
import { Box, Button, CircularProgress, Grid, Typography } from "@mui/material";
import { CopyLinkToClipboard } from "../common/utilComponents/CopyLinkToClipboard";
import { Chart } from "../common/chartComponents/Chart";
import { ComparisonTable } from "../common/chartComponents/ComparisonTable";
import { toDate } from "../utils";
import { ApolloClient, gql, HttpLink, InMemoryCache, useLazyQuery } from "@apollo/client";
import { DeploymentsDropDown } from "../common/utilComponents/DeploymentsDropDown";
import { Chart as ChartJS, registerables, PointElement } from "chart.js";
import { useNavigate } from "react-router";

interface DefiLlamaComparsionTabProps {
  deploymentJSON: { [x: string]: any };
  getData: any;
}

const lineupChartDatapoints = (compChart: any, stitchLeftIndex: number): any => {
  while (toDate(compChart.defiLlama[stitchLeftIndex].date) !== toDate(compChart.subgraph[stitchLeftIndex].date)) {
    if (compChart.defiLlama[stitchLeftIndex].date < compChart.subgraph[stitchLeftIndex].date) {
      const startIndex = compChart.defiLlama.findIndex((x: any) => x.date >= compChart.subgraph[stitchLeftIndex].date);
      let newArray = [...compChart.defiLlama.slice(startIndex)];
      if (stitchLeftIndex > 0) {
        newArray = [...compChart.defiLlama.slice(0, stitchLeftIndex), ...compChart.defiLlama.slice(startIndex, compChart.defiLlama.length)];
      }
      compChart.defiLlama = newArray;
    } else {
      const startIndex = compChart.subgraph.findIndex((x: any) => x.date >= compChart.defiLlama[stitchLeftIndex].date);
      let newArray = [...compChart.subgraph.slice(startIndex)];
      if (stitchLeftIndex > 0) {
        newArray = [...compChart.subgraph.slice(0, stitchLeftIndex), ...compChart.subgraph.slice(startIndex, compChart.subgraph.length)];
      }
      compChart.subgraph = newArray;
    }
  }
  return compChart;
}

// This component is for each individual subgraph
function DefiLlamaComparsionTab({ deploymentJSON, getData }: DefiLlamaComparsionTabProps) {
  const navigate = useNavigate();

  ChartJS.register(...registerables);
  ChartJS.register(PointElement);
  const [issuesState, setIssues] = useState<{ message: string; type: string; level: string; fieldName: string }[]>([]);
  const issues: { message: string; type: string; level: string; fieldName: string }[] = issuesState;
  const [defiLlamaRequestLoading, setDefiLlamaRequestLoading] = useState(false);
  const [deploymentURL, setDeploymentURL] = useState<string>("");
  const [defiLlamaSlug, setDefiLlamaSlug] = useState<string>("");

  const [defiLlamaData, setDefiLlamaData] = useState<{ [x: string]: any }>({});
  const [defiLlamaProtocols, setDefiLlamaProtocols] = useState<any[]>([]);
  const [isMonthly, setIsMonthly] = useState(false);
  const [includeStakedTVL, setIncludeStakedTVL] = useState(true);
  const [includeBorrowedTVL, setIncludeBorrowedTVL] = useState(true);

  const client = useMemo(() => {
    return new ApolloClient({
      link: new HttpLink({
        uri: deploymentURL,
      }),
      cache: new InMemoryCache(),
    });
  }, [deploymentURL]);

  useEffect(() => {
    if (!deploymentJSON || Object.keys(deploymentJSON).length === 0) {
      getData();
    }
  }, []);

  const deploymentNameToUrlMapping: any = {};

  Object.values(deploymentJSON).forEach((protocolsOnType: { [x: string]: any }) => {
    Object.entries(protocolsOnType).forEach(([protocolName, deploymentOnNetwork]) => {
      protocolName = protocolName.toLowerCase();
      deploymentNameToUrlMapping[protocolName] = {
        slug: "",
        defiLlamaNetworks: [],
        subgraphNetworks: deploymentOnNetwork,
      };
      if (protocolName.includes('-v')) {
        const protocolNameVersionRemoved = protocolName.split("-v")[0];
        deploymentNameToUrlMapping[protocolNameVersionRemoved] = {
          slug: "",
          defiLlamaNetworks: [],
          subgraphNetworks: deploymentOnNetwork,
        };
      }
      if (protocolName.includes('-finance')) {
        deploymentNameToUrlMapping[protocolName.split('-finance')[0]] = {
          slug: "",
          defiLlamaNetworks: [],
          subgraphNetworks: deploymentOnNetwork,
        };
      } else {
        deploymentNameToUrlMapping[protocolName + '-finance'] = {
          slug: "",
          defiLlamaNetworks: [],
          subgraphNetworks: deploymentOnNetwork,
        };
      }
    });
  });

  if (defiLlamaProtocols.length > 0) {
    defiLlamaProtocols.forEach((protocol) => {
      const currentName = protocol.name.toLowerCase().split(" ").join("-");
      if (Object.keys(deploymentNameToUrlMapping).includes(currentName) || Object.keys(deploymentNameToUrlMapping).includes(currentName.split('-')[0])) {
        const key = Object.keys(deploymentNameToUrlMapping).includes(currentName) ? currentName : currentName.split('-')[0];
        deploymentNameToUrlMapping[key].slug = protocol.slug;
        deploymentNameToUrlMapping[key].defiLlamaNetworks = Object.keys(protocol.chainTvls).map((x) =>
          x.toLowerCase(),
        );
      }
    });
  }

  const fetchDefiLlamaProtocols = () => {
    setDefiLlamaRequestLoading(true);
    fetch("https://api.llama.fi/protocols", {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    })
      .then(function (res) {
        return res.json();
      })
      .then(function (json) {
        setDefiLlamaRequestLoading(false);
        setDefiLlamaProtocols(json);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  useEffect(() => {
    fetchDefiLlamaProtocols();
  }, []);

  const [
    getFinancialsData,
    { data: financialsData, loading: financialsLoading, error: financialsError, refetch: financialsRefetch },
  ] = useLazyQuery(
    gql`
      {
        financialsDailySnapshots(first: 1000) {
          totalValueLockedUSD
          timestamp
        }
      }
    `,
    { client },
  );

  const defiLlama = () => {
    fetch("https://api.llama.fi/protocol/" + defiLlamaSlug?.split(" (")[0].split(" ").join("-"), {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    })
      .then(function (res) {
        return res.json();
      })
      .then(function (json) {
        setDefiLlamaData(json);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  useEffect(() => {
    if (defiLlamaSlug.length > 0) {
      setDefiLlamaData({});
      defiLlama();
    }
    if (deploymentURL.length > 0) {
      getFinancialsData();
    }
  }, [defiLlamaSlug, deploymentURL]);

  useEffect(() => {
    setIssues(issues);
  }, [issuesState]);

  let chart = null;
  let chartRenderCondition = (Object.keys(defiLlamaData).length > 0 &&
    financialsData?.financialsDailySnapshots &&
    defiLlamaData.name.toLowerCase() === defiLlamaSlug?.split(" (")[0].toLowerCase());

  let stakedDataset = "";
  let borrowedDataset = "";
  if (chartRenderCondition) {

    let dataset: string = "";

    Object.keys(defiLlamaData.chainTvls).forEach((chain) => {
      let networkName = defiLlamaSlug?.split(" (")[1]?.split(")")[0]?.toUpperCase();
      if (networkName === "MAINNET") {
        networkName = "ETHEREUM";
      }
      if (networkName === "MATIC") {
        networkName = "POLYGON";
      }
      if (chain.toUpperCase() === networkName) {
        dataset = chain;
      }
      if (chain.toUpperCase() === networkName + '-STAKING') {
        stakedDataset = chain;
      }
      if (chain.toUpperCase() === networkName + '-BORROWED') {
        borrowedDataset = chain;
      }
    });

    let compChart = {
      defiLlama: defiLlamaData.chainTvls[dataset].tvl.map((x: any, idx: number) => {
        let value = x.totalLiquidityUSD;
        const date = toDate(x.date);
        if (defiLlamaData.chainTvls[stakedDataset]) {
          const stakedDatapoint = defiLlamaData.chainTvls[stakedDataset]?.tvl?.find((x: any) => toDate(x.date) === date);
          if (stakedDatapoint && includeStakedTVL) {
            value += stakedDatapoint.totalLiquidityUSD;
          }
        }
        if (defiLlamaData.chainTvls[borrowedDataset]) {
          const borrowedDatapoint = defiLlamaData.chainTvls[borrowedDataset]?.tvl?.find((x: any) => toDate(x.date) === date);
          if (borrowedDatapoint && includeBorrowedTVL) {
            value += borrowedDatapoint.totalLiquidityUSD;
          }
        }
        return { value: value, date: x.date };
      }),
      subgraph: financialsData.financialsDailySnapshots.map((x: any) => ({
        value: parseFloat(x.totalValueLockedUSD),
        date: parseInt(x.timestamp),
      })),
    };
    if (isMonthly) {
      // key number of months from epoch value first val of month
      const tempChartData: any = { defiLlama: {}, subgraph: {} };
      compChart.defiLlama.forEach((point: { [x: string]: any }) => {
        const monthKey = toDate(point.date).split("-").slice(0, 2).join("-");
        if (!Object.keys(tempChartData.defiLlama).includes(monthKey)) {
          tempChartData.defiLlama[monthKey] = { value: point.value, date: point.date };
        }
      });
      compChart.subgraph.forEach((point: { [x: string]: any }) => {
        const monthKey = toDate(point.date).split("-").slice(0, 2).join("-");
        if (!Object.keys(tempChartData.subgraph).includes(monthKey)) {
          tempChartData.subgraph[monthKey] = { value: point.value, date: point.date };
        }
      });
      compChart = {
        defiLlama: Object.values(tempChartData.defiLlama).map((val: any) => ({ date: val.date, value: val.value })),
        subgraph: Object.values(tempChartData.subgraph).map((val: any) => ({ date: val.date, value: val.value })),
      };
    }

    compChart = lineupChartDatapoints({ ...compChart }, 0);
    compChart.defiLlama
      .forEach((val: any, i: any) => {
        const subgraphPoint = compChart.subgraph[i];
        if (!subgraphPoint) {
          return;
        }

        const subgraphTimestamp = subgraphPoint?.date || 0;
        const llamaDate = toDate(val.date);

        if (Math.abs(subgraphTimestamp - val.date) > 86400) {
          const dateIndex = compChart.subgraph.findIndex((x: any) => toDate(x.date) === llamaDate || x.date > val.date);
          compChart.subgraph = [...compChart.subgraph.slice(0, i), ...compChart.subgraph.slice(dateIndex, compChart.subgraph.length)];
          compChart = lineupChartDatapoints({ ...compChart }, i);
        }
      });

    const elementId = `${isMonthly ? "Monthly" : "Daily"} Chart - ${defiLlamaSlug}`;
    chart = (
      <div key={elementId} id={elementId}>
        <Box mt={3} mb={1}>
          <CopyLinkToClipboard link={window.location.href} scrollId={elementId}>
            <Typography variant="h6">{elementId}</Typography>
          </CopyLinkToClipboard>
        </Box>
        <Grid container justifyContent="space-between">
          <Grid key={elementId} item xs={7.5}>
            <Chart identifier={""} datasetLabel={`Chart-${defiLlamaSlug}`} dataChart={compChart} />
          </Grid>
          <Grid key={elementId + "2"} item xs={4}>
            <ComparisonTable
              datasetLabel="Data Comparison"
              dataTable={compChart}
              isMonthly={isMonthly}
              setIsMonthly={(x: boolean) => setIsMonthly(x)}
            />
          </Grid>
        </Grid>
      </div>
    );
  }
  if (financialsError && !(issues.filter((x) => x.fieldName === deploymentURL).length > 0)) {
    setIssues([
      {
        message: `Error fetching subgraph data - ${defiLlamaSlug}; ${financialsError.message}`,
        type: "VAL",
        level: "critical",
        fieldName: deploymentURL,
      },
    ]);
  }
  useEffect(() => {
    setIssues([]);
  }, [deploymentURL]);

  if (financialsLoading || defiLlamaRequestLoading) {
    chart = <CircularProgress sx={{ my: 5 }} size={40} />;
  }

  let valueToggles = null;
  if (chartRenderCondition) {
    let stakedTVL = null;
    if (stakedDataset) {
      stakedTVL = <Button variant="contained" color="primary" sx={{ my: 4 }} onClick={() => setIncludeStakedTVL(!includeStakedTVL)}>{includeStakedTVL ? "Disclude Staked TVL" : "Include Staked TVL"}</Button>
    }

    let borrowedTVL = null;
    if (borrowedDataset) {
      borrowedTVL = <Button variant="contained" color="primary" sx={{ my: 4, mx: 2 }} onClick={() => setIncludeBorrowedTVL(!includeBorrowedTVL)}>{includeBorrowedTVL ? "Disclude Borrowed TVL" : "Include Borrowed TVL"}</Button>
    }

    valueToggles = (
      <div style={{ display: "flex" }}>
        {stakedTVL}
        {borrowedTVL}
      </div>
    );
  }
  return (
    <>
      <Button variant="contained" color="primary" sx={{ my: 4, mx: 2 }} onClick={() => navigate("/")}>
        Back To Deployments List
      </Button>
      <div style={{ margin: "0px 16px" }}>
        <DeploymentsDropDown
          setDeploymentURL={(x) => setDeploymentURL(x)}
          setDefiLlamaSlug={(x) => setDefiLlamaSlug(x)}
          setIssues={(x: any) => setIssues(x)}
          issuesProps={issues}
          deploymentURL={deploymentURL}
          deploymentJSON={deploymentNameToUrlMapping}
        />
        <IssuesDisplay issuesArrayProps={issues} allLoaded={true} oneLoaded={true} />
        {chart}
        {valueToggles}

      </div>
    </>
  );
}

export default DefiLlamaComparsionTab;
