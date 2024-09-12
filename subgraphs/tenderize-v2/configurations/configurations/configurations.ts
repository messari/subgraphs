import { log } from "@graphprotocol/graph-ts";

import { Configurations } from "./interface";
import { Deploy } from "./deploy";
import { TenderizeV2MainnetConfigurations } from "../../protocols/tenderize-v2/config/deployments/tenderize-v2-ethereum/configurations";
import { TenderizeV2ArbitrumConfigurations } from "../../protocols/tenderize-v2/config/deployments/tenderize-v2-arbitrum/configurations";

export function getNetworkConfigurations(deploy: i32): Configurations {
  switch (deploy) {
    case Deploy.TENDERIZE_V2_ETHEREUM: {
      return new TenderizeV2MainnetConfigurations();
    }
    case Deploy.TENDERIZE_V2_ARBITRUM: {
      return new TenderizeV2ArbitrumConfigurations();
    }
    default: {
      log.critical(
        "No configurations found for deployment protocol/network",
        []
      );
      return new TenderizeV2MainnetConfigurations();
    }
  }
}
