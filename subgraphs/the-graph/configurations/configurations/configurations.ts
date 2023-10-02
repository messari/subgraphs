import { TheGraphArbitrumConfigurations } from "../../protocols/the-graph/config/deployments/the-graph-arbitrum/configurations";
import { TheGraphEthereumConfigurations } from "../../protocols/the-graph/config/deployments/the-graph-ethereum/configurations";
import { Configurations } from "./interface";
import { Deploy } from "./deploy";
import { log } from "@graphprotocol/graph-ts";

export function getNetworkConfigurations(deploy: i32): Configurations {
  switch (deploy) {
    case Deploy.THE_GRAPH_ARBITRUM: {
      return new TheGraphArbitrumConfigurations();
    }
    case Deploy.THE_GRAPH_ETHEREUM: {
      return new TheGraphEthereumConfigurations();
    }
    default: {
      log.critical(
        "No configurations found for deployment protocol/network",
        []
      );
      return new TheGraphArbitrumConfigurations();
    }
  }
}
