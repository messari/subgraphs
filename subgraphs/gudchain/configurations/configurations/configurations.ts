import { log } from "@graphprotocol/graph-ts";

import { Configurations } from "./interface";
import { Deploy } from "./deploy";
import { GudchainMainnetConfigurations } from "../../protocols/gudchain/config/deployments/gudchain-ethereum/configurations";

export function getNetworkConfigurations(deploy: i32): Configurations {
  switch (deploy) {
    case Deploy.GUDCHAIN_ETHEREUM: {
      return new GudchainMainnetConfigurations();
    }
    default: {
      log.critical(
        "No configurations found for deployment protocol/network",
        []
      );
      return new GudchainMainnetConfigurations();
    }
  }
}
