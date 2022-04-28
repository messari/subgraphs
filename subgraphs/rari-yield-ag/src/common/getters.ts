// get or create snapshots and metrics
import { getAssetDecimals, getAssetName, getAssetSymbol } from "./utils/tokens";
import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";

///////////////////
//// Snapshots ////
///////////////////

export function getOrCreateUsageMetricSnapshot(event: ethereum.Event): UsageMetricsDailySnapshot {
  // Number of days since Unix epoch
  let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;

  // Create unique id for the day
  let usageMetrics = UsageMetricsDailySnapshot.load(id.toString());

  if (!usageMetrics) {
    usageMetrics = new UsageMetricsDailySnapshot(id.toString());
    usageMetrics.protocol = COMPTROLLER_ADDRESS;

    usageMetrics.activeUsers = 0;
    usageMetrics.totalUniqueUsers = 0;
    usageMetrics.dailyTransactionCount = 0;
    usageMetrics.blockNumber = event.block.number;
    usageMetrics.timestamp = event.block.timestamp;
    usageMetrics.save();
  }

  return usageMetrics;
}

export function getOrCreateMarketDailySnapshot(event: ethereum.Event): MarketDailySnapshot {
  let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;
  let marketAddress = event.address.toHexString();
  let marketMetrics = MarketDailySnapshot.load(marketAddress.concat("-").concat(id.toString()));

  if (!marketMetrics) {
    marketMetrics = new MarketDailySnapshot(marketAddress.concat("-").concat(id.toString()));
    marketMetrics.protocol = COMPTROLLER_ADDRESS;
    marketMetrics.market = marketAddress;
    marketMetrics.totalValueLockedUSD = BIGDECIMAL_ZERO;
    let inputBalances = new Array<BigInt>();
    inputBalances.push(BIGINT_ZERO);
    marketMetrics.inputTokenBalances = inputBalances;
    let inputPrices = new Array<BigDecimal>();
    marketMetrics.inputTokenPricesUSD = inputPrices;
    marketMetrics.outputTokenSupply = BIGINT_ZERO;
    marketMetrics.outputTokenPriceUSD = BIGDECIMAL_ZERO;
    let emissionsAmount = new Array<BigInt>();
    emissionsAmount.push(BIGINT_ZERO);
    marketMetrics.rewardTokenEmissionsAmount = emissionsAmount;
    let emissionsUSD = new Array<BigDecimal>();
    emissionsUSD.push(BIGDECIMAL_ZERO);
    emissionsUSD.push(BIGDECIMAL_ZERO);
    marketMetrics.rewardTokenEmissionsUSD = emissionsUSD;
    marketMetrics.blockNumber = event.block.number;
    marketMetrics.timestamp = event.block.timestamp;
    marketMetrics.depositRate = BIGDECIMAL_ZERO;
    marketMetrics.stableBorrowRate = BIGDECIMAL_ZERO;
    marketMetrics.variableBorrowRate = BIGDECIMAL_ZERO;

    marketMetrics.save();
  }

  return marketMetrics;
}

export function getOrCreateFinancials(event: ethereum.Event): FinancialsDailySnapshot {
  // Number of days since Unix epoch
  let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;

  let financialMetrics = FinancialsDailySnapshot.load(id.toString());

  if (!financialMetrics) {
    financialMetrics = new FinancialsDailySnapshot(id.toString());
    financialMetrics.protocol = COMPTROLLER_ADDRESS;
    financialMetrics.totalVolumeUSD = BIGDECIMAL_ZERO;
    financialMetrics.totalDepositUSD = BIGDECIMAL_ZERO;
    financialMetrics.totalBorrowUSD = BIGDECIMAL_ZERO;
    financialMetrics.supplySideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.protocolSideRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.totalRevenueUSD = BIGDECIMAL_ZERO;
    financialMetrics.blockNumber = event.block.number;
    financialMetrics.timestamp = event.block.timestamp;

    financialMetrics.save();
  }
  return financialMetrics;
}
