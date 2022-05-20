import { Address, BigInt } from "@graphprotocol/graph-ts";
import { PoolBalanceChanged, PoolRegistered, TokensRegistered, Swap } from "../../generated/Vault/Vault";
import {
  createPool,
  getOrCreateToken,
  getOrCreateSwap,
  getOrCreateDex,
  getOrCreateHourlyUsageMetricSnapshot,
  getOrCreateDailyUsageMetricSnapshot,
} from "../common/getters";
import { LiquidityPool, LiquidityPoolFee } from "../../generated/schema";
import { BIGDECIMAL_ZERO, BIGINT_ZERO } from "../common/constants";
import { updateFinancials, updatePoolMetrics, updateTokenPrice, updateUsageMetrics } from "../common/metrics";
import { isUSDStable, valueInUSD, fetchPrice } from "../common/pricing";
import { scaleDown } from "../common/tokens";
import { ERC20 } from "../../generated/Vault/ERC20";
import { updateWeight } from "../common/weight";
import { SwapFeePercentageChanged, WeightedPool } from "../../generated/Vault/WeightedPool";

export function handleSwapFeePercentageChange(event: SwapFeePercentageChanged): void {
  let poolContract = WeightedPool.bind(event.address);
  let poolIdCall = poolContract.try_getPoolId();
  if (!poolIdCall.reverted) {
    let fee = LiquidityPoolFee.load(poolIdCall.value.toHexString());
    if (fee) {
      fee.feePercentage = scaleDown(event.params.swapFeePercentage, null);
      fee.save();
    }
  }
}

export function handlePoolRegister(event: PoolRegistered): void {
  createPool(event.params.poolId.toHexString(), event.params.poolAddress, event.block);
}

export function handleTokensRegister(event: TokensRegistered): void {
  let tokens: string[] = new Array<string>();
  let tokensAmount: BigInt[] = new Array<BigInt>();
  for (let i = 0; i < event.params.tokens.length; i++) {
    let token = getOrCreateToken(event.params.tokens[i]);
    tokens.push(token.id);
    tokensAmount.push(BIGINT_ZERO);
  }
  let pool = LiquidityPool.load(event.params.poolId.toHexString());
  if (pool == null) {
    return;
  }
  pool.inputTokens = tokens;
  pool.inputTokenBalances = tokensAmount;
  pool.save();
  updateWeight(pool.id);
}

export function handlePoolBalanceChanged(event: PoolBalanceChanged): void {
  let pool = LiquidityPool.load(event.params.poolId.toHexString());
  if (pool == null) return;
  let inputTokenBalances: BigInt[] = new Array<BigInt>();
  let protocol = getOrCreateDex();

  let amounts: BigInt[] = event.params.deltas;

  if (amounts.length === 0) return;
  let total: BigInt = amounts.reduce<BigInt>((sum, amount) => sum.plus(amount), new BigInt(0));

  let hourlyUsage = getOrCreateHourlyUsageMetricSnapshot(event);
  let dailyUsage = getOrCreateDailyUsageMetricSnapshot(event);

  if (total.gt(BIGINT_ZERO)) {
    hourlyUsage.hourlyDepositCount += 1;
    dailyUsage.dailyDepositCount += 1;
  } else {
    hourlyUsage.hourlyWithdrawCount += 1;
    dailyUsage.dailyWithdrawCount += 1;
  }

  hourlyUsage.save();
  dailyUsage.save();

  for (let i = 0; i < event.params.deltas.length; i++) {
    let currentAmount = pool.inputTokenBalances[i];
    inputTokenBalances.push(currentAmount.plus(event.params.deltas[i]));

    let tokenFee = event.params.protocolFeeAmounts[i];
    if (tokenFee.gt(BigInt.zero())) {
      let tokenAddress = event.params.tokens[i];
      let formattedAmount = scaleDown(tokenFee, tokenAddress);
      let price = fetchPrice(tokenAddress);
      if (price.gt(BIGDECIMAL_ZERO)) {
        pool._protocolGeneratedFee = pool._protocolGeneratedFee.plus(formattedAmount.times(price));
        protocol.cumulativeTotalRevenueUSD = protocol.cumulativeTotalRevenueUSD.plus(formattedAmount.times(price));
        protocol.cumulativeProtocolSideRevenueUSD = protocol.cumulativeProtocolSideRevenueUSD.plus(
          formattedAmount.times(price),
        );
      }
    }
  }

  const outputToken = ERC20.bind(Address.fromString(pool.outputToken));
  const totalSupplyCall = outputToken.try_totalSupply();
  if (!totalSupplyCall.reverted) {
    pool.outputTokenSupply = totalSupplyCall.value;
  }
  pool.inputTokenBalances = inputTokenBalances;
  pool.save();
  protocol.save();

  updatePoolMetrics(event, pool);
  updateUsageMetrics(event, event.transaction.from);
  updateFinancials(event);
}

export function handleSwap(event: Swap): void {
  let pool = LiquidityPool.load(event.params.poolId.toHexString());
  if (pool == null) return;
  updateWeight(pool.id);

  const tokenIn = event.params.tokenIn;
  const tokenOut = event.params.tokenOut;

  let tokenInIndex: i32 = 0;
  let tokenOutIndex: i32 = 0;
  let newBalances = pool.inputTokenBalances;

  for (let i: i32 = 0; i < pool.inputTokens.length; i++) {
    if (tokenIn == Address.fromString(pool.inputTokens[i])) {
      newBalances[i] = pool.inputTokenBalances[i].plus(event.params.amountIn);
      tokenInIndex = i;
    }

    if (tokenOut == Address.fromString(pool.inputTokens[i])) {
      newBalances[i] = pool.inputTokenBalances[i].minus(event.params.amountOut);
      tokenOutIndex = i;
    }
  }

  pool.inputTokenBalances = newBalances;
  pool.save();

  updateTokenPrice(
    pool,
    tokenIn,
    event.params.amountIn,
    tokenInIndex,
    tokenOut,
    event.params.amountOut,
    tokenOutIndex,
    event.block.number,
  );

  const swap = getOrCreateSwap(event, pool);
  const amountIn = scaleDown(event.params.amountIn, tokenIn);
  const amountOut = scaleDown(event.params.amountOut, tokenOut);

  swap.tokenIn = tokenIn.toHexString();
  swap.tokenOut = tokenOut.toHexString();
  swap.amountIn = event.params.amountIn;
  swap.amountOut = event.params.amountOut;
  swap.amountInUSD = valueInUSD(amountIn, tokenIn);
  swap.amountOutUSD = valueInUSD(amountOut, tokenOut);
  swap.save();

  let hourlyUsage = getOrCreateHourlyUsageMetricSnapshot(event);
  let dailyUsage = getOrCreateDailyUsageMetricSnapshot(event);
  hourlyUsage.hourlySwapCount += 1;
  dailyUsage.dailySwapCount += 1;
  hourlyUsage.save();
  dailyUsage.save();

  updatePoolMetrics(event, pool);
  updateUsageMetrics(event, event.transaction.from);
  updateFinancials(event);
}
