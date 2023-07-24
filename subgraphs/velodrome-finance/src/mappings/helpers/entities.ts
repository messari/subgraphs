import {
  Address,
  store,
  BigDecimal,
  BigInt,
  ethereum,
  TypedMap,
} from "@graphprotocol/graph-ts";

import { getBaseTokenLookup } from "../../common/baseTokenDefinition";
import {
  BIGDECIMAL_ZERO,
  BIGINT_ZERO,
  LiquidityPoolFeeType,
  ZERO_ADDRESS,
} from "../../common/constants";
import { getOrCreateToken, getOrCreateTransfer } from "../../common/getters";
import { applyDecimals } from "../../common/utils/numbers";

import {
  Deposit,
  DexAmmProtocol,
  LiquidityPool,
  LiquidityPoolFee,
  Swap,
  Withdraw,
  _LiquidityGauge,
  _PoolPricingHelper,
} from "../../../generated/schema";

// Create a liquidity pool from PairCreated contract call
export function createLiquidityPool(
  protocol: DexAmmProtocol,
  poolAddress: Address,
  token0Address: Address,
  token1Address: Address,
  stable: boolean,
  hardcodedPools: TypedMap<string, TypedMap<string, string>>,
  event: ethereum.Event
): void {
  // create the tokens and tokentracker
  const token0 = getOrCreateToken(token0Address);
  const token1 = getOrCreateToken(token1Address);
  const LPtoken = getOrCreateToken(poolAddress);

  const pool = new LiquidityPool(poolAddress.toHexString());

  pool.protocol = protocol.id;
  pool.name = protocol.name + " " + LPtoken.symbol;
  pool.symbol = LPtoken.symbol;
  pool.inputTokens = [token0.id, token1.id];
  pool.outputToken = LPtoken.id;
  pool.isSingleSided = false;
  pool.createdTimestamp = event.block.timestamp;
  pool.createdBlockNumber = event.block.number;
  pool.totalValueLockedUSD = BIGDECIMAL_ZERO;
  pool.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
  pool.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
  pool.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
  pool.cumulativeVolumeUSD = BIGDECIMAL_ZERO;
  pool.inputTokenBalances = [BIGINT_ZERO, BIGINT_ZERO];
  pool.inputTokenWeights = [
    BigDecimal.fromString("50"),
    BigDecimal.fromString("50"),
  ];
  pool.outputTokenSupply = BIGINT_ZERO;
  pool.outputTokenPriceUSD = BIGDECIMAL_ZERO;
  pool.stakedOutputTokenAmount = BIGINT_ZERO;
  pool.rewardTokenEmissionsAmount = [BIGINT_ZERO];
  pool.rewardTokenEmissionsUSD = [BIGDECIMAL_ZERO];

  pool._stable = stable;

  const poolTradingFees = createPoolFees(
    poolAddress,
    pool._stable ? protocol._stableFee : protocol._volatileFee
  );
  pool.fees = [poolTradingFees.id];

  createPoolPricingHelper(
    poolAddress,
    token0Address,
    token1Address,
    hardcodedPools
  );

  const poolList = stable ? protocol._stablePools : protocol._volatilePools;
  poolList.push(poolAddress);
  if (stable) {
    protocol._stablePools = poolList;
  } else {
    protocol._volatilePools = poolList;
  }

  protocol.totalPoolCount += 1;

  pool.save();
  token0.save();
  token1.save();
  LPtoken.save();
  protocol.save();
}

export function createPoolPricingHelper(
  poolAddress: Address,
  token0Address: Address,
  token1Address: Address,
  hardcodedPools: TypedMap<string, TypedMap<string, string>>
): _PoolPricingHelper {
  let helper = _PoolPricingHelper.load(poolAddress.toHex());
  if (!helper) {
    helper = new _PoolPricingHelper(poolAddress.toHex());

    const token0Lookup = getBaseTokenLookup(token0Address, hardcodedPools);
    const token1Lookup = getBaseTokenLookup(token1Address, hardcodedPools);

    // Reference arrays are in reverse order of priority. i.e. larger index take precedence
    if (token0Lookup.priority > token1Lookup.priority) {
      // token0 is the base token
      helper.whitelisted = true;
      helper.baseToken = token0Address.toHex();
      helper.baseTokenIndex = 0;
      helper.usdPath = token0Lookup.path;
      helper.usdPathBaseTokenIndex = token0Lookup.pathUsdIdx;
    } else if (token1Lookup.priority > token0Lookup.priority) {
      // token1 is the base token
      helper.whitelisted = true;
      helper.baseToken = token1Address.toHex();
      helper.baseTokenIndex = 1;
      helper.usdPath = token1Lookup.path;
      helper.usdPathBaseTokenIndex = token1Lookup.pathUsdIdx;
    } else {
      // This means token0 == token1 == -1, unidentified base token
      helper.whitelisted = false;
      helper.baseToken = ZERO_ADDRESS;
      helper.baseTokenIndex = -1;
      helper.usdPath = [ZERO_ADDRESS];
      helper.usdPathBaseTokenIndex = [-1];
    }

    helper.priceTokenInBase = BIGDECIMAL_ZERO;

    helper.save();
  }

  return helper;
}

export function createPoolFees(
  poolAddress: Address,
  feePercentage: BigDecimal
): LiquidityPoolFee {
  let poolFee = LiquidityPoolFee.load(
    LiquidityPoolFeeType.FIXED_TRADING_FEE.concat(poolAddress.toHex())
  );
  if (!poolFee) {
    poolFee = new LiquidityPoolFee(
      LiquidityPoolFeeType.FIXED_TRADING_FEE.concat(poolAddress.toHex())
    );
    poolFee.feeType = LiquidityPoolFeeType.FIXED_TRADING_FEE;
  }
  poolFee.feePercentage = feePercentage;

  poolFee.save();

  return poolFee;
}

// Generate the deposit entity and update deposit account for the according pool.
export function createDeposit(
  protocol: DexAmmProtocol,
  pool: LiquidityPool,
  amount0: BigInt,
  amount1: BigInt,
  from: Address,
  event: ethereum.Event
): void {
  const transfer = getOrCreateTransfer(event);

  const token0 = getOrCreateToken(Address.fromString(pool.inputTokens[0]));
  const token1 = getOrCreateToken(Address.fromString(pool.inputTokens[1]));

  // update exchange info (except balances, sync will cover that)
  const token0Adjusted = applyDecimals(amount0, token0.decimals);
  const token1Adjusted = applyDecimals(amount1, token1.decimals);

  const deposit = new Deposit(
    "deposit"
      .concat("-")
      .concat(event.transaction.hash.toHex())
      .concat("-")
      .concat(event.logIndex.toString())
  );
  deposit.hash = event.transaction.hash.toHex();
  deposit.logIndex = event.logIndex.toI32();
  deposit.protocol = protocol.id;
  deposit.to = event.address.toHex();
  deposit.from = from.toHex();
  deposit.blockNumber = event.block.number;
  deposit.timestamp = event.block.timestamp;
  deposit.inputTokens = pool.inputTokens;
  deposit.outputToken = pool.outputToken;
  deposit.inputTokenAmounts = [amount0, amount1];
  deposit.outputTokenAmount = transfer.liquidity;
  deposit.amountUSD = token0
    .lastPriceUSD!.times(token0Adjusted)
    .plus(token1.lastPriceUSD!.times(token1Adjusted));
  deposit.pool = pool.id;

  deposit.save();
}

// Generate the withdraw entity
export function createWithdraw(
  protocol: DexAmmProtocol,
  pool: LiquidityPool,
  amount0: BigInt,
  amount1: BigInt,
  to: Address,
  event: ethereum.Event
): void {
  const transfer = getOrCreateTransfer(event);

  const token0 = getOrCreateToken(Address.fromString(pool.inputTokens[0]));
  const token1 = getOrCreateToken(Address.fromString(pool.inputTokens[1]));

  // update exchange info (except balances, sync will cover that)
  const token0Adjusted = applyDecimals(amount0, token0.decimals);
  const token1Adjusted = applyDecimals(amount1, token1.decimals);

  const withdrawal = new Withdraw(
    "withdraw"
      .concat("-")
      .concat(event.transaction.hash.toHex())
      .concat("-")
      .concat(event.logIndex.toString())
  );
  withdrawal.hash = event.transaction.hash.toHex();
  withdrawal.logIndex = event.logIndex.toI32();
  withdrawal.protocol = protocol.id;
  withdrawal.to = to.toHex();
  withdrawal.from = event.address.toHex();
  withdrawal.blockNumber = event.block.number;
  withdrawal.timestamp = event.block.timestamp;
  withdrawal.inputTokens = pool.inputTokens;
  withdrawal.outputToken = pool.outputToken;
  withdrawal.inputTokenAmounts = [amount0, amount1];
  withdrawal.outputTokenAmount = transfer.liquidity;
  withdrawal.amountUSD = token0
    .lastPriceUSD!.times(token0Adjusted)
    .plus(token1.lastPriceUSD!.times(token1Adjusted));
  withdrawal.pool = pool.id;

  store.remove("_Transfer", transfer.id);

  withdrawal.save();
}

export function createSwap(
  protocol: DexAmmProtocol,
  pool: LiquidityPool,
  amount0In: BigInt,
  amount0Out: BigInt,
  amount1In: BigInt,
  amount1Out: BigInt,
  from: Address,
  to: Address,
  event: ethereum.Event
): void {
  const token0 = getOrCreateToken(Address.fromString(pool.inputTokens[0]));
  const token1 = getOrCreateToken(Address.fromString(pool.inputTokens[1]));

  const amount0Total = amount0Out.plus(amount0In);
  const amount1Total = amount1Out.plus(amount1In);

  // update exchange info (except balances, sync will cover that)
  const amount0Adjusted = applyDecimals(amount0Total, token0.decimals);
  const amount1Adjusted = applyDecimals(amount1Total, token1.decimals);

  const swap = new Swap(
    "swap"
      .concat("-")
      .concat(event.transaction.hash.toHex())
      .concat("-")
      .concat(event.logIndex.toString())
  );

  swap.hash = event.transaction.hash.toHex();
  swap.logIndex = event.logIndex.toI32();
  swap.protocol = protocol.id;
  swap.to = to.toHex();
  swap.from = from.toHex();
  swap.blockNumber = event.block.number;
  swap.timestamp = event.block.timestamp;
  swap.pool = pool.id;

  if (amount0In != BIGINT_ZERO) {
    swap.tokenIn = token0.id;
    swap.amountIn = amount0Total;
    swap.amountInUSD = token0.lastPriceUSD!.times(amount0Adjusted);
    swap.tokenOut = token1.id;
    swap.amountOut = amount1Total;
    swap.amountOutUSD = token1.lastPriceUSD!.times(amount1Adjusted);
  } else {
    swap.tokenIn = token1.id;
    swap.amountIn = amount1Total;
    swap.amountInUSD = token1.lastPriceUSD!.times(amount1Adjusted);
    swap.tokenOut = token0.id;
    swap.amountOut = amount0Total;
    swap.amountOutUSD = token0.lastPriceUSD!.times(amount0Adjusted);
  }

  swap.save();
}

export function createLiquidityGauge(
  gaugeAddress: Address,
  poolAddress: Address
): _LiquidityGauge {
  const gauge = new _LiquidityGauge(gaugeAddress.toHex());
  gauge.pool = poolAddress.toHex();
  gauge.active = true;
  gauge.save();

  return gauge;
}
