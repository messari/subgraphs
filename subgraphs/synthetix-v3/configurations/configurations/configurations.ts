import { log } from "@graphprotocol/graph-ts";

import { Configurations } from "./interface";
import { Deploy } from "./deploy";
import { SynthetixV3MainnetConfigurations } from "../../protocols/synthetix-v3/config/deployments/synthetix-v3-ethereum/configurations";
import { SynthetixV3ArbitrumConfigurations } from "../../protocols/synthetix-v3/config/deployments/synthetix-v3-arbitrum/configurations";
import { SynthetixV3BaseConfigurations } from "../../protocols/synthetix-v3/config/deployments/synthetix-v3-base/configurations";
import { SynthetixV3OptimismConfigurations } from "../../protocols/synthetix-v3/config/deployments/synthetix-v3-optimism/configurations";

export function getNetworkConfigurations(deploy: i32): Configurations {
  switch (deploy) {
    case Deploy.SYNTHETIX_V3_MAINNET: {
      return new SynthetixV3MainnetConfigurations();
    }
    case Deploy.SYNTHETIX_V3_ARBITRUM: {
      return new SynthetixV3ArbitrumConfigurations();
    }
    case Deploy.SYNTHETIX_V3_BASE: {
      return new SynthetixV3BaseConfigurations();
    }
    case Deploy.SYNTHETIX_V3_OPTIMISM: {
      return new SynthetixV3OptimismConfigurations();
    }
    default: {
      log.critical(
        "No configurations found for deployment protocol/network",
        []
      );
      return new SynthetixV3MainnetConfigurations();
    }
  }
}
