import { useMemo, useState } from "react";
import { latestSchemaVersion } from "../constants";
import { useNavigate } from "react-router";
import { ApolloClient, NormalizedCacheObject, useLazyQuery } from "@apollo/client";
import { formatIntToFixed2, NewClient, parseSubgraphName, toPercent } from "../utils";
import { ProtocolQuery } from "../queries/protocolQuery";
import { useEffect } from "react";
import { styled } from "../styled";
import { alpha, Card, CircularProgress, TableRow, Typography } from "@mui/material";
import { NetworkLogo } from "../common/NetworkLogo";
import { SubgraphLogo } from "../common/SubgraphLogo";
import { TableCell } from "@mui/material";

const DeploymentBackground = styled("div")`
  background: rgba(22, 24, 29, 0.95);
  border-radius: 8px;
  flex-grow: 2;
`;

const StyledDeployment = styled(Card)<{
  $styleRules: {
    schemaOutdated: boolean;
    nonFatalErrors: boolean;
    fatalError: boolean;
    success: boolean;
    currentVersion: Boolean;
  };
}>(({ $styleRules, theme }) => {
  let statusColor = "";
  if ($styleRules.fatalError) {
    statusColor = theme.palette.error.main;
  } else if ($styleRules.schemaOutdated || $styleRules.nonFatalErrors || !$styleRules.currentVersion) {
    statusColor = theme.palette.warning.main;
  } else if ($styleRules.success) {
    statusColor = theme.palette.success.main;
  } else {
    statusColor = "white";
  }

  return `
    background: rgba(22,24,29,0.9);
    background: linear-gradient(0deg, rgba(22,24,29,0.9) 0%, ${statusColor} 95%);
    padding: 1px;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    cursor: pointer;
    width: 100%;
    justifyContent: space-around;
    &:hover {
      box-shadow: 0 0 2px 1px ${alpha(theme.palette.primary.main, 0.6)};
    }
    
    .indexed {
      color: ${statusColor};
    }
  `;
});

interface DeploymentProps {
  networkName: string;
  deployment: string;
  subgraphID: string;
  clientIndexing: ApolloClient<NormalizedCacheObject>;
  currentDeployment: Boolean;
  statusReturned: any;
  statusLoading: any;
  errorIndexing: any;
}

// This component is for each individual subgraph
export const Deployment = ({
  networkName,
  deployment,
  subgraphID,
  clientIndexing,
  currentDeployment,
  statusReturned,
  statusLoading,
  errorIndexing
}: DeploymentProps) => {
  let statusKey = "";
  let status: { [x: string]: any } = {};
  if (statusReturned) {
    statusKey = Object.keys(statusReturned).find(x => x.includes(networkName) && x.includes(subgraphID.split('-').join('_'))) || Object.keys(statusReturned)[0];
    status = statusReturned[statusKey];
  }
  const [endpointURL, setEndpointURL] = useState(deployment);
  const navigate = useNavigate();
  const navigateToSubgraph = (url: string) => () => {
    let versionParam = "";
    if (!currentDeployment) {
      versionParam = "&version=pending&name=" + parseSubgraphName(deployment);
    }
    navigate(`subgraph?endpoint=${url}&tab=protocol` + versionParam);
  };

  let statusData = status;
  let { nonFatalErrors, fatalError, synced } = statusData ?? {};
  if (status?.indexingStatuses) {
    statusData = status?.indexingStatuses[0];
    synced = statusData?.synced ?? null;
    fatalError = statusData?.fatalError ?? null;
    nonFatalErrors = statusData?.nonFatalErrors ?? [];
  }

  const client = useMemo(() => NewClient(endpointURL), [endpointURL]);
  const [getSchemaData, { data, error, loading }] = useLazyQuery(ProtocolQuery, {
    client,
  });

  let protocol = useMemo(() => data?.protocols, [data]);
  if (protocol?.length > 0) {
    protocol = protocol[0];
  }
  const { schemaVersion } = protocol ?? {};

  useEffect(() => {
    if (!data && statusData && !currentDeployment) {
      setEndpointURL("https://api.thegraph.com/subgraphs/id/" + statusData?.subgraph);
    }
    getSchemaData();
  }, [statusLoading]);

  useEffect(() => {
    if (error || errorIndexing) {
      console.log(deployment, "DEPLOYMENT ERR", error, errorIndexing, status);
    }
  }, [error]);

  const { schemaOutdated, indexedSuccess } = useMemo(() => {
    return {
      schemaOutdated: schemaVersion && schemaVersion !== latestSchemaVersion,
      indexedSuccess: synced && schemaVersion === latestSchemaVersion,
    };
  }, [schemaVersion, fatalError, synced]);
  if (loading || statusLoading) {
    return (
      <div style={{ display: "inline-block", width: "100%" }}>
        <CircularProgress sx={{ margin: "10px" }} size={"33px"} />
      </div>
    );
  }

  if (!statusData && !statusLoading && !currentDeployment) {
    return null;
  }

  let statusColor = "";
  if (fatalError) {
    statusColor = "#B8301C";
  } else if (schemaOutdated || nonFatalErrors?.length > 0 || !currentDeployment) {
    statusColor = "#EFCB68";
  } else if (indexedSuccess) {
    statusColor = "#58BC82";
  }

  let statusDataOnChain: { [x: string]: any } = {};
  if (status?.chains?.length > 0) {
    statusDataOnChain = status?.chains[0];
  }

  const indexed = formatIntToFixed2(synced
    ? 100
    : toPercent(
      statusDataOnChain?.latestBlock?.number - statusDataOnChain?.earliestBlock?.number || 0,
      statusDataOnChain?.chainHeadBlock?.number - statusDataOnChain?.earliestBlock?.number,
    ));

  return (
    <TableRow sx={{ width: "100%", backgroundColor: "rgba(22,24,29,0.9)" }} onClick={navigateToSubgraph(endpointURL)}>
      <TableCell
        sx={{ padding: "6px", borderLeft: `${statusColor} solid 6px`, verticalAlign: "middle", display: "flex" }}
      >
        <SubgraphLogo size={40} name={subgraphID} />
        <NetworkLogo size={40} network={networkName} />
        <span style={{ display: "inline-flex", alignItems: "center", paddingLeft: "6px", fontSize: "14px" }}>
          {subgraphID}-{networkName}
          {!currentDeployment ? " (pending)" : null}
        </span>
      </TableCell>
      <TableCell sx={{ padding: "6px", textAlign: "right" }}>
        <Typography variant="h5" sx={{ width: "100%" }} fontSize={14}>
          {Number(indexed) ? indexed + "%" : "N/A"}
        </Typography>
      </TableCell>
      <TableCell sx={{ padding: "6px", textAlign: "right" }}>
        <Typography variant="h5" sx={{ width: "100%" }} fontSize={14}>
          {Number(statusDataOnChain?.earliestBlock?.number)?.toLocaleString()}
        </Typography>
      </TableCell>
      <TableCell sx={{ padding: "6px", textAlign: "right" }}>
        <Typography variant="h5" sx={{ width: "100%" }} fontSize={14}>
          {Number(statusDataOnChain?.latestBlock?.number)?.toLocaleString() ||
            Number(data?._meta?.block?.number)?.toLocaleString()}
        </Typography>
      </TableCell>
      <TableCell sx={{ padding: "6px", textAlign: "right" }}>
        <Typography variant="h5" sx={{ width: "100%" }} fontSize={14}>
          {Number(statusDataOnChain?.chainHeadBlock?.number)?.toLocaleString() || "?"}
        </Typography>
      </TableCell>
      <TableCell sx={{ padding: "6px", textAlign: "right" }}>
        <Typography variant="h5" sx={{ width: "100%" }} fontSize={14}>
          {protocol?.schemaVersion || "N/A"}
        </Typography>
      </TableCell>
      <TableCell sx={{ padding: "6px", textAlign: "right" }}>
        <Typography variant="h5" sx={{ width: "100%" }} fontSize={14}>
          {protocol?.subgraphVersion || "N/A"}
        </Typography>
      </TableCell>
      <TableCell sx={{ padding: "6px", textAlign: "right" }}>
        <Typography variant="h5" sx={{ width: "100%" }} fontSize={14}>
          {nonFatalErrors?.length || 0}
        </Typography>
      </TableCell>
      <TableCell sx={{ padding: "6px", textAlign: "right", paddingRight: "30px" }}>
        <Typography variant="h5" sx={{ width: "100%" }} fontSize={14}>
          {parseInt(statusData?.entityCount) ? parseInt(statusData?.entityCount)?.toLocaleString() : "N/A"}
        </Typography>
      </TableCell>
    </TableRow>
  );
};
