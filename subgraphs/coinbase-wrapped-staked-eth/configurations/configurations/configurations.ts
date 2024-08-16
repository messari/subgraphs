import { log } from "@graphprotocol/graph-ts";

import { Configurations } from "./interface";
import { Deploy } from "./deploy";
import { CoinbaseWrappedStakedEthMainnetConfigurations } from "../../protocols/coinbase-wrapped-staked-eth/config/deployments/coinbase-wrapped-staked-eth-ethereum/configurations";

export function getNetworkConfigurations(deploy: i32): Configurations {
  switch (deploy) {
    case Deploy.COINBASE_WRAPPED_STAKED_ETH_ETHEREUM: {
      return new CoinbaseWrappedStakedEthMainnetConfigurations();
    }
    default: {
      log.critical(
        "No configurations found for deployment protocol/network",
        []
      );
      return new CoinbaseWrappedStakedEthMainnetConfigurations();
    }
  }
}
