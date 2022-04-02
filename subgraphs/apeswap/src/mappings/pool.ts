import { Address, BigInt } from "@graphprotocol/graph-ts";
import { Bundle, LiquidityPool, Token } from "../../generated/schema";
import {
  Burn,
  Mint,
  Swap as SwapEvent,
  Sync,
  Transfer,
} from "../../generated/templates/Pool/Pair";
import { getOrCreateDeposit } from "../helpers/deposit";
import { getOrCreateFinancials } from "../helpers/financials";
import { updatePool } from "../helpers/pool";
import { createPoolDailySnapshot } from "../helpers/poolDailySnapshot";
import { getOrCreateSwap } from "../helpers/swap";
import { updateUsageMetrics } from "../helpers/updateUsageMetrics";
import { getOrCreateWithdraw } from "../helpers/withdraw";
import { getOrCreateProtocol } from "../utils/common";
import {
  BIGINT_ONE,
  BIGINT_ZERO,
  DEFAULT_DECIMALS,
  toDecimal,
  ZERO_ADDRESS,
} from "../utils/constant";
import {
  findBnbPerToken,
  getBnbPriceInUSD,
  getTrackedLiquidityUSD,
  getTrackedVolumeUSD,
} from "../utils/pricing";
import { getOrCreateToken } from "../utils/token";

export function handleTransfer(event: Transfer): void {
  let from = event.params.from;
  let to = event.params.to;
  let amount = event.params.value;
  let id = event.address.toHexString();
  let fromHex = from.toHexString();
  let toHex = to.toHexString();
  // ignore initial transfers for first adds
  if (toHex == ZERO_ADDRESS && amount.equals(BigInt.fromI32(1000))) {
    return;
  }

  // get pool
  let pool = LiquidityPool.load(id);
  if (pool !== null) {
    // Update pool outputToken Supply
    if (fromHex == ZERO_ADDRESS) {
      if (toHex == ZERO_ADDRESS) {
        pool.outputTokenSupply = pool.outputTokenSupply.plus(amount);
      }

      let deposit = getOrCreateDeposit(event, pool);
      deposit.from = from.toHexString();
      deposit.to = to.toHexString();
      deposit.outputTokenAmount = amount;
      deposit.save();

      // Update pool
      updatePool(pool)
    }

    if (fromHex !== ZERO_ADDRESS && toHex == pool.id) {
      let withdraw = getOrCreateWithdraw(event, pool);
      withdraw.from = from.toHexString();
      withdraw.to = to.toHexString();
      withdraw.outputTokenAmount = amount;
      withdraw.save();
      
      updatePool(pool)
    }

    if (fromHex == pool.id && toHex == ZERO_ADDRESS) {
      pool.outputTokenSupply = pool.outputTokenSupply.minus(amount);
      pool.save();
      let withdraw = getOrCreateWithdraw(event, pool);
      withdraw.from = from.toHexString();
      withdraw.to = to.toHexString();
      withdraw.outputTokenAmount = amount;
      withdraw.save();

      // Update pool
      updatePool(pool)
    }

  }
}

export function handleMint(event: Mint): void {
  let amount0 = event.params.amount0;
  let amount1 = event.params.amount1;
  let id = event.address.toHexString();
  let protocol = getOrCreateProtocol();

  let pool = LiquidityPool.load(id);
  if (pool !== null) {
    let token0 = Token.load(pool._token0)!;
    let token1 = Token.load(pool._token1)!;

    // update txn counts
    token0.txCount = token0.txCount.plus(BIGINT_ONE);
    token1.txCount = token1.txCount.plus(BIGINT_ONE);

    // get new amounts of USD and BNB for tracking
    let bundle = Bundle.load("1")!;
    let amountTotalUSD = token1.derivedBNB
      .times(amount1)
      .plus(token0.derivedBNB.times(amount0))
      .times(bundle.bnbPrice);

    pool._txCount = pool._txCount.plus(BIGINT_ONE);
    token0.save();
    token1.save();
    pool.save();

    // Deposit
    let deposit = getOrCreateDeposit(event, pool);
    deposit.from = event.params.sender.toHexString();
    deposit.to = pool.id;
    deposit.inputTokenAmounts[0] = amount0;
    deposit.inputTokenAmounts[1] = amount1;
    deposit.amountUSD = toDecimal(amountTotalUSD, DEFAULT_DECIMALS);

    deposit.save();

    // Update pool
    updatePool(pool)

    // Take a PoolDailySnapshot
    createPoolDailySnapshot(
      event.address,
      event.block.number,
      event.block.timestamp,
      pool
    );

    // Take FinancialsDailySnapshot
    let financials = getOrCreateFinancials(
      protocol,
      event.block.timestamp,
      event.block.number
    );
    financials.totalValueLockedUSD = pool.totalValueLockedUSD;
    financials.totalVolumeUSD = pool.totalVolumeUSD;

    financials.save();

    // Take UsageMetricsDailySnapshot
    updateUsageMetrics(
      event.params.sender,
      protocol,
      event.block.timestamp,
      event.block.number
    );
  }
}

export function handleBurn(event: Burn): void {
  let amount0 = event.params.amount0;
  let amount1 = event.params.amount1;
  let to = event.params.to;
  let id = event.address.toHexString();
  let protocol = getOrCreateProtocol();

  let pool = LiquidityPool.load(id);
  if (pool !== null) {
    let token0 = Token.load(pool._token0)!;
    let token1 = Token.load(pool._token1)!;

    // update txn counts
    token0.txCount = token0.txCount.plus(BIGINT_ONE);
    token1.txCount = token1.txCount.plus(BIGINT_ONE);

    // get new amounts of USD and BNB for tracking
    let bundle = Bundle.load("1")!;
    let amountTotalUSD = token1.derivedBNB
      .times(amount1)
      .plus(token0.derivedBNB.times(amount0))
      .times(bundle.bnbPrice);

    pool._txCount = pool._txCount.plus(BIGINT_ONE);
    token0.save();
    token1.save();
    pool.save();

    let withdraw = getOrCreateWithdraw(event, pool);
    withdraw.to = to.toHexString();
    withdraw.from = event.params.sender.toHexString();
    withdraw.inputTokenAmounts[0] = amount0;
    withdraw.inputTokenAmounts[1] = amount1;
    withdraw.amountUSD = toDecimal(amountTotalUSD, DEFAULT_DECIMALS);

    withdraw.save();

    // Update pool
    updatePool(pool)

    // Take a PoolDailySnapshot
    createPoolDailySnapshot(
      event.address,
      event.block.number,
      event.block.timestamp,
      pool
    );

    // Take FinancialsDailySnapshot
    let financials = getOrCreateFinancials(
      protocol,
      event.block.timestamp,
      event.block.number
    );
    financials.totalValueLockedUSD = pool.totalValueLockedUSD;
    financials.totalVolumeUSD = pool.totalVolumeUSD;

    financials.save();

    // Take UsageMetricsDailySnapshot
    updateUsageMetrics(
      event.params.sender,
      protocol,
      event.block.timestamp,
      event.block.number
    );
  }
}

export function handleSwap(event: SwapEvent): void {
  let pool = LiquidityPool.load(event.address.toHexString());
  let amount0In = event.params.amount0In;
  let amount0Out = event.params.amount0Out;
  let amount1In = event.params.amount1In;
  let amount1Out = event.params.amount1Out;
  let protocol = getOrCreateProtocol();

  if (pool !== null) {
    let token0 = Token.load(pool._token0)!;
    let token1 = Token.load(pool._token1)!;

    // totals for volume updates
    let amount0Total = amount0Out.plus(amount0In);
    let amount1Total = amount1Out.plus(amount1In);

    // BNB/USD prices
    let bundle = Bundle.load("1")!;

    // get total amounts of derived USD and BNB for tracking
    let derivedAmountBNB = token1.derivedBNB
      .times(amount1Total)
      .plus(token0.derivedBNB.times(amount0Total))
      .div(BigInt.fromString("2"));
    let derivedAmountUSD = derivedAmountBNB.times(bundle.bnbPrice);

    // Only accounts for volume through white listed tokens
    let trackedAmountUSD = getTrackedVolumeUSD(
      amount0Total,
      token0,
      amount1Total,
      token1,
      pool
    );

    let trackedAmountBNB: BigInt;
    if (bundle.bnbPrice.equals(BIGINT_ZERO)) {
      trackedAmountBNB = BIGINT_ZERO;
    } else {
      trackedAmountBNB = trackedAmountUSD.div(bundle.bnbPrice);
    }

    // update token0 global volume and token liquidity stats
    token0.tradeVolume = token0.tradeVolume.plus(amount0In.plus(amount0Out));
    token0.tradeVolumeUSD = token0.tradeVolumeUSD.plus(trackedAmountUSD);
    token0.untrackedVolumeUSD = token0.untrackedVolumeUSD.plus(
      derivedAmountUSD
    );

    // update token1 global volume and token liquidity stats
    token1.tradeVolume = token1.tradeVolume.plus(amount1In.plus(amount1Out));
    token1.tradeVolumeUSD = token1.tradeVolumeUSD.plus(trackedAmountUSD);
    token1.untrackedVolumeUSD = token1.untrackedVolumeUSD.plus(
      derivedAmountUSD
    );

    // update txn counts
    token0.txCount = token0.txCount.plus(BIGINT_ONE);
    token1.txCount = token1.txCount.plus(BIGINT_ONE);

    // update pair volume data, use tracked amount if we have it as its probably more accurate
    pool.totalVolumeUSD = pool.totalVolumeUSD.plus(
      toDecimal(trackedAmountUSD, DEFAULT_DECIMALS)
    );
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
    swap.amountIn = amount0Total;
    let amountInBNB = token0.derivedBNB.times(amount0Total);
    swap.amountInUSD = toDecimal(
      amountInBNB.times(bundle.bnbPrice),
      DEFAULT_DECIMALS
    );
    swap.amountOut = amount1Total;
    let amountOutBNB = token1.derivedBNB.times(amount1Total);
    swap.amountOutUSD = toDecimal(
      amountOutBNB.times(bundle.bnbPrice),
      DEFAULT_DECIMALS
    );

    swap.save();

    // Take a PoolDailySnapshot
    createPoolDailySnapshot(
      event.address,
      event.block.number,
      event.block.timestamp,
      pool
    );

    // Take FinancialsDailySnapshot
    let financials = getOrCreateFinancials(
      protocol,
      event.block.timestamp,
      event.block.number
    );
    financials.totalValueLockedUSD = pool.totalValueLockedUSD;
    financials.totalVolumeUSD = pool.totalVolumeUSD;
    financials.feesUSD = toDecimal(
      trackedAmountUSD.times(BigInt.fromI32(30/1000)),
      DEFAULT_DECIMALS
    );
    financials.supplySideRevenueUSD = toDecimal(
      trackedAmountUSD.times(BigInt.fromI32(30/1000)),
      DEFAULT_DECIMALS
    );

    financials.save();

    // Take UsageMetricsDailySnapshot
    updateUsageMetrics(
      event.params.sender,
      protocol,
      event.block.timestamp,
      event.block.number
    );
  }
}

export function handleSync(event: Sync): void {
  let reserve0 = event.params.reserve0;
  let reserve1 = event.params.reserve1;
  let id = event.address.toHexString();

  let pool = LiquidityPool.load(id);
  let protocol = getOrCreateProtocol();

  if (pool !== null) {
    // reset factory liquidity by subtracting onluy tarcked liquidity
    protocol._totalValueLockedBNB = protocol._totalValueLockedBNB.minus(
      pool._trackedReserveBNB
    );

    // reset token total liquidity amounts
    let token0 = Token.load(pool._token0)!;
    let token1 = Token.load(pool._token1)!;
    token0.totalLiquidity = token0.totalLiquidity.minus(pool._reserve0);
    token1.totalLiquidity = token1.totalLiquidity.minus(pool._reserve1);

    pool._reserve0 = reserve0;
    pool._reserve1 = reserve1;

    if (pool._reserve1.notEqual(BIGINT_ZERO))
      pool._token0Price = pool._reserve0.div(pool._reserve1);
    else pool._token0Price = BIGINT_ZERO;
    if (pool._reserve0.notEqual(BIGINT_ZERO))
      pool._token1Price = pool._reserve1.div(pool._reserve0);
    else pool._token1Price = BIGINT_ZERO;

    pool.save();

    // update BNB price now that reserves could have changed
    let bundle = Bundle.load("1")!;
    bundle.bnbPrice = getBnbPriceInUSD();
    bundle.save();

    let outputToken = getOrCreateToken(Address.fromString(pool.outputToken));
    let outputTokenPriceBNB = findBnbPerToken(outputToken);
    pool.outputTokenPriceUSD = toDecimal(
      outputTokenPriceBNB.times(bundle.bnbPrice),
      DEFAULT_DECIMALS
    );

    token0.derivedBNB = findBnbPerToken(token0 as Token);
    token1.derivedBNB = findBnbPerToken(token1 as Token);
    token0.save();
    token1.save();

    // get tracked liquidity - will be 0 if neither is in whitelist
    let trackedLiquidityBNB: BigInt;
    if (bundle.bnbPrice.notEqual(BIGINT_ZERO)) {
      trackedLiquidityBNB = getTrackedLiquidityUSD(
        pool._reserve0,
        token0 as Token,
        pool._reserve1,
        token1 as Token
      ).div(bundle.bnbPrice);
    } else {
      trackedLiquidityBNB = BIGINT_ZERO;
    }

    // use derived amounts within pair
    pool._trackedReserveBNB = trackedLiquidityBNB;
    pool._reserveBNB = pool._reserve0
      .times(token0.derivedBNB)
      .plus(pool._reserve1.times(token1.derivedBNB));
    pool.totalValueLockedUSD = toDecimal(
      pool._reserveBNB.times(bundle.bnbPrice),
      DEFAULT_DECIMALS
    );

    // use tracked amounts globally
    protocol._totalValueLockedBNB = protocol._totalValueLockedBNB.plus(trackedLiquidityBNB)
    protocol.totalValueLockedUSD = toDecimal(protocol._totalValueLockedBNB.times(bundle.bnbPrice), DEFAULT_DECIMALS);

    // now correctly set liquidity amounts for each token
    token0.totalLiquidity = token0.totalLiquidity.plus(pool._reserve0);
    token1.totalLiquidity = token1.totalLiquidity.plus(pool._reserve1);

    // save entities
    pool.save();
    protocol.save();
    token0.save();
    token1.save();
  }
}
