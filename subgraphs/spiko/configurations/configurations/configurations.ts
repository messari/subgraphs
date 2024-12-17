import { log } from "@graphprotocol/graph-ts";

import { Configurations } from "./interface";
import { Deploy } from "./deploy";
import { SpikoEthereumConfigurations } from "../../protocols/spiko/config/deployments/spiko-ethereum/configurations";
import { SpikoPolygonConfigurations } from "../../protocols/spiko/config/deployments/spiko-polygon/configurations";

export function getNetworkConfigurations(deploy: i32): Configurations {
  switch (deploy) {
    case Deploy.SPIKO_ETHEREUM: {
      return new SpikoEthereumConfigurations();
    }
    case Deploy.SPIKO_POLYGON: {
      return new SpikoPolygonConfigurations();
    }
    default: {
      log.critical(
        "No configurations found for deployment protocol/network",
        []
      );
      return new SpikoEthereumConfigurations();
    }
  }
}
