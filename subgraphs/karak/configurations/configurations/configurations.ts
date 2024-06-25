import { log } from "@graphprotocol/graph-ts";

import { Configurations } from "./interface";
import { Deploy } from "./deploy";
import { KarakMainnetConfigurations } from "../../protocols/karak/config/deployments/karak-ethereum/configurations";
import { KarakArbitrumConfigurations } from "../../protocols/karak/config/deployments/karak-arbitrum/configurations";
import { KarakBscConfigurations } from "../../protocols/karak/config/deployments/karak-bsc/configurations";

export function getNetworkConfigurations(deploy: i32): Configurations {
  switch (deploy) {
    case Deploy.KARAK_ETHEREUM: {
      return new KarakMainnetConfigurations();
    }
    case Deploy.KARAK_ARBITRUM: {
      return new KarakArbitrumConfigurations();
    }
    case Deploy.KARAK_BSC: {
      return new KarakBscConfigurations();
    }
    default: {
      log.critical(
        "No configurations found for deployment protocol/network",
        []
      );
      return new KarakMainnetConfigurations();
    }
  }
}
