import { log, dataSource, Address, BigDecimal, BigInt, Bytes, ethereum } from "@graphprotocol/graph-ts";
import { Account, DailyActiveAccount, UsageMetricsDailySnapshot, _HelperStore, _TokenTracker } from "../../generated/schema";
import {
  getLiquidityPool,
  getLiquidityPoolAmounts,
  getOrCreateDex,
  getOrCreateEtherHelper,
  getOrCreateFinancials,
  getOrCreatePoolDailySnapshot,
  getOrCreateToken,
  getOrCreateTokenTracker,
  getOrCreateUsersHelper,
} from "./getters";
import { BIGDECIMAL_ZERO, BIGINT_ZERO, DEFAULT_DECIMALS, FACTORY_ADDRESS, INT_ONE, SECONDS_PER_DAY, WHITELIST } from "./constants";
import { convertTokenToDecimal } from "./utils/utils";
import { getUsdPricePerToken } from "../Prices/index";
import { findEthPerToken, getEthPriceInUSD } from "./price/price";

// Update FinancialsDailySnapshots entity
export function updateFinancials(event: ethereum.Event): void {
  let financialMetrics = getOrCreateFinancials(event);
  let protocol = getOrCreateDex();

  // Update the block number and timestamp to that of the last transaction of that day
  financialMetrics.blockNumber = event.block.number;
  financialMetrics.timestamp = event.block.timestamp;
  financialMetrics.currentTvlUSD = protocol.currentTvlUSD;

  financialMetrics.save();
}

export function updateUsageMetrics(event: ethereum.Event, from: string): void {
  // Number of days since Unix epoch
  let dayID = event.block.timestamp.toI32() / SECONDS_PER_DAY;
  let id = dayID.toString();
  let usageMetrics = UsageMetricsDailySnapshot.load(id);
  let totalUniqueUsers = getOrCreateUsersHelper();
  let protocol = getOrCreateDex();

  if (!usageMetrics) {
    usageMetrics = new UsageMetricsDailySnapshot(id);
    usageMetrics.protocol = FACTORY_ADDRESS;
    usageMetrics.dailyActiveUsers = 0;
    usageMetrics.cumulativeUniqueUsers = 0;
    usageMetrics.dailyTransactionCount = 0;
  }

  // Update the block number and timestamp to that of the last transaction of that day
  usageMetrics.blockNumber = event.block.number;
  usageMetrics.timestamp = event.block.timestamp;
  usageMetrics.dailyTransactionCount += 1;

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
  poolMetrics.currentTvlUSD = pool.currentTvlUSD;
  poolMetrics.inputTokenBalances = pool.inputTokenBalances;
  poolMetrics.outputTokenSupply = pool.outputTokenSupply;
  poolMetrics.outputTokenPriceUSD = pool.outputTokenPriceUSD;
  poolMetrics.blockNumber = event.block.number;
  poolMetrics.timestamp = event.block.timestamp;

  poolMetrics.save();
}

// These whiteslists are used to track what pools the tokens are a part of. Used in price calculations.
export function updateTokenWhitelists(tokenTracker0: _TokenTracker, tokenTracker1: _TokenTracker, poolAddress: string): void {
  // update white listed pools
  if (WHITELIST.includes(tokenTracker0.id)) {
    let newPools = tokenTracker1.whitelistPools;
    newPools.push(poolAddress);
    tokenTracker1.whitelistPools = newPools;
    tokenTracker1.save();
  }

  if (WHITELIST.includes(tokenTracker1.id)) {
    let newPools = tokenTracker0.whitelistPools;
    newPools.push(poolAddress);
    tokenTracker0.whitelistPools = newPools;
    tokenTracker0.save();
  }
}

// Upate token balances based on reserves emitted from the sync event.
export function updateInputTokenBalances(poolAddress: string, reserve0: BigInt, reserve1: BigInt): void {
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

  let tokenTracker0 = getOrCreateTokenTracker(pool.inputTokens[0]);
  let tokenTracker1 = getOrCreateTokenTracker(pool.inputTokens[1]);

  let ether = getOrCreateEtherHelper();
  ether.valueDecimal = getEthPriceInUSD();
  tokenTracker0.derivedETH = findEthPerToken(tokenTracker0);
  tokenTracker1.derivedETH = findEthPerToken(tokenTracker1);

  tokenTracker0.derivedUSD = ether.valueDecimal!.times(tokenTracker0.derivedETH);
  tokenTracker1.derivedUSD = ether.valueDecimal!.times(tokenTracker1.derivedETH);

  ether.save();

  // Subtract the old pool tvl
  protocol.currentTvlUSD = protocol.currentTvlUSD.minus(pool.currentTvlUSD);

  let inputToken0 = convertTokenToDecimal(pool.inputTokenBalances[0], token0.decimals);
  let inputToken1 = convertTokenToDecimal(pool.inputTokenBalances[1], token1.decimals);

  // Get new tvl
  let newTvl = tokenTracker0.derivedUSD.times(inputToken0).plus(tokenTracker1.derivedUSD.times(inputToken1));

  // Add the new pool tvl
  pool.currentTvlUSD = newTvl;
  protocol.currentTvlUSD = protocol.currentTvlUSD.plus(newTvl);

  let outputTokenSupply = convertTokenToDecimal(pool.outputTokenSupply!, DEFAULT_DECIMALS);

  // Update LP token prices
  if (pool.outputTokenSupply == BIGINT_ZERO) pool.outputTokenPriceUSD = BIGDECIMAL_ZERO;
  else pool.outputTokenPriceUSD = newTvl.div(outputTokenSupply);

  pool.save();
  protocol.save();
  tokenTracker0.save();
  tokenTracker1.save();
}

// Update the volume and accrued fees for all relavant entities
export function updateVolumeAndFees(
  event: ethereum.Event,
  trackedAmountUSD: BigDecimal,
  tradingFeeAmountUSD: BigDecimal,
  protocolFeeAmountUSD: BigDecimal
): void {
  let pool = getLiquidityPool(event.address.toHexString());
  let protocol = getOrCreateDex();
  let poolMetrics = getOrCreatePoolDailySnapshot(event);
  let financialMetrics = getOrCreateFinancials(event);

  financialMetrics.cumulativeVolumeUSD = financialMetrics.cumulativeVolumeUSD.plus(trackedAmountUSD);
  financialMetrics.cumulativeTotalRevenueUSD = financialMetrics.cumulativeTotalRevenueUSD.plus(tradingFeeAmountUSD).plus(protocolFeeAmountUSD);
  financialMetrics.cumulativeSupplySideRevenueUSD = financialMetrics.cumulativeSupplySideRevenueUSD.plus(tradingFeeAmountUSD);
  financialMetrics.cumulativeProtocolSideRevenueUSD = financialMetrics.cumulativeProtocolSideRevenueUSD.plus(protocolFeeAmountUSD);

  poolMetrics.cumulativeVolumeUSD = poolMetrics.cumulativeVolumeUSD.plus(trackedAmountUSD);
  pool.cumulativeVolumeUSD = pool.cumulativeVolumeUSD.plus(trackedAmountUSD);
  protocol.cumulativeVolumeUSD = protocol.cumulativeVolumeUSD.plus(trackedAmountUSD);

  financialMetrics.save();
  poolMetrics.save();
  protocol.save();
  pool.save();
}

// Update store that tracks the deposit count per pool
export function updateDepositHelper(poolAddress: string): void {
  let poolDeposits = _HelperStore.load(poolAddress)!;
  poolDeposits.valueInt = poolDeposits.valueInt + INT_ONE;
  poolDeposits.save();
}
