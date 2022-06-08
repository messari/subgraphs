import { BigDecimal, dataSource, ethereum } from "@graphprotocol/graph-ts";
import { Vault, YieldAggregator } from "../../generated/schema";
import {
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  PROTOCOL_ID,
} from "../prices/common/constants";
import {
  createFirstDailyFinancialSnapshot,
  getUniqueUsers,
  updateDailyFinancialSnapshot,
  updateUsageMetricsDailySnapshot,
  updateUsageMetricsHourlySnapshot,
} from "../utils/metrics";
import { getVaultDailyRevenues, updateVaultAndSave } from "./vault";

export function createBeefyFinance(
  vaultId: string,
  block: ethereum.Block
): YieldAggregator {
  const beefy = new YieldAggregator(PROTOCOL_ID);
  beefy.name = "Beefy Finance";
  beefy.slug = "beefy-finance";
  beefy.schemaVersion = "1.2.1";
  beefy.subgraphVersion = "1.0.2";
  beefy.methodologyVersion = "1.1.0";
  beefy.network = dataSource.network().toUpperCase();
  beefy.type = "YIELD";
  beefy.totalValueLockedUSD = BIGDECIMAL_ZERO;
  beefy.protocolControlledValueUSD = BIGDECIMAL_ZERO;
  beefy.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO; //todo
  beefy.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO; //todo
  beefy.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO; //todo
  beefy.cumulativeUniqueUsers = BIGINT_ZERO;
  beefy.vaults = [vaultId];
  beefy.dailyUsageMetrics = [updateUsageMetricsDailySnapshot(block, beefy).id];
  beefy.hourlyUsageMetrics = [
    updateUsageMetricsHourlySnapshot(block, beefy).id,
  ];
  beefy.financialMetrics = [createFirstDailyFinancialSnapshot(block, beefy).id];
  beefy.save();
  return beefy;
}

export function updateProtocolAndSave(
  protocol: YieldAggregator,
  block: ethereum.Block,
  vault: string
): YieldAggregator {
  if (!protocol.vaults.includes(vault)) {
    protocol.vaults = protocol.vaults.concat([vault]);
  }
  protocol.save();
  protocol.totalValueLockedUSD = getTvlUsd(protocol, block);
  protocol.protocolControlledValueUSD = protocol.totalValueLockedUSD;
  protocol.cumulativeUniqueUsers = getUniqueUsers(protocol, [
    BIGINT_ZERO,
    block.timestamp,
  ]);
  const dailySnapshot = updateUsageMetricsDailySnapshot(block, protocol);
  if (
    protocol.dailyUsageMetrics[protocol.dailyUsageMetrics.length - 1] !=
    dailySnapshot.id
  ) {
    protocol.dailyUsageMetrics = protocol.dailyUsageMetrics.concat([
      dailySnapshot.id,
    ]);
  }
  const hourlySnapshot = updateUsageMetricsHourlySnapshot(block, protocol);
  if (
    protocol.hourlyUsageMetrics[protocol.hourlyUsageMetrics.length - 1] !=
    hourlySnapshot.id
  ) {
    protocol.hourlyUsageMetrics = protocol.hourlyUsageMetrics.concat([
      hourlySnapshot.id,
    ]);
  }

  protocol.cumulativeUniqueUsers = getUniqueUsers(protocol, [
    BIGINT_ZERO,
    block.timestamp,
  ]);

  const dailyFinancialSnapshot = updateDailyFinancialSnapshot(block, protocol);
  if (
    protocol.financialMetrics[protocol.financialMetrics.length - 1] !=
    dailyFinancialSnapshot.id
  ) {
    protocol.financialMetrics = protocol.financialMetrics.concat([
      dailyFinancialSnapshot.id,
    ]);
  }
  protocol.cumulativeSupplySideRevenueUSD =
    dailyFinancialSnapshot.cumulativeSupplySideRevenueUSD;
  protocol.cumulativeProtocolSideRevenueUSD =
    dailyFinancialSnapshot.cumulativeProtocolSideRevenueUSD;
  protocol.cumulativeTotalRevenueUSD =
    dailyFinancialSnapshot.cumulativeTotalRevenueUSD;

  protocol.save();

  return protocol;
}

export function getTvlUsd(
  protocol: YieldAggregator,
  block: ethereum.Block
): BigDecimal {
  let tvlUsd = BIGDECIMAL_ZERO;
  for (let i = 0; i < protocol.vaults.length; i++) {
    const vault = Vault.load(protocol.vaults[i]);
    if (vault) {
      updateVaultAndSave(vault, block);
      tvlUsd = tvlUsd.plus(vault.totalValueLockedUSD);
    }
  }
  return tvlUsd;
}

export function getDailyRevenuesUsd(
  protocol: YieldAggregator,
  block: ethereum.Block
): BigDecimal[] {
  let dailyRevenueProtocolSide = BIGDECIMAL_ZERO;
  let dailyRevenueSupplySide = BIGDECIMAL_ZERO;
  let dailyTotalRevenueUsd = BIGDECIMAL_ZERO;
  let revenues: BigDecimal[];
  for (let i = 0; i < protocol.vaults.length; i++) {
    const vault = Vault.load(protocol.vaults[i]);
    if (vault == null) {
      continue;
    } else {
      revenues = getVaultDailyRevenues(vault, block);
      dailyRevenueSupplySide = dailyRevenueSupplySide.plus(revenues[0]);
      dailyRevenueProtocolSide = dailyRevenueProtocolSide.plus(revenues[1]);
      dailyTotalRevenueUsd = dailyTotalRevenueUsd.plus(revenues[2]);
    }
  }
  return [
    dailyRevenueSupplySide,
    dailyRevenueProtocolSide,
    dailyTotalRevenueUsd,
  ];
}
