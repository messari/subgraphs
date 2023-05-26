import { log } from "@graphprotocol/graph-ts";

import { Configurations } from "./interface";
import { Deploy } from "./deploy";

import { MultichainMainnetConfigurations } from "../../protocols/multichain/config/deployments/multichain-ethereum/configurations";
import { MultichainArbitrumConfigurations } from "../../protocols/multichain/config/deployments/multichain-arbitrum/configurations";
import { MultichainAvalancheConfigurations } from "../../protocols/multichain/config/deployments/multichain-avalanche/configurations";
import { MultichainBscConfigurations } from "../../protocols/multichain/config/deployments/multichain-bsc/configurations";
import { MultichainCeloConfigurations } from "../../protocols/multichain/config/deployments/multichain-celo/configurations";
import { MultichainFantomConfigurations } from "../../protocols/multichain/config/deployments/multichain-fantom/configurations";
import { MultichainGnosisConfigurations } from "../../protocols/multichain/config/deployments/multichain-gnosis/configurations";
import { MultichainOptimismConfigurations } from "../../protocols/multichain/config/deployments/multichain-optimism/configurations";
import { MultichainPolygonConfigurations } from "../../protocols/multichain/config/deployments/multichain-polygon/configurations";

export function getNetworkConfigurations(deploy: i32): Configurations {
  switch (deploy) {
    case Deploy.MULTICHAIN_MAINNET: {
      return new MultichainMainnetConfigurations();
    }
    case Deploy.MULTICHAIN_ARBITRUM: {
      return new MultichainArbitrumConfigurations();
    }
    case Deploy.MULTICHAIN_AVALANCHE: {
      return new MultichainAvalancheConfigurations();
    }
    case Deploy.MULTICHAIN_BSC: {
      return new MultichainBscConfigurations();
    }
    case Deploy.MULTICHAIN_CELO: {
      return new MultichainCeloConfigurations();
    }
    case Deploy.MULTICHAIN_FANTOM: {
      return new MultichainFantomConfigurations();
    }
    case Deploy.MULTICHAIN_GNOSIS: {
      return new MultichainGnosisConfigurations();
    }
    case Deploy.MULTICHAIN_OPTIMISM: {
      return new MultichainOptimismConfigurations();
    }
    case Deploy.MULTICHAIN_POLYGON: {
      return new MultichainPolygonConfigurations();
    }
    default: {
      log.critical(
        "No configurations found for deployment protocol/network",
        []
      );
      return new MultichainMainnetConfigurations();
    }
  }
}
