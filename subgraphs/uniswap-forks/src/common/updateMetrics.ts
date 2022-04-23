import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import { Account, ActiveAccount, Token, UsageMetricsDailySnapshot, UsageMetricsHourlySnapshot, _HelperStore, _TokenWhitelist } from "../../generated/schema";
import {
  getLiquidityPool,
  getLiquidityPoolAmounts,
  getOrCreateDex,
  getOrCreateFinancialsDailySnapshot,
  getOrCreateLiquidityPoolDailySnapshot,
  getOrCreateLiquidityPoolHourlySnapshot,
  getOrCreateToken,
  getOrCreateTokenWhitelist,
} from "./getters";
import { BIGDECIMAL_ZERO, BIGINT_ZERO, DEFAULT_DECIMALS, INT_ONE, INT_ZERO, SECONDS_PER_DAY, SECONDS_PER_HOUR, UsageType } from "./constants";
import { convertTokenToDecimal } from "./utils/utils";
import { findNativeTokenPerToken, updateNativeTokenPriceInUSD } from "./price/price";
import { NetworkConfigs } from "../../config/_networkConfig";

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

export function updateUsageMetrics(event: ethereum.Event, from: string, usageType: string): void {
  // Number of days since Unix epoch
  let day = event.block.timestamp.toI32() / SECONDS_PER_DAY;
  let hour = event.block.timestamp.toI32() / SECONDS_PER_HOUR;

  let dayId = day.toString();
  let hourId = hour.toString();

  let usageMetricsDaily = UsageMetricsDailySnapshot.load(dayId);
  let usageMetricsHourly = UsageMetricsHourlySnapshot.load(dayId.concat(hourId));

  let protocol = getOrCreateDex();

  if (!usageMetricsDaily) {
    usageMetricsDaily = new UsageMetricsDailySnapshot(dayId);
    usageMetricsDaily.protocol = NetworkConfigs.FACTORY_ADDRESS;
    usageMetricsDaily.dailyActiveUsers = INT_ZERO;
    usageMetricsDaily.cumulativeUniqueUsers = INT_ZERO;
    usageMetricsDaily.dailyTransactionCount = INT_ZERO;
  }

  if (!usageMetricsHourly) {
    usageMetricsHourly = new UsageMetricsHourlySnapshot(dayId.concat(hourId));
    usageMetricsHourly.protocol = NetworkConfigs.FACTORY_ADDRESS;
    usageMetricsHourly.hourlyActiveUsers = INT_ZERO;
    usageMetricsHourly.cumulativeUniqueUsers = INT_ZERO;
    usageMetricsHourly.hourlyTransactionCount = INT_ZERO;
  }

  // Update the block number and timestamp to that of the last transaction of that day
  usageMetricsDaily.blockNumber = event.block.number;
  usageMetricsDaily.timestamp = event.block.timestamp;
  usageMetricsDaily.dailyTransactionCount += INT_ONE;
  if (usageType == UsageType.DEPOSIT) {
    usageMetricsDaily.dailyDepositCount += INT_ONE;
  } else if (usageType == UsageType.WITHDRAW) {
    usageMetricsDaily.dailyWithdrawCount += INT_ONE;
  } else if (usageType == UsageType.SWAP) {
    usageMetricsDaily.dailySwapCount += INT_ONE;
  }

  usageMetricsHourly.blockNumber = event.block.number;
  usageMetricsHourly.timestamp = event.block.timestamp;
  usageMetricsHourly.hourlyTransactionCount += INT_ONE;
  if (usageType == UsageType.DEPOSIT) {
    usageMetricsHourly.hourlyDepositCount += INT_ONE;
  } else if (usageType == UsageType.WITHDRAW) {
    usageMetricsHourly.hourlyWithdrawCount += INT_ONE;
  } else if (usageType == UsageType.SWAP) {
    usageMetricsHourly.hourlySwapCount += INT_ONE;
  }

  // Combine the id and the user address to generate a unique user id for the day
  let dailyActiveAccountId = dayId.concat(from);
  let dailyActiveAccount = ActiveAccount.load(dailyActiveAccountId);
  if (!dailyActiveAccount) {
    dailyActiveAccount = new ActiveAccount(dailyActiveAccountId);
    usageMetricsDaily.dailyActiveUsers += INT_ONE;
    dailyActiveAccount.save();
  }

  let hourlyActiveAccountId = dayId.concat(hourId).concat(from);
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

  usageMetricsDaily.save();
  usageMetricsHourly.save();
  protocol.save();
}

// Update UsagePoolDailySnapshot entity
export function updatePoolMetrics(event: ethereum.Event): void {
  // get or create pool metrics
  let poolMetricsDaily = getOrCreateLiquidityPoolDailySnapshot(event);
  let poolMetricsHourly = getOrCreateLiquidityPoolHourlySnapshot(event);

  let pool = getLiquidityPool(event.address.toHexString());

  // Update the block number and timestamp to that of the last transaction of that day
  poolMetricsDaily.totalValueLockedUSD = pool.totalValueLockedUSD;
  poolMetricsDaily.cumulativeVolumeUSD = pool.cumulativeVolumeUSD;
  poolMetricsDaily.inputTokenBalances = pool.inputTokenBalances;
  poolMetricsDaily.inputTokenWeights = pool.inputTokenWeights;
  poolMetricsDaily.outputTokenSupply = pool.outputTokenSupply;
  poolMetricsDaily.outputTokenPriceUSD = pool.outputTokenPriceUSD;
  poolMetricsDaily.blockNumber = event.block.number;
  poolMetricsDaily.timestamp = event.block.timestamp;

  poolMetricsHourly.totalValueLockedUSD = pool.totalValueLockedUSD;
  poolMetricsHourly.cumulativeVolumeUSD = pool.cumulativeVolumeUSD;
  poolMetricsHourly.inputTokenBalances = pool.inputTokenBalances;
  poolMetricsHourly.inputTokenWeights = pool.inputTokenWeights;
  poolMetricsHourly.outputTokenSupply = pool.outputTokenSupply;
  poolMetricsHourly.outputTokenPriceUSD = pool.outputTokenPriceUSD;
  poolMetricsHourly.blockNumber = event.block.number;
  poolMetricsHourly.timestamp = event.block.timestamp;

  poolMetricsDaily.save();
  poolMetricsHourly.save();
}

// These whiteslists are used to track what pools the tokens are a part of. Used in price calculations.
export function updateTokenWhitelists(token0: Token, token1: Token, poolAddress: string): void {
  let tokenWhitelist0 = getOrCreateTokenWhitelist(token0.id);
  let tokenWhitelist1 = getOrCreateTokenWhitelist(token1.id);

  // update white listed pools
  if (NetworkConfigs.WHITELIST_TOKENS.includes(tokenWhitelist0.id)) {
    let newPools = tokenWhitelist1.whitelistPools;
    newPools.push(poolAddress);
    tokenWhitelist1.whitelistPools = newPools;
    tokenWhitelist1.save();
  }

  if (NetworkConfigs.WHITELIST_TOKENS.includes(tokenWhitelist1.id)) {
    let newPools = tokenWhitelist0.whitelistPools;
    newPools.push(poolAddress);
    tokenWhitelist0.whitelistPools = newPools;
    tokenWhitelist0.save();
  }
}

// Upate token balances based on reserves emitted from the sync event.
export function updateInputTokenBalances(poolAddress: string, reserve0: BigInt, reserve1: BigInt): void {
  let pool = getLiquidityPool(poolAddress);
  let poolAmounts = getLiquidityPoolAmounts(poolAddress);

  let token0 = getOrCreateToken(pool.inputTokens[INT_ZERO]);
  let token1 = getOrCreateToken(pool.inputTokens[INT_ONE]);

  let tokenDecimal0 = convertTokenToDecimal(reserve0, token0.decimals);
  let tokenDecimal1 = convertTokenToDecimal(reserve1, token1.decimals);

  poolAmounts.inputTokenBalances = [tokenDecimal0, tokenDecimal1];
  pool.inputTokenBalances = [reserve0, reserve1];

  poolAmounts.save();
  pool.save();
}

// Update tvl an token prices
export function updateTvlAndTokenPrices(poolAddress: string, blockNumber: BigInt): void {
  let pool = getLiquidityPool(poolAddress);

  let protocol = getOrCreateDex();

  let token0 = getOrCreateToken(pool.inputTokens[0]);
  let token1 = getOrCreateToken(pool.inputTokens[1]);

  let nativeToken = updateNativeTokenPriceInUSD();

  token0.lastPriceUSD = findNativeTokenPerToken(token0, nativeToken);
  token1.lastPriceUSD = findNativeTokenPerToken(token1, nativeToken);

  // Subtract the old pool tvl
  protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.minus(pool.totalValueLockedUSD);

  let inputToken0 = convertTokenToDecimal(pool.inputTokenBalances[0], token0.decimals);
  let inputToken1 = convertTokenToDecimal(pool.inputTokenBalances[1], token1.decimals);

  // Get new tvl
  let newTvl = token0.lastPriceUSD!.times(inputToken0).plus(token1.lastPriceUSD!.times(inputToken1));

  // Add the new pool tvl
  pool.totalValueLockedUSD = newTvl;
  protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.plus(newTvl);

  let outputTokenSupply = convertTokenToDecimal(pool.outputTokenSupply!, DEFAULT_DECIMALS);

  // Update LP token prices
  if (pool.outputTokenSupply == BIGINT_ZERO) {
    pool.outputTokenPriceUSD = BIGDECIMAL_ZERO;
  } else {
    pool.outputTokenPriceUSD = newTvl.div(outputTokenSupply);
  }

  pool.save();
  protocol.save();
  token0.save();
  token1.save();
  nativeToken.save();
}

// Update the volume and accrued fees for all relavant entities
export function updateVolumeAndFees(
  event: ethereum.Event,
  token0VolumeUSD: BigDecimal,
  token1VolumeUSD: BigDecimal,
  token0Amount: BigInt,
  token1Amount: BigInt,
  supplyFeeAmountUSD: BigDecimal,
  protocolFeeAmountUSD: BigDecimal
): void {
  let pool = getLiquidityPool(event.address.toHexString());
  let protocol = getOrCreateDex();
  let financialMetrics = getOrCreateFinancialsDailySnapshot(event);
  let poolMetricsDaily = getOrCreateLiquidityPoolDailySnapshot(event);
  let poolMetricsHourly = getOrCreateLiquidityPoolHourlySnapshot(event);

  let trackedAmountUSD = token0VolumeUSD.plus(token1VolumeUSD);

  let tradingFeeAmountUSD = supplyFeeAmountUSD.plus(protocolFeeAmountUSD);

  protocol.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD.plus(tradingFeeAmountUSD);
  protocol.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD.plus(supplyFeeAmountUSD);
  protocol.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD.plus(protocolFeeAmountUSD);

  financialMetrics.dailyTotalRevenueUSD = financialMetrics.dailyTotalRevenueUSD.plus(tradingFeeAmountUSD);
  financialMetrics.dailySupplySideRevenueUSD = financialMetrics.dailySupplySideRevenueUSD.plus(supplyFeeAmountUSD);
  financialMetrics.dailyProtocolSideRevenueUSD = financialMetrics.dailyProtocolSideRevenueUSD.plus(protocolFeeAmountUSD);

  financialMetrics.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD;
  financialMetrics.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD;
  financialMetrics.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD;

  poolMetricsDaily.dailyVolumeByTokenUSD = [
    poolMetricsDaily.dailyVolumeByTokenUSD[INT_ZERO].plus(token0VolumeUSD),
    poolMetricsDaily.dailyVolumeByTokenUSD[INT_ONE].plus(token1VolumeUSD),
  ];
  poolMetricsDaily.dailyVolumeByTokenAmount = [
    poolMetricsDaily.dailyVolumeByTokenAmount[INT_ZERO].plus(token0Amount),
    poolMetricsDaily.dailyVolumeByTokenAmount[INT_ONE].plus(token1Amount),
  ];
  poolMetricsHourly.hourlyVolumeByTokenUSD = [
    poolMetricsHourly.hourlyVolumeByTokenUSD[INT_ZERO].plus(token0VolumeUSD),
    poolMetricsHourly.hourlyVolumeByTokenUSD[INT_ONE].plus(token1VolumeUSD),
  ];
  poolMetricsHourly.hourlyVolumeByTokenAmount = [
    poolMetricsHourly.hourlyVolumeByTokenAmount[INT_ZERO].plus(token0Amount),
    poolMetricsHourly.hourlyVolumeByTokenAmount[INT_ONE].plus(token1Amount),
  ];

  financialMetrics.dailyVolumeUSD = financialMetrics.dailyVolumeUSD.plus(trackedAmountUSD);
  pool.cumulativeVolumeUSD = pool.cumulativeVolumeUSD.plus(trackedAmountUSD);
  protocol.cumulativeVolumeUSD = protocol.cumulativeVolumeUSD.plus(trackedAmountUSD);

  financialMetrics.save();
  poolMetricsDaily.save();
  poolMetricsHourly.save();
  protocol.save();
  pool.save();
}

// Update store that tracks the deposit count per pool
export function updateDepositHelper(poolAddress: Address): void {
  let poolDeposits = _HelperStore.load(poolAddress.toHexString())!;
  poolDeposits.valueInt = poolDeposits.valueInt + INT_ONE;
  poolDeposits.save();
}
