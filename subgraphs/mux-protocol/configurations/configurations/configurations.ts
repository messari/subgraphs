import { MUXProtocolArbitrumConfigurations } from "../../protocols/mux-protocol/config/deployments/mux-protocol-arbitrum/configurations";
import { MUXProtocolAvalancheConfigurations } from "../../protocols/mux-protocol/config/deployments/mux-protocol-avalanche/configurations";
import { MUXProtocolBscConfigurations } from "../../protocols/mux-protocol/config/deployments/mux-protocol-bsc/configurations";
import { MUXProtocolFantomConfigurations } from "../../protocols/mux-protocol/config/deployments/mux-protocol-fantom/configurations";
import { MUXProtocolOptimismConfigurations } from "../../protocols/mux-protocol/config/deployments/mux-protocol-optimism/configurations";

import { Configurations } from "./interface";
import { Deploy } from "./deploy";
import { log } from "@graphprotocol/graph-ts";

// This function is called to load in the proper configurations for a protocol/network deployment.
// To add a new deployment, add a value to the `Deploy` namespace and add a new configuration class to the network specific typescript file in the `protocols` folder.
// Finally, add a new entry for this deployment to the getNetworkConfigurations() function
export function getNetworkConfigurations(deploy: i32): Configurations {
  switch (deploy) {
    case Deploy.MUX_ARBITRUM: {
      return new MUXProtocolArbitrumConfigurations();
    }
    case Deploy.MUX_AVALANCHE: {
      return new MUXProtocolAvalancheConfigurations();
    }
    case Deploy.MUX_BSC: {
      return new MUXProtocolBscConfigurations();
    }
    case Deploy.MUX_FANTOM: {
      return new MUXProtocolFantomConfigurations();
    }
    case Deploy.MUX_OPTIMISM: {
      return new MUXProtocolOptimismConfigurations();
    }

    default: {
      log.error("No configurations found for deployment protocol/network", []);
      return new MUXProtocolArbitrumConfigurations();
    }
  }
}
