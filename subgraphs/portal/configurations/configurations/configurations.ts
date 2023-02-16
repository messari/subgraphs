import { PortalMainnetConfigurations } from "../../protocols/portal/config/deployments/portal-ethereum/configurations";
import { PortalFantomConfigurations } from "../../protocols/portal/config/deployments/portal-fantom/configurations";
import { PortalBscConfigurations } from "../../protocols/portal/config/deployments/portal-bsc/configurations";
import { PortalPolygonConfigurations } from "../../protocols/portal/config/deployments/portal-polygon/configurations";
import { PortalAvalancheConfigurations } from "../../protocols/portal/config/deployments/portal-avalanche/configurations";
import { Configurations } from "./interface";
import { Deploy } from "./deploy";
import { log } from "@graphprotocol/graph-ts";

export function getNetworkConfigurations(deploy: i32): Configurations {
  switch (deploy) {
    case Deploy.PORTAL_MAINNET: {
      return new PortalMainnetConfigurations();
    }
    case Deploy.PORTAL_FANTOM: {
      return new PortalFantomConfigurations();
    }
    case Deploy.PORTAL_BSC: {
      return new PortalBscConfigurations();
    }
    case Deploy.PORTAL_POLYGON: {
      return new PortalPolygonConfigurations();
    }
    case Deploy.PORTAL_AVALANCHE: {
      return new PortalAvalancheConfigurations();
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
