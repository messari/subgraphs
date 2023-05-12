import { OrbitMainnetConfigurations } from "../../protocols/orbit/config/deployments/orbit-ethereum/configurations";
import { OrbitKlaytnConfigurations } from "../../protocols/orbit/config/deployments/orbit-klaytn/configurations";
import { OrbitBscConfigurations } from "../../protocols/orbit/config/deployments/orbit-bsc/configurations";
import { OrbitMaticConfigurations } from "../../protocols/orbit/config/deployments/orbit-polygon/configurations";
import { OrbitCeloConfigurations } from "../../protocols/orbit/config/deployments/orbit-celo/configurations";
import { OrbitHecoConfigurations } from "../../protocols/orbit/config/deployments/orbit-heco/configurations";
import { Configurations } from "./interface";
import { Deploy } from "./deploy";
import { log } from "@graphprotocol/graph-ts";

export function getNetworkConfigurations(deploy: i32): Configurations {
  switch (deploy) {
    case Deploy.ORBIT_MAINNET: {
      return new OrbitMainnetConfigurations();
    }
    case Deploy.ORBIT_BSC: {
      return new OrbitBscConfigurations();
    }
    case Deploy.ORBIT_POLYGON: {
      return new OrbitMaticConfigurations();
    }
    case Deploy.ORBIT_KLAYTN: {
      return new OrbitKlaytnConfigurations();
    }
    case Deploy.ORBIT_HECO: {
      return new OrbitHecoConfigurations();
    }
    case Deploy.ORBIT_CELO: {
      return new OrbitCeloConfigurations();
    }
    default: {
      log.critical(
        "No configurations found for deployment protocol/network",
        []
      );
      return new OrbitMainnetConfigurations();
    }
  }
}
