import React, { MouseEventHandler, useContext, useMemo } from "react";
import { latestSchemaVersion } from "../constants";
import { useNavigate } from "react-router";
import { ApolloClient, HttpLink, InMemoryCache, useQuery } from "@apollo/client";
import { NewClient, parseSubgraphName, toPercent } from "../utils";
import { ProtocolQuery } from "../queries/protocolQuery";
import { SubgraphStatusQuery } from "../queries/subgraphStatusQuery";
import { useEffect } from "react";
import { styled } from "../styled";
import { alpha, Box, Button, Card, CardContent, Typography } from "@mui/material";
import DeploymentsContext from "./DeploymentsContext";
import { NetworkLogo } from "../common/NetworkLogo";

const DeploymentBackground = styled("div")`
  background: rgba(22, 24, 29, 0.95);
  border-radius: 8px;
  flex-grow: 2;
`;

const StyledDeployment = styled(Card)<{
  $styleRules: { schemaOutdated: boolean; nonFatalErrors: boolean; fatalError: boolean; success: boolean };
}>(({ $styleRules, theme }) => {
  let statusColor = "";
  if ($styleRules.fatalError) {
    statusColor = theme.palette.error.main;
  } else if ($styleRules.schemaOutdated || $styleRules.nonFatalErrors) {
    statusColor = theme.palette.warning.main;
  } else if ($styleRules.success) {
    statusColor = theme.palette.success.main;
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
    
    &:hover {
      box-shadow: 0 0 2px 1px ${alpha(theme.palette.primary.main, 0.6)};
    }
    
    ${indexedStyles}
  `;
});

const CardRow = styled("div")<{ $warning?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing(2)};
  margin-top: ${({ theme }) => theme.spacing(1)};
  ${({ $warning, theme }) => $warning && `color: ${theme.palette.warning.main}`};
`;

const CardButton = styled(Button)`
  width: 100%;
  border-top-left-radius: 0;
  border-top-right-radius: 0;
`;

interface DeploymentProps {
  networkName: string;
  deployment: string;
  subgraphID: string;
}

// This component is for each individual subgraph
export const Deployment = ({ networkName, deployment, subgraphID }: DeploymentProps) => {
  const deploymentsContext = useContext(DeploymentsContext);
  const navigate = useNavigate();
  const clientIndexing = useMemo(
    () =>
      new ApolloClient({
        link: new HttpLink({
          uri: "https://api.thegraph.com/index-node/graphql",
        }),
        cache: new InMemoryCache(),
      }),
    [],
  );

  // Pull the subgraph name to use as the variable input for the indexing status query
  const subgraphName = parseSubgraphName(deployment);
  const { data: status, error: errorIndexing } = useQuery(SubgraphStatusQuery, {
    variables: { subgraphName },
    client: clientIndexing,
  });
  const { nonFatalErrors, fatalError, synced } = status?.indexingStatusesForSubgraphName[0] ?? {};

  const client = useMemo(() => NewClient(deployment), [deployment]);
  const { data, error } = useQuery(ProtocolQuery, {
    client,
  });

  const protocol = useMemo(() => data?.protocols[0], [data]);
  const { schemaVersion } = protocol ?? {};

  useEffect(() => {
    console.log("DEPLOYMENT ERR?", error, errorIndexing, status, subgraphName);
  }, [error]);

  const { schemaOutdated, indexedSuccess } = useMemo(() => {
    return {
      schemaOutdated: schemaVersion && schemaVersion !== latestSchemaVersion,
      indexedSuccess: synced && schemaVersion === latestSchemaVersion,
    };
  }, [schemaVersion, fatalError, synced]);

  if (!status) {
    return null;
  }
  const indexed = synced
    ? 100
    : toPercent(
        status.indexingStatusesForSubgraphName[0].chains[0].latestBlock.number,
        status.indexingStatusesForSubgraphName[0].chains[0].chainHeadBlock.number,
      );

  const navigateToSubgraph = (url: string) => () => {
    navigate(`subgraph?endpoint=${url}&tab=protocol`);
  };

  const showErrorModal: MouseEventHandler<HTMLButtonElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();

    deploymentsContext.setErrorDialogData({
      deployment,
      network: networkName,
      fatalError,
      nonFatalErrors,
      subgraphName: subgraphID,
    });
    deploymentsContext.showErrorDialog(true);
  };

  return (
    <StyledDeployment
      onClick={navigateToSubgraph(deployment)}
      $styleRules={{
        schemaOutdated,
        nonFatalErrors: nonFatalErrors.length > 0,
        fatalError: !!fatalError,
        success: indexedSuccess,
      }}
    >
      <DeploymentBackground>
        <CardContent>
          <Box display="flex" gap={2} alignItems="center">
            <NetworkLogo network={networkName} />
            <Typography variant="h6" align="center">
              {networkName}
            </Typography>
          </Box>
          <CardRow className="indexed">
            <span>Indexed:</span> <span>{indexed}%</span>
          </CardRow>
          <CardRow>
            <span>Latest Block:</span>{" "}
            <span>{status.indexingStatusesForSubgraphName[0].chains[0].latestBlock.number}</span>
          </CardRow>
          <CardRow>
            <span>Current chain block:</span>
            <span>{status.indexingStatusesForSubgraphName[0].chains[0].chainHeadBlock.number}</span>
          </CardRow>
          <CardRow $warning={schemaOutdated}>
            <span>Schema version:</span> <span>{protocol?.schemaVersion || "N/A"}</span>
          </CardRow>
          <CardRow>
            <span>Subgraph version:</span> <span>{protocol?.subgraphVersion || "N/A"}</span>
          </CardRow>
          <CardRow $warning={nonFatalErrors.length > 0}>
            <span>Non fatal error count:</span> <span>{nonFatalErrors.length}</span>
          </CardRow>
          <CardRow>
            <span>Entity count:</span>{" "}
            <span>{parseInt(status.indexingStatusesForSubgraphName[0].entityCount).toLocaleString()}</span>
          </CardRow>
        </CardContent>
        {(nonFatalErrors.length > 0 || fatalError) && (
          <CardButton variant="contained" color="error" onClick={showErrorModal}>
            View Errors
          </CardButton>
        )}
      </DeploymentBackground>
    </StyledDeployment>
  );
};
