import { log } from "@graphprotocol/graph-ts";

import { Configurations } from "./interface";
import { Deploy } from "./deploy";
import { BinanceStakedEthMainnetConfigurations } from "../../protocols/binance-staked-eth/config/deployments/binance-staked-eth-ethereum/configurations";
import { BinanceStakedEthBscConfigurations } from "../../protocols/binance-staked-eth/config/deployments/binance-staked-eth-bsc/configurations";

export function getNetworkConfigurations(deploy: i32): Configurations {
  switch (deploy) {
    case Deploy.BINANCE_STAKED_ETH_ETHEREUM: {
      return new BinanceStakedEthMainnetConfigurations();
    }
    case Deploy.BINANCE_STAKED_ETH_BSC: {
      return new BinanceStakedEthBscConfigurations();
    }
    default: {
      log.critical(
        "No configurations found for deployment protocol/network",
        []
      );
      return new BinanceStakedEthMainnetConfigurations();
    }
  }
}
