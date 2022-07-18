// import { log } from '@graphprotocol/graph-ts'
import { BigDecimal, ethereum, BigInt, Address } from "@graphprotocol/graph-ts";
import { Account, ActiveAccount, DexAmmProtocol, LiquidityPool } from "../../generated/schema";
import { SECONDS_PER_DAY, INT_ZERO, INT_ONE, BIGDECIMAL_ONE, UsageType, SECONDS_PER_HOUR, INT_TWO } from "./constants";
import {
  getOrCreateDex,
  getLiquidityPool,
  getLiquidityPoolFee,
  getOrCreateToken,
  getOrCreateLiquidityPoolDailySnapshot,
  getOrCreateLiquidityPoolHourlySnapshot,
  getOrCreateFinancialsDailySnapshot,
  getOrCreateUsageMetricDailySnapshot,
  getOrCreateUsageMetricHourlySnapshot,
} from "./getters";
import { calculatePrice, fetchPrice, isUSDStable, TokenInfo } from "./pricing";
import { scaleDown } from "./tokens";

// Update FinancialsDailySnapshots entity
export function updateFinancials(event: ethereum.Event): void {
  let financialMetricsDaily = getOrCreateFinancialsDailySnapshot(event);

  let protocol = getOrCreateDex();

  // Update the block number and timestamp to that of the last transaction of that day
  financialMetricsDaily.blockNumber = event.block.number;
  financialMetricsDaily.timestamp = event.block.timestamp;
  financialMetricsDaily.totalValueLockedUSD = protocol.totalValueLockedUSD;
  financialMetricsDaily.cumulativeVolumeUSD = protocol.cumulativeVolumeUSD;

  financialMetricsDaily.save();
}

// Update usage metrics entities
export function updateUsageMetrics(event: ethereum.Event, fromAddress: Address, usageType: string): void {
  let from = fromAddress.toHexString();

  let usageMetricsDaily = getOrCreateUsageMetricDailySnapshot(event);
  let usageMetricsHourly = getOrCreateUsageMetricHourlySnapshot(event);

  let protocol = getOrCreateDex();

  // Update the block number and timestamp to that of the last transaction of that day
  usageMetricsDaily.blockNumber = event.block.number;
  usageMetricsDaily.timestamp = event.block.timestamp;
  usageMetricsDaily.dailyTransactionCount += INT_ONE;

  usageMetricsHourly.blockNumber = event.block.number;
  usageMetricsHourly.timestamp = event.block.timestamp;
  usageMetricsHourly.hourlyTransactionCount += INT_ONE;

  if (usageType == UsageType.DEPOSIT) {
    usageMetricsDaily.dailyDepositCount += INT_ONE;
    usageMetricsHourly.hourlyDepositCount += INT_ONE;
  } else if (usageType == UsageType.WITHDRAW) {
    usageMetricsDaily.dailyWithdrawCount += INT_ONE;
    usageMetricsHourly.hourlyWithdrawCount += INT_ONE;
  } else if (usageType == UsageType.SWAP) {
    usageMetricsDaily.dailySwapCount += INT_ONE;
    usageMetricsHourly.hourlySwapCount += INT_ONE;
  }

  // Number of days since Unix epoch
  let day = event.block.timestamp.toI32() / SECONDS_PER_DAY;
  let hour = event.block.timestamp.toI32() / SECONDS_PER_HOUR;

  let dayId = day.toString();
  let hourId = hour.toString();

  // Combine the id and the user address to generate a unique user id for the day
  let dailyActiveAccountId = from.concat("-").concat(dayId);
  let dailyActiveAccount = ActiveAccount.load(dailyActiveAccountId);
  if (!dailyActiveAccount) {
    dailyActiveAccount = new ActiveAccount(dailyActiveAccountId);
    usageMetricsDaily.dailyActiveUsers += INT_ONE;
    dailyActiveAccount.save();
  }

  let hourlyActiveAccountId = from.concat("-").concat(hourId);
  let hourlyActiveAccount = ActiveAccount.load(hourlyActiveAccountId);
  if (!hourlyActiveAccount) {
    hourlyActiveAccount = new ActiveAccount(hourlyActiveAccountId);
    usageMetricsHourly.hourlyActiveUsers += INT_ONE;
    hourlyActiveAccount.save();
  }

  let account = Account.load(from);
  if (!account) {
    account = new Account(from);
    protocol.cumulativeUniqueUsers += INT_ONE;
    account.save();
  }
  usageMetricsDaily.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
  usageMetricsHourly.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
  usageMetricsDaily.totalPoolCount = protocol.totalPoolCount;
  usageMetricsDaily.save();
  usageMetricsHourly.save();
  protocol.save();
}

// Update UsagePoolDailySnapshot entity
export function updatePoolMetrics(event: ethereum.Event, poolAddress: string): void {
  // get or create pool metrics
  let pool = getLiquidityPool(poolAddress);
  let poolMetricsDaily = getOrCreateLiquidityPoolDailySnapshot(event, poolAddress);
  let poolMetricsHourly = getOrCreateLiquidityPoolHourlySnapshot(event, poolAddress);

  // Update the block number and timestamp to that of the last transaction of that day
  poolMetricsDaily.totalValueLockedUSD = pool.totalValueLockedUSD;
  poolMetricsDaily.cumulativeVolumeUSD = pool.cumulativeVolumeUSD;
  poolMetricsDaily.inputTokenBalances = pool.inputTokenBalances;
  poolMetricsDaily.inputTokenWeights = pool.inputTokenWeights;
  poolMetricsDaily.outputTokenSupply = pool.outputTokenSupply;
  poolMetricsDaily.outputTokenPriceUSD = pool.outputTokenPriceUSD;
  poolMetricsDaily.blockNumber = event.block.number;
  poolMetricsDaily.timestamp = event.block.timestamp;
  poolMetricsDaily.cumulativeTotalRevenueUSD = pool.cumulativeTotalRevenueUSD;
  poolMetricsDaily.cumulativeSupplySideRevenueUSD = pool.cumulativeSupplySideRevenueUSD;
  poolMetricsDaily.cumulativeProtocolSideRevenueUSD = pool.cumulativeProtocolSideRevenueUSD;

  poolMetricsHourly.totalValueLockedUSD = pool.totalValueLockedUSD;
  poolMetricsHourly.cumulativeVolumeUSD = pool.cumulativeVolumeUSD;
  poolMetricsHourly.inputTokenBalances = pool.inputTokenBalances;
  poolMetricsHourly.inputTokenWeights = pool.inputTokenWeights;
  poolMetricsHourly.outputTokenSupply = pool.outputTokenSupply;
  poolMetricsHourly.outputTokenPriceUSD = pool.outputTokenPriceUSD;
  poolMetricsHourly.blockNumber = event.block.number;
  poolMetricsHourly.timestamp = event.block.timestamp;
  poolMetricsHourly.cumulativeTotalRevenueUSD = pool.cumulativeTotalRevenueUSD;
  poolMetricsHourly.cumulativeSupplySideRevenueUSD = pool.cumulativeSupplySideRevenueUSD;
  poolMetricsHourly.cumulativeProtocolSideRevenueUSD = pool.cumulativeProtocolSideRevenueUSD;

  poolMetricsDaily.save();
  poolMetricsHourly.save();
}

// Update the volume for all relavant entities
export function updateVolumeAndFee(
  event: ethereum.Event,
  protocol: DexAmmProtocol,
  pool: LiquidityPool,
  trackedAmountUSD: BigDecimal,
): void {
  let financialMetrics = getOrCreateFinancialsDailySnapshot(event);
  let supplyFee = getLiquidityPoolFee(pool.fees[INT_ZERO]);
  let protocolFee = getLiquidityPoolFee(pool.fees[INT_ONE]);
  let tradingFee = getLiquidityPoolFee(pool.fees[INT_TWO]);

  financialMetrics.dailyVolumeUSD = financialMetrics.dailyVolumeUSD.plus(trackedAmountUSD);
  pool.cumulativeVolumeUSD = pool.cumulativeVolumeUSD.plus(trackedAmountUSD);
  protocol.cumulativeVolumeUSD = protocol.cumulativeVolumeUSD.plus(trackedAmountUSD);

  let tradingFeeAmountUSD = trackedAmountUSD.times(tradingFee.feePercentage!);
  let supplyFeeAmountUSD = trackedAmountUSD.times(supplyFee.feePercentage!);
  let protocolFeeAmountUSD = trackedAmountUSD.times(protocolFee.feePercentage!);

  protocol.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD.plus(tradingFeeAmountUSD);
  protocol.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD.plus(supplyFeeAmountUSD);
  protocol.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD.plus(protocolFeeAmountUSD);

  pool.cumulativeTotalRevenueUSD = pool.cumulativeTotalRevenueUSD.plus(tradingFeeAmountUSD);
  pool.cumulativeSupplySideRevenueUSD = pool.cumulativeSupplySideRevenueUSD.plus(supplyFeeAmountUSD);
  pool.cumulativeProtocolSideRevenueUSD = pool.cumulativeProtocolSideRevenueUSD.plus(protocolFeeAmountUSD);

  financialMetrics.dailyTotalRevenueUSD = financialMetrics.dailyTotalRevenueUSD.plus(tradingFeeAmountUSD);
  financialMetrics.dailySupplySideRevenueUSD = financialMetrics.dailySupplySideRevenueUSD.plus(supplyFeeAmountUSD);
  financialMetrics.dailyProtocolSideRevenueUSD =
    financialMetrics.dailyProtocolSideRevenueUSD.plus(protocolFeeAmountUSD);

  financialMetrics.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD;
  financialMetrics.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD;
  financialMetrics.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD;

  financialMetrics.save();

  protocol.save();
  pool.save();
}

export function updateTokenPrice(
  pool: LiquidityPool,
  tokenIn: Address,
  tokenInAmount: BigInt,
  tokenInIndex: i32,
  tokenOut: Address,
  tokenOutAmount: BigInt,
  tokenOutIndex: i32,
  blockNumber: BigInt,
): void {
  let hasWeights = pool.inputTokenWeights.length > 0;

  let weightTokenOut: BigDecimal | null = null;
  let weightTokenIn: BigDecimal | null = null;
  let tokenInDecimalsAmount = scaleDown(tokenInAmount, tokenIn);
  let tokenOutDecimalsAmount = scaleDown(tokenOutAmount, tokenOut);

  if (hasWeights) {
    weightTokenOut = pool.inputTokenWeights[tokenOutIndex];
    weightTokenIn = pool.inputTokenWeights[tokenInIndex];
    tokenInDecimalsAmount = scaleDown(pool.inputTokenBalances[tokenInIndex], tokenIn);
    tokenOutDecimalsAmount = scaleDown(pool.inputTokenBalances[tokenOutIndex], tokenOut);
  }

  let tokenInfo: TokenInfo | null = calculatePrice(
    tokenIn,
    tokenInDecimalsAmount,
    weightTokenIn,
    tokenOut,
    tokenOutDecimalsAmount,
    weightTokenOut,
  );

  if (tokenInfo) {
    const token = getOrCreateToken(tokenInfo.address.toHexString());
    const index = tokenInfo.address == tokenOut ? tokenOutIndex : tokenInIndex;
    const currentBalance = scaleDown(pool.inputTokenBalances[index], Address.fromString(pool.inputTokens[index]));
    // We check if current balance multiplied by the price is over 10k USD, if not,
    // it means that the pool does have too much liquidity, so we fetch the price from
    // external source
    if (currentBalance.times(tokenInfo.price).gt(BigDecimal.fromString("10000"))) {
      token.lastPriceUSD = tokenInfo.price;
      token.lastPriceBlockNumber = blockNumber;
      token.save();
      return;
    }
  }

  if (getOrCreateDex().network == "MATIC" || getOrCreateDex().network == "OPTIMISM") return;

  if (!isUSDStable(tokenIn)) {
    const token = getOrCreateToken(tokenIn.toHexString());
    token.lastPriceUSD = fetchPrice(tokenIn);
    token.lastPriceBlockNumber = blockNumber;
    token.save();
  }

  if (!isUSDStable(tokenOut)) {
    const token = getOrCreateToken(tokenOut.toHexString());
    token.lastPriceUSD = fetchPrice(tokenOut);
    token.lastPriceBlockNumber = blockNumber;
    token.save();
  }
}
