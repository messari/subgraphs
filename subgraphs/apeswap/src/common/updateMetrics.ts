import {
  log,
  dataSource,
  Address,
  BigDecimal,
  BigInt,
  Bytes,
  ethereum,
} from "@graphprotocol/graph-ts";
import {
  Account,
  DailyActiveAccount,
  Token,
  UsageMetricsDailySnapshot,
  _HelperStore,
  _TokenWhitelist,
} from "../../generated/schema";
import {
  getLiquidityPool,
  getLiquidityPoolAmounts,
  getOrCreateDex,
  getOrCreateFinancials,
  getOrCreatePoolDailySnapshot,
  getOrCreateToken,
  getOrCreateTokenWhitelist,
  getOrCreateUsersHelper,
} from "./getters";
import {
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  DEFAULT_DECIMALS,
  INT_ONE,
  SECONDS_PER_DAY,
  UsageType,
} from "./constants";
import { convertTokenToDecimal } from "./utils/utils";
import { findNativeTokenPerToken, updateNativeTokenPriceInUSD } from "./price/price";
import { NetworkConfigs } from "../../config/_networkConfig";

// Update FinancialsDailySnapshots entity
export function updateFinancials(event: ethereum.Event): void {
  let financialMetrics = getOrCreateFinancials(event);
  let protocol = getOrCreateDex();

  // Update the block number and timestamp to that of the last transaction of that day
  financialMetrics.blockNumber = event.block.number;
  financialMetrics.timestamp = event.block.timestamp;
  financialMetrics.totalValueLockedUSD = protocol.totalValueLockedUSD;
  financialMetrics.cumulativeVolumeUSD = protocol.cumulativeVolumeUSD;

  financialMetrics.save();
}

export function updateUsageMetrics(
  event: ethereum.Event,
  from: string,
  usageType: string,
): void {
  // Number of days since Unix epoch
  let dayID = event.block.timestamp.toI32() / SECONDS_PER_DAY;
  let id = dayID.toString();
  let usageMetrics = UsageMetricsDailySnapshot.load(id);
  let totalUniqueUsers = getOrCreateUsersHelper();
  let protocol = getOrCreateDex();

  if (!usageMetrics) {
    usageMetrics = new UsageMetricsDailySnapshot(id);
    usageMetrics.protocol = NetworkConfigs.FACTORY_ADDRESS;
    usageMetrics.dailyActiveUsers = 0;
    usageMetrics.cumulativeUniqueUsers = 0;
    usageMetrics.dailyTransactionCount = 0;
  }

  // Update the block number and timestamp to that of the last transaction of that day
  usageMetrics.blockNumber = event.block.number;
  usageMetrics.timestamp = event.block.timestamp;
  usageMetrics.dailyTransactionCount += 1;
  if (usageType == UsageType.DEPOSIT) {
    usageMetrics.dailyDepositCount += 1;
  } else if (usageType == UsageType.WITHDRAW) {
    usageMetrics.dailyWithdrawCount += 1;
  } else if (usageType == UsageType.SWAP) {
    usageMetrics.dailySwapCount += 1;
  }

  let account = Account.load(from);
  if (!account) {
    account = new Account(from);
    account.save();
    totalUniqueUsers.valueInt += 1;
  }
  usageMetrics.cumulativeUniqueUsers = totalUniqueUsers.valueInt;
  protocol.cumulativeUniqueUsers = totalUniqueUsers.valueInt;

  // Combine the id and the user address to generate a unique user id for the day
  let dailyActiveAccountId = id.concat(from);
  let dailyActiveAccount = DailyActiveAccount.load(dailyActiveAccountId);
  if (!dailyActiveAccount) {
    dailyActiveAccount = new DailyActiveAccount(dailyActiveAccountId);
    dailyActiveAccount.save();
    usageMetrics.dailyActiveUsers += 1;
  }

  totalUniqueUsers.save();
  usageMetrics.save();
  protocol.save();
}

// Update UsagePoolDailySnapshot entity
export function updatePoolMetrics(event: ethereum.Event): void {
  // get or create pool metrics
  let poolMetrics = getOrCreatePoolDailySnapshot(event);
  let pool = getLiquidityPool(event.address.toHexString());

  // Update the block number and timestamp to that of the last transaction of that day
  poolMetrics.totalValueLockedUSD = pool.totalValueLockedUSD;
  poolMetrics.cumulativeVolumeUSD = pool.cumulativeVolumeUSD;
  poolMetrics.inputTokenBalances = pool.inputTokenBalances;
  poolMetrics.outputTokenSupply = pool.outputTokenSupply;
  poolMetrics.outputTokenPriceUSD = pool.outputTokenPriceUSD;
  poolMetrics.blockNumber = event.block.number;
  poolMetrics.timestamp = event.block.timestamp;

  poolMetrics.save();
}

// These whiteslists are used to track what pools the tokens are a part of. Used in price calculations.
export function updateTokenWhitelists(
  token0: Token,
  token1: Token,
  poolAddress: string,
): void {
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
export function updateInputTokenBalances(
  poolAddress: string,
  reserve0: BigInt,
  reserve1: BigInt,
): void {
  let pool = getLiquidityPool(poolAddress);
  let poolAmounts = getLiquidityPoolAmounts(poolAddress);

  let token0 = getOrCreateToken(pool.inputTokens[0]);
  let token1 = getOrCreateToken(pool.inputTokens[1]);

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
  protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.minus(
    pool.totalValueLockedUSD,
  );

  let inputToken0 = convertTokenToDecimal(pool.inputTokenBalances[0], token0.decimals);
  let inputToken1 = convertTokenToDecimal(pool.inputTokenBalances[1], token1.decimals);

  // Get new tvl
  let newTvl = token0
    .lastPriceUSD!.times(inputToken0)
    .plus(token1.lastPriceUSD!.times(inputToken1));

  // Add the new pool tvl
  pool.totalValueLockedUSD = newTvl;
  protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.plus(newTvl);

  let outputTokenSupply = convertTokenToDecimal(
    pool.outputTokenSupply!,
    DEFAULT_DECIMALS,
  );

  // Update LP token prices
  if (pool.outputTokenSupply == BIGINT_ZERO) pool.outputTokenPriceUSD = BIGDECIMAL_ZERO;
  else pool.outputTokenPriceUSD = newTvl.div(outputTokenSupply);

  pool.save();
  protocol.save();
  token0.save();
  token1.save();
  nativeToken.save();
}

// Update the volume and accrued fees for all relavant entities
export function updateVolumeAndFees(
  event: ethereum.Event,
  trackedAmountUSD: BigDecimal,
  supplyFeeAmountUSD: BigDecimal,
  protocolFeeAmountUSD: BigDecimal,
): void {
  let pool = getLiquidityPool(event.address.toHexString());
  let protocol = getOrCreateDex();
  let financialMetrics = getOrCreateFinancials(event);
  let tradingFeeAmountUSD = supplyFeeAmountUSD.plus(protocolFeeAmountUSD);

  protocol.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD.plus(
    tradingFeeAmountUSD,
  );
  protocol.cumulativeSupplySideRevenueUSD = protocol.cumulativeSupplySideRevenueUSD.plus(
    supplyFeeAmountUSD,
  );
  protocol.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD.plus(
    protocolFeeAmountUSD,
  );

  financialMetrics.dailyTotalRevenueUSD = financialMetrics.dailyTotalRevenueUSD.plus(
    tradingFeeAmountUSD,
  );
  financialMetrics.dailySupplySideRevenueUSD = financialMetrics.dailySupplySideRevenueUSD.plus(
    supplyFeeAmountUSD,
  );
  financialMetrics.dailyProtocolSideRevenueUSD = financialMetrics.dailyProtocolSideRevenueUSD.plus(
    protocolFeeAmountUSD,
  );

  financialMetrics.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD;
  financialMetrics.cumulativeSupplySideRevenueUSD =
    protocol.cumulativeSupplySideRevenueUSD;
  financialMetrics.cumulativeProtocolSideRevenueUSD =
    protocol.cumulativeProtocolSideRevenueUSD;

  financialMetrics.dailyVolumeUSD = financialMetrics.dailyVolumeUSD.plus(
    trackedAmountUSD,
  );
  pool.cumulativeVolumeUSD = pool.cumulativeVolumeUSD.plus(trackedAmountUSD);
  protocol.cumulativeVolumeUSD = protocol.cumulativeVolumeUSD.plus(trackedAmountUSD);

  financialMetrics.save();
  protocol.save();
  pool.save();
}

// Update store that tracks the deposit count per pool
export function updateDepositHelper(poolAddress: Address): void {
  let poolDeposits = _HelperStore.load(poolAddress.toHexString())!;
  poolDeposits.valueInt = poolDeposits.valueInt + INT_ONE;
  poolDeposits.save();
}
