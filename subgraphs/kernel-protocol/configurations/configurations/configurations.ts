import { log } from "@graphprotocol/graph-ts";

import { Configurations } from "./interface";
import { Deploy } from "./deploy";
import { KernelProtocolMainnetConfigurations } from "../../protocols/kernel-protocol/config/deployments/kernel-protocol-ethereum/configurations";

export function getNetworkConfigurations(deploy: i32): Configurations {
  switch (deploy) {
    case Deploy.KERNEL_PROTOCOL_ETHEREUM: {
      return new KernelProtocolMainnetConfigurations();
    }
    default: {
      log.critical(
        "No configurations found for deployment protocol/network",
        []
      );
      return new KernelProtocolMainnetConfigurations();
    }
  }
}
