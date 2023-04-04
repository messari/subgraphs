import { UniswapV3ArbitrumConfigurations } from "../../protocols/uniswap-v3/config/deployments/uniswap-v3-arbitrum/configurations";
import { UniswapV3MainnetConfigurations } from "../../protocols/uniswap-v3/config/deployments/uniswap-v3-ethereum/configurations";
import { UniswapV3MaticConfigurations } from "../../protocols/uniswap-v3/config/deployments/uniswap-v3-polygon/configurations";
import { UniswapV3OptimismConfigurations } from "../../protocols/uniswap-v3/config/deployments/uniswap-v3-optimism/configurations";
import { UniswapV3CeloConfigurations } from "../../protocols/uniswap-v3/config/deployments/uniswap-v3-celo/configurations";
import { PancakeV3BSCConfigurations } from "../../protocols/pancakeswap-v3/config/deployments/pancakeswap-v3-bsc/configurations";
import { PancakeV3EthereumConfigurations } from "../../protocols/pancakeswap-v3/config/deployments/pancakeswap-v3-ethereum/configurations";
import { Configurations } from "./interface";
import { Deploy } from "./deploy";
import { log } from "@graphprotocol/graph-ts";

export function getNetworkConfigurations(deploy: i32): Configurations {
  switch (deploy) {
    case Deploy.UNISWAP_V3_ARBITRUM: {
      return new UniswapV3ArbitrumConfigurations();
    }
    case Deploy.UNISWAP_V3_ETHEREUM: {
      return new UniswapV3MainnetConfigurations();
    }
    case Deploy.UNISWAP_V3_POLYGON: {
      return new UniswapV3MaticConfigurations();
    }
    case Deploy.UNISWAP_V3_OPTIMISM: {
      return new UniswapV3OptimismConfigurations();
    }
    case Deploy.UNISWAP_V3_CELO: {
      return new UniswapV3CeloConfigurations();
    }
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
      return new UniswapV3OptimismConfigurations();
    }
  }
}
