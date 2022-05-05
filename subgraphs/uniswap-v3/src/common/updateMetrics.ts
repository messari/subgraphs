// import { log } from '@graphprotocol/graph-ts'
import { BigDecimal, ethereum, BigInt, Address } from "@graphprotocol/graph-ts";
import { NetworkConfigs } from "../../config/paramConfig";
import { UsageMetricsDailySnapshot, Account, Token, ActiveAccount, UsageMetricsHourlySnapshot, _HelperStore, DexAmmProtocol, LiquidityPool } from "../../generated/schema";
import { Pool } from "../../generated/templates/Pool/Pool";
import { SECONDS_PER_DAY, INT_ZERO, INT_ONE, BIGDECIMAL_ONE, UsageType, SECONDS_PER_HOUR, INT_TWO, BIGINT_ZERO, BIGINT_NEG_ONE } from "./constants";
import {
  getOrCreateDex,
  getLiquidityPool,
  getLiquidityPoolFee,
  getLiquidityPoolAmounts,
  getOrCreateToken,
  getOrCreateTokenWhitelist,
  getOrCreateLiquidityPoolDailySnapshot,
  getOrCreateLiquidityPoolHourlySnapshot,
  getOrCreateFinancialsDailySnapshot,
  getOrCreateUsageMetricDailySnapshot,
  getOrCreateUsageMetricHourlySnapshot,
} from "./getters";
import { findNativeTokenPerToken, sqrtPriceX96ToTokenPrices, updateNativeTokenPriceInUSD } from "./price/price";
import { percToDec } from "./utils/utils";

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

export function updatePrices(event: ethereum.Event, sqrtPriceX96: BigInt): void {
  let pool = getLiquidityPool(event.address.toHexString());
  let poolAmounts = getLiquidityPoolAmounts(event.address.toHexString());

  // Retrieve token Trackers
  let token0 = getOrCreateToken(pool.inputTokens[0]);
  let token1 = getOrCreateToken(pool.inputTokens[1]);

  // update native token price now that prices could have changed
  let nativeToken = updateNativeTokenPriceInUSD();

  poolAmounts.tokenPrices = sqrtPriceX96ToTokenPrices(sqrtPriceX96, token0 as Token, token1 as Token);
  poolAmounts.save();

  // update token prices
  token0.lastPriceUSD = findNativeTokenPerToken(token0, nativeToken);
  token1.lastPriceUSD = findNativeTokenPerToken(token1, nativeToken);

  token0.lastPriceBlockNumber = event.block.number;
  token1.lastPriceBlockNumber = event.block.number;

  token0.save();
  token1.save();
  nativeToken.save();
}

// Update the volume and accrued fees for all relavant entities
export function updateVolumeAndFees(
  event: ethereum.Event,
  protocol: DexAmmProtocol,
  pool: LiquidityPool,
  trackedAmountUSD: BigDecimal[],
  token0Amount: BigInt,
  token1Amount: BigInt
): void {
  let financialMetrics = getOrCreateFinancialsDailySnapshot(event);
  let poolMetricsDaily = getOrCreateLiquidityPoolDailySnapshot(event);
  let poolMetricsHourly = getOrCreateLiquidityPoolHourlySnapshot(event);
  let supplyFee = getLiquidityPoolFee(pool.fees[INT_ZERO]);
  let protocolFee = getLiquidityPoolFee(pool.fees[INT_ONE]);

  // Update volume occurred during swaps
  poolMetricsDaily.dailyVolumeByTokenUSD = [
    poolMetricsDaily.dailyVolumeByTokenUSD[INT_ZERO].plus(trackedAmountUSD[INT_ZERO]),
    poolMetricsDaily.dailyVolumeByTokenUSD[INT_ONE].plus(trackedAmountUSD[INT_ONE]),
  ];
  if (token0Amount.lt(BIGINT_ZERO)) {
    poolMetricsDaily.dailyVolumeByTokenAmount = [
      poolMetricsDaily.dailyVolumeByTokenAmount[INT_ZERO].plus(token0Amount.times(BIGINT_NEG_ONE)),
      poolMetricsDaily.dailyVolumeByTokenAmount[INT_ONE].plus(token1Amount),
    ];
  } else {
    poolMetricsDaily.dailyVolumeByTokenAmount = [
      poolMetricsDaily.dailyVolumeByTokenAmount[INT_ZERO].minus(token0Amount),
      poolMetricsDaily.dailyVolumeByTokenAmount[INT_ONE].minus(token1Amount.times(BIGINT_NEG_ONE)),
    ];
  }

  poolMetricsHourly.hourlyVolumeByTokenUSD = [
    poolMetricsHourly.hourlyVolumeByTokenUSD[INT_ZERO].plus(trackedAmountUSD[INT_ZERO]),
    poolMetricsHourly.hourlyVolumeByTokenUSD[INT_ONE].plus(trackedAmountUSD[INT_ONE]),
  ];
  if (token0Amount.lt(BIGINT_ZERO)) {
    poolMetricsHourly.hourlyVolumeByTokenAmount = [
      poolMetricsHourly.hourlyVolumeByTokenAmount[INT_ZERO].plus(token0Amount.times(BIGINT_NEG_ONE)),
      poolMetricsHourly.hourlyVolumeByTokenAmount[INT_ONE].plus(token1Amount),
    ];
  } else {
    poolMetricsHourly.hourlyVolumeByTokenAmount = [
      poolMetricsHourly.hourlyVolumeByTokenAmount[INT_ZERO].minus(token0Amount),
      poolMetricsHourly.hourlyVolumeByTokenAmount[INT_ONE].minus(token1Amount.times(BIGINT_NEG_ONE)),
    ];
  }

  poolMetricsDaily.dailyVolumeUSD = poolMetricsDaily.dailyVolumeUSD.plus(trackedAmountUSD[INT_TWO]);
  poolMetricsHourly.hourlyVolumeUSD = poolMetricsHourly.hourlyVolumeUSD.plus(trackedAmountUSD[INT_TWO]);

  financialMetrics.dailyVolumeUSD = financialMetrics.dailyVolumeUSD.plus(trackedAmountUSD[INT_TWO]);
  pool.cumulativeVolumeUSD = pool.cumulativeVolumeUSD.plus(trackedAmountUSD[INT_TWO]);
  protocol.cumulativeVolumeUSD = protocol.cumulativeVolumeUSD.plus(trackedAmountUSD[INT_TWO]);

  let supplyFeeAmountUSD = trackedAmountUSD[INT_TWO].times(percToDec(supplyFee.feePercentage!));
  let protocolFeeAmountUSD = trackedAmountUSD[INT_TWO].times(percToDec(protocolFee.feePercentage!));
  let tradingFeeAmountUSD = supplyFeeAmountUSD.plus(protocolFeeAmountUSD);

  // Update fees collected during swaps
  protocol.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD.plus(tradingFeeAmountUSD);
  protocol.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD.plus(supplyFeeAmountUSD);
  protocol.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD.plus(protocolFeeAmountUSD);

  financialMetrics.dailyTotalRevenueUSD = financialMetrics.dailyTotalRevenueUSD.plus(tradingFeeAmountUSD);
  financialMetrics.dailySupplySideRevenueUSD = financialMetrics.dailySupplySideRevenueUSD.plus(supplyFeeAmountUSD);
  financialMetrics.dailyProtocolSideRevenueUSD = financialMetrics.dailyProtocolSideRevenueUSD.plus(protocolFeeAmountUSD);

  financialMetrics.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD;
  financialMetrics.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD;
  financialMetrics.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD;

  financialMetrics.save();
  poolMetricsDaily.save();
  poolMetricsHourly.save();
  protocol.save();
  pool.save();
}

export function updateProtocolFees(event: ethereum.Event): void {
  let poolContract = Pool.bind(event.address);
  let pool = getLiquidityPool(event.address.toString());

  let tradingFee = getLiquidityPoolFee(pool.fees[0]);
  let protocolFee = getLiquidityPoolFee(pool.fees[1]);

  // Get the total proportion of swap value collected as a fee
  let totalPoolFee = tradingFee.feePercentage!.plus(protocolFee.feePercentage!);

  // Value5 is the feeProtocol variabe in the slot0 struct of the pool contract
  let feeProtocol = poolContract.slot0().value5;
  let protocolFeeProportion = BIGDECIMAL_ONE.div(BigDecimal.fromString(feeProtocol.toString()));

  // Update protocol and trading fees for this pool
  tradingFee.feePercentage = totalPoolFee.times(BIGDECIMAL_ONE.minus(protocolFeeProportion));
  protocolFee.feePercentage = totalPoolFee.times(protocolFeeProportion);

  tradingFee.save();
  protocolFee.save();
}
