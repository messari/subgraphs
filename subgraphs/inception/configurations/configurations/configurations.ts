import { log } from "@graphprotocol/graph-ts";

import { Configurations } from "./interface";
import { Deploy } from "./deploy";
import { InceptionMainnetConfigurations } from "../../protocols/inception/config/deployments/inception-ethereum/configurations";

export function getNetworkConfigurations(deploy: i32): Configurations {
  switch (deploy) {
    case Deploy.INCEPTION_ETHEREUM: {
      return new InceptionMainnetConfigurations();
    }
    default: {
      log.critical(
        "No configurations found for deployment protocol/network",
        []
      );
      return new InceptionMainnetConfigurations();
    }
  }
}
