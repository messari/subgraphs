import { PortalMainnetConfigurations } from "../../protocols/portal/config/deployments/portal-ethereum/configurations";
import { Configurations } from "./interface";
import { Deploy } from "./deploy";
import { log } from "@graphprotocol/graph-ts";

export function getNetworkConfigurations(deploy: i32): Configurations {
  switch (deploy) {
    case Deploy.PORTAL_MAINNET: {
      return new PortalMainnetConfigurations();
    }
    default: {
      log.critical(
        "No configurations found for deployment protocol/network",
        []
      );
      return new PortalMainnetConfigurations();
    }
  }
}
