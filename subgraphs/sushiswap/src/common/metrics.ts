import { BigDecimal, Address, ethereum, BigInt } from "@graphprotocol/graph-ts";
import {
  _Account,
  _DailyActiveAccount,
  UsageMetricsDailySnapshot,
  Deposit,
  Withdraw,
  Swap,
} from "../../generated/schema";
import { SECONDS_PER_DAY } from "./constants";
import {
  getLiquidityPool,
  getOrCreateDexAmm,
  getOrCreateFinancialsDailySnapshot,
  getOrCreatePoolDailySnapshot,
  getOrCreateUsageMetricsDailySnapshot,
} from "./getters";

export function updateLiquidityPoolFromDeposit(deposit: Deposit): void {
  let pool = getLiquidityPool(deposit.pool);

  pool.inputTokenBalances = [
    pool.inputTokenBalances[0].plus(deposit.inputTokenAmounts[0]),
    pool.inputTokenBalances[1].plus(deposit.inputTokenAmounts[1]),
  ];
  pool.outputTokenSupply = pool.outputTokenSupply.plus(deposit.outputTokenAmount);

  pool.save();
}

export function updateLiquidityPoolFromWithdraw(withdraw: Withdraw): void {
  let pool = getLiquidityPool(withdraw.pool);

  pool.inputTokenBalances = [
    pool.inputTokenBalances[0].minus(withdraw.inputTokenAmounts[0]),
    pool.inputTokenBalances[1].minus(withdraw.inputTokenAmounts[1]),
  ];
  pool.outputTokenSupply = pool.outputTokenSupply.minus(withdraw.outputTokenAmount);

  pool.save();
}

export function updateLiquidityPoolFromSwap(swap: Swap): void {
  let pool = getLiquidityPool(swap.pool);

  if (swap.tokenIn == pool.inputTokens[0]) {
    pool.inputTokenBalances = [
      pool.inputTokenBalances[0].plus(swap.amountIn),
      pool.inputTokenBalances[1].minus(swap.amountOut),
    ];
  } else {
    pool.inputTokenBalances = [
      pool.inputTokenBalances[0].minus(swap.amountOut),
      pool.inputTokenBalances[1].plus(swap.amountIn),
    ];
  }

  pool.save();
}

export function updateLiquidityPoolFromSync(poolAddress: string, reserve0: BigInt, reserve1: BigInt): void {
  let pool = getLiquidityPool(poolAddress);

  pool.inputTokenBalances = [reserve0, reserve1];

  pool.save();
}

// Update FinancialsDailySnapshot entity
export function updateFinancialsDailySnapshot(event: ethereum.Event): void {
  let financialMetrics = getOrCreateFinancialsDailySnapshot(event);
  let protocol = getOrCreateDexAmm();

  // Update the block number and timestamp to that of the last transaction of that day
  financialMetrics.blockNumber = event.block.number;
  financialMetrics.timestamp = event.block.timestamp;
  financialMetrics.totalValueLockedUSD = protocol.totalValueLockedUSD;
  // TODO: implement the rest

  financialMetrics.save();
}

export function updateUsageMetricsDailySnapshot(event: ethereum.Event, from: Address): void {
  // Number of days since Unix epoch
  let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;
  let usageMetrics = getOrCreateUsageMetricsDailySnapshot(event);

  // Update the block number and timestamp to that of the last transaction of that day
  usageMetrics.blockNumber = event.block.number;
  usageMetrics.timestamp = event.block.timestamp;
  usageMetrics.dailyTransactionCount += 1;

  let accountId = from.toHexString();
  let account = _Account.load(accountId);
  let protocol = getOrCreateDexAmm();
  if (!account) {
    account = new _Account(accountId);
    account.save();

    protocol.totalUniqueUsers += 1;
    protocol.save();
  }
  usageMetrics.totalUniqueUsers = protocol.totalUniqueUsers;

  // Combine the id and the user address to generate a unique user id for the day
  let dailyActiveAccountId = id.toString() + "-" + from.toHexString();
  let dailyActiveAccount = _DailyActiveAccount.load(dailyActiveAccountId);
  if (!dailyActiveAccount) {
    dailyActiveAccount = new _DailyActiveAccount(dailyActiveAccountId);
    dailyActiveAccount.save();
    usageMetrics.activeUsers += 1;
  }

  usageMetrics.save();
}

// Update UsagePoolDailySnapshot entity
export function updatePoolDailySnapshot(event: ethereum.Event): void {
  let poolMetrics = getOrCreatePoolDailySnapshot(event);
  let pool = getLiquidityPool(event.address.toHexString());

  // Update the block number and timestamp to that of the last transaction of that day
  poolMetrics.totalValueLockedUSD = pool.totalValueLockedUSD;
  poolMetrics.inputTokenBalances = pool.inputTokenBalances;
  poolMetrics.outputTokenSupply = pool.outputTokenSupply;
  poolMetrics.outputTokenPriceUSD = pool.outputTokenPriceUSD;
  poolMetrics.blockNumber = event.block.number;
  poolMetrics.timestamp = event.block.timestamp;
  // TODO: implement the rest

  poolMetrics.save();
}
