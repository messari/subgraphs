import { log } from "@graphprotocol/graph-ts";

import { Configurations } from "./interface";
import { Deploy } from "./deploy";
import { OraProtocolMainnetConfigurations } from "../../protocols/ora-protocol/config/deployments/ora-protocol-ethereum/configurations";

export function getNetworkConfigurations(deploy: i32): Configurations {
  switch (deploy) {
    case Deploy.ORA_PROTOCOL_ETHEREUM: {
      return new OraProtocolMainnetConfigurations();
    }
    default: {
      log.critical(
        "No configurations found for deployment protocol/network",
        []
      );
      return new OraProtocolMainnetConfigurations();
    }
  }
}
