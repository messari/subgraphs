import { log } from "@graphprotocol/graph-ts";

import { Configurations } from "./interface";
import { Deploy } from "./deploy";
import { TestProtocolMainnetConfigurations } from "../../protocols/test-protocol/config/deployments/test-protocol-ethereum/configurations";
import { TestProtocolAvalancheConfigurations } from "../../protocols/test-protocol/config/deployments/test-protocol-avalanche/configurations";

export function getNetworkConfigurations(deploy: i32): Configurations {
  switch (deploy) {
    case Deploy.TEST_PROTOCOL_ETHEREUM: {
      return new TestProtocolMainnetConfigurations();
    }
    case Deploy.TEST_PROTOCOL_AVALANCHE: {
      return new TestProtocolAvalancheConfigurations();
    }
    default: {
      log.critical(
        "No configurations found for deployment protocol/network",
        []
      );
      return new TestProtocolMainnetConfigurations();
    }
  }
}
