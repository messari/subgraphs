import { Address, BigDecimal, BigInt, ethereum, log, store } from "@graphprotocol/graph-ts";
import {
  Account,
  ActiveAccount,
  Deposit,
  DexAmmProtocol,
  LiquidityPool,
  Stat,
  Swap,
  Token,
  Withdraw,
  _HelperStore,
} from "../../generated/schema";
import {
  getLiquidityPool,
  getLiquidityPoolAmounts,
  getLiquidityPoolFee,
  getOrCreateProtocol,
  getOrCreateFinancialsDailySnapshot,
  getOrCreateLiquidityPoolDailySnapshot,
  getOrCreateLiquidityPoolHourlySnapshot,
  getOrCreateToken,
  getOrCreateTokenWhitelist,
  getOrCreateUsageMetricDailySnapshot,
  getOrCreateUsageMetricHourlySnapshot,
} from "./getters";
import {
  BIGDECIMAL_ZERO,
  BIGINT_ONE,
  BIGINT_ZERO,
  DEFAULT_DECIMALS,
  INT_ONE,
  INT_TWO,
  INT_ZERO,
  SECONDS_PER_DAY,
  SECONDS_PER_HOUR,
  UsageType,
  DepositValueEntitySuffix,
  StatValueEntitySuffix
} from "./constants";
import { convertTokenToDecimal, percToDec, BigDecimalArray } from "./utils/utils";
import {
  findUSDPricePerToken,
  updateNativeTokenPriceInUSD,
} from "../price/price";
import { NetworkConfigs } from "../../configurations/configure";
import { createStat } from "./creators";

// Update FinancialsDailySnapshots entity
// Updated on Swap, Burn, and Mint events.
export function updateFinancials(event: ethereum.Event): void {
  const financialMetricsDaily = getOrCreateFinancialsDailySnapshot(event);

  const protocol = getOrCreateProtocol();

  // Update the block number and timestamp to that of the last transaction of that day
  financialMetricsDaily.blockNumber = event.block.number;
  financialMetricsDaily.timestamp = event.block.timestamp;
  financialMetricsDaily.totalValueLockedUSD = protocol.totalValueLockedUSD;
  financialMetricsDaily.cumulativeVolumeUSD = protocol.cumulativeVolumeUSD;

  financialMetricsDaily.save();
}

// Update usage metrics entities
// Updated on Swap, Burn, and Mint events.
export function updateUsageMetrics(
  event: ethereum.Event,
  fromAddress: Address,
  usageType: string
): void {
  const from = fromAddress.toHexString();

  const usageMetricsDaily = getOrCreateUsageMetricDailySnapshot(event);
  const usageMetricsHourly = getOrCreateUsageMetricHourlySnapshot(event);

  const protocol = getOrCreateProtocol();

  // Update the block number and timestamp to that of the last transaction of that day
  usageMetricsDaily.blockNumber = event.block.number;
  usageMetricsDaily.timestamp = event.block.timestamp;
  usageMetricsDaily.dailyTransactionCount += INT_ONE;

  usageMetricsHourly.blockNumber = event.block.number;
  usageMetricsHourly.timestamp = event.block.timestamp;
  usageMetricsHourly.hourlyTransactionCount += INT_ONE;

  // Number of days since Unix epoch
  const day = event.block.timestamp.toI32() / SECONDS_PER_DAY;
  const hour = event.block.timestamp.toI32() / SECONDS_PER_HOUR;

  const dayId = day.toString();
  const hourId = hour.toString();

  if (usageType == UsageType.DEPOSIT) {

    usageMetricsHourly.hourlyDepositCount += INT_ONE;
    usageMetricsDaily.depositStats = updateDepositMetricsUSD(protocol.id, event);
  } else if (usageType == UsageType.WITHDRAW) {
    usageMetricsHourly.hourlyWithdrawCount += INT_ONE;
    usageMetricsDaily.withdrawStats = updateWithdrawMetricsUSD(protocol.id, event);
  } else if (usageType == UsageType.SWAP) {
    usageMetricsHourly.hourlySwapCount += INT_ONE;
    usageMetricsDaily.swapStats = updateSwapMetricsUSD(protocol.id, event);
  }

  // Combine the id and the user address to generate a unique user id for the day
  const dailyActiveAccountId = from.concat("-").concat(dayId);
  let dailyActiveAccount = ActiveAccount.load(dailyActiveAccountId);
  if (!dailyActiveAccount) {
    dailyActiveAccount = new ActiveAccount(dailyActiveAccountId);
    usageMetricsDaily.dailyActiveUsers += INT_ONE;
    dailyActiveAccount.save();
  }

  const hourlyActiveAccountId = from.concat("-").concat(hourId);
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
    account.positionCount = INT_ZERO;
    account.openPositionCount = INT_ZERO;
    account.closedPositionCount = INT_ZERO;
    account.depositCount = INT_ZERO;
    account.withdrawCount = INT_ZERO;
    account.swapCount = INT_ZERO;
    account.save();
  }
  usageMetricsDaily.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;
  usageMetricsHourly.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;

  usageMetricsDaily.save();
  usageMetricsHourly.save();
  protocol.save();
}

/**
 * Updates daily deposit usage metrics stats for a given day
 * @param event 
 * @returns string the id of the stat entity for the given day
 */
function updateDepositMetricsUSD(statTypeId:string, event: ethereum.Event): string {

  // Number of days since Unix epoch
  const day = event.block.timestamp.toI32() / SECONDS_PER_DAY;
  const dayId = day.toString();

  const statId = statTypeId.concat("-deposit-").concat(dayId);
  let stat = Stat.load(statId);
  if (!stat) {
    stat = createStat(statId)
  }
  const transactionHash = event.transaction.hash.toHexString();
  const deposit = Deposit.load(
    transactionHash.concat("-").concat(event.logIndex.toString())
  );

  if (deposit && deposit.amountUSD) {
    const amountUSD = deposit.amountUSD;

    let valuesUSD = stat._valuesUSD;
    valuesUSD.push(amountUSD);
    stat._valuesUSD = valuesUSD;
    stat.meanUSD = BigDecimalArray.mean(valuesUSD);
    stat.medianUSD = BigDecimalArray.median(valuesUSD);
    stat.maxUSD = BigDecimalArray.maxValue(valuesUSD);
    stat.minUSD = BigDecimalArray.minValue(valuesUSD);
  }

  stat.count = stat.count.plus(BIGINT_ONE);
  stat.save();
  return stat.id;
}


/*
 * Updates withdraw usage metrics stats for the day or hour
 * @param timeStampId
 * @param protocolId
 * @param valuesSuffix
 * @param event 
 * @returns string the id of the stat entity 
 */
function updateWithdrawMetricsUSD(statTypeId: string, event: ethereum.Event): string {

  const day = event.block.timestamp.toI32() / SECONDS_PER_DAY;
  const dayId = day.toString();

  const statId = statTypeId.concat("-withdraw-").concat(dayId);
  let stat = Stat.load(statId);
  if (!stat) {
    stat = createStat(statId);
  }
  const transactionHash = event.transaction.hash.toHexString();
  const withdraw = Withdraw.load(
    transactionHash.concat("-").concat(event.logIndex.toString())
  );

  if (withdraw && withdraw.amountUSD) {
    const amountUSD = withdraw.amountUSD;
    let valuesUSD = stat._valuesUSD;
    valuesUSD.push(amountUSD);
    stat.meanUSD = BigDecimalArray.mean(valuesUSD);
    stat.medianUSD = BigDecimalArray.median(valuesUSD);
    stat.maxUSD = BigDecimalArray.maxValue(valuesUSD);
    stat.minUSD = BigDecimalArray.minValue(valuesUSD);
  }

  stat.count = stat.count.plus(BIGINT_ONE);
  stat.save();
  return stat.id;
}

/*
 * Updates swap usage metrics stats for the day or hour
 * @param timeStampId
 * @param protocolId
 * @param valuesSuffix
 * @param event 
 * @returns string the id of the stat entity 
 */
function updateSwapMetricsUSD(statTypeId: string, event: ethereum.Event): string {

  const day = event.block.timestamp.toI32() / SECONDS_PER_DAY;
  const dayId = day.toString();

  const statId = statTypeId.concat("-swap-").concat(dayId);
  let stat = Stat.load(statId);
  if (!stat) {
    stat = createStat(statId);
  }
  const transactionHash = event.transaction.hash.toHexString();
  const swap = Swap.load(
    transactionHash.concat("-").concat(event.logIndex.toString())
  );

  if (swap && swap.amountInUSD) {
    const amountUSD = swap.amountInUSD
    let valuesUSD = stat._valuesUSD;
    valuesUSD.push(amountUSD)
    stat._valuesUSD = valuesUSD;
    stat.count = stat.count.plus(BIGINT_ONE);
    const meanUsd = BigDecimalArray.mean(valuesUSD);
    stat.meanUSD = meanUsd;
    stat.medianUSD = BigDecimalArray.median(valuesUSD);
    stat.maxUSD = BigDecimalArray.maxValue(valuesUSD);
    stat.minUSD = BigDecimalArray.minValue(valuesUSD);
  }

  stat.count = stat.count.plus(BIGINT_ONE);
  stat.save();
  return stat.id;
}




// Update UsagePoolDailySnapshot entity
// Updated on Swap, Burn, and Mint events.
export function updatePoolMetrics(event: ethereum.Event): void {
  // get or create pool metrics
  const poolMetricsDaily = getOrCreateLiquidityPoolDailySnapshot(event);
  const poolMetricsHourly = getOrCreateLiquidityPoolHourlySnapshot(event);

  const pool = getLiquidityPool(
    event.address.toHexString(),
    event.block.number
  );



  // Update the block number and timestamp to that of the last transaction of that day
  poolMetricsDaily.totalValueLockedUSD = pool.totalValueLockedUSD;
  poolMetricsDaily.cumulativeVolumeUSD = pool.cumulativeVolumeUSD;
  poolMetricsDaily.inputTokenBalances = pool.inputTokenBalances;
  poolMetricsDaily.inputTokenWeights = pool.inputTokenWeights;
  poolMetricsDaily.outputTokenSupply = pool.outputTokenSupply;
  poolMetricsDaily.outputTokenPriceUSD = pool.outputTokenPriceUSD;
  poolMetricsDaily.blockNumber = event.block.number;
  poolMetricsDaily.timestamp = event.block.timestamp;
  poolMetricsDaily.rewardTokenEmissionsAmount = pool.rewardTokenEmissionsAmount;
  poolMetricsDaily.rewardTokenEmissionsUSD = pool.rewardTokenEmissionsUSD;
  poolMetricsDaily.stakedOutputTokenAmount = pool.stakedOutputTokenAmount;
  poolMetricsDaily.cumulativeTotalRevenueUSD = pool.cumulativeTotalRevenueUSD;
  poolMetricsDaily.cumulativeSupplySideRevenueUSD =
    pool.cumulativeSupplySideRevenueUSD;
  poolMetricsDaily.cumulativeProtocolSideRevenueUSD =
    pool.cumulativeProtocolSideRevenueUSD;

  poolMetricsHourly.totalValueLockedUSD = pool.totalValueLockedUSD;
  poolMetricsHourly.cumulativeVolumeUSD = pool.cumulativeVolumeUSD;
  poolMetricsHourly.inputTokenBalances = pool.inputTokenBalances;
  poolMetricsHourly.inputTokenWeights = pool.inputTokenWeights;
  poolMetricsHourly.outputTokenSupply = pool.outputTokenSupply;
  poolMetricsHourly.outputTokenPriceUSD = pool.outputTokenPriceUSD;
  poolMetricsHourly.blockNumber = event.block.number;
  poolMetricsHourly.timestamp = event.block.timestamp;
  poolMetricsHourly.rewardTokenEmissionsAmount =
    pool.rewardTokenEmissionsAmount;
  poolMetricsHourly.rewardTokenEmissionsUSD = pool.rewardTokenEmissionsUSD;
  poolMetricsHourly.stakedOutputTokenAmount = pool.stakedOutputTokenAmount;
  poolMetricsHourly.cumulativeTotalRevenueUSD = pool.cumulativeTotalRevenueUSD;
  poolMetricsHourly.cumulativeSupplySideRevenueUSD =
    pool.cumulativeSupplySideRevenueUSD;
  poolMetricsHourly.cumulativeProtocolSideRevenueUSD =
    pool.cumulativeProtocolSideRevenueUSD;

  poolMetricsDaily.depositStats = updateDepositMetricsUSD(pool.id, event);
  poolMetricsDaily.withdrawStats = updateWithdrawMetricsUSD(pool.id, event);
  poolMetricsDaily.swapStats = updateSwapMetricsUSD(pool.id, event)
  poolMetricsDaily.save();
  poolMetricsHourly.save();
}

// These whiteslists are used to track what pools the tokens are a part of. Used in price calculations.
// Updated at the time of pool created (poolCreated event)
export function updateTokenWhitelists(
  token0: Token,
  token1: Token,
  poolAddress: string
): void {
  const tokenWhitelist0 = getOrCreateTokenWhitelist(token0.id);
  const tokenWhitelist1 = getOrCreateTokenWhitelist(token1.id);

  // update white listed pools
  if (NetworkConfigs.getWhitelistTokens().includes(tokenWhitelist0.id)) {
    const newPools = tokenWhitelist1.whitelistPools;
    newPools.push(poolAddress);
    tokenWhitelist1.whitelistPools = newPools;
    tokenWhitelist1.save();
  }

  if (NetworkConfigs.getWhitelistTokens().includes(tokenWhitelist1.id)) {
    const newPools = tokenWhitelist0.whitelistPools;
    newPools.push(poolAddress);
    tokenWhitelist0.whitelistPools = newPools;
    tokenWhitelist0.save();
  }
}

// Upate token balances based on reserves emitted from the Sync event.
export function updateInputTokenBalances(
  poolAddress: string,
  reserve0: BigInt,
  reserve1: BigInt,
  blockNumber: BigInt
): void {
  const pool = getLiquidityPool(poolAddress, blockNumber);
  const poolAmounts = getLiquidityPoolAmounts(poolAddress);

  const token0 = getOrCreateToken(pool.inputTokens[INT_ZERO]);
  const token1 = getOrCreateToken(pool.inputTokens[INT_ONE]);

  const tokenDecimal0 = convertTokenToDecimal(reserve0, token0.decimals);
  const tokenDecimal1 = convertTokenToDecimal(reserve1, token1.decimals);

  poolAmounts.inputTokenBalances = [tokenDecimal0, tokenDecimal1];
  pool.inputTokenBalances = [reserve0, reserve1];

  const nativeToken = updateNativeTokenPriceInUSD();

  const token0PriceUSD = findUSDPricePerToken(token0, nativeToken, blockNumber);
  const token1PriceUSD = findUSDPricePerToken(token1, nativeToken, blockNumber);

  let token0BalanceUSD = token0PriceUSD.times(convertTokenToDecimal(reserve0, token0.decimals));
  let token1BalanceUSD = token1PriceUSD.times(convertTokenToDecimal(reserve1, token1.decimals));

  pool.inputTokenBalancesUSD = [token0BalanceUSD, token1BalanceUSD];
  poolAmounts.save();
  pool.save();
}

// Update tvl an token prices in the Sync event.
export function updateTvlAndTokenPrices(
  poolAddress: string,
  blockNumber: BigInt
): void {
  const pool = getLiquidityPool(poolAddress, blockNumber);

  const protocol = getOrCreateProtocol();

  const token0 = getOrCreateToken(pool.inputTokens[0]);
  const token1 = getOrCreateToken(pool.inputTokens[1]);

  const nativeToken = updateNativeTokenPriceInUSD();

  token0.lastPriceUSD = findUSDPricePerToken(token0, nativeToken, blockNumber);
  token1.lastPriceUSD = findUSDPricePerToken(token1, nativeToken, blockNumber);

  // Subtract the old pool tvl
  protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.minus(
    pool.totalValueLockedUSD
  );

  const inputToken0 = convertTokenToDecimal(
    pool.inputTokenBalances[0],
    token0.decimals
  );
  const inputToken1 = convertTokenToDecimal(
    pool.inputTokenBalances[1],
    token1.decimals
  );

  // Get new tvl
  const newTvl = token0
    .lastPriceUSD!.times(inputToken0)
    .plus(token1.lastPriceUSD!.times(inputToken1));

  // Add the new pool tvl
  pool.totalValueLockedUSD = newTvl;
  protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.plus(newTvl);

  const outputTokenSupply = convertTokenToDecimal(
    pool.outputTokenSupply!,
    DEFAULT_DECIMALS
  );

  // Update LP token prices
  if (pool.outputTokenSupply! == BIGINT_ZERO) {
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

// Update the volume and fees from financial metrics snapshot, pool metrics snapshot, protocol, and pool entities.
// Updated on Swap event.
export function updateVolumeAndFees(
  event: ethereum.Event,
  protocol: DexAmmProtocol,
  pool: LiquidityPool,
  trackedAmountUSD: BigDecimal[],
  token0Amount: BigInt,
  token1Amount: BigInt
): void {
  const financialMetrics = getOrCreateFinancialsDailySnapshot(event);
  const poolMetricsDaily = getOrCreateLiquidityPoolDailySnapshot(event);
  const poolMetricsHourly = getOrCreateLiquidityPoolHourlySnapshot(event);
  const supplyFee = getLiquidityPoolFee(pool.fees[INT_ZERO]);
  const protocolFee = getLiquidityPoolFee(pool.fees[INT_ONE]);

  // Update volume occurred during swaps
  poolMetricsDaily.dailyVolumeByTokenUSD = [
    poolMetricsDaily.dailyVolumeByTokenUSD[INT_ZERO].plus(
      trackedAmountUSD[INT_ZERO]
    ),
    poolMetricsDaily.dailyVolumeByTokenUSD[INT_ONE].plus(
      trackedAmountUSD[INT_ONE]
    ),
  ];
  poolMetricsDaily.dailyVolumeByTokenAmount = [
    poolMetricsDaily.dailyVolumeByTokenAmount[INT_ZERO].plus(token0Amount),
    poolMetricsDaily.dailyVolumeByTokenAmount[INT_ONE].plus(token1Amount),
  ];
  poolMetricsHourly.hourlyVolumeByTokenUSD = [
    poolMetricsHourly.hourlyVolumeByTokenUSD[INT_ZERO].plus(
      trackedAmountUSD[INT_ZERO]
    ),
    poolMetricsHourly.hourlyVolumeByTokenUSD[INT_ONE].plus(
      trackedAmountUSD[INT_ONE]
    ),
  ];
  poolMetricsHourly.hourlyVolumeByTokenAmount = [
    poolMetricsHourly.hourlyVolumeByTokenAmount[INT_ZERO].plus(token0Amount),
    poolMetricsHourly.hourlyVolumeByTokenAmount[INT_ONE].plus(token1Amount),
  ];

  poolMetricsDaily.dailyVolumeUSD = poolMetricsDaily.dailyVolumeUSD.plus(
    trackedAmountUSD[INT_TWO]
  );
  poolMetricsHourly.hourlyVolumeUSD = poolMetricsHourly.hourlyVolumeUSD.plus(
    trackedAmountUSD[INT_TWO]
  );

  financialMetrics.dailyVolumeUSD = financialMetrics.dailyVolumeUSD.plus(
    trackedAmountUSD[INT_TWO]
  );
  pool.cumulativeVolumeUSD = pool.cumulativeVolumeUSD.plus(
    trackedAmountUSD[INT_TWO]
  );
  protocol.cumulativeVolumeUSD = protocol.cumulativeVolumeUSD.plus(
    trackedAmountUSD[INT_TWO]
  );

  const supplyFeeAmountUSD = trackedAmountUSD[INT_TWO].times(
    percToDec(supplyFee.feePercentage!)
  );
  const protocolFeeAmountUSD = trackedAmountUSD[INT_TWO].times(
    percToDec(protocolFee.feePercentage!)
  );
  const tradingFeeAmountUSD = supplyFeeAmountUSD.plus(protocolFeeAmountUSD);

  // Update fees collected during swaps
  // Protocol
  protocol.cumulativeTotalRevenueUSD =
    protocol.cumulativeTotalRevenueUSD.plus(tradingFeeAmountUSD);
  protocol.cumulativeSupplySideRevenueUSD =
    protocol.cumulativeSupplySideRevenueUSD.plus(supplyFeeAmountUSD);
  protocol.cumulativeProtocolSideRevenueUSD =
    protocol.cumulativeProtocolSideRevenueUSD.plus(protocolFeeAmountUSD);

  // Pool
  pool.cumulativeTotalRevenueUSD =
    pool.cumulativeTotalRevenueUSD.plus(tradingFeeAmountUSD);
  pool.cumulativeSupplySideRevenueUSD =
    pool.cumulativeSupplySideRevenueUSD.plus(supplyFeeAmountUSD);
  pool.cumulativeProtocolSideRevenueUSD =
    pool.cumulativeProtocolSideRevenueUSD.plus(protocolFeeAmountUSD);

  // Daily Financials
  financialMetrics.dailyTotalRevenueUSD =
    financialMetrics.dailyTotalRevenueUSD.plus(tradingFeeAmountUSD);
  financialMetrics.dailySupplySideRevenueUSD =
    financialMetrics.dailySupplySideRevenueUSD.plus(supplyFeeAmountUSD);
  financialMetrics.dailyProtocolSideRevenueUSD =
    financialMetrics.dailyProtocolSideRevenueUSD.plus(protocolFeeAmountUSD);

  financialMetrics.cumulativeTotalRevenueUSD =
    protocol.cumulativeTotalRevenueUSD;
  financialMetrics.cumulativeSupplySideRevenueUSD =
    protocol.cumulativeSupplySideRevenueUSD;
  financialMetrics.cumulativeProtocolSideRevenueUSD =
    protocol.cumulativeProtocolSideRevenueUSD;

  // Daily Pool Metrics
  poolMetricsDaily.dailyTotalRevenueUSD =
    poolMetricsDaily.dailyTotalRevenueUSD.plus(tradingFeeAmountUSD);
  poolMetricsDaily.dailySupplySideRevenueUSD =
    poolMetricsDaily.dailySupplySideRevenueUSD.plus(supplyFeeAmountUSD);
  poolMetricsDaily.dailyProtocolSideRevenueUSD =
    poolMetricsDaily.dailyProtocolSideRevenueUSD.plus(protocolFeeAmountUSD);

  poolMetricsDaily.cumulativeTotalRevenueUSD = pool.cumulativeTotalRevenueUSD;
  poolMetricsDaily.cumulativeSupplySideRevenueUSD =
    pool.cumulativeSupplySideRevenueUSD;
  poolMetricsDaily.cumulativeProtocolSideRevenueUSD =
    pool.cumulativeProtocolSideRevenueUSD;

  // Hourly Pool Metrics
  poolMetricsHourly.hourlyTotalRevenueUSD =
    poolMetricsHourly.hourlyTotalRevenueUSD.plus(tradingFeeAmountUSD);
  poolMetricsHourly.hourlySupplySideRevenueUSD =
    poolMetricsHourly.hourlySupplySideRevenueUSD.plus(supplyFeeAmountUSD);
  poolMetricsHourly.hourlyProtocolSideRevenueUSD =
    poolMetricsHourly.hourlyProtocolSideRevenueUSD.plus(protocolFeeAmountUSD);

  poolMetricsHourly.cumulativeTotalRevenueUSD = pool.cumulativeTotalRevenueUSD;
  poolMetricsHourly.cumulativeSupplySideRevenueUSD =
    pool.cumulativeSupplySideRevenueUSD;
  poolMetricsHourly.cumulativeProtocolSideRevenueUSD =
    pool.cumulativeProtocolSideRevenueUSD;

  financialMetrics.save();
  poolMetricsDaily.save();
  poolMetricsHourly.save();
  protocol.save();
  pool.save();
}

// Update store that tracks the deposit count per pool
export function updateDepositHelper(poolAddress: Address): void {
  const poolDeposits = _HelperStore.load(poolAddress.toHexString())!;
  poolDeposits.valueInt = poolDeposits.valueInt + INT_ONE;
  poolDeposits.save();
}

export function updateMetricsDepositsHelper(event: ethereum.Event, valueUSD: BigDecimal): void {
  const protocol = getOrCreateProtocol();

  // Number of days since Unix epoch
  const day = event.block.timestamp.toI32() / SECONDS_PER_DAY;
  const hour = event.block.timestamp.toI32() / SECONDS_PER_HOUR;

  const dayId = day.toString();
  const hourId = hour.toString();

}
