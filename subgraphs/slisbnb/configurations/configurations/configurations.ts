import { log } from "@graphprotocol/graph-ts";

import { Configurations } from "./interface";
import { Deploy } from "./deploy";
import { StakedListaBnbBscConfigurations } from "../../protocols/slisbnb/config/deployments/slisbnb-bsc/configurations";

export function getNetworkConfigurations(deploy: i32): Configurations {
  switch (deploy) {
    case Deploy.STAKED_LISTA_BNB_BSC: {
      return new StakedListaBnbBscConfigurations();
    }
    default: {
      log.critical(
        "No configurations found for deployment protocol/network",
        []
      );
      return new StakedListaBnbBscConfigurations();
    }
  }
}
