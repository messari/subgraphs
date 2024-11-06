import { log } from "@graphprotocol/graph-ts";

import { Configurations } from "./interface";
import { Deploy } from "./deploy";
import { StakewiseV2EthereumConfigurations } from "../../protocols/stakewise-v2/config/deployments/stakewise-v2-ethereum/configurations";
import { StakewiseV2GnosisConfigurations } from "../../protocols/stakewise-v2/config/deployments/stakewise-v2-gnosis/configurations";

export function getNetworkConfigurations(deploy: i32): Configurations {
  switch (deploy) {
    case Deploy.STAKEWISE_V2_ETHEREUM: {
      return new StakewiseV2EthereumConfigurations();
    }
    case Deploy.STAKEWISE_V2_GNOSIS: {
      return new StakewiseV2GnosisConfigurations();
    }
    default: {
      log.critical(
        "No configurations found for deployment protocol/network",
        []
      );
      return new StakewiseV2EthereumConfigurations();
    }
  }
}
