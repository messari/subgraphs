import { log } from "@graphprotocol/graph-ts";

import { Configurations } from "./interface";
import { Deploy } from "./deploy";
import { BlackwingMainnetConfigurations } from "../../protocols/blackwing/config/deployments/blackwing-ethereum/configurations";
import { BlackwingArbitrumConfigurations } from "../../protocols/blackwing/config/deployments/blackwing-arbitrum/configurations";
import { BlackwingBscConfigurations } from "../../protocols/blackwing/config/deployments/blackwing-bsc/configurations";

export function getNetworkConfigurations(deploy: i32): Configurations {
  switch (deploy) {
    case Deploy.BLACKWING_ETHEREUM: {
      return new BlackwingMainnetConfigurations();
    }
    case Deploy.BLACKWING_ARBITRUM: {
      return new BlackwingArbitrumConfigurations();
    }
    case Deploy.BLACKWING_BSC: {
      return new BlackwingBscConfigurations();
    }
    default: {
      log.critical(
        "No configurations found for deployment protocol/network",
        []
      );
      return new BlackwingMainnetConfigurations();
    }
  }
}
