import { useMemo } from "react";
import { Deployment } from "./Deployment";
import { BoxProps } from "@mui/material";
import { ApolloClient, NormalizedCacheObject } from "@apollo/client";

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
    <>
      {deployments.map(({ network, deployment }) => {
        return (
          <>
            <Deployment
              key={deployment + "-" + network}
              clientIndexing={clientIndexing}
              subgraphID={name}
              networkName={network}
              deployment={deployment}
              currentDeployment={true}
            />
            <Deployment
              key={"pending-" + deployment + "-" + network}
              clientIndexing={clientIndexing}
              subgraphID={name}
              networkName={network}
              deployment={deployment}
              currentDeployment={false}
            />
          </>
        );
      })}
    </>
  );
};
