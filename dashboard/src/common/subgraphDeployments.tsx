import React, { useMemo } from "react";
import { DeploymentConfig, SubgraphStatus } from "../types";
import { Deployment } from "./deployment";

interface SubgraphDeploymentsProps {
  protocol: {
    name: string;
    deploymentMap: { [network: string]: string; };
  };
}

// This component is the container for all different subgraphs of a protocol (the container for the different networks)
export const SubgraphDeployments = ({ protocol: { name, deploymentMap } }: SubgraphDeploymentsProps) => {
  const deployments = useMemo(
    () =>
      Object.entries(deploymentMap).map(([network, deployment]) => ({
        network,
        deployment,
      })),
    [deploymentMap],
  );

  return (
    <div style={{ border: "black 2px solid", margin: "18px 50px" }}>
      <h2 style={{ textAlign: "center" }}>{name}</h2>
      <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap" }}>
        {deployments.map(({ network, deployment }) => (
          <Deployment
            key={network}
            networkName={network}
            deployment={deployment}
          />
        ))}
      </div>
    </div>
  );
};