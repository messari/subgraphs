import { log } from "@graphprotocol/graph-ts";

import { Configurations } from "./interface";
import { Deploy } from "./deploy";

import { PancakeV3BSCConfigurations } from "../../protocols/pancakeswap-v3-swap/config/deployments/pancakeswap-v3-swap-bsc/configurations";
import { PancakeV3EthereumConfigurations } from "../../protocols/pancakeswap-v3-swap/config/deployments/pancakeswap-v3-swap-ethereum/configurations";

export function getNetworkConfigurations(deploy: i32): Configurations {
  switch (deploy) {
    case Deploy.PANCAKE_V3_BSC: {
      return new PancakeV3BSCConfigurations();
    }
    case Deploy.PANCAKE_V3_ETHEREUM: {
      return new PancakeV3EthereumConfigurations();
    }
    default: {
      log.critical(
        "No configurations found for deployment protocol/network",
        []
      );
      return new PancakeV3BSCConfigurations();
    }
  }
}
