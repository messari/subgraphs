import React, { useEffect, useState } from "react";
import { TableEvents } from "../../common/chartComponents/TableEvents";
import { PoolDropDown } from "../../common/utilComponents/PoolDropDown";
import IssuesDisplay from "../IssuesDisplay";
import { Box, CircularProgress, Grid, Typography } from "@mui/material";
import { CopyLinkToClipboard } from "../../common/utilComponents/CopyLinkToClipboard";
import { Chart } from "../../common/chartComponents/Chart";
import { ComparisonTable } from "../../common/chartComponents/ComparisonTable";
import { toDate } from "../../utils";

interface DefiLlamaComparsionTabProps {
  data: any;
  protocolNetwork: string;
  protocolTimeseriesData: any;
}

// This component is for each individual subgraph
function DefiLlamaComparsionTab({ data, protocolNetwork, protocolTimeseriesData }: DefiLlamaComparsionTabProps) {
  const [issuesState, setIssues] = useState<{ message: string; type: string; level: string; fieldName: string }[]>([]);
  const issues: { message: string; type: string; level: string; fieldName: string }[] = issuesState;

  const [defiLlamaData, setDefiLlamaData] = useState<{ [x: string]: any }>({});
  const [isMonthly, setIsMonthly] = useState(false);

  const defiLlama = () => {
    fetch("https://api.llama.fi/protocol/" + data.protocols[0].slug, {
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
    defiLlama();
  }, []);

  useEffect(() => {
    setIssues(issues);
  }, [issuesState]);

  let chart = null;
  if (Object.keys(defiLlamaData).length > 0 && protocolTimeseriesData?.financialsDailySnapshots) {
    const dataset: string =
      Object.keys(defiLlamaData.chainTvls).find((chain) => {
        let networkName = protocolNetwork.toUpperCase();
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
      subgraph: protocolTimeseriesData.financialsDailySnapshots
        .map((x: any) => ({ value: parseFloat(x.totalValueLockedUSD), date: parseInt(x.timestamp) }))
        .reverse(),
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
    const elementId = "Chart (" + (isMonthly ? "Monthly" : "Daily") + ")";
    chart = (
      <div key={elementId} id={elementId}>
        <Box mt={3} mb={1}>
          <CopyLinkToClipboard link={window.location.href} scrollId={elementId}>
            <Typography variant="h6">{elementId}</Typography>
          </CopyLinkToClipboard>
        </Box>
        <Grid container justifyContent="space-between">
          <Grid key={elementId} item xs={7.5}>
            <Chart datasetLabel="Chart" dataChart={compChart} />
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

  return (
    <>
      <IssuesDisplay issuesArrayProps={issues} allLoaded={true} oneLoaded={true} />
      {chart}
    </>
  );
}

export default DefiLlamaComparsionTab;
