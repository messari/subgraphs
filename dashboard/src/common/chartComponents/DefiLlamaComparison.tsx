import { useEffect, useRef, useState } from "react";
import IssuesDisplay from "../../interfaces/IssuesDisplay";
import { Box, Button, CircularProgress, Grid, Typography } from "@mui/material";
import { CopyLinkToClipboard } from "../utilComponents/CopyLinkToClipboard";
import { Chart } from "./Chart";
import { ComparisonTable } from "./ComparisonTable";
import { lineupChartDatapoints, toDate } from "../../utils";
import { DeploymentsDropDown } from "../utilComponents/DeploymentsDropDown";
import { Chart as ChartJS, registerables, PointElement } from "chart.js";
import moment from "moment";

interface DefiLlamaComparsionTabProps {
  subgraphEndpoints: { [x: string]: any };
  financialsData: any;
}

// This component is for each individual subgraph
function DefiLlamaComparsionTab({ subgraphEndpoints, financialsData }: DefiLlamaComparsionTabProps) {
  function jpegDownloadHandler() {
    try {
      const fileName =
        defiLlamaSlug?.split(" (").join("-")?.split(")")?.join("-")?.split(" ")?.join("-") +
        moment.utc(Date.now()).format("MMDDYY") +
        ".jpeg";
      const link = document.createElement("a");
      link.download = fileName;
      link.href = chartRef.current?.toBase64Image("image/jpeg", 1);
      link.click();
    } catch (err) {
      return;
    }
  }

  ChartJS.register(...registerables);
  ChartJS.register(PointElement);
  const [issuesState, setIssues] = useState<{ message: string; type: string; level: string; fieldName: string }[]>([]);
  const issues: { message: string; type: string; level: string; fieldName: string }[] = issuesState;
  const [defiLlamaRequestLoading, setDefiLlamaRequestLoading] = useState(false);
  const [deploymentURL, setDeploymentURL] = useState<string>("");
  const [defiLlamaSlug, setDefiLlamaSlug] = useState<string>("");

  const [defiLlamaData, setDefiLlamaData] = useState<{ [x: string]: any }>({});
  const [defiLlamaProtocols, setDefiLlamaProtocols] = useState<any[]>([]);
  const [defiLlamaProtocolFetchError, setDefiLlamaProtocolFetchError] = useState<boolean>(false);
  const [includeStakedTVL, setIncludeStakedTVL] = useState(true);
  const [includeBorrowedTVL, setIncludeBorrowedTVL] = useState(true);

  const chartRef = useRef<any>(null);
  const deploymentNameToUrlMapping: {
    [x: string]: { slug: string; defiLlamaNetworks: string[]; subgraphNetworks: any };
  } = {};

  try {
    Object.values(subgraphEndpoints).forEach((protocolsOnType: { [x: string]: any }) => {
      Object.entries(protocolsOnType).forEach(([protocolName, deploymentOnNetwork]) => {
        protocolName = protocolName.toLowerCase();
        deploymentNameToUrlMapping[protocolName] = {
          slug: "",
          defiLlamaNetworks: [],
          subgraphNetworks: deploymentOnNetwork,
        };
        if (protocolName.includes("-v")) {
          const protocolNameVersionRemoved = protocolName.split("-v")[0];
          deploymentNameToUrlMapping[protocolNameVersionRemoved] = {
            slug: "",
            defiLlamaNetworks: [],
            subgraphNetworks: deploymentOnNetwork,
          };
        }
        if (protocolName.includes("-finance")) {
          deploymentNameToUrlMapping[protocolName.split("-finance")[0]] = {
            slug: "",
            defiLlamaNetworks: [],
            subgraphNetworks: deploymentOnNetwork,
          };
        } else {
          deploymentNameToUrlMapping[protocolName + "-finance"] = {
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
        if (
          Object.keys(deploymentNameToUrlMapping).includes(currentName) ||
          Object.keys(deploymentNameToUrlMapping).includes(currentName.split("-")[0])
        ) {
          const key: string = Object.keys(deploymentNameToUrlMapping).includes(currentName)
            ? currentName
            : currentName.split("-")[0];
          deploymentNameToUrlMapping[key].slug = protocol.slug;
          deploymentNameToUrlMapping[key].defiLlamaNetworks = Object.keys(protocol.chainTvls).map((x) =>
            x.toLowerCase(),
          );
        }
      });
    }
  } catch (err: any) {
    console.error(err.message);
  }

  const fetchDefiLlamaProtocols = () => {
    try {
      setDefiLlamaRequestLoading(true);
      fetch(process.env.REACT_APP_DEFILLAMA_BASE_URL! + "/protocols", {
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
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchDefiLlamaProtocols();
  }, []);

  const defiLlama = () => {
    try {
      fetch(
        process.env.REACT_APP_DEFILLAMA_BASE_URL! + "/protocol/" + defiLlamaSlug?.split(" (")[0].split(" ").join("-"),
        {
          method: "GET",
        },
      )
        .then(function (res) {
          return res.json();
        })
        .then(function (json) {
          setDefiLlamaData(json);
        })
        .catch((err) => {
          setDefiLlamaProtocolFetchError(true);
          console.log(err);
        });
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    setDefiLlamaProtocolFetchError(false);
    if (defiLlamaSlug.length > 0) {
      setDefiLlamaData({});
      defiLlama();
    }
  }, [defiLlamaSlug, deploymentURL]);

  useEffect(() => {
    setIssues(issues);
  }, [issuesState]);

  let chart = null;
  let chartRenderCondition: Boolean =
    Object.keys(defiLlamaData).length > 0 &&
    financialsData?.financialsDailySnapshots &&
    defiLlamaData?.name?.split(" ")[0].toLowerCase() === defiLlamaSlug?.split("-")[0].split(" (")[0]?.toLowerCase();

  let stakedDataset = "";
  let borrowedDataset = "";
  try {
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
        if (chain.toUpperCase() === networkName + "-STAKING") {
          stakedDataset = chain;
        }
        if (chain.toUpperCase() === networkName + "-BORROWED") {
          borrowedDataset = chain;
        }
      });

      let compChart: any = {
        defiLlama: defiLlamaData.chainTvls[dataset].tvl.map((x: any, idx: number) => {
          let value = x.totalLiquidityUSD;
          const date = toDate(x.date);
          if (defiLlamaData.chainTvls[stakedDataset]) {
            const stakedDatapoint = defiLlamaData.chainTvls[stakedDataset]?.tvl?.find(
              (x: any) => toDate(x.date) === date,
            );
            if (stakedDatapoint && includeStakedTVL) {
              value += stakedDatapoint.totalLiquidityUSD;
            }
          }
          if (defiLlamaData.chainTvls[borrowedDataset]) {
            const borrowedDatapoint = defiLlamaData.chainTvls[borrowedDataset]?.tvl?.find(
              (x: any) => toDate(x.date) === date,
            );
            if (borrowedDatapoint && includeBorrowedTVL) {
              value += borrowedDatapoint.totalLiquidityUSD;
            }
          }
          return { value: value, date: x.date };
        }),
        subgraph: financialsData.financialsDailySnapshots
          .map((x: any) => ({
            value: parseFloat(x.totalValueLockedUSD),
            date: parseInt(x.timestamp),
          }))
          .reverse(),
      };

      compChart = lineupChartDatapoints({ ...compChart });
      if (compChart instanceof Error) {
        throw new Error(compChart?.message);
      }

      const elementId = `Daily Chart - ${defiLlamaSlug}`;
      chart = (
        <div key={elementId} id={elementId}>
          <Box mt={3} mb={1}>
            <CopyLinkToClipboard link={window.location.href} scrollId={elementId}>
              <Typography variant="h6">TVL Comparison</Typography>
            </CopyLinkToClipboard>
          </Box>
          <Grid container justifyContent="space-between">
            <Grid key={elementId} item xs={7.5}>
              <Chart datasetLabel={`Chart-${defiLlamaSlug}`} dataChart={compChart} chartRef={chartRef} />
            </Grid>
            <Grid key={elementId + "2"} item xs={4}>
              <ComparisonTable
                datasetLabel="Data Comparison"
                dataTable={compChart}
                isHourly={false}
                jpegDownloadHandler={() => jpegDownloadHandler()}
                baseKey="subgraph"
                overlayKey="defiLlama"
              />
            </Grid>
          </Grid>
        </div>
      );
    } else if (deploymentURL || defiLlamaSlug) {
      chart = <CircularProgress sx={{ my: 5 }} size={40} />;
    }
  } catch (err: any) {
    chart = null;
    console.error(err.message);
  }

  useEffect(() => {
    setIssues([]);
  }, [deploymentURL]);

  if (defiLlamaRequestLoading) {
    chart = <CircularProgress sx={{ my: 5 }} size={40} />;
  }

  let valueToggles = null;
  if (chartRenderCondition) {
    let stakedTVL = (
      <Button disabled={true} variant="contained" color="primary" sx={{ my: 4, marginRight: "16px" }}>
        {"Include Staked TVL"}
      </Button>
    );
    if (stakedDataset) {
      stakedTVL = (
        <Button
          variant="contained"
          color="primary"
          sx={{ my: 4, marginRight: "16px" }}
          onClick={() => setIncludeStakedTVL(!includeStakedTVL)}
        >
          {includeStakedTVL ? "Disclude Staked TVL" : "Include Staked TVL"}
        </Button>
      );
    }

    let borrowedTVL = (
      <Button disabled={true} variant="contained" color="primary" sx={{ my: 4 }}>
        {"Include Borrowed TVL"}
      </Button>
    );
    if (borrowedDataset) {
      borrowedTVL = (
        <Button
          variant="contained"
          color="primary"
          sx={{ my: 4 }}
          onClick={() => setIncludeBorrowedTVL(!includeBorrowedTVL)}
        >
          {includeBorrowedTVL ? "Disclude Borrowed TVL" : "Include Borrowed TVL"}
        </Button>
      );
    }

    valueToggles = (
      <div style={{ display: "flex" }}>
        {stakedTVL}
        {borrowedTVL}
      </div>
    );
  }

  if (defiLlamaProtocolFetchError) {
    chart = null;
  }

  return (
    <>
      <div>
        <DeploymentsDropDown
          setDeploymentURL={(x) => setDeploymentURL(x)}
          setDefiLlamaSlug={(x) => setDefiLlamaSlug(x)}
          setIssues={(x: any) => setIssues(x)}
          issuesProps={issues}
          deploymentURL={deploymentURL}
          deploymentJSON={deploymentNameToUrlMapping}
        />
        {valueToggles}
        <IssuesDisplay issuesArrayProps={issues} allLoaded={true} oneLoaded={true} />
        {chart}
      </div>
    </>
  );
}

export default DefiLlamaComparsionTab;
