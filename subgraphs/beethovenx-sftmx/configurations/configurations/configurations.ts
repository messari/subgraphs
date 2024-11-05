import { log } from "@graphprotocol/graph-ts";

import { Configurations } from "./interface";
import { Deploy } from "./deploy";
import { SFTMXFANTOMConfigurations } from "../../protocols/beethovenx-sftmx/config/deployments/beethovenx-sftmx-fantom/configurations";

export function getNetworkConfigurations(deploy: i32): Configurations {
  switch (deploy) {
    case Deploy.SFTMX_FANTOM: {
      return new SFTMXFANTOMConfigurations();
    }
    default: {
      log.critical(
        "No configurations found for deployment protocol/network",
        []
      );
      return new SFTMXFANTOMConfigurations();
    }
  }
}
