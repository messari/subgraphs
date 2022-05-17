import React, { useMemo } from "react";
import { latestSchemaVersion } from "../constants";
import { DeploymentConfig, SubgraphStatus } from "../types";
import { useNavigate } from "react-router";
import { ApolloClient, HttpLink, InMemoryCache, useQuery } from "@apollo/client";
import { NewClient, parseSubgraphName } from "../utils";
import { ProtocolQuery } from "../queries/protocolQuery";
import { SubgraphStatusQuery } from "../queries/subgraphStatusQuery";
import { useEffect } from "react";

interface DeploymentProps {
  networkName: string;
  deployment: string;
}

// This component is for each individual subgraph
export const Deployment = ({ networkName, deployment }: DeploymentProps) => {
  const navigate = useNavigate();
  const link = new HttpLink({
    uri: "https://api.thegraph.com/index-node/graphql",
  });
  const clientIndexing = useMemo(
    () =>
      new ApolloClient({
        link,
        cache: new InMemoryCache(),
      }),
    [],
  );

  // Pull the subgraph name to use as the variable input for the indexing status query
  const subgraphName = deployment?.split('name/')[1];
  const { data: status, error: errorIndexing } = useQuery(SubgraphStatusQuery, {
    variables: { subgraphName },
    client: clientIndexing,
  });

  const client = useMemo(() => NewClient(deployment), [deployment]);
  const { data, error } = useQuery(ProtocolQuery, {
    client,
  });

  const protocol = useMemo(() => data?.protocols[0], [data]);

  useEffect(() => {
    console.log('DEPLOYMENT ERR?', error, errorIndexing, status, data?.protocols[0]?.name, subgraphName)
  }, [error])

  if (!status) {
    return null;
  }

  const navigateToSubgraph = (url: string) => () => {
    navigate(`graphs?subgraph=${url}`);
  };

  let color = "black";
  if (protocol?.schemaVersion !== latestSchemaVersion) {
    color = "yellow";
  }
  if (status.indexingStatusesForSubgraphName[0].fatalError) {
    color = "red";
  }
  if (status.indexingStatusesForSubgraphName[0].synced && protocol?.schemaVersion === latestSchemaVersion) {
    color = "green";
  }

  console.log(status)

  let indexed = 0;
  if (status.indexingStatusesForSubgraphName[0].synced) {
    indexed = 100;
  } else {
    indexed = parseFloat(
      ((status.indexingStatusesForSubgraphName[0].chains[0].latestBlock.number / status.indexingStatusesForSubgraphName[0].chains[0].chainHeadBlock.number) * 100).toFixed(2),
    );
  }

  return (
    <div
      onClick={navigateToSubgraph(deployment)}
      style={{
        border: color + " 2px solid",
        padding: "1%",
        margin: "1%",
        width: "29%",
        cursor: "pointer",
      }}
    >
      <h3 style={{ textAlign: "center", color }}>{networkName}</h3>
      <p>Entity count: {status.indexingStatusesForSubgraphName[0].entityCount}</p>
      <p style={{ color }}>Indexed: {indexed}%</p>
      <p>
        {status.indexingStatusesForSubgraphName[0].fatalError ? (
          <>
            <span style={{ color: "red" }}>
              Fatal Error - Execution Stopped at block {status.indexingStatusesForSubgraphName[0].fatalError.block.number}
            </span>{" "}
            -{" "}
            <span>
              <b>"{status.indexingStatusesForSubgraphName[0].fatalError.message.substring(0, 30)}..."</b>
            </span>
          </>
        ) : (
          <span>Latest Block: {status.indexingStatusesForSubgraphName[0].chains[0].latestBlock.number}</span>
        )}
      </p>
      <p>
        Network: {status.indexingStatusesForSubgraphName[0].chains[0].network} - Current chain block: {status.indexingStatusesForSubgraphName[0].chains[0].chainHeadBlock.number}
      </p>
      <p>
        Schema version: {protocol?.schemaVersion || "N/A"} - Subgraph version: {protocol?.subgraphVersion || "N/A"}
      </p>
      <p>Non fatal error count: {status.indexingStatusesForSubgraphName[0].nonFatalErrors.length}</p>
    </div>
  );
};