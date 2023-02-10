import { GMXArbitrumConfigurations } from "../../protocols/gmx/config/deployments/gmx-arbitrum/configurations";
import { GMXAvalancheConfigurations } from "../../protocols/gmx/config/deployments/gmx-avalanche/configurations";

import { Configurations } from "./interface";
import { Deploy } from "./deploy";
import { log } from "@graphprotocol/graph-ts";

// This function is called to load in the proper configurations for a protocol/network deployment.
// To add a new deployment, add a value to the `Deploy` namespace and add a new configuration class to the network specific typescript file in the `protocols` folder.
// Finally, add a new entry for this deployment to the getNetworkConfigurations() function
export function getNetworkConfigurations(deploy: i32): Configurations {
  switch (deploy) {
    case Deploy.GMX_ARBITRUM: {
      return new GMXArbitrumConfigurations();
    }
    case Deploy.GMX_AVALANCHE: {
      return new GMXAvalancheConfigurations();
    }

    default: {
      log.critical(
        "No configurations found for deployment protocol/network",
        []
      );
      return new GMXArbitrumConfigurations();
    }
  }
}
