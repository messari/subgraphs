import { StargateMainnetConfigurations } from "../../protocols/stargate/config/deployments/stargate-ethereum/configurations";
import { StargateAvalancheConfigurations } from "../../protocols/stargate/config/deployments/stargate-avalanche/configurations";
import { StargateBscConfigurations } from "../../protocols/stargate/config/deployments/stargate-bsc/configurations";
import { StargatePolygonConfigurations } from "../../protocols/stargate/config/deployments/stargate-polygon/configurations";
import { StargateArbitrumConfigurations } from "../../protocols/stargate/config/deployments/stargate-arbitrum/configurations";
import { StargateOptimismConfigurations } from "../../protocols/stargate/config/deployments/stargate-optimism/configurations";
import { StargateFantomConfigurations } from "../../protocols/stargate/config/deployments/stargate-fantom/configurations";
import { Configurations } from "./interface";
import { Deploy } from "./deploy";
import { log } from "@graphprotocol/graph-ts";

export function getNetworkConfigurations(deploy: i32): Configurations {
  switch (deploy) {
    case Deploy.STARGATE_MAINNET: {
      return new StargateMainnetConfigurations();
    }
    case Deploy.STARGATE_AVALANCHE: {
      return new StargateAvalancheConfigurations();
    }
    case Deploy.STARGATE_BSC: {
      return new StargateBscConfigurations();
    }
    case Deploy.STARGATE_POLYGON: {
      return new StargatePolygonConfigurations();
    }
    case Deploy.STARGATE_ARBITRUM: {
      return new StargateArbitrumConfigurations();
    }
    case Deploy.STARGATE_OPTIMISM: {
      return new StargateOptimismConfigurations();
    }
    case Deploy.STARGATE_FANTOM: {
      return new StargateFantomConfigurations();
    }
    default: {
      log.critical(
        "No configurations found for deployment protocol/network",
        []
      );
      return new StargateMainnetConfigurations();
    }
  }
}
