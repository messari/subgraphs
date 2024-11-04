import { log } from "@graphprotocol/graph-ts";

import { Configurations } from "./interface";
import { Deploy } from "./deploy";
import { AnzenV2MainnetConfigurations } from "../../protocols/anzen-v2/config/deployments/anzen-v2-ethereum/configurations";
import { AnzenV2BaseConfigurations } from "../../protocols/anzen-v2/config/deployments/anzen-v2-base/configurations";
import { AnzenV2ArbitrumConfigurations } from "../../protocols/anzen-v2/config/deployments/anzen-v2-arbitrum/configurations";
import { AnzenV2BlastConfigurations } from "../../protocols/anzen-v2/config/deployments/anzen-v2-blast/configurations";

export function getNetworkConfigurations(deploy: i32): Configurations {
  switch (deploy) {
    case Deploy.ANZEN_V2_ETHEREUM: {
      return new AnzenV2MainnetConfigurations();
    }
    case Deploy.ANZEN_V2_BASE: {
      return new AnzenV2BaseConfigurations();
    }
    case Deploy.ANZEN_V2_ARBITRUM: {
      return new AnzenV2ArbitrumConfigurations();
    }
    case Deploy.ANZEN_V2_BLAST: {
      return new AnzenV2BlastConfigurations();
    }
    default: {
      log.critical(
        "No configurations found for deployment protocol/network",
        []
      );
      return new AnzenV2MainnetConfigurations();
    }
  }
}
