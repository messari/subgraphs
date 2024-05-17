import { log } from "@graphprotocol/graph-ts";

import { Configurations } from "./interface";
import { Deploy } from "./deploy";
import { MantleStakedEthConfigurations } from "../../protocols/mantle-staked-eth/config/deployments/configurations";

export function getNetworkConfigurations(deploy: i32): Configurations {
  switch (deploy) {
    case Deploy.MANTLE_STAKED_ETH_ETHEREUM: {
      return new MantleStakedEthConfigurations();
    }
    default: {
      log.critical(
        "No configurations found for deployment protocol/network",
        []
      );
      return new MantleStakedEthConfigurations();
    }
  }
}
