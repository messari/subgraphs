import { Address, BigDecimal, BigInt, Bytes, ethereum, log, store } from "@graphprotocol/graph-ts";
import {
  Account,
  ActiveAccount,
  Deposit,
  DexAmmProtocol,
  LiquidityPool,
  Swap,
  Token,
  Withdraw,
} from "../../generated/schema";
import {
  getLiquidityPool,
  getLiquidityPoolFee,
  getOrCreateProtocol,
  getOrCreateFinancialsDailySnapshot,
  getOrCreateLiquidityPoolDailySnapshot,
  getOrCreateLiquidityPoolHourlySnapshot,
  getOrCreateUsageMetricDailySnapshot,
  getOrCreateUsageMetricHourlySnapshot,
  getOrCreateToken,
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
} from "./constants";
import { convertTokenToDecimal, percToDec, BigDecimalArray } from "./utils/utils";
import {
  findUSDPricePerToken,
  updateNativeTokenPriceInUSD,
} from "../price/price";

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
  financialMetricsDaily.activeLiquidityUSD = protocol.activeLiquidityUSD;
  financialMetricsDaily.totalLiquidityUSD = protocol.totalLiquidityUSD;
  financialMetricsDaily.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD;
  financialMetricsDaily.cumulativeSupplySideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD;
  financialMetricsDaily.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD;
  

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
    usageMetricsDaily.dailyDepositCount += INT_ONE;
  } else if (usageType == UsageType.WITHDRAW) {
    usageMetricsHourly.hourlyWithdrawCount += INT_ONE;
    usageMetricsDaily.dailyDepositCount += INT_ONE;
  } else if (usageType == UsageType.SWAP) {
    usageMetricsHourly.hourlySwapCount += INT_ONE;
    usageMetricsDaily.dailyDepositCount += INT_ONE;
  }

  // Combine the id and the user address to generate a unique user id for the day
  const dailyActiveAccountId = Address.fromString(from.concat("-").concat(dayId));
  let dailyActiveAccount = ActiveAccount.load(dailyActiveAccountId);
  if (!dailyActiveAccount) {
    dailyActiveAccount = new ActiveAccount(dailyActiveAccountId);
    usageMetricsDaily.dailyActiveUsers += INT_ONE;
    dailyActiveAccount.save();
  }

  const hourlyActiveAccountId = Address.fromString(from.concat("-").concat(hourId));
  let hourlyActiveAccount = ActiveAccount.load(hourlyActiveAccountId);
  if (!hourlyActiveAccount) {
    hourlyActiveAccount = new ActiveAccount(hourlyActiveAccountId);
    usageMetricsHourly.hourlyActiveUsers += INT_ONE;
    hourlyActiveAccount.save();
  }

  let account = Account.load(fromAddress);
  if (!account) {
    account = new Account(fromAddress);
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

// Update UsagePoolDailySnapshot entity
// Updated on Swap, Burn, and Mint events.
export function updatePoolMetrics(event: ethereum.Event): void {
  // get or create pool metrics
  const poolMetricsDaily = getOrCreateLiquidityPoolDailySnapshot(event);
  const poolMetricsHourly = getOrCreateLiquidityPoolHourlySnapshot(event);

  const pool = getLiquidityPool(
    event.address,
    event.block.number
  );



  // Update the block number and timestamp to that of the last transaction of that day
  poolMetricsDaily.totalValueLockedUSD = pool.totalValueLockedUSD;
  poolMetricsDaily.cumulativeVolumeUSD = pool.cumulativeVolumeUSD;
  poolMetricsDaily.inputTokenBalances = pool.inputTokenBalances;
  poolMetricsDaily.inputTokenWeights = pool.inputTokenWeights;
  poolMetricsDaily.activeLiquidity = pool.activeLiquidity;
  poolMetricsDaily.activeLiquidityUSD = pool.activeLiquidityUSD;
  poolMetricsDaily.totalLiquidity = pool.totalLiquidity;
  poolMetricsDaily.totalLiquidityUSD = pool.totalLiquidityUSD;
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
  poolMetricsHourly.activeLiquidity = pool.activeLiquidity;
  poolMetricsHourly.activeLiquidityUSD = pool.activeLiquidityUSD;
  poolMetricsHourly.totalLiquidity = pool.totalLiquidity;
  poolMetricsHourly.totalLiquidityUSD = pool.totalLiquidityUSD
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

  poolMetricsDaily.save();
  poolMetricsHourly.save();
}

// Upate token balances based on reserves emitted from the Sync event.
export function updateInputTokenBalances(
  poolAddress: Bytes,
  reserve0: BigInt,
  reserve1: BigInt,
  blockNumber: BigInt
): void {
  const pool = getLiquidityPool(poolAddress, blockNumber);

  const token0 = getOrCreateToken(pool.inputTokens[INT_ZERO]);
  const token1 = getOrCreateToken(pool.inputTokens[INT_ONE]);

  const tokenDecimal0 = convertTokenToDecimal(reserve0, token0.decimals);
  const tokenDecimal1 = convertTokenToDecimal(reserve1, token1.decimals);

  pool.inputTokenBalances = [reserve0, reserve1];

  const nativeToken = updateNativeTokenPriceInUSD();

  const token0PriceUSD = findUSDPricePerToken(token0, nativeToken, blockNumber);
  const token1PriceUSD = findUSDPricePerToken(token1, nativeToken, blockNumber);

  let token0BalanceUSD = token0PriceUSD.times(convertTokenToDecimal(reserve0, token0.decimals));
  let token1BalanceUSD = token1PriceUSD.times(convertTokenToDecimal(reserve1, token1.decimals));

  pool.inputTokenBalancesUSD = [token0BalanceUSD, token1BalanceUSD];
  pool.save();
}

// Update tvl an token prices in the Sync event.
export function updateTvlAndTokenPrices(
  poolAddress: Bytes,
  blockNumber: BigInt
): void {
  const pool = getLiquidityPool(poolAddress, blockNumber);

  const protocol = getOrCreateProtocol();

  const token0 = Token.load(pool.inputTokens[0]);
  const token1 = Token.load(pool.inputTokens[1]);

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
    pool.totalLiquidity,
    DEFAULT_DECIMALS
  );

  // Update LP token prices
  if (pool.totalLiquidity == BIGINT_ZERO) {
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
  // const supplyFee = getLiquidityPoolFee(pool.fees[INT_ZERO]);
  // const protocolFee = getLiquidityPoolFee(pool.fees[INT_ONE]);

  // Update volume occurred during swaps
  // poolMetricsDaily.dailyVolumeByTokenUSD = [
  //   poolMetricsDaily.dailyVolumeByTokenUSD[INT_ZERO].plus(
  //     trackedAmountUSD[INT_ZERO]
  //   ),
  //   poolMetricsDaily.dailyVolumeByTokenUSD[INT_ONE].plus(
  //     trackedAmountUSD[INT_ONE]
  //   ),
  // ];
  poolMetricsDaily.dailyVolumeTokenAmounts = [
    poolMetricsDaily.dailyVolumeTokenAmounts[INT_ZERO].plus(token0Amount),
    poolMetricsDaily.dailyVolumeTokenAmounts[INT_ONE].plus(token1Amount),
  ];
  // poolMetricsHourly.hourlyVolumeByTokenUSD = [
  //   poolMetricsHourly.hourlyVolumeByTokenUSD[INT_ZERO].plus(
  //     trackedAmountUSD[INT_ZERO]
  //   ),
  //   poolMetricsHourly.hourlyVolumeByTokenUSD[INT_ONE].plus(
  //     trackedAmountUSD[INT_ONE]
  //   ),
  // ];
  poolMetricsHourly.hourlyVolumeTokenAmounts = [
    poolMetricsHourly.hourlyVolumeTokenAmounts[INT_ZERO].plus(token0Amount),
    poolMetricsHourly.hourlyVolumeTokenAmounts[INT_ONE].plus(token1Amount),
  ];

  poolMetricsDaily.dailyTotalVolumeUSD = poolMetricsDaily.dailyTotalVolumeUSD.plus(
    trackedAmountUSD[INT_TWO]
  );
  poolMetricsHourly.hourlyTotalVolumeUSD = poolMetricsHourly.hourlyTotalVolumeUSD.plus(
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

export function updateMetricsDepositsHelper(event: ethereum.Event, valueUSD: BigDecimal): void {
  const protocol = getOrCreateProtocol();

  // Number of days since Unix epoch
  const day = event.block.timestamp.toI32() / SECONDS_PER_DAY;
  const hour = event.block.timestamp.toI32() / SECONDS_PER_HOUR;

  const dayId = day.toString();
  const hourId = hour.toString();

}
