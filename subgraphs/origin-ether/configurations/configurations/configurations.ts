import { log } from "@graphprotocol/graph-ts";

import { Configurations } from "./interface";
import { Deploy } from "./deploy";
import { OriginEtherMainnetConfigurations } from "../../protocols/origin-ether/config/deployments/origin-ether-ethereum/configurations";

export function getNetworkConfigurations(deploy: i32): Configurations {
  switch (deploy) {
    case Deploy.ORIGIN_ETHER_ETHEREUM: {
      return new OriginEtherMainnetConfigurations();
    }
    default: {
      log.critical(
        "No configurations found for deployment protocol/network",
        []
      );
      return new OriginEtherMainnetConfigurations();
    }
  }
}
