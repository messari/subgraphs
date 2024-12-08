import { log } from "@graphprotocol/graph-ts";

import { Configurations } from "./interface";
import { Deploy } from "./deploy";
import { MountainProtocolEthereumConfigurations } from "../../protocols/mountain-protocol/config/deployments/mountain-protocol-ethereum/configurations";
import { MountainProtocolArbitrumConfigurations } from "../../protocols/mountain-protocol/config/deployments/mountain-protocol-arbitrum/configurations";
import { MountainProtocolBaseConfigurations } from "../../protocols/mountain-protocol/config/deployments/mountain-protocol-base/configurations";
import { MountainProtocolOptimismConfigurations } from "../../protocols/mountain-protocol/config/deployments/mountain-protocol-optimism/configurations";
import { MountainProtocolPolygonConfigurations } from "../../protocols/mountain-protocol/config/deployments/mountain-protocol-polygon/configurations";

export function getNetworkConfigurations(deploy: i32): Configurations {
  switch (deploy) {
    case Deploy.MOUNTAIN_PROTOCOL_ETHEREUM: {
      return new MountainProtocolEthereumConfigurations();
    }
    case Deploy.MOUNTAIN_PROTOCOL_ARBITRUM: {
      return new MountainProtocolArbitrumConfigurations();
    }
    case Deploy.MOUNTAIN_PROTOCOL_BASE: {
      return new MountainProtocolBaseConfigurations();
    }
    case Deploy.MOUNTAIN_PROTOCOL_OPTIMISM: {
      return new MountainProtocolOptimismConfigurations();
    }
    case Deploy.MOUNTAIN_PROTOCOL_POLYGON: {
      return new MountainProtocolPolygonConfigurations();
    }
    default: {
      log.critical(
        "No configurations found for deployment protocol/network",
        []
      );
      return new MountainProtocolEthereumConfigurations();
    }
  }
}
