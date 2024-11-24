import { log } from "@graphprotocol/graph-ts";

import { Configurations } from "./interface";
import { Deploy } from "./deploy";
import { YieldnestMainnetConfigurations } from "../../protocols/yieldnest/config/deployments/yieldnest-ethereum/configurations";
import { YieldnestBscConfigurations } from "../../protocols/yieldnest/config/deployments/yieldnest-bsc/configurations";

export function getNetworkConfigurations(deploy: i32): Configurations {
  switch (deploy) {
    case Deploy.YIELDNEST_ETHEREUM: {
      return new YieldnestMainnetConfigurations();
    }
    case Deploy.YIELDNEST_BSC: {
      return new YieldnestBscConfigurations();
    }
    default: {
      log.critical(
        "No configurations found for deployment protocol/network",
        []
      );
      return new YieldnestMainnetConfigurations();
    }
  }
}
