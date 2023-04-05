import { NetworkConfigs } from "../../../configurations/configure";
import { DexAmmProtocol } from "../../../generated/schema";
import { Versions } from "../../versions";
import {
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  INT_ZERO,
  ProtocolType,
} from "../constants";

export function getOrCreateProtocol(): DexAmmProtocol {
  let protocol = DexAmmProtocol.load(NetworkConfigs.getFactoryAddress());

  if (!protocol) {
    protocol = new DexAmmProtocol(NetworkConfigs.getFactoryAddress());
    protocol.name = NetworkConfigs.getProtocolName();
    protocol.slug = NetworkConfigs.getProtocolSlug();
    protocol.totalValueLockedUSD = BIGDECIMAL_ZERO;
    protocol.activeLiquidityUSD = BIGDECIMAL_ZERO;
    protocol.totalLiquidityUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeVolumeUSD = BIGDECIMAL_ZERO;
    protocol.uncollectedProtocolSideValueUSD = BIGDECIMAL_ZERO;
    protocol.uncollectedSupplySideValueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
    protocol.cumulativeUniqueUsers = INT_ZERO;
    protocol.cumulativeUniqueTraders = INT_ZERO;
    protocol.cumulativeUniqueLPs = INT_ZERO;
    protocol.openPositionCount = INT_ZERO;
    protocol.cumulativePositionCount = INT_ZERO;
    protocol.network = NetworkConfigs.getNetwork();
    protocol.type = ProtocolType.EXCHANGE;
    protocol.totalPoolCount = INT_ZERO;
    protocol._regenesis = false;
    protocol.lastSnapshotDayID = INT_ZERO;
    protocol.lastUpdateBlockNumber = BIGINT_ZERO;
    protocol.lastUpdateTimestamp = BIGINT_ZERO;
  }

  protocol.schemaVersion = Versions.getSchemaVersion();
  protocol.subgraphVersion = Versions.getSubgraphVersion();
  protocol.methodologyVersion = Versions.getMethodologyVersion();
  protocol.save();

  return protocol;
}
