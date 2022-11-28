import { MultichainMainnetConfigurations } from "../../protocols/multichain/config/deployments/multichain-mainnet/configurations";
import { MultichainBscConfigurations } from "../../protocols/multichain/config/deployments/multichain-bsc/configurations";
import { MultichainFantomConfigurations } from "../../protocols/multichain/config/deployments/multichain-fantom/configurations";
import { Configurations } from "./interface";
import { Deploy } from "./deploy";
import { log } from "@graphprotocol/graph-ts";

export function getNetworkConfigurations(deploy: i32): Configurations {
  switch (deploy) {
    case Deploy.MULTICHAIN_MAINNET: {
      return new MultichainMainnetConfigurations();
    }
    case Deploy.MULTICHAIN_BSC: {
      return new MultichainBscConfigurations();
    }
    case Deploy.MULTICHAIN_FANTOM: {
      return new MultichainFantomConfigurations();
    }
    default: {
      log.critical(
        "No configurations found for deployment protocol/network",
        []
      );
      return new MultichainMainnetConfigurations();
    }
  }
}
