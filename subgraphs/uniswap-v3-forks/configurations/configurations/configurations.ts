import { UniswapV3ArbitrumConfigurations } from "../../protocols/uniswap-v3/config/deployments/uniswap-v3-arbitrum/configurations";
import { UniswapV3MainnetConfigurations } from "../../protocols/uniswap-v3/config/deployments/uniswap-v3-ethereum/configurations";
import { UniswapV3MaticConfigurations } from "../../protocols/uniswap-v3/config/deployments/uniswap-v3-polygon/configurations";
import { UniswapV3OptimismConfigurations } from "../../protocols/uniswap-v3/config/deployments/uniswap-v3-optimism/configurations";
import { UniswapV3CeloConfigurations } from "../../protocols/uniswap-v3/config/deployments/uniswap-v3-celo/configurations";
import { UniswapV3BSCConfigurations } from "../../protocols/uniswap-v3/config/deployments/uniswap-v3-bsc/configurations";
import { PancakeV3BSCConfigurations } from "../../protocols/pancakeswap-v3/config/deployments/pancakeswap-v3-bsc/configurations";
import { PancakeV3EthereumConfigurations } from "../../protocols/pancakeswap-v3/config/deployments/pancakeswap-v3-ethereum/configurations";
import { NftxV3MainnetConfigurations } from "../../protocols/nftx-v3/config/deployments/nftx-v3-ethereum/configurations";
import { NftxV3GoerliConfigurations } from "../../protocols/nftx-v3/config/deployments/nftx-v3-goerli/configurations";
import { NftxV3ArbitrumConfigurations } from "../../protocols/nftx-v3/config/deployments/nftx-v3-arbitrum/configurations";
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
    case Deploy.UNISWAP_V3_BSC: {
      return new UniswapV3BSCConfigurations();
    }
    case Deploy.PANCAKE_V3_BSC: {
      return new PancakeV3BSCConfigurations();
    }
    case Deploy.PANCAKE_V3_ETHEREUM: {
      return new PancakeV3EthereumConfigurations();
    }
    case Deploy.NFTX_V3_GOERLI: {
      return new NftxV3GoerliConfigurations();
    }
    case Deploy.NFTX_V3_MAINNET: {
      return new NftxV3MainnetConfigurations();
    }
    case Deploy.NFTX_V3_ARBITRUM: {
      return new NftxV3ArbitrumConfigurations();
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
