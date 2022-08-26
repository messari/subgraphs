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
      const protocolNameVersionRemoved = protocolName.split("-v")[0];
      deploymentNameToUrlMapping[protocolName] = {
        slug: "",
        defiLlamaNetworks: [],
        subgraphNetworks: deploymentOnNetwork,
      };
      deploymentNameToUrlMapping[protocolNameVersionRemoved] = {
        slug: "",
        defiLlamaNetworks: [],
        subgraphNetworks: deploymentOnNetwork,
      };
    });
  });

  if (defiLlamaProtocols.length > 0) {
    defiLlamaProtocols.forEach((protocol) => {
      const currentName = protocol.name.toLowerCase().split(" ").join("-");
      if (deploymentNameToUrlMapping[currentName]?.slug === "") {
        deploymentNameToUrlMapping[currentName].slug = protocol.slug;
        deploymentNameToUrlMapping[currentName].defiLlamaNetworks = Object.keys(protocol.chainTvls).map((x) =>
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
  if (
    Object.keys(defiLlamaData).length > 0 &&
    financialsData?.financialsDailySnapshots &&
    defiLlamaData.name.toLowerCase() === defiLlamaSlug?.split(" (")[0].toLowerCase()
  ) {
    const dataset: string =
      Object.keys(defiLlamaData.chainTvls).find((chain) => {
        let networkName = defiLlamaSlug?.split(" (")[1]?.split(")")[0]?.toUpperCase();
        if (networkName === "MAINNET") {
          networkName = "ETHEREUM";
        }
        if (networkName === "MATIC") {
          networkName = "POLYGON";
        }
        return chain.toUpperCase() === networkName;
      }) || "";
    let compChart = {
      defiLlama: defiLlamaData.chainTvls[dataset].tvl.map((x: any) => ({ value: x.totalLiquidityUSD, date: x.date })),
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
    if (compChart.defiLlama.length > compChart.subgraph.length) {
      compChart.defiLlama = compChart.defiLlama.slice(compChart.defiLlama.length - compChart.subgraph.length);
    } else if (compChart.defiLlama.length < compChart.subgraph.length) {
      compChart.subgraph = compChart.subgraph.slice(compChart.subgraph.length - compChart.defiLlama.length);
    }
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
            <Chart datasetLabel={`Chart-${defiLlamaSlug}`} dataChart={compChart} />
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

  return (
    <>
      <Button variant="contained" color="primary" sx={{ my: 4 }} onClick={() => navigate("/")}>
        Back To Deployments List
      </Button>
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
    </>
  );
}

export default DefiLlamaComparsionTab;
