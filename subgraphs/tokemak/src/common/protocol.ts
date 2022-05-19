import { YieldAggregator } from "../../generated/schema";
import * as constants from "./constants";

export function getOrCreateProtocol(): YieldAggregator {
  let protocol = YieldAggregator.load(constants.PROTOCOL_ID);
  if (!protocol) {
    protocol = new YieldAggregator(constants.PROTOCOL_ID);
    protocol.name = "Tokemak";
    protocol.slug = "tokemak";
    protocol.schemaVersion = "1.2.1";
    protocol.subgraphVersion = "1.0.0";
    protocol.methodologyVersion = "1.0.0";
    protocol.network = constants.Network.MAINNET;
    protocol.type = constants.ProtocolType.YIELD;

    //////// Quantitative Data ////////
    protocol.totalValueLockedUSD = constants.BIGDECIMAL_ZERO;
    protocol.protocolControlledValueUSD = constants.BIGDECIMAL_ZERO;
    protocol.cumulativeSupplySideRevenueUSD = constants.BIGDECIMAL_ZERO;
    protocol.cumulativeProtocolSideRevenueUSD = constants.BIGDECIMAL_ZERO;
    protocol.cumulativeTotalRevenueUSD = constants.BIGDECIMAL_ZERO;
    protocol.cumulativeUniqueUsers = 0;

    protocol._vaultIds = [];

    protocol.save();
  }
  return protocol;
}
