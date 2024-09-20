import { log } from "@graphprotocol/graph-ts";

import { Configurations } from "./interface";
import { Deploy } from "./deploy";
import { PaxosGoldMainnetConfigurations } from "../../protocols/paxos-gold/config/deployments/paxos-gold-ethereum/configurations";

export function getNetworkConfigurations(deploy: i32): Configurations {
  switch (deploy) {
    case Deploy.PAXOS_GOLD_ETHEREUM: {
      return new PaxosGoldMainnetConfigurations();
    }
    default: {
      log.critical(
        "No configurations found for deployment protocol/network",
        []
      );
      return new PaxosGoldMainnetConfigurations();
    }
  }
}
