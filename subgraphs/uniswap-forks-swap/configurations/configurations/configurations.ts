import { log } from "@graphprotocol/graph-ts";

import { Configurations } from "./interface";
import { Deploy } from "./deploy";

import { UniswapV2MainnetConfigurations } from "../../protocols/uniswap-v2-swap/config/deployments/uniswap-v2-swap-ethereum/configurations";
import { QuickswapMaticConfigurations } from "../../protocols/quickswap-swap/config/deployments/quickswap-swap-polygon/configurations";
import { PancakeswapV2BscConfigurations } from "../../protocols/pancakeswap-v2-swap/config/deployments/pancakeswap-v2-swap-bsc/configurations";
import { BaseswapBaseConfigurations } from "../../protocols/baseswap-swap/config/deployments/baseswap-swap-base/configurations";

// This function is called to load in the proper configurations for a protocol/network deployment.
// To add a new deployment, add a value to the `Deploy` namespace and add a new configuration class to the network specific typescript file in the `protocols` folder.
// Finally, add a new entry for this deployment to the getNetworkConfigurations() function
export function getNetworkConfigurations(deploy: i32): Configurations {
  switch (deploy) {
    case Deploy.UNISWAP_V2_ETHEREUM: {
      return new UniswapV2MainnetConfigurations();
    }
    case Deploy.QUICKSWAP_POLYGON: {
      return new QuickswapMaticConfigurations();
    }
    case Deploy.PANCAKESWAP_V2_BSC: {
      return new PancakeswapV2BscConfigurations();
    }
    case Deploy.BASESWAP_BASE: {
      return new BaseswapBaseConfigurations();
    }
    default: {
      log.critical(
        "No configurations found for deployment protocol/network",
        []
      );
      return new UniswapV2MainnetConfigurations();
    }
  }
}
