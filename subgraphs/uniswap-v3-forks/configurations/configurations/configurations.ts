import { UniswapV3ArbitrumConfigurations } from "../../protocols/uniswap-v3/config/deployments/uniswap-v3-arbitrum/configurations";
import { UniswapV3BaseConfigurations } from "../../protocols/uniswap-v3/config/deployments/uniswap-v3-base/configurations";
import { UniswapV3MainnetConfigurations } from "../../protocols/uniswap-v3/config/deployments/uniswap-v3-ethereum/configurations";
import { UniswapV3MaticConfigurations } from "../../protocols/uniswap-v3/config/deployments/uniswap-v3-polygon/configurations";
import { UniswapV3OptimismConfigurations } from "../../protocols/uniswap-v3/config/deployments/uniswap-v3-optimism/configurations";
import { UniswapV3CeloConfigurations } from "../../protocols/uniswap-v3/config/deployments/uniswap-v3-celo/configurations";
import { UniswapV3BSCConfigurations } from "../../protocols/uniswap-v3/config/deployments/uniswap-v3-bsc/configurations";
import { PancakeV3BSCConfigurations } from "../../protocols/pancakeswap-v3/config/deployments/pancakeswap-v3-bsc/configurations";
import { PancakeV3EthereumConfigurations } from "../../protocols/pancakeswap-v3/config/deployments/pancakeswap-v3-ethereum/configurations";
import { SushiswapV3EthereumConfigurations } from "../../protocols/sushiswap-v3/config/deployments/sushiswap-v3-ethereum/configurations";
import { SushiswapV3ArbitrumConfigurations } from "../../protocols/sushiswap-v3/config/deployments/sushiswap-v3-arbitrum/configurations";
import { SushiswapV3AvalancheConfigurations } from "../../protocols/sushiswap-v3/config/deployments/sushiswap-v3-avalanche/configurations";
import { SushiswapV3BscConfigurations } from "../../protocols/sushiswap-v3/config/deployments/sushiswap-v3-bsc/configurations";
import { SushiswapV3FantomConfigurations } from "../../protocols/sushiswap-v3/config/deployments/sushiswap-v3-fantom/configurations";
import { SushiswapV3FuseConfigurations } from "../../protocols/sushiswap-v3/config/deployments/sushiswap-v3-fuse/configurations";
import { SushiswapV3GnosisConfigurations } from "../../protocols/sushiswap-v3/config/deployments/sushiswap-v3-gnosis/configurations";
import { SushiswapV3MoonriverConfigurations } from "../../protocols/sushiswap-v3/config/deployments/sushiswap-v3-moonriver/configurations";
import { SushiswapV3OptimismConfigurations } from "../../protocols/sushiswap-v3/config/deployments/sushiswap-v3-optimism/configurations";
import { SushiswapV3PolygonConfigurations } from "../../protocols/sushiswap-v3/config/deployments/sushiswap-v3-polygon/configurations";
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
    case Deploy.UNISWAP_V3_BASE: {
      return new UniswapV3BaseConfigurations();
    }
    case Deploy.PANCAKE_V3_BSC: {
      return new PancakeV3BSCConfigurations();
    }
    case Deploy.PANCAKE_V3_ETHEREUM: {
      return new PancakeV3EthereumConfigurations();
    }
    case Deploy.SUSHISWAP_V3_ETHEREUM: {
      return new SushiswapV3EthereumConfigurations();
    }
    case Deploy.SUSHISWAP_V3_ARBITRUM: {
      return new SushiswapV3ArbitrumConfigurations();
    }
    case Deploy.SUSHISWAP_V3_AVALANCHE: {
      return new SushiswapV3AvalancheConfigurations();
    }
    case Deploy.SUSHISWAP_V3_BSC: {
      return new SushiswapV3BscConfigurations();
    }
    case Deploy.SUSHISWAP_V3_FANTOM: {
      return new SushiswapV3FantomConfigurations();
    }
    case Deploy.SUSHISWAP_V3_FUSE: {
      return new SushiswapV3FuseConfigurations();
    }
    case Deploy.SUSHISWAP_V3_GNOSIS: {
      return new SushiswapV3GnosisConfigurations();
    }
    case Deploy.SUSHISWAP_V3_MOONRIVER: {
      return new SushiswapV3MoonriverConfigurations();
    }
    case Deploy.SUSHISWAP_V3_OPTIMISM: {
      return new SushiswapV3OptimismConfigurations();
    }
    case Deploy.SUSHISWAP_V3_POLYGON: {
      return new SushiswapV3PolygonConfigurations();
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
