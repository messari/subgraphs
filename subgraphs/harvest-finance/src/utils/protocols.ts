import { Address } from "@graphprotocol/graph-ts";
import { YieldAggregator } from "../../generated/schema";
import { constants } from "./constants";

export namespace protocols {
  export function findOrInitialize(address: Address): YieldAggregator {
    const id = address.toHexString();

    let protocol = YieldAggregator.load(id);

    if (protocol) return protocol;

    return initialize(id);
  }

  export function initialize(id: string): YieldAggregator {
    const protocol = new YieldAggregator(id);

    protocol.name = "Harvest Finance";
    protocol.slug = "harvest-finance";
    protocol.schemaVersion = "0.0.1";
    protocol.subgraphVersion = "0.0.1";
    protocol.methodologyVersion = "0.0.1";
    protocol.network = "MAINNET";
    protocol.type = "YIELD";
    protocol.totalValueLockedUSD = constants.BIG_DECIMAL_ZERO;
    protocol.protocolControlledValueUSD = constants.BIG_DECIMAL_ZERO;
    protocol.cumulativeSupplySideRevenueUSD = constants.BIG_DECIMAL_ZERO;
    protocol.cumulativeProtocolSideRevenueUSD = constants.BIG_DECIMAL_ZERO;
    protocol.cumulativeTotalRevenueUSD = constants.BIG_DECIMAL_ZERO;
    protocol.cumulativeUniqueUsers = 0;

    return protocol;
  }
}
