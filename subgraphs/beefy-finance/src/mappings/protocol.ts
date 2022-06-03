import { ethereum } from "@graphprotocol/graph-ts";
import { YieldAggregator } from "../../generated/schema";
import { BIGDECIMAL_ZERO, BIGINT_ZERO } from "../prices/common/constants";
import {
  getUniqueUsers,
  updateUsageMetricsDailySnapshot,
  updateUsageMetricsHourlySnapshot,
} from "../utils/metrics";

export function createBeefyFinance(
  network: string,
  vaultId: string,
  block: ethereum.Block
): YieldAggregator {
  const beefy = new YieldAggregator("BeefyFinance");
  beefy.name = "Beefy Finance";
  beefy.slug = "beefy-finance";
  beefy.schemaVersion = "1.2.1";
  beefy.subgraphVersion = "0.0.2";
  //beefy.methodologyVersion = "Abboh";
  beefy.network = network.toUpperCase();
  beefy.type = "YIELD";
  beefy.totalValueLockedUSD = BIGDECIMAL_ZERO;
  // beefy.protocolControlledValueUSD = new BigDecimal(new BigInt(0));
  // beefy.cumulativeSupplySideRevenueUSD = new BigDecimal(new BigInt(0));
  // beefy.cumulativeProtocolSideRevenueUSD = new BigDecimal(new BigInt(0));
  // beefy.cumulativeTotalRevenueUSD = new BigDecimal(new BigInt(0));
  beefy.cumulativeUniqueUsers = BIGINT_ZERO;
  beefy.vaults = [vaultId];
  beefy.dailyUsageMetrics = [updateUsageMetricsDailySnapshot(block, beefy).id];
  beefy.hourlyUsageMetrics = [
    updateUsageMetricsHourlySnapshot(block, beefy).id,
  ];
  beefy.save();
  return beefy;
}

export function updateProtocolAndSave(
  protocol: YieldAggregator,
  block: ethereum.Block
): YieldAggregator {
  protocol.cumulativeUniqueUsers = getUniqueUsers(protocol, [
    BIGINT_ZERO,
    block.timestamp,
  ]);
  const dailySnapshot = updateUsageMetricsDailySnapshot(block, protocol);
  if (
    protocol.dailyUsageMetrics[protocol.dailyUsageMetrics.length - 1] !==
    dailySnapshot.id
  )
    protocol.dailyUsageMetrics = protocol.dailyUsageMetrics.concat([
      dailySnapshot.id,
    ]);
  const hourlySnapshot = updateUsageMetricsHourlySnapshot(block, protocol);
  if (
    protocol.hourlyUsageMetrics[protocol.hourlyUsageMetrics.length - 1] !==
    hourlySnapshot.id
  )
    protocol.hourlyUsageMetrics = protocol.hourlyUsageMetrics.concat([
      hourlySnapshot.id,
    ]);
  protocol.save();

  return protocol;
}
