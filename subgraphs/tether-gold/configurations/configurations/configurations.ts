import { log } from "@graphprotocol/graph-ts";

import { Configurations } from "./interface";
import { Deploy } from "./deploy";
import { TetherGoldMainnetConfigurations } from "../../protocols/tether-gold/config/deployments/tether-gold-ethereum/configurations";

export function getNetworkConfigurations(deploy: i32): Configurations {
  switch (deploy) {
    case Deploy.TETHER_GOLD_ETHEREUM: {
      return new TetherGoldMainnetConfigurations();
    }
    default: {
      log.critical(
        "No configurations found for deployment protocol/network",
        []
      );
      return new TetherGoldMainnetConfigurations();
    }
  }
}
