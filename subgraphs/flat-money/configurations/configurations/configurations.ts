import { log } from "@graphprotocol/graph-ts";

import { Configurations } from "./interface";
import { Deploy } from "./deploy";
import { FlatMoneyBaseConfigurations } from "../../protocols/flat-money/config/deployments/flat-money-base/configurations";

export function getNetworkConfigurations(deploy: i32): Configurations {
  switch (deploy) {
    case Deploy.FLAT_MONEY_BASE: {
      return new FlatMoneyBaseConfigurations();
    }
    default: {
      log.critical(
        "No configurations found for deployment protocol/network",
        []
      );
      return new FlatMoneyBaseConfigurations();
    }
  }
}
