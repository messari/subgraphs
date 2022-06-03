import { YieldAggregator } from "../../generated/schema";
import { BIGDECIMAL_ZERO } from "../prices/common/constants";

export function createBeefyFinance(
  network: string,
  vaultId: string
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
  beefy.cumulativeUniqueUsers = 0;
  beefy.dailyUsageMetrics = [createFirstDailyUsageMetric()];
  beefy.hourlyUsageMetrics = [createFirstHourlyUsageMetric()];
  beefy.vaults = [vaultId];
  beefy.save();
  return beefy;
}
