import { OdosEthereumConfigurations } from "../../protocols/odos/config/deployments/odos-ethereum/configurations";
import { OdosArbitrumConfigurations } from "../../protocols/odos/config/deployments/odos-arbitrum/configurations";
import { OdosPolygonConfigurations } from "../../protocols/odos/config/deployments/odos-polygon/configurations";
import { OdosOptimismConfigurations } from "../../protocols/odos/config/deployments/odos-optimism/configurations";
import { Configurations } from "./interface";
import { Deploy } from "./deploy";
import { log } from "@graphprotocol/graph-ts";

// This function is called to load in the proper configurations for a protocol/network deployment.
// To add a new deployment, add a value to the `Deploy` namespace and add a new configuration class to the network specific typescript file in the `protocols` folder.
// Finally, add a new entry for this deployment to the getNetworkConfigurations() function
export function getNetworkConfigurations(deploy: i32): Configurations {
  switch (deploy) {
    case Deploy.ODOS_ETHEREUM: {
      return new OdosEthereumConfigurations();
    }
    case Deploy.ODOS_ARBITRUM: {
      return new OdosArbitrumConfigurations();
    }
    case Deploy.ODOS_POLYGON: {
      return new OdosPolygonConfigurations();
    }
    case Deploy.ODOS_OPTIMISM: {
      return new OdosOptimismConfigurations();
    }
    default: {
      log.critical(
        "No configurations found for deployment protocol/network",
        []
      );
      return new OdosPolygonConfigurations();
    }
  }
}
