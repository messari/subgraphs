import { KwentaOptimismConfigurations } from "../../protocols/kwenta/config/deployments/kwenta-optimism/configurations";
import { Configurations } from "./interface";
import { Deploy } from "./deploy";
import { log } from "@graphprotocol/graph-ts";

export function getNetworkConfigurations(deploy: i32): Configurations {
  switch (deploy) {
    case Deploy.KWENTA_OPTIMISM: {
      return new KwentaOptimismConfigurations();
    }
    default: {
      log.critical(
        "No configurations found for deployment protocol/network",
        []
      );
      return new KwentaOptimismConfigurations();
    }
  }
}
