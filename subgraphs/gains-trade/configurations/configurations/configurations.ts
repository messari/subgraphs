import { GainsTradeArbitrumConfigurations } from "../../protocols/gains-trade/config/deployments/gains-trade-arbitrum/configurations";
import { GainsTradePolygonConfigurations } from "../../protocols/gains-trade/config/deployments/gains-trade-polygon/configurations";
import { Configurations } from "./interface";
import { Deploy } from "./deploy";
import { log } from "@graphprotocol/graph-ts";

export function getNetworkConfigurations(deploy: i32): Configurations {
  switch (deploy) {
    case Deploy.GAINS_TRADE_ARBITRUM: {
      return new GainsTradeArbitrumConfigurations();
    }
    case Deploy.GAINS_TRADE_POLYGON: {
      return new GainsTradePolygonConfigurations();
    }
    default: {
      log.critical(
        "No configurations found for deployment protocol/network",
        []
      );
      return new GainsTradeArbitrumConfigurations();
    }
  }
}
