import { log } from "@graphprotocol/graph-ts";

import { Configurations } from "./interface";
import { Deploy } from "./deploy";
import { KilmaDAOPolygonConfigurations } from "../../protocols/klimadao/config/deployments/klimadao-polygon/configurations";

export function getNetworkConfigurations(deploy: i32): Configurations {
  switch (deploy) {
    case Deploy.KLIMADAO_POLYGON: {
      return new KilmaDAOPolygonConfigurations();
    }
    default: {
      log.critical(
        "No configurations found for deployment protocol/network",
        []
      );
      return new KilmaDAOPolygonConfigurations();
    }
  }
}
