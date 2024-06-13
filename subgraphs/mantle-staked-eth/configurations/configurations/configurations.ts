import { log } from "@graphprotocol/graph-ts";

import { Configurations } from "./interface";
import { Deploy } from "./deploy";
import { MantleStakedEthMainnetConfigurations } from "../../protocols/mantle-staked-eth/config/deployments/mantle-staked-eth-ethereum/configurations";

export function getNetworkConfigurations(deploy: i32): Configurations {
  switch (deploy) {
    case Deploy.MANTLE_STAKED_ETH_ETHEREUM: {
      return new MantleStakedEthMainnetConfigurations();
    }
    default: {
      log.critical(
        "No configurations found for deployment protocol/network",
        []
      );
      return new MantleStakedEthMainnetConfigurations();
    }
  }
}
