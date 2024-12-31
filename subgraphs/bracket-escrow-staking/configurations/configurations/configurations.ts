import { log } from "@graphprotocol/graph-ts";

import { Configurations } from "./interface";
import { Deploy } from "./deploy";
import { BracketEscrowStakingMainnetConfigurations } from "../../protocols/bracket-escrow-staking/config/deployments/bracket-escrow-staking-ethereum/configurations";
import { BracketEscrowStakingArbitrumConfigurations } from "../../protocols/bracket-escrow-staking/config/deployments/bracket-escrow-staking-arbitrum/configurations";

export function getNetworkConfigurations(deploy: i32): Configurations {
  switch (deploy) {
    case Deploy.BRACKET_ESCROW_STAKING_ETHEREUM: {
      return new BracketEscrowStakingMainnetConfigurations();
    }
    case Deploy.BRACKET_ESCROW_STAKING_ARBITRUM: {
      return new BracketEscrowStakingArbitrumConfigurations();
    }
    default: {
      log.critical(
        "No configurations found for deployment protocol/network",
        []
      );
      return new BracketEscrowStakingMainnetConfigurations();
    }
  }
}
