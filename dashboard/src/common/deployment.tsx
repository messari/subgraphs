import React, { useMemo } from "react";
import { latestSchemaVersion } from "../constants";
import { DeploymentConfig, SubgraphStatus } from "../types";
import { useNavigate } from "react-router";
import { useQuery } from "@apollo/client";
import { NewClient, parseSubgraphName } from "../utils";
import { ProtocolQuery } from "../queries/protocolQuery";

interface DeploymentProps {
  networkName: string;
  deployment: DeploymentConfig;
  status: SubgraphStatus;
}

export const Deployment = ({ networkName, deployment, status }: DeploymentProps) => {
  const navigate = useNavigate();
  const client = useMemo(() => NewClient(deployment.URL), [deployment.URL]);
  const { data, error } = useQuery(ProtocolQuery, {
    client,
  });

  const protocol = useMemo(() => data?.protocols[0], [data]);
  // Probably still want to render if we couldn't fetch the status.
  if (!protocol || !status) return null;
  if (error) {
    return <>Error state</>;
  }

  const navigateToSubgraph = (url: string) => () => {
    const subgraphName = parseSubgraphName(url);
    navigate(`graphs?subgraph=${subgraphName}`);
  };

  let color = "black";
  if (status.fatalError) {
    color = "red";
  }
  if (status.synced && protocol.schemaVersion === latestSchemaVersion) {
    color = "green";
  }

  let indexed = 0;
  if (status.synced) {
    indexed = 100;
  } else {
    indexed = parseFloat(
      ((status.chains[0].latestBlock.number / status.chains[0].chainHeadBlock.number) * 100).toFixed(2),
    );
  }

  return (
    <div
      onClick={navigateToSubgraph(deployment.URL)}
      style={{
        border: color + " 2px solid",
        padding: "1%",
        margin: "1%",
        width: "29%",
        cursor: "pointer",
      }}
    >
      <h3 style={{ textAlign: "center", color }}>{networkName}</h3>
      <p>Entity count: {status.entityCount}</p>
      <p style={{ color }}>Indexed: {indexed}%</p>
      <p>
        {status.fatalError ? (
          <>
            <span style={{ color: "red" }}>
              Fatal Error - Execution Stopped at block {status.fatalError.block.number}
            </span>{" "}
            -{" "}
            <span>
              <b>"{status.fatalError.message.substring(0, 30)}..."</b>
            </span>
          </>
        ) : (
          <span>Latest Block: {status.chains[0].latestBlock.number}</span>
        )}
      </p>
      <p>
        Network: {status.chains[0].network} - Current chain block: {status.chains[0].chainHeadBlock.number}
      </p>
      <p>
        Schema version: {protocol.schemaVersion || "0.0.0"} - Subgraph version: {protocol.subgraphVersion || "0.0.0"}
      </p>
      <p>Non fatal error count: {status.nonFatalErrors.length}</p>
    </div>
  );
};