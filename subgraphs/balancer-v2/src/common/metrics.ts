import {Address, BigDecimal, BigInt, Bytes, ethereum} from "@graphprotocol/graph-ts";
import { getOrCreateDex, getOrCreateFinancials, getOrCreateUsageMetricSnapshot } from "./getters";
import { SECONDS_PER_DAY } from "./constants";
import { Account, DailyActiveAccount, _TokenPrice, LiquidityPool } from "../../generated/schema";
import {calculatePrice, isUSDStable, valueInUSD} from "./pricing";
import { scaleDown } from "./tokens";
import {WeightedPool} from "../../generated/Vault/WeightedPool";
import { log } from "matchstick-as"

export function updateFinancials(event: ethereum.Event): void {
  let financialMetrics = getOrCreateFinancials(event);
  financialMetrics.blockNumber = event.block.number;
  financialMetrics.timestamp = event.block.timestamp;

  financialMetrics.save();
}

export function updateUsageMetrics(event: ethereum.Event, from: Address): void {
  // Number of days since Unix epoch
  let id: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;
  let usageMetrics = getOrCreateUsageMetricSnapshot(event);

  // Update the block number and timestamp to that of the last transaction of that day
  usageMetrics.blockNumber = event.block.number;
  usageMetrics.timestamp = event.block.timestamp;
  usageMetrics.dailyTransactionCount += 1;

  let accountId = from.toHexString();
  let account = Account.load(accountId);
  let protocol = getOrCreateDex();
  if (!account) {
    account = new Account(accountId);
    account.save();

    protocol.totalUniqueUsers += 1;
    protocol.save();
  }
  usageMetrics.totalUniqueUsers = protocol.totalUniqueUsers;

  // Combine the id and the user address to generate a unique user id for the day
  let dailyActiveAccountId = id.toString() + "-" + from.toHexString();
  let dailyActiveAccount = DailyActiveAccount.load(dailyActiveAccountId);
  if (!dailyActiveAccount) {
    dailyActiveAccount = new DailyActiveAccount(dailyActiveAccountId);
    dailyActiveAccount.save();
    usageMetrics.activeUsers += 1;
  }

  usageMetrics.save();
}

export function updatePoolMetrics(pool: LiquidityPool): void {
  let totalValueLocked = BigDecimal.zero();
  let tokenWithoutPrice = false;
  for (let i = 0; i < pool.inputTokens.length; i++) {
    let currentToken = Address.fromString(pool.inputTokens[i]);
    let currentTokenBalance = scaleDown(
        pool.inputTokenBalances[i],
        Address.fromString(pool.inputTokens[i]),
    );

    if (isUSDStable(currentToken)) {
      totalValueLocked = totalValueLocked.plus(currentTokenBalance);
      continue;
    }

    const token = _TokenPrice.load(currentToken.toHexString());
    if (token == null) {
      tokenWithoutPrice = true;
      continue;
    }

    let currentTokenValueInUsd = valueInUSD(currentTokenBalance, Address.fromString(token.id));
    totalValueLocked = totalValueLocked.plus(currentTokenValueInUsd);
  }

  if (tokenWithoutPrice) return;
  pool.totalValueLockedUSD = totalValueLocked;
  pool.save();
}

export function updateTokenPrice(
    pool: LiquidityPool,
    tokenA: Address,
    tokenAAmount: BigInt,
    tokenAIndex: i32,
    tokenB: Address,
    tokenBAmount: BigInt,
    tokenBIndex: i32,
    blockNumber: BigInt
): void {
  let weightPool = WeightedPool.bind(Address.fromString(pool.outputToken));
  let getWeightCall = weightPool.try_getNormalizedWeights();
  let hasWeights = !getWeightCall.reverted;
  let weightTokenB: BigDecimal | null = null;
  let weightTokenA: BigDecimal | null = null;

  if (hasWeights) {
    weightTokenB = scaleDown(getWeightCall.value[tokenBIndex], null);
    weightTokenA = scaleDown(getWeightCall.value[tokenAIndex], null);
  }

  let tokenAmountIn = scaleDown(tokenAAmount, tokenA);
  let tokenAmountOut = scaleDown(tokenBAmount, tokenB);

  const tokenInfo = calculatePrice(
      pool,
      tokenA,
      tokenAmountIn,
      weightTokenA,
      tokenAIndex,
      tokenB,
      tokenAmountOut,
      weightTokenB,
      tokenBIndex,
  );

  if (tokenInfo) {
    let token = _TokenPrice.load(tokenInfo.address.toHexString());
    if (token == null) token = new _TokenPrice(tokenInfo.address.toHexString());
    const index = tokenInfo.address == tokenB ? tokenBIndex : tokenAIndex
    const currentBalance = scaleDown(
        pool.inputTokenBalances[index],
        Address.fromString(pool.inputTokens[index])
    )
    // We make sure the current balance plus the new price is over 40k USD
    if (currentBalance.times(tokenInfo.price).gt(BigDecimal.fromString('40000'))) {
      token.block = blockNumber;
      token.lastUsdPrice = tokenInfo.price;
      token.save();
    }
  }
}
