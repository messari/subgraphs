import { Address, BigDecimal, BigInt, ethereum } from "@graphprotocol/graph-ts";
import {
  getOrCreateDex,
  getOrCreateFinancials,
  getOrCreateUsageMetricSnapshot,
  updatePoolDailySnapshot,
} from "./getters";
import { BIGDECIMAL_ZERO, FEE_COLLECTOR_ADDRESS, SECONDS_PER_DAY } from "./constants";
import {
  Account,
  DailyActiveAccount,
  LiquidityPool,
  Swap,
  LiquidityPoolFee,
  Token
} from "../../generated/schema";
import { calculatePrice, isUSDStable, valueInUSD } from "./pricing";
import { scaleDown } from "./tokens";
import { WeightedPool } from "../../generated/Vault/WeightedPool";
import { ProtocolFeesCollector } from "../../generated/Vault/ProtocolFeesCollector";
import { getUsdPricePerToken } from "../prices";

export function updateFinancials(event: ethereum.Event): void {
  let financialMetrics = getOrCreateFinancials(event);
  let dex = getOrCreateDex();
  let totalValueLocked = BIGDECIMAL_ZERO;
  let totalVolumeUsd = BIGDECIMAL_ZERO;
  let totalFeesUsd = BIGDECIMAL_ZERO;
  let totalProtocolGeneratedFee = BIGDECIMAL_ZERO;
  let totalRevenueGeneratedFee = BIGDECIMAL_ZERO;

  for (let i = 0; i < dex._poolIds.length; i++) {
    let pool = LiquidityPool.load(dex._poolIds[i]);
    if (pool) {
      totalValueLocked = totalValueLocked.plus(pool.totalValueLockedUSD);
      totalVolumeUsd = totalVolumeUsd.plus(pool.cumulativeVolumeUSD);
      totalRevenueGeneratedFee = totalRevenueGeneratedFee.plus(pool._sideRevenueGeneratedFee);
      totalProtocolGeneratedFee = totalProtocolGeneratedFee.plus(pool._protocolGeneratedFee);
      totalFeesUsd = totalFeesUsd.plus(pool._totalSwapFee)
    }
  }

  financialMetrics.totalValueLockedUSD = totalValueLocked;
  financialMetrics.cumulativeVolumeUSD = totalVolumeUsd;
  financialMetrics.cumulativeTotalRevenueUSD = totalFeesUsd;
  financialMetrics.cumulativeSupplySideRevenueUSD = totalRevenueGeneratedFee;
  financialMetrics.cumulativeProtocolSideRevenueUSD = totalProtocolGeneratedFee;
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

    protocol.cumulativeUniqueUsers += 1;
    protocol.save();
  }
  usageMetrics.cumulativeUniqueUsers = protocol.cumulativeUniqueUsers;

  // Combine the id and the user address to generate a unique user id for the day
  let dailyActiveAccountId = id.toString() + "-" + from.toHexString();
  let dailyActiveAccount = DailyActiveAccount.load(dailyActiveAccountId);
  if (!dailyActiveAccount) {
    dailyActiveAccount = new DailyActiveAccount(dailyActiveAccountId);
    dailyActiveAccount.save();
    usageMetrics.dailyActiveUsers += 1;
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

    const token = Token.load(currentToken.toHexString());
    let tokenPrice: BigDecimal | null = token!.lastPriceUSD
    if (!token || !tokenPrice) {
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
    let swapValue = (swap.amountInUSD.plus(swap.amountOutUSD)).div(BigDecimal.fromString("2"))
    let fee = LiquidityPoolFee.load(pool.fees[0]);
    if (fee) {
      let feesCollector = ProtocolFeesCollector.bind(FEE_COLLECTOR_ADDRESS);
      let protocolSwapPercentage = scaleDown(feesCollector.getSwapFeePercentage(), null);
      let supplySidePercentage = BigDecimal.fromString("1").minus(protocolSwapPercentage)
      let swapFee = swapValue.times(fee.feePercentage);

      pool._totalSwapFee = pool._totalSwapFee.plus(swapFee);
      pool._protocolGeneratedFee = pool._protocolGeneratedFee.plus(swapFee.times(protocolSwapPercentage))
      pool._sideRevenueGeneratedFee = pool._sideRevenueGeneratedFee.plus(swapFee.times(supplySidePercentage))
    }
    pool.cumulativeVolumeUSD = pool.cumulativeVolumeUSD.plus(swapValue);
  }
  pool.totalValueLockedUSD = newPoolLiquidity;
  pool.outputTokenPriceUSD = newPoolLiquidity.div(
    scaleDown(pool.outputTokenSupply, Address.fromString(pool.outputToken)),
  );

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
  let hasWeights = !!pool.inputTokenWeights.length

  let weightTokenB: BigDecimal | null = null;
  let weightTokenA: BigDecimal | null = null;
  let tokenAmountIn = scaleDown(tokenAAmount, tokenA);
  let tokenAmountOut = scaleDown(tokenBAmount, tokenB);

  if (hasWeights) {
    weightTokenB = pool.inputTokenWeights[tokenBIndex]
    weightTokenA = pool.inputTokenWeights[tokenAIndex]
    tokenAmountIn = scaleDown(pool.inputTokenBalances[tokenAIndex], tokenA);
    tokenAmountOut = scaleDown(pool.inputTokenBalances[tokenBIndex], tokenB);
  }

  const tokenInfo = calculatePrice(tokenA, tokenAmountIn, weightTokenA, tokenB, tokenAmountOut, weightTokenB);

  if (tokenInfo) {
    let token = Token.load(tokenInfo.address.toHexString());
    if (!token) token = new Token(tokenInfo.address.toHexString());
    const index = tokenInfo.address == tokenB ? tokenBIndex : tokenAIndex;
    const currentBalance = scaleDown(pool.inputTokenBalances[index], Address.fromString(pool.inputTokens[index]));
    // We check if current balance multiplied by the price is over 40k USD, if not,
    // it means that the pool does have too much liquidity, so we fetch the price from
    // external source
    if (currentBalance.times(tokenInfo.price).gt(BigDecimal.fromString("40000"))) {
      token.lastPriceUSD = tokenInfo.price;
      token.lastPriceBlockNumber = blockNumber;
      token.save();
      return;
    }
  }

  if (!isUSDStable(tokenA)) {
    const tokenPrice = new Token(tokenA.toHexString());
    const price = getUsdPricePerToken(tokenA);
    tokenPrice.lastPriceUSD = price.usdPrice;
    if (!price.reverted) {
      tokenPrice.lastPriceUSD = price.usdPrice.div(price.decimals.toBigDecimal());
    }
    tokenPrice.lastPriceBlockNumber = blockNumber;
    tokenPrice.save();
  }

  if (!isUSDStable(tokenB)) {
    const tokenPrice = new Token(tokenB.toHexString());
    const price = getUsdPricePerToken(tokenB);
    tokenPrice.lastPriceUSD = price.usdPrice;
    if (!price.reverted) {
      tokenPrice.lastPriceUSD = price.usdPrice.div(price.decimals.toBigDecimal());
    }
    tokenPrice.lastPriceBlockNumber = blockNumber;
    tokenPrice.save();
  }
}

/**
 * @param tokenAddress
 * @returns Previously stored price, otherwise fetch it from oracle
 */
export function fetchPrice(tokenAddress: Address): BigDecimal {
  let token = Token.load(tokenAddress.toHexString())
  let tokenPrice: BigDecimal | null = null
  if (token) tokenPrice = token.lastPriceUSD
  if (tokenPrice) return tokenPrice

  let price = getUsdPricePerToken(tokenAddress)
  if (!price.reverted) return price.usdPrice.div(price.decimals.toBigDecimal())
  return price.usdPrice
}
