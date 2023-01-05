import { BigDecimal, cosmos } from "@graphprotocol/graph-ts";
import { LiquidityPool as LiquidityPoolStore } from "../../generated/schema";
import {
  getOrCreateDexAmmProtocol,
  getOrCreateFinancialDailySnapshots,
  getOrCreateLiquidityPoolDailySnapshots,
  getOrCreateLiquidityPoolHourlySnapshots,
} from "../common/initializer";

export function updateRevenueSnapshots(
  pool: LiquidityPoolStore,
  supplySideRevenueUSD: BigDecimal,
  protocolSideRevenueUSD: BigDecimal,
  block: cosmos.HeaderOnlyBlock
): void {
  const protocol = getOrCreateDexAmmProtocol();
  const financialMetrics = getOrCreateFinancialDailySnapshots(block);
  const poolDailySnapshot = getOrCreateLiquidityPoolDailySnapshots(
    pool.id,
    block
  );
  const poolHourlySnapshot = getOrCreateLiquidityPoolHourlySnapshots(
    pool.id,
    block
  );
  if (!poolDailySnapshot || !poolHourlySnapshot) {
    return;
  }

  const totalRevenueUSD = supplySideRevenueUSD.plus(protocolSideRevenueUSD);

  // SupplySideRevenueUSD Metrics
  protocol.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD.plus(
    supplySideRevenueUSD
  );
  financialMetrics.dailySupplySideRevenueUSD = financialMetrics.dailySupplySideRevenueUSD.plus(
    supplySideRevenueUSD
  );
  financialMetrics.cumulativeSupplySideRevenueUSD =
    protocol.cumulativeSupplySideRevenueUSD;

  pool.cumulativeSupplySideRevenueUSD = pool.cumulativeSupplySideRevenueUSD.plus(
    supplySideRevenueUSD
  );
  poolDailySnapshot.cumulativeSupplySideRevenueUSD =
    pool.cumulativeSupplySideRevenueUSD;
  poolDailySnapshot.dailySupplySideRevenueUSD = poolDailySnapshot.dailySupplySideRevenueUSD.plus(
    supplySideRevenueUSD
  );
  poolHourlySnapshot.cumulativeSupplySideRevenueUSD =
    pool.cumulativeSupplySideRevenueUSD;
  poolHourlySnapshot.hourlySupplySideRevenueUSD = poolHourlySnapshot.hourlySupplySideRevenueUSD.plus(
    supplySideRevenueUSD
  );

  // ProtocolSideRevenueUSD Metrics
  protocol.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD.plus(
    protocolSideRevenueUSD
  );
  financialMetrics.cumulativeProtocolSideRevenueUSD =
    protocol.cumulativeProtocolSideRevenueUSD;
  financialMetrics.dailyProtocolSideRevenueUSD = financialMetrics.dailyProtocolSideRevenueUSD.plus(
    protocolSideRevenueUSD
  );

  pool.cumulativeProtocolSideRevenueUSD = pool.cumulativeProtocolSideRevenueUSD.plus(
    protocolSideRevenueUSD
  );
  poolDailySnapshot.cumulativeProtocolSideRevenueUSD =
    pool.cumulativeProtocolSideRevenueUSD;
  poolDailySnapshot.dailyProtocolSideRevenueUSD = poolDailySnapshot.dailyProtocolSideRevenueUSD.plus(
    protocolSideRevenueUSD
  );
  poolHourlySnapshot.cumulativeProtocolSideRevenueUSD =
    pool.cumulativeProtocolSideRevenueUSD;
  poolHourlySnapshot.hourlyProtocolSideRevenueUSD = poolHourlySnapshot.hourlyProtocolSideRevenueUSD.plus(
    protocolSideRevenueUSD
  );

  // TotalRevenueUSD Metrics
  protocol.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD.plus(
    totalRevenueUSD
  );
  financialMetrics.cumulativeTotalRevenueUSD =
    protocol.cumulativeTotalRevenueUSD;
  financialMetrics.dailyTotalRevenueUSD = financialMetrics.dailyTotalRevenueUSD.plus(
    totalRevenueUSD
  );

  pool.cumulativeTotalRevenueUSD = pool.cumulativeTotalRevenueUSD.plus(
    totalRevenueUSD
  );
  poolDailySnapshot.cumulativeTotalRevenueUSD = pool.cumulativeTotalRevenueUSD;
  poolDailySnapshot.dailyTotalRevenueUSD = poolDailySnapshot.dailyTotalRevenueUSD.plus(
    totalRevenueUSD
  );
  poolHourlySnapshot.cumulativeTotalRevenueUSD = pool.cumulativeTotalRevenueUSD;
  poolHourlySnapshot.hourlyTotalRevenueUSD = poolHourlySnapshot.hourlyTotalRevenueUSD.plus(
    totalRevenueUSD
  );

  poolHourlySnapshot.save();
  poolDailySnapshot.save();
  pool.save();
  financialMetrics.save();
  protocol.save();
}
