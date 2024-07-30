import { log } from "@graphprotocol/graph-ts";

import { Configurations } from "./interface";
import { Deploy } from "./deploy";
import { ChainlinkStakingMainnetConfigurations } from "../../protocols/chainlink-staking/config/deployments/chainlink-staking-ethereum/configurations";

export function getNetworkConfigurations(deploy: i32): Configurations {
  switch (deploy) {
    case Deploy.CHAINLINK_STAKING_ETHEREUM: {
      return new ChainlinkStakingMainnetConfigurations();
    }
    default: {
      log.critical(
        "No configurations found for deployment protocol/network",
        []
      );
      return new ChainlinkStakingMainnetConfigurations();
    }
  }
}
