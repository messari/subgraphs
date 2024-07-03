import { log } from "@graphprotocol/graph-ts";

import { Configurations } from "./interface";
import { Deploy } from "./deploy";
import { FraxEtherStakingMainnetConfigurations } from "../../protocols/frax-ether-staking/config/deployments/frax-ether-staking-ethereum/configurations";
import { FraxEtherStakingArbitrumConfigurations } from "../../protocols/frax-ether-staking/config/deployments/frax-ether-staking-arbitrum/configurations";
import { FraxEtherStakingBscConfigurations } from "../../protocols/frax-ether-staking/config/deployments/frax-ether-staking-bsc/configurations";
import { FraxEtherStakingFantomConfigurations } from "../../protocols/frax-ether-staking/config/deployments/frax-ether-staking-fantom/configurations";
import { FraxEtherStakingMoonbeamConfigurations } from "../../protocols/frax-ether-staking/config/deployments/frax-ether-staking-moonbeam/configurations";
import { FraxEtherStakingOptimismConfigurations } from "../../protocols/frax-ether-staking/config/deployments/frax-ether-staking-optimism/configurations";
import { FraxEtherStakingPolygonConfigurations } from "../../protocols/frax-ether-staking/config/deployments/frax-ether-staking-polygon/configurations";

export function getNetworkConfigurations(deploy: i32): Configurations {
  switch (deploy) {
    case Deploy.FRAX_ETHER_STAKING_ETHEREUM: {
      return new FraxEtherStakingMainnetConfigurations();
    }
    case Deploy.FRAX_ETHER_STAKING_ARBITRUM: {
      return new FraxEtherStakingArbitrumConfigurations();
    }
    case Deploy.FRAX_ETHER_STAKING_BSC: {
      return new FraxEtherStakingBscConfigurations();
    }
    case Deploy.FRAX_ETHER_STAKING_FANTOM: {
      return new FraxEtherStakingFantomConfigurations();
    }
    case Deploy.FRAX_ETHER_STAKING_MOONBEAM: {
      return new FraxEtherStakingMoonbeamConfigurations();
    }
    case Deploy.FRAX_ETHER_STAKING_OPTIMISM: {
      return new FraxEtherStakingOptimismConfigurations();
    }
    case Deploy.FRAX_ETHER_STAKING_POLYGON: {
      return new FraxEtherStakingPolygonConfigurations();
    }
    default: {
      log.critical(
        "No configurations found for deployment protocol/network",
        []
      );
      return new FraxEtherStakingMainnetConfigurations();
    }
  }
}
