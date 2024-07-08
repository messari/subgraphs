import { log } from "@graphprotocol/graph-ts";

import { Configurations } from "./interface";
import { Deploy } from "./deploy";
import { SymbioticMainnetConfigurations } from "../../protocols/symbiotic/config/deployments/symbiotic-ethereum/configurations";

export function getNetworkConfigurations(deploy: i32): Configurations {
  switch (deploy) {
    case Deploy.SYMBIOTIC_ETHEREUM: {
      return new SymbioticMainnetConfigurations();
    }
    default: {
      log.critical(
        "No configurations found for deployment protocol/network",
        []
      );
      return new SymbioticMainnetConfigurations();
    }
  }
}
