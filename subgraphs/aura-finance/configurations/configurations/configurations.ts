import { AuraFinanceMainnetConfigurations } from "../../protocols/aura-finance/config/deployments/aura-finance-ethereum/configurations";
import { Configurations } from "./interface";
import { Deploy } from "./deploy";
import { log } from "@graphprotocol/graph-ts";

export function getNetworkConfigurations(deploy: i32): Configurations {
  switch (deploy) {
    case Deploy.AURAFINANCE_MAINNET: {
      return new AuraFinanceMainnetConfigurations();
    }
    default: {
      log.critical(
        "No configurations found for deployment protocol/network",
        []
      );
      return new AuraFinanceMainnetConfigurations();
    }
  }
}
