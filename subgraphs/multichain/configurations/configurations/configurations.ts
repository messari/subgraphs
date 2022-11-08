import { MultichainMainnetConfigurations } from "../../protocols/multichain/config/deployments/multichain-mainnet/configurations";
import { Configurations } from "./interface";
import { Deploy } from "./deploy";
import { log } from "@graphprotocol/graph-ts";

export function getNetworkConfigurations(deploy: i32): Configurations {
  switch (deploy) {
    case Deploy.MULTICHAIN_MAINNET: {
      return new MultichainMainnetConfigurations();
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
