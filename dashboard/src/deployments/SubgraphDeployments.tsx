import { Fragment, useMemo } from "react";
import { Deployment } from "./Deployment";
import { BoxProps } from "@mui/material";
import { ApolloClient, gql, NormalizedCacheObject, useQuery } from "@apollo/client";
import { parseSubgraphName } from "../utils";
import { SubgraphStatusQuery } from "../queries/subgraphStatusQuery";

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

  // Map through deployments and construct the status query with all depos for a protocol

  const fullCurrentQueryArray = ["query Status {"];
  const fullPendingQueryArray = ["query Status {"];

  const queryContents = `
  subgraph
  node
  synced
  health
  fatalError {
    message
    handler
  }
  nonFatalErrors {
    message
    handler
  }
  chains {
    network
    chainHeadBlock {
      number
    }
    earliestBlock {
      number
    }
    latestBlock {
      number
    }
    lastHealthyBlock {
      number
    }
  }
  entityCount`;

  (deployments).forEach((depoObj) => {
    const name = parseSubgraphName(depoObj.deployment);
    const nameSplit = name.split("messari/")[name.split("messari/").length - 1];
    fullCurrentQueryArray[fullCurrentQueryArray.length - 1] += `        
          ${nameSplit
        .split("-")
        .join(
          "_"
        )}: indexingStatusForCurrentVersion(subgraphName: "messari/${nameSplit}") {
            ${queryContents}
          }
      `;
    fullPendingQueryArray[fullPendingQueryArray.length - 1] += `        
        ${nameSplit
        .split("-")
        .join(
          "_"
        )}_pending: indexingStatusForPendingVersion(subgraphName: "messari/${nameSplit}") {
          ${queryContents}
        }
    `;
    if (fullCurrentQueryArray[fullCurrentQueryArray.length - 1].length > 80000) {
      fullCurrentQueryArray[fullCurrentQueryArray.length - 1] += "}";
      fullCurrentQueryArray.push(" query Status {");
    }
    if (fullPendingQueryArray[fullPendingQueryArray.length - 1].length > 80000) {
      fullPendingQueryArray[fullPendingQueryArray.length - 1] += "}";
      fullPendingQueryArray.push(" query Status {");
    }
  });
  fullCurrentQueryArray[fullCurrentQueryArray.length - 1] += "}";
  fullPendingQueryArray[fullPendingQueryArray.length - 1] += "}";

  const {
    data: status,
    error: errorIndexing,
    loading: statusLoading,
  } = useQuery(gql`${fullCurrentQueryArray.join("")}`, {
    client: clientIndexing,
  });

  const {
    data: statusPending,
    error: errorIndexingPending,
    loading: statusLoadingPending,
  } = useQuery(gql`${fullPendingQueryArray.join("")}`, {
    client: clientIndexing,
  });

  return (
    <>
      {deployments.map(({ network, deployment }, idx) => {
        let pendingDeployment = null;
        if (!!Object.values(status)[idx]) {
          pendingDeployment = (
            <Deployment
              key={"pending-" + deployment + "-" + network}
              clientIndexing={clientIndexing}
              subgraphID={name}
              networkName={network}
              deployment={deployment}
              currentDeployment={false}
              statusReturned={statusPending}
              statusLoading={statusLoadingPending}
              errorIndexing={errorIndexingPending}
            />
          );
        }
        return (
          <Fragment key={deployment + 'CompGroup'}>
            <Deployment
              key={deployment + "-" + network}
              clientIndexing={clientIndexing}
              subgraphID={name}
              networkName={network}
              deployment={deployment}
              currentDeployment={true}
              statusReturned={status}
              statusLoading={statusLoading}
              errorIndexing={errorIndexing}
            />
            {pendingDeployment}
          </Fragment>
        );
      })}
    </>
  );
};