import { TornadoCashMainnetConfigurations } from "../../protocols/tornado-cash/config/deployments/tornado-cash-mainnet/configurations";
import { TornadoCashBscConfigurations } from "../../protocols/tornado-cash/config/deployments/tornado-cash-bsc/configurations";
import { Configurations } from "./interface";
import { Deploy } from "./deploy";
import { log } from "@graphprotocol/graph-ts";

export function getNetworkConfigurations(deploy: i32): Configurations {
  switch (deploy) {
    case Deploy.TORNADOCASH_MAINNET: {
      return new TornadoCashMainnetConfigurations();
    }
    case Deploy.TORNADOCASH_BSC: {
      return new TornadoCashBscConfigurations();
    }
    default: {
      log.critical(
        "No configurations found for deployment protocol/network",
        []
      );
      return new TornadoCashMainnetConfigurations();
    }
  }
}
