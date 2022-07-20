import { useMemo, useState } from "react";
import { latestSchemaVersion } from "../constants";
import { useNavigate } from "react-router";
import { ApolloClient, NormalizedCacheObject, useQuery, useLazyQuery } from "@apollo/client";
import { NewClient, parseSubgraphName, toPercent } from "../utils";
import { ProtocolQuery } from "../queries/protocolQuery";
import { SubgraphStatusQuery } from "../queries/subgraphStatusQuery";
import { useEffect } from "react";
import { styled } from "../styled";
import { alpha, Box, Card, CircularProgress, Typography } from "@mui/material";
import { NetworkLogo } from "../common/NetworkLogo";
import { SubgraphLogo } from "../common/SubgraphLogo";

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

  const indexedStyles =
    ($styleRules.fatalError || $styleRules.success) &&
    `
    .indexed {
      color: ${statusColor};
    }
  `;
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
    
    ${indexedStyles}
  `;
});

interface DeploymentProps {
  networkName: string;
  deployment: string;
  subgraphID: string;
  clientIndexing: ApolloClient<NormalizedCacheObject>;
  currentDeployment: Boolean;
}

// This component is for each individual subgraph
export const Deployment = ({
  networkName,
  deployment,
  subgraphID,
  clientIndexing,
  currentDeployment,
}: DeploymentProps) => {
  const [endpointURL, setEndpointURL] = useState(deployment);
  const navigate = useNavigate();
  const navigateToSubgraph = (url: string) => () => {
    let versionParam = "";
    if (!currentDeployment) {
      versionParam = "&version=pending&name=" + parseSubgraphName(deployment);
    }
    navigate(`subgraph?endpoint=${url}&tab=protocol` + versionParam);
  };
  // Pull the subgraph name to use as the variable input for the indexing status query
  const subgraphName = parseSubgraphName(deployment);
  const deploymentId = deployment.split("id/")[1];
  const {
    data: status,
    error: errorIndexing,
    loading: statusLoading,
  } = useQuery(SubgraphStatusQuery(deployment), {
    variables: { subgraphName, deploymentIds: [deploymentId ? deploymentId : ""] },
    client: clientIndexing,
  });
  let statusData = status?.indexingStatusForCurrentVersion;
  if (!currentDeployment) {
    statusData = status?.indexingStatusForPendingVersion;
  }
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
      console.log(deployment, "DEPLOYMENT ERR", error, errorIndexing, status, statusData, subgraphName);
    }
  }, [error]);

  const { schemaOutdated, indexedSuccess } = useMemo(() => {
    return {
      schemaOutdated: schemaVersion && schemaVersion !== latestSchemaVersion,
      indexedSuccess: synced && schemaVersion === latestSchemaVersion,
    };
  }, [schemaVersion, fatalError, synced]);
  if (loading || statusLoading) {
    return <div style={{ display: "inline-block", width: "100%" }}><CircularProgress sx={{ margin: 2 }} size={10} /></div>;
  }

  if (!statusData && !statusLoading && !currentDeployment) {
    return null;
  }

  if (!statusData && !statusLoading && !data) {
    let errorMsg = null;
    if (errorIndexing) {
      errorMsg = (
        <Box marginTop="10px" gap={2} alignItems="center">
          <span>Indexing status could not be pulled: "{errorIndexing.message.slice(0, 100)}..."</span>
        </Box>
      );
    }
    return (
      <StyledDeployment
        onClick={navigateToSubgraph(endpointURL)}
        sx={{ width: "100%" }}
        $styleRules={{
          schemaOutdated,
          nonFatalErrors: false,
          fatalError: false,
          success: false,
          currentVersion: currentDeployment,
        }}
      >
        <DeploymentBackground>
          <Box display="flex" gap={3} alignItems="center">
            <NetworkLogo network={networkName} />
            <Typography variant="h5" align="center">
              {networkName}
            </Typography>
          </Box>
          <Box marginTop="10px" gap={2} alignItems="center">
            <span>{deployment}</span>
          </Box>
          {errorMsg}
        </DeploymentBackground>
      </StyledDeployment>
    );
  }
  const indexed = synced
    ? 100
    : toPercent(statusData?.chains[0]?.latestBlock?.number || 0, statusData?.chains[0]?.chainHeadBlock?.number);

  const columnStyle = {
    width: "100%",
    paddingLeft: "4px",
    height: "40px",
    margin: "0"
  }

  return (
    <StyledDeployment
      onClick={navigateToSubgraph(endpointURL)}
      $styleRules={{
        schemaOutdated,
        nonFatalErrors: nonFatalErrors?.length > 0,
        fatalError: !!fatalError,
        success: indexedSuccess,
        currentVersion: currentDeployment,
      }}
    >
      <DeploymentBackground>
        <div style={{ display: "flex", width: "100%", justifyContent: "space-around", height: "40px" }}>
          <div style={{ ...columnStyle, flex: 4, borderRight: "white 2px solid", display: "flex" }}><SubgraphLogo name={subgraphID} /><NetworkLogo network={networkName} /><span>{subgraphID}-{networkName}{!currentDeployment ? " (pending)" : null}</span></div>
          <h5 style={{ ...columnStyle, flex: 2, borderRight: "white 2px solid" }}>{Number(indexed) ? indexed + "%" : "N/A"}</h5>
          <h5 style={{ ...columnStyle, flex: 2, borderRight: "white 2px solid" }}>{statusData?.chains[0]?.latestBlock?.number || data?._meta?.block?.number}</h5>
          <h5 style={{ ...columnStyle, flex: 2, borderRight: "white 2px solid" }}>{statusData?.chains[0]?.chainHeadBlock?.number || "?"}</h5>
          <h5 style={{ ...columnStyle, flex: 1, borderRight: "white 2px solid" }}>{protocol?.schemaVersion || "N/A"}</h5>
          <h5 style={{ ...columnStyle, flex: 1, borderRight: "white 2px solid" }}>{protocol?.subgraphVersion || "N/A"}</h5>
          <h5 style={{ ...columnStyle, flex: 1, borderRight: "white 2px solid" }}>{nonFatalErrors?.length || 0}</h5>
          <h5 style={{ ...columnStyle, flex: 2 }}>{parseInt(statusData?.entityCount) ? parseInt(statusData?.entityCount)?.toLocaleString() : "N/A"}</h5>
        </div>

      </DeploymentBackground>
    </StyledDeployment>
  );
};
