import React, { useMemo } from "react";
import { Deployment } from "./Deployment";
import { Box, BoxProps, Typography } from "@mui/material";
import { styled } from "../styled";
import { SubgraphLogo } from "../common/SubgraphLogo";

const Subgraph = styled(Box)`
  margin-bottom: ${({ theme }) => theme.spacing(6)};
`;

const DeploymentContainer = styled("div")`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing(2)};
`;

interface SubgraphDeploymentsProps extends BoxProps {
  protocol: {
    name: string;
    deploymentMap: { [network: string]: string };
  };
}

// This component is the container for all different subgraphs of a protocol (the container for the different networks)
export const SubgraphDeployments = ({ protocol: { name, deploymentMap }, ...rest }: SubgraphDeploymentsProps) => {
  const deployments = useMemo(
    () =>
      Object.entries(deploymentMap).map(([network, deployment]) => ({
        network,
        deployment,
      })),
    [deploymentMap],
  );

  return (
    <Subgraph {...rest}>
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <SubgraphLogo name={name} />
        <Typography variant="h4">{name}</Typography>
      </Box>
      <DeploymentContainer>
        {deployments.map(({ network, deployment }) => (
          <Deployment key={network} subgraphID={name} networkName={network} deployment={deployment} />
        ))}
      </DeploymentContainer>
    </Subgraph>
  );
};
