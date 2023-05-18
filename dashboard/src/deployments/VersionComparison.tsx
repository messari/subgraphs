import { useEffect, useState } from "react";
import { Button, Table, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { schemaMapping } from "../utils";
import { Chart as ChartJS, registerables, PointElement } from "chart.js";
import FetchSubgraphVersion from "./FetchSubgraphVersion";
import { useNavigate } from "react-router";
import FetchIndexingStatusForType from "./FetchIndexingStatusForType";

interface VersionComparisonProps {
  protocolsToQuery: { [x: string]: any };
  getData: any;
}

function isVersionMismatch(
  versionPending: string,
  versionDecen: string,
  versionHostedService: string,
  versionJSON: string,
): boolean {
  if (versionPending && versionJSON !== versionPending) {
    return true;
  }
  if (versionDecen && versionJSON !== versionDecen) {
    return true;
  }
  if (versionHostedService && versionJSON !== versionHostedService) {
    return true;
  }
  return false;
}

function getPriorityColor(version: string, versionJSON: string): string {
  const versionChangesEntity = version.split(".");
  const versionChangesJSON = versionJSON.split(".");

  let priorityColor = "none";
  if (versionChangesEntity[2] !== versionChangesJSON[2]) {
    priorityColor = "yellow";
  }
  if (versionChangesEntity[1] !== versionChangesJSON[1]) {
    priorityColor = "orange";
  }
  if (versionChangesEntity[0] !== versionChangesJSON[0]) {
    priorityColor = "#B8301C";
  }
  return priorityColor;
}

function VersionComparison({ protocolsToQuery, getData }: VersionComparisonProps) {
  ChartJS.register(...registerables);
  ChartJS.register(PointElement);

  const navigate = useNavigate();
  const [subgraphVersionMapping, setSubgraphVersionMapping] = useState<any>({});

  const prodDeploymentsToQuery: any = [];
  const slugToVersionJSON: any = {};
  const slugsListByType: any = {};
  const slugToQueryString: any = {};

  useEffect(() => {
    if (!protocolsToQuery || Object.keys(protocolsToQuery).length === 0) {
      getData();
    }
  }, []);

  Object.keys(protocolsToQuery).forEach((protocol) => {
    Object.keys(protocolsToQuery[protocol].deployments).forEach((depo) => {
      if (protocolsToQuery[protocol].deployments[depo].status === "prod") {
        const schemaName = schemaMapping[protocolsToQuery[protocol].schema];
        if (schemaName) {
          prodDeploymentsToQuery.push(protocolsToQuery[protocol].deployments[depo]);
          const depoData = protocolsToQuery[protocol].deployments[depo];
          let slug = depoData?.["services"]?.["hosted-service"]?.["slug"];
          if (depoData.network === "cronos") {
            slug = depoData?.["services"]?.["cronos-portal"]?.["slug"];
          }
          if (!slugsListByType[schemaName]) {
            slugsListByType[schemaName] = [];
          }
          slugToVersionJSON[slug] = protocolsToQuery[protocol].deployments[depo].versions.subgraph;
          slugsListByType[schemaName].push(slug);

          if (depoData?.["services"]?.["decentralized-network"]) {
            slugsListByType[schemaName].push(slug + " (Decentralized)");
          }
        }
      }
    });
  });

  let fetchVersionComponent = null;

  if (prodDeploymentsToQuery.length > 0) {
    fetchVersionComponent = (
      <>
        {prodDeploymentsToQuery.map((depo: any) => {
          let slug = depo?.["services"]?.["hosted-service"]?.["slug"];
          let endpoint = "https://api.thegraph.com/subgraphs/name/messari/" + slug;
          if (depo.network === "cronos") {
            slug = depo?.["services"]?.["cronos-portal"]?.["slug"];
            endpoint = "https://graph.cronoslabs.com/subgraphs/name/messari/" + slug;
          }
          slugToQueryString[slug] = "messari/" + slug;
          let decentralizedFetch = null;
          if (depo?.["services"]?.["decentralized-network"]) {
            let decenEndpoint =
              "https://gateway.thegraph.com/api/" +
              process.env.REACT_APP_GRAPH_API_KEY +
              "/subgraphs/id/" +
              depo?.["services"]?.["decentralized-network"]?.["query-id"];
            slugToQueryString[slug + " (Decentralized)"] = decenEndpoint;
            decentralizedFetch = (
              <FetchSubgraphVersion
                subgraphEndpoint={decenEndpoint}
                slug={slug + " (Decentralized)"}
                setDeployments={setSubgraphVersionMapping}
              />
            );
          }
          return (
            <>
              <FetchSubgraphVersion
                subgraphEndpoint={endpoint}
                slug={slug}
                setDeployments={setSubgraphVersionMapping}
              />
              {decentralizedFetch}
            </>
          );
        })}
      </>
    );
  }

  const columnLabels: string[] = ["Deployment", "Schema Type", "Pending", "Decentralized", "Hosted Service", "JSON"];

  const tableHead = (
    <TableHead sx={{ height: "20px" }}>
      <TableRow sx={{ height: "20px" }}>
        {columnLabels.map((col, idx) => {
          let textAlign = "left";
          let paddingLeft = "0px";
          let minWidth = "auto";
          let maxWidth = "auto";
          if (idx > 1) {
            textAlign = "right";
            paddingLeft = "16px";
          }
          if (idx === 0) {
            minWidth = "300px";
            maxWidth = "300px";
          }
          return (
            <TableCell sx={{ paddingLeft, minWidth, maxWidth, paddingRight: 0 }} key={"column" + col}>
              <Typography variant="h5" fontSize={14} fontWeight={500} sx={{ margin: "0", textAlign }}>
                {col}
              </Typography>
            </TableCell>
          );
        })}
      </TableRow>
    </TableHead>
  );

  const tablesBySchemaType = Object.keys(slugsListByType).map((type) => {
    const failedQueryRows: any = [];
    const decenDepos: any = {};
    slugsListByType[type].forEach((depo: string) => {
      if (depo.includes(" (Decentralized)")) {
        const hostedServiceSlug: string = depo.split(" (Decentralized)").join("");
        decenDepos[hostedServiceSlug] = subgraphVersionMapping[depo];
      }
    });

    const rowsOnTypeTable = slugsListByType[type].map((depo: string) => {
      const versionPending = subgraphVersionMapping[depo + " (Pending)"] || "";
      const versionDecen = decenDepos[depo] || "";
      const versionHostedService = subgraphVersionMapping[depo] || "";
      const versionJSON = slugToVersionJSON[depo] || "";

      if (
        depo.includes(" (Decentralized)") ||
        !isVersionMismatch(versionPending, versionDecen, versionHostedService, versionJSON)
      ) {
        return null;
      }
      if (subgraphVersionMapping[depo]?.includes(".") && slugToVersionJSON[depo]?.includes(".")) {
        return (
          <TableRow
            key={depo + "RowComp"}
            sx={{ height: "10px", width: "100%", backgroundColor: "rgba(22,24,29,0.9)", cursor: "pointer" }}
          >
            <TableCell sx={{ padding: "0 0 0 6px", verticalAlign: "middle", height: "30px", pointerEvents: "none" }}>
              {depo}
            </TableCell>
            <TableCell sx={{ padding: "0", paddingRight: "6px", textAlign: "left", pointerEvents: "none" }}>
              {type}
            </TableCell>
            <TableCell
              onClick={() =>
                (window.location.href = versionPending
                  ? "/subgraph?endpoint=" + slugToQueryString[depo] + "&tab=protocol&version=pending"
                  : "#")
              }
              sx={{
                padding: "0",
                paddingRight: "6px",
                textAlign: "right",
                color: getPriorityColor(versionPending, versionJSON),
              }}
            >
              {versionPending}
            </TableCell>
            <TableCell
              onClick={() =>
                (window.location.href = versionDecen
                  ? "/subgraph?endpoint=" + slugToQueryString[depo + " (Decentralized)"] + "&tab=protocol"
                  : "#")
              }
              sx={{
                padding: "0",
                paddingRight: "6px",
                textAlign: "right",
                color: getPriorityColor(versionDecen, versionJSON),
              }}
            >
              {versionDecen}
            </TableCell>
            <TableCell
              onClick={() =>
                (window.location.href = versionHostedService
                  ? "/subgraph?endpoint=" + slugToQueryString[depo] + "&tab=protocol"
                  : "#")
              }
              sx={{
                padding: "0",
                paddingRight: "6px",
                textAlign: "right",
                color: getPriorityColor(versionHostedService, versionJSON),
              }}
            >
              {versionHostedService}
            </TableCell>
            <TableCell sx={{ padding: "0", paddingRight: "6px", textAlign: "right", pointerEvents: "none" }}>
              {versionJSON}
            </TableCell>
          </TableRow>
        );
      } else if (subgraphVersionMapping[depo]) {
        failedQueryRows.push(
          <TableRow
            onClick={() => (window.location.href = "https://okgraph.xyz/?q=" + slugToQueryString[depo])}
            key={depo + "RowComp"}
            sx={{ height: "10px", width: "100%", backgroundColor: "rgba(22,24,29,0.9)", cursor: "pointer" }}
          >
            <TableCell sx={{ padding: "0 0 0 6px", verticalAlign: "middle", height: "30px" }}>{depo}</TableCell>
            <TableCell sx={{ padding: "0", paddingRight: "6px", textAlign: "left", pointerEvents: "none" }}>
              {type}
            </TableCell>
            <TableCell sx={{ padding: "0", paddingRight: "6px", textAlign: "right", color: "#B8301C" }}>
              {versionPending}
            </TableCell>
            <TableCell sx={{ padding: "0", paddingRight: "6px", textAlign: "right", color: "#B8301C" }}>
              {versionDecen}
            </TableCell>
            <TableCell sx={{ padding: "0", paddingRight: "6px", textAlign: "right", color: "#B8301C" }}>
              {subgraphVersionMapping[depo]}
            </TableCell>
            <TableCell sx={{ padding: "0", paddingRight: "6px", textAlign: "right", pointerEvents: "none" }}>
              {versionJSON}
            </TableCell>
          </TableRow>,
        );
        return null;
      }
    });

    if (rowsOnTypeTable.filter((x: any) => !!x)?.length === 0) {
      return null;
    }

    return (
      <TableContainer sx={{ my: 4, mx: 2 }} key={"TableContainer-VersionComparison-" + type}>
        <div style={{ width: "97.5%" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Typography variant="h2" align="left" fontSize={32}>
              {type}
            </Typography>
          </div>
        </div>
        <FetchIndexingStatusForType
          slugs={slugsListByType[type].filter((x: string) => !x.includes(" (Decentralized)"))}
          setDeployments={setSubgraphVersionMapping}
        />
        <Table sx={{ width: "97.5%" }} stickyHeader>
          {tableHead}
          {rowsOnTypeTable}
          {failedQueryRows}
        </Table>
      </TableContainer>
    );
  });

  return (
    <div style={{ overflowX: "hidden" }}>
      <div style={{ display: "flex", justifyContent: "space-between", margin: "40px 24px 10px 16px" }}>
        <Button variant="contained" color="primary" onClick={() => navigate("/")}>
          Back To Deployments List
        </Button>
      </div>
      {fetchVersionComponent}
      {tablesBySchemaType}
    </div>
  );
}

export default VersionComparison;
