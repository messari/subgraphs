import { log } from "@graphprotocol/graph-ts";
import { OpynArbitrumConfigurations } from "../../protocols/opyn-gamma/config/deployments/opyn-gamma-arbitrum/configurations";
import { OpynAvalancheConfigurations } from "../../protocols/opyn-gamma/config/deployments/opyn-gamma-avalanche/configurations";
import { OpynEthereumConfigurations } from "../../protocols/opyn-gamma/config/deployments/opyn-gamma-ethereum/configurations";
import { OpynPolygonConfigurations } from "../../protocols/opyn-gamma/config/deployments/opyn-gamma-polygon/configurations";
import { Deploy } from "./deploy";
import { Configurations } from "./interface";

// This function is called to load in the proper configurations for a protocol/network deployment.
// To add a new deployment, add a value to the `Deploy` namespace and add a new configuration class to the network specific typescript file in the `protocols` folder.
// Finally, add a new entry for this deployment to the getNetworkConfigurations() function
export function getNetworkConfigurations(deploy: i32): Configurations {
  switch (deploy) {
    case Deploy.OPYN_ETHEREUM: {
      return new OpynEthereumConfigurations();
    }
    case Deploy.OPYN_AVALANCHE: {
      return new OpynAvalancheConfigurations();
    }
    case Deploy.OPYN_ARBITRUM: {
      return new OpynArbitrumConfigurations();
    }
    case Deploy.OPYN_POLYGON: {
      return new OpynPolygonConfigurations();
    }
    default: {
      log.critical(
        "No configurations found for deployment protocol/network",
        []
      );
      return new OpynEthereumConfigurations();
    }
  }
}
