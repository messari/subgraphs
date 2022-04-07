import { BigDecimal, log } from "@graphprotocol/graph-ts";
import { ERC20 } from "../../generated/Factory/ERC20";
import { HelperStore, LiquidityPool, Token } from "../../generated/schema";
import { Burn, Mint, Swap as SwapEvent, Sync, Transfer } from "../../generated/templates/Pool/Pair";
import { getOrCreateDeposit } from "../helpers/deposit";
import { getOrCreateFinancials } from "../helpers/financials";
import { updatePool } from "../helpers/pool";
import { createPoolDailySnapshot } from "../helpers/poolDailySnapshot";
import { getOrCreateSwap } from "../helpers/swap";
import { updateUsageMetrics } from "../helpers/updateUsageMetrics";
import { getOrCreateWithdraw } from "../helpers/withdraw";
import {
  getOrCreateProtocol,
  getOrCreateProtocolFeeShare,
  getOrCreateSupplyFeeShare,
  getOrCreateTradingFees,
} from "../utils/common";
import { BIGDECIMAL_ZERO, BIGINT_ONE, BIGINT_ZERO, toBigInt, toDecimal, ZERO_ADDRESS } from "../utils/constant";
import { baseTokenPriceInUSD, findBnbPerToken, getTrackedLiquidityUSD, getTrackedVolumeUSD } from "../utils/pricing";

export function handleTransfer(event: Transfer): void {
  log.info("Transfer mapping on pool {}", [event.address.toHexString()]);
  let from = event.params.from;
  let to = event.params.to;
  let amount = event.params.value;
  let id = event.address.toHexString();
  let fromHex = from.toHexString();
  let toHex = to.toHexString();

  // get pool
  let pool = LiquidityPool.load(id);
  if (pool !== null) {
    // Update pool outputToken Supply
    if (fromHex == ZERO_ADDRESS) {

      let deposit = getOrCreateDeposit(event, pool);
      deposit.from = from.toHexString();
      deposit.to = to.toHexString();
      deposit.outputTokenAmount = amount;
      deposit.save();

      // Update pool
      updatePool(pool);
    }

    if (fromHex !== ZERO_ADDRESS && toHex == pool.id) {
      let withdraw = getOrCreateWithdraw(event, pool);
      withdraw.from = from.toHexString();
      withdraw.to = to.toHexString();
      withdraw.outputTokenAmount = amount;
      withdraw.save();

      updatePool(pool);
    }

    if (fromHex == pool.id && toHex == ZERO_ADDRESS) {
      let withdraw = getOrCreateWithdraw(event, pool);
      withdraw.from = from.toHexString();
      withdraw.to = to.toHexString();
      withdraw.outputTokenAmount = amount;
      withdraw.save();

      // Update pool
      updatePool(pool);
    }
  }
}

export function handleMint(event: Mint): void {
  log.info("Mint mapping on pool {}", [event.address.toHexString()]);
  let id = event.address.toHexString();
  let protocol = getOrCreateProtocol();

  let pool = LiquidityPool.load(id);
  if (pool !== null) {
    let token0 = Token.load(pool._token0)!;
    let token1 = Token.load(pool._token1)!;

    let amount0 = toDecimal(event.params.amount0, token0.decimals);
    let amount1 = toDecimal(event.params.amount1, token1.decimals);

    // get new amounts of USD and BNB for tracking
    let helperStore = HelperStore.load("1")!;
    let amountTotalUSD = token1._derivedBNB
      .times(amount1)
      .plus(token0._derivedBNB.times(amount0))
      .times(helperStore._value);

    pool._txCount = pool._txCount.plus(BIGINT_ONE);
    token0.save();
    token1.save();
    pool.save();

    // Deposit
    let deposit = getOrCreateDeposit(event, pool);
    deposit.from = event.params.sender.toHexString();
    deposit.to = pool.id;
    deposit.inputTokenAmounts[0] = toBigInt(amount0, token0.decimals);
    deposit.inputTokenAmounts[1] = toBigInt(amount1, token1.decimals);
    deposit.amountUSD = amountTotalUSD;

    deposit.save();

    // Update pool
    updatePool(pool);

    // Take a PoolDailySnapshot
    createPoolDailySnapshot(event.address, event.block.number, event.block.timestamp, pool);

    // Take FinancialsDailySnapshot
    let financials = getOrCreateFinancials(protocol, event.block.timestamp, event.block.number);
    financials.totalValueLockedUSD = pool.totalValueLockedUSD;
    financials.totalVolumeUSD = pool.totalVolumeUSD;

    financials.save();

    // Take UsageMetricsDailySnapshot
    updateUsageMetrics(event.params.sender, protocol, event.block.timestamp, event.block.number);
  }
}

export function handleBurn(event: Burn): void {
  log.info("Burn mapping on pool {}", [event.address.toHexString()]);
  let to = event.params.to;
  let id = event.address.toHexString();
  let protocol = getOrCreateProtocol();

  let pool = LiquidityPool.load(id);
  if (pool !== null) {
    let token0 = Token.load(pool._token0)!;
    let token1 = Token.load(pool._token1)!;

    let amount0 = toDecimal(event.params.amount0, token0.decimals);
    let amount1 = toDecimal(event.params.amount1, token1.decimals);

    // get new amounts of USD and BNB for tracking
    let helperStore = HelperStore.load("1")!;
    let amountTotalUSD = token1._derivedBNB
      .times(amount1)
      .plus(token0._derivedBNB.times(amount0))
      .times(helperStore._value);

    pool._txCount = pool._txCount.plus(BIGINT_ONE);
    token0.save();
    token1.save();
    pool.save();

    let withdraw = getOrCreateWithdraw(event, pool);
    withdraw.to = to.toHexString();
    withdraw.from = event.params.sender.toHexString();
    withdraw.inputTokenAmounts[0] = toBigInt(amount0, token0.decimals);
    withdraw.inputTokenAmounts[1] = toBigInt(amount1, token1.decimals);
    withdraw.amountUSD = amountTotalUSD;

    withdraw.save();

    // Update pool
    updatePool(pool);

    // Take a PoolDailySnapshot
    createPoolDailySnapshot(event.address, event.block.number, event.block.timestamp, pool);

    // Take FinancialsDailySnapshot
    let financials = getOrCreateFinancials(protocol, event.block.timestamp, event.block.number);
    financials.totalValueLockedUSD = pool.totalValueLockedUSD;
    financials.totalVolumeUSD = pool.totalVolumeUSD;

    financials.save();

    // Take UsageMetricsDailySnapshot
    updateUsageMetrics(event.params.sender, protocol, event.block.timestamp, event.block.number);
  }
}

export function handleSwap(event: SwapEvent): void {
  log.info("Swap mapping on pool {}", [event.address.toHexString()]);
  let pool = LiquidityPool.load(event.address.toHexString());
  let protocol = getOrCreateProtocol();

  if (pool !== null) {
    let token0 = Token.load(pool._token0)!;
    let token1 = Token.load(pool._token1)!;

    let amount0In = toDecimal(event.params.amount0In, token0.decimals);
    let amount0Out = toDecimal(event.params.amount0Out, token0.decimals);
    let amount1In = toDecimal(event.params.amount1In, token1.decimals);
    let amount1Out = toDecimal(event.params.amount1Out, token1.decimals);
    // totals for volume updates
    let amount0Total = amount0Out.plus(amount0In);
    let amount1Total = amount1Out.plus(amount1In);

    // BNB/USD prices
    let helperStore = HelperStore.load("1")!;

    // get total amounts of derived USD and BNB for tracking
    let derivedAmountBNB = token1._derivedBNB
      .times(amount1Total)
      .plus(token0._derivedBNB.times(amount0Total))
      .div(BigDecimal.fromString("2"));
    let derivedAmountUSD = derivedAmountBNB.times(helperStore._value);

    // Only accounts for volume through white listed tokens
    let trackedAmountUSD = getTrackedVolumeUSD(amount0Total, token0, amount1Total, token1);

    let trackedAmountBNB: BigDecimal;
    if (helperStore._value.equals(BIGDECIMAL_ZERO)) {
      trackedAmountBNB = BIGDECIMAL_ZERO;
    } else {
      trackedAmountBNB = trackedAmountUSD.div(helperStore._value);
    }

    // update pair volume data, use tracked amount if we have it as its probably more accurate
    pool.totalVolumeUSD = pool.totalVolumeUSD.plus(trackedAmountUSD);
    pool._volumeToken0 = pool._volumeToken0.plus(amount0Total);
    pool._volumeToken1 = pool._volumeToken1.plus(amount1Total);
    pool._untrackedVolumeUSD = pool._untrackedVolumeUSD.plus(derivedAmountUSD);
    pool._txCount = pool._txCount.plus(BIGINT_ONE);

    pool.save();
    token0.save();
    token1.save();

    // update swap
    let swap = getOrCreateSwap(event, pool);
    swap.from = event.params.sender.toHexString();
    swap.to = event.params.to.toHexString();
    swap.tokenIn = token0.id;
    swap.tokenOut = token1.id;
    swap.amountIn = toBigInt(amount0Total, token0.decimals);
    let amountInBNB = token0._derivedBNB.times(amount0Total);
    swap.amountInUSD = amountInBNB.times(helperStore._value);
    swap.amountOut = toBigInt(amount1Total, token0.decimals);
    let amountOutBNB = token1._derivedBNB.times(amount1Total);
    swap.amountOutUSD = amountOutBNB.times(helperStore._value);

    swap.save();

    // Take a PoolDailySnapshot
    createPoolDailySnapshot(event.address, event.block.number, event.block.timestamp, pool);

    // Take FinancialsDailySnapshot
    let financials = getOrCreateFinancials(protocol, event.block.timestamp, event.block.number);
    let tradingFee = getOrCreateTradingFees(event.address);
    let protocolFee = getOrCreateProtocolFeeShare(event.address);
    let supplyFee = getOrCreateSupplyFeeShare(event.address);

    let tradingFeeAmount = amount0Total.times(tradingFee.feePercentage);

    let tradingFeeAmountUSD: BigDecimal = tradingFeeAmount.times(token0._derivedBNB).times(helperStore._value);
    let protocolFeeAmountUSD: BigDecimal = tradingFeeAmountUSD.times(protocolFee.feePercentage);
    let supplyFeeAmountUSD = tradingFeeAmountUSD.times(supplyFee.feePercentage);

    financials.totalValueLockedUSD = pool.totalValueLockedUSD;
    financials.totalVolumeUSD = pool.totalVolumeUSD;
    financials.feesUSD = financials.feesUSD.plus(tradingFeeAmountUSD);
    financials.supplySideRevenueUSD = financials.supplySideRevenueUSD.plus(supplyFeeAmountUSD);
    financials.protocolSideRevenueUSD = financials.protocolSideRevenueUSD.plus(protocolFeeAmountUSD);

    financials.save();

    // Take UsageMetricsDailySnapshot
    updateUsageMetrics(event.params.sender, protocol, event.block.timestamp, event.block.number);
  }
}

export function handleSync(event: Sync): void {
  log.info("Sync mapping on pool {}", [event.address.toHexString()]);
  let reserve0 = event.params.reserve0;
  let reserve1 = event.params.reserve1;
  let id = event.address.toHexString();

  let pool = LiquidityPool.load(id);
  let protocol = getOrCreateProtocol();

  if (pool !== null && reserve0 !== BIGINT_ZERO && reserve1 !== BIGINT_ZERO) {
    // reset factory liquidity by subtracting only tracked liquidity
    protocol._totalValueLockedBNB = protocol._totalValueLockedBNB.minus(pool._trackedReserveBNB);

    // reset token total liquidity amounts
    let token0 = Token.load(pool._token0)!;
    let token1 = Token.load(pool._token1)!;

    pool._reserve0 = toDecimal(reserve0, token0.decimals);
    pool._reserve1 = toDecimal(reserve1, token1.decimals);

    if (pool._reserve1.notEqual(BIGDECIMAL_ZERO)) pool._token0Price = pool._reserve0.div(pool._reserve1);
    else pool._token0Price = BIGDECIMAL_ZERO;
    if (pool._reserve0.notEqual(BIGDECIMAL_ZERO)) pool._token1Price = pool._reserve1.div(pool._reserve0);
    else pool._token1Price = BIGDECIMAL_ZERO;

    pool.save();

    // update BNB price now that reserves could have changed
    let helperStore = HelperStore.load("1")!;
    helperStore._value = baseTokenPriceInUSD();
    helperStore.save();

    token0._derivedBNB = findBnbPerToken(token0 as Token);
    token1._derivedBNB = findBnbPerToken(token1 as Token);
    token0.save();
    token1.save();

    // get tracked liquidity - will be 0 if neither is in whitelist
    let trackedLiquidityBNB: BigDecimal;
    if (helperStore._value.notEqual(BIGDECIMAL_ZERO)) {
      let TrackedLiquidityUSD = getTrackedLiquidityUSD(
        pool._reserve0,
        token0 as Token,
        pool._reserve1,
        token1 as Token,
      );
      log.info("Tracked liquidity for pool {} is {} at BNB Price {}", [
        TrackedLiquidityUSD.toString(),
        event.address.toHexString(),
        helperStore._value.toString(),
      ]);
      trackedLiquidityBNB = TrackedLiquidityUSD.div(helperStore._value);
    } else {
      trackedLiquidityBNB = BIGDECIMAL_ZERO;
    }

    // use derived amounts within pair
    pool._trackedReserveBNB = trackedLiquidityBNB;
    pool._reserveBNB = pool._reserve0.times(token0._derivedBNB).plus(pool._reserve1.times(token1._derivedBNB));

    pool.totalValueLockedUSD = pool._reserveBNB.times(helperStore._value);

    // Update pool OutputTokenSupply
    let poolContract = ERC20.bind(event.address);
    let getTotalSupply = poolContract.try_totalSupply();
    if (!getTotalSupply.reverted) {
      pool.outputTokenSupply = getTotalSupply.value;
      log.info("TVLUSD for pool {} is {} and outputTokenSupply is {}", [
        event.address.toHexString(),
        pool.totalValueLockedUSD.toString(),
        pool.outputTokenSupply.toString()
      ]);
      pool.outputTokenPriceUSD = pool.totalValueLockedUSD.div(toDecimal(pool.outputTokenSupply));
    }

    // use tracked amounts globally
    protocol._totalValueLockedBNB = protocol._totalValueLockedBNB.plus(trackedLiquidityBNB);
    protocol.totalValueLockedUSD = protocol._totalValueLockedBNB.times(helperStore._value);

    // save entities
    pool.save();
    protocol.save();
    token0.save();
    token1.save();
  }
}
