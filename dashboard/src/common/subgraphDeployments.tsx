import React, { useMemo } from "react";
import { DeploymentConfig, SubgraphStatus } from "../types";
import { Deployment } from "./deployment";

interface SubgraphDeploymentsProps {
  protocol: {
    name: string;
    deploymentMap: Record<string, DeploymentConfig>;
  };
  statusMap: Record<string, SubgraphStatus>;
}

export const SubgraphDeployments = ({ protocol: { name, deploymentMap }, statusMap }: SubgraphDeploymentsProps) => {
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
          // <span key={network}>{network}</span>
          <Deployment
            key={network}
            networkName={network}
            deployment={deployment}
            status={statusMap[deployment.deploymentId]}
          />
        ))}
      </div>
    </div>
  );
};