import { log } from "@graphprotocol/graph-ts";

import { Configurations } from "./interface";
import { Deploy } from "./deploy";
import { BobFusionMainnetConfigurations } from "../../protocols/bob-fusion/config/deployments/bob-fusion-ethereum/configurations";

export function getNetworkConfigurations(deploy: i32): Configurations {
  switch (deploy) {
    case Deploy.BOB_FUSION_ETHEREUM: {
      return new BobFusionMainnetConfigurations();
    }
    default: {
      log.critical(
        "No configurations found for deployment protocol/network",
        []
      );
      return new BobFusionMainnetConfigurations();
    }
  }
}
