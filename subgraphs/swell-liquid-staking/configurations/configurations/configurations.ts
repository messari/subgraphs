import { log } from "@graphprotocol/graph-ts";

import { Configurations } from "./interface";
import { Deploy } from "./deploy";
import { SwellLiquidStakingMainnetConfigurations } from "../../protocols/swell-liquid-staking/config/deployments/swell-liquid-staking-ethereum/configurations";

export function getNetworkConfigurations(deploy: i32): Configurations {
  switch (deploy) {
    case Deploy.SWELL_LIQUID_STAKING_ETHEREUM: {
      return new SwellLiquidStakingMainnetConfigurations();
    }
    default: {
      log.critical(
        "No configurations found for deployment protocol/network",
        []
      );
      return new SwellLiquidStakingMainnetConfigurations();
    }
  }
}
