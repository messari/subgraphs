import { OrbitMainnetConfigurations } from "../../protocols/orbit/config/deployments/orbit-ethereum/configurations";
// import { OrbitAvalancheConfigurations } from "../../protocols/orbit/config/deployments/orbit-avalanche/configurations";
// import { OrbitBscConfigurations } from "../../protocols/orbit/config/deployments/orbit-bsc/configurations";
// import { OrbitPolygonConfigurations } from "../../protocols/orbit/config/deployments/orbit-polygon/configurations";
// import { OrbitArbitrumConfigurations } from "../../protocols/orbit/config/deployments/orbit-arbitrum/configurations";
// import { OrbitOptimismConfigurations } from "../../protocols/orbit/config/deployments/orbit-optimism/configurations";
// import { OrbitFantomConfigurations } from "../../protocols/orbit/config/deployments/orbit-fantom/configurations";
// import { OrbitMetisConfigurations } from "../../protocols/orbit/config/deployments/orbit-metis/configurations";
import { Configurations } from "./interface";
import { Deploy } from "./deploy";
import { log } from "@graphprotocol/graph-ts";

export function getNetworkConfigurations(deploy: i32): Configurations {
  switch (deploy) {
    case Deploy.ORBIT_MAINNET: {
      return new OrbitMainnetConfigurations();
    }
    // case Deploy.ORBIT_AVALANCHE: {
    //   return new OrbitAvalancheConfigurations();
    // }
    // case Deploy.ORBIT_BSC: {
    //   return new OrbitBscConfigurations();
    // }
    // case Deploy.ORBIT_POLYGON: {
    //   return new OrbitPolygonConfigurations();
    // }
    // case Deploy.ORBIT_ARBITRUM: {
    //   return new OrbitArbitrumConfigurations();
    // }
    // case Deploy.ORBIT_OPTIMISM: {
    //   return new OrbitOptimismConfigurations();
    // }
    // case Deploy.ORBIT_FANTOM: {
    //   return new OrbitFantomConfigurations();
    // }
    // case Deploy.ORBIT_METIS: {
    //   return new OrbitMetisConfigurations();
    // }
    default: {
      log.critical(
        "No configurations found for deployment protocol/network",
        []
      );
      return new OrbitMainnetConfigurations();
    }
  }
}
