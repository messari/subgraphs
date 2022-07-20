import React, { useMemo } from "react";
import { Deployment } from "./Deployment";
import { Box, BoxProps, Typography } from "@mui/material";
import { styled } from "../styled";
import { SubgraphLogo } from "../common/SubgraphLogo";
import { ApolloClient, NormalizedCacheObject } from "@apollo/client";
import LazyLoad from "react-lazyload";

const Subgraph = styled(Box)`
  width: 100%;
`;

const DeploymentContainer = styled("div")`
  display: flex;
  flex-wrap: wrap;
`;

interface SubgraphDeploymentsProps extends BoxProps {
  protocol: {
    name: string;
    deploymentMap: { [network: string]: string };
  };
  clientIndexing: ApolloClient<NormalizedCacheObject>;
}

// This component is the container for all different subgraphs of a protocol (the container for the different networks)
export const SubgraphDeployments = ({
  protocol: { name, deploymentMap },
  clientIndexing,
  ...rest
}: SubgraphDeploymentsProps) => {
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

      <LazyLoad height={125} offset={70}>
        <DeploymentContainer>
          {deployments.map(({ network, deployment }) => {
            return (
              <>
                <Deployment
                  key={network}
                  clientIndexing={clientIndexing}
                  subgraphID={name}
                  networkName={network}
                  deployment={deployment}
                  currentDeployment={true}
                />
                <Deployment
                  key={network}
                  clientIndexing={clientIndexing}
                  subgraphID={name}
                  networkName={network}
                  deployment={deployment}
                  currentDeployment={false}
                />
              </>
            );
          })}
        </DeploymentContainer>
      </LazyLoad>
    </Subgraph>
  );
};
