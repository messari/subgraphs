import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import {
  getOrCreateDex,
  getOrCreateFinancials,
  getOrCreateUsageMetricSnapshot,
  updatePoolDailySnapshot,
} from "./getters";
import {BIGDECIMAL_ZERO, SECONDS_PER_DAY} from "./constants";
import { Account, DailyActiveAccount, _TokenPrice, LiquidityPool, Swap } from "../../generated/schema";
import { calculatePrice, isUSDStable, swapValueInUSD, valueInUSD } from "./pricing";
import { scaleDown } from "./tokens";
import { WeightedPool } from "../../generated/Vault/WeightedPool";
import { getUsdPricePerToken } from "../pricing";

export function updateFinancials(event: ethereum.Event): void {
  let financialMetrics = getOrCreateFinancials(event);
  let dex = getOrCreateDex()
  let totalValueLocked = BIGDECIMAL_ZERO
  let totalVolumeUsd = BIGDECIMAL_ZERO

  for (let i = 0; i < dex._poolIds.length; i++) {
    let pool = LiquidityPool.load(dex._poolIds[i])
    if (pool) {
      totalValueLocked = totalValueLocked.plus(pool.totalValueLockedUSD)
      totalVolumeUsd = totalVolumeUsd.plus(pool.totalVolumeUSD)
    }
  }

  financialMetrics.totalValueLockedUSD = totalValueLocked;
  financialMetrics.totalVolumeUSD = totalVolumeUsd;
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

export function updatePoolMetrics(event: ethereum.Event, pool: LiquidityPool): void {
  let newPoolLiquidity = BigDecimal.zero();
  let tokenWithoutPrice = false;
  for (let i = 0; i < pool.inputTokens.length; i++) {
    let currentToken = Address.fromString(pool.inputTokens[i]);
    let currentTokenBalance = scaleDown(pool.inputTokenBalances[i], Address.fromString(pool.inputTokens[i]));

    if (isUSDStable(currentToken)) {
      newPoolLiquidity = newPoolLiquidity.plus(currentTokenBalance);
      continue;
    }

    const token = _TokenPrice.load(currentToken.toHexString());
    if (token == null) {
      tokenWithoutPrice = true;
      continue;
    }

    let currentTokenValueInUsd = valueInUSD(currentTokenBalance, Address.fromString(token.id));
    newPoolLiquidity = newPoolLiquidity.plus(currentTokenValueInUsd);
  }

  if (tokenWithoutPrice) return;

  let oldPoolLiquidity = pool.totalValueLockedUSD;
  let liquidityChange = newPoolLiquidity.minus(oldPoolLiquidity);

  let protocol = getOrCreateDex();
  protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.plus(liquidityChange);
  protocol.save();

  const swap = Swap.load(event.transaction.hash.toHexString().concat("-").concat(event.logIndex.toHexString()));
  if (swap) {
    let tokenIn = Address.fromString(swap.tokenIn);
    let tokenOut = Address.fromString(swap.tokenOut);
    let amountIn = scaleDown(swap.amountIn, tokenIn);
    let amountOut = scaleDown(swap.amountOut, tokenOut);
    let swapValue = swapValueInUSD(tokenIn, amountIn, tokenOut, amountOut);
    pool.totalVolumeUSD = pool.totalVolumeUSD.plus(swapValue);
  }
  pool.totalValueLockedUSD = newPoolLiquidity;
  pool.outputTokenPriceUSD = newPoolLiquidity.div(pool.outputTokenSupply.toBigDecimal());
  pool.save();
  updatePoolDailySnapshot(event, pool);
}

export function updateTokenPrice(
  pool: LiquidityPool,
  tokenA: Address,
  tokenAAmount: BigInt,
  tokenAIndex: i32,
  tokenB: Address,
  tokenBAmount: BigInt,
  tokenBIndex: i32,
  blockNumber: BigInt,
): void {
  let weightPool = WeightedPool.bind(Address.fromString(pool.outputToken));
  let getWeightCall = weightPool.try_getNormalizedWeights();
  let hasWeights = !getWeightCall.reverted;
  let weightTokenB: BigDecimal | null = null;
  let weightTokenA: BigDecimal | null = null;
  let tokenAmountIn = scaleDown(tokenAAmount, tokenA);
  let tokenAmountOut = scaleDown(tokenBAmount, tokenB);

  if (hasWeights) {
    weightTokenB = scaleDown(getWeightCall.value[tokenBIndex], null);
    weightTokenA = scaleDown(getWeightCall.value[tokenAIndex], null);
    tokenAmountIn = scaleDown(pool.inputTokenBalances[tokenAIndex], tokenA);
    tokenAmountOut = scaleDown(pool.inputTokenBalances[tokenBIndex], tokenB);
  }

  const tokenInfo = calculatePrice(tokenA, tokenAmountIn, weightTokenA, tokenB, tokenAmountOut, weightTokenB);

  if (tokenInfo) {
    let token = _TokenPrice.load(tokenInfo.address.toHexString());
    if (token == null) token = new _TokenPrice(tokenInfo.address.toHexString());
    const index = tokenInfo.address == tokenB ? tokenBIndex : tokenAIndex;
    const currentBalance = scaleDown(pool.inputTokenBalances[index], Address.fromString(pool.inputTokens[index]));
    // We check if current balance multiplied by the price is over 40k USD, if not,
    // it means that the pool does have too much liquidity, so we fetch the price from
    // external source
    if (currentBalance.times(tokenInfo.price).gt(BigDecimal.fromString("40000"))) {
      token.lastUsdPrice = tokenInfo.price;
      token.block = blockNumber;
      token.save();
      return;
    }
  }

  if (!isUSDStable(tokenA)) {
    const tokenPrice = new _TokenPrice(tokenA.toHexString());
    const price = getUsdPricePerToken(tokenA);
    tokenPrice.lastUsdPrice = price.usdPrice;
    if (!price.reverted) {
      tokenPrice.lastUsdPrice = price.usdPrice.div(price.decimals.toBigDecimal());
    }
    tokenPrice.block = blockNumber;
    tokenPrice.save();
  }

  if (!isUSDStable(tokenB)) {
    const tokenPrice = new _TokenPrice(tokenB.toHexString());
    const price = getUsdPricePerToken(tokenB);
    tokenPrice.lastUsdPrice = price.usdPrice;
    if (!price.reverted) {
      tokenPrice.lastUsdPrice = price.usdPrice.div(price.decimals.toBigDecimal());
    }
    tokenPrice.block = blockNumber;
    tokenPrice.save();
  }
}
