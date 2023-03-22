import { Configurations } from "./interface";
import { Deploy } from "./deploy";
import { log } from "@graphprotocol/graph-ts";
import { PolygonMainnetConfigurations } from "../../protocols/polygon-bridge/config/deployments/polygon-bridge-ethereum/configurations";
import { PolygonMaticConfigurations } from "../../protocols/polygon-bridge/config/deployments/polygon-bridge-polygon/configurations";

export function getNetworkConfigurations(deploy: i32): Configurations {
  switch (deploy) {
    case Deploy.POLYGON_MAINNET: {
      return new PolygonMainnetConfigurations();
    }
    case Deploy.POLYGON_MATIC: {
      return new PolygonMaticConfigurations();
    }
    default: {
      log.critical(
        "No configurations found for deployment protocol/network",
        []
      );
      return new PolygonMainnetConfigurations();
    }
  }
}
