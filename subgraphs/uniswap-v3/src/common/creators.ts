import { BigInt, Address, ethereum, BigDecimal } from "@graphprotocol/graph-ts";
import {
  LiquidityPool,
  Token,
  Deposit,
  Withdraw,
  Swap,
  _HelperStore,
  _LiquidityPoolAmount,
  LiquidityPoolFee,
} from "../../generated/schema";
import { Pool as PoolTemplate } from "../../generated/templates";
import {
  getLiquidityPool,
  getLiquidityPoolAmounts,
  getOrCreateDex,
  getOrCreateToken,
} from "./getters";
import { NetworkConfigs } from "../../configurations/configure";
import {
  BIGDECIMAL_FIFTY,
  BIGDECIMAL_NEG_ONE,
  BIGDECIMAL_ZERO,
  BIGINT_NEG_ONE,
  BIGINT_ZERO,
  INT_ONE,
  INT_ZERO,
  LiquidityPoolFeeType,
  Network,
  PROTOCOL_FEE_TO_OFF,
} from "./constants";
import {
  getTrackedVolumeUSD,
  findUSDPricePerToken,
  sqrtPriceX96ToTokenPrices,
  updateNativeTokenPriceInUSD,
} from "./price/price";
import { updateTokenWhitelists, updateVolumeAndFees } from "./updateMetrics";
import { convertFeeToPercent, convertTokenToDecimal } from "./utils/utils";
import { populateEmptyPools } from "./utils/backfill";

// Create a liquidity pool from pairCreated event.
export function createLiquidityPool(
  event: ethereum.Event,
  poolAddress: string,
  token0Address: string,
  token1Address: string,
  fees: i32
): void {
  let protocol = getOrCreateDex();

  // create the tokens and tokentracker
  let token0 = getOrCreateToken(token0Address);
  let token1 = getOrCreateToken(token1Address);

  updateTokenWhitelists(token0, token1, poolAddress);

  let pool = new LiquidityPool(poolAddress);
  let poolAmounts = new _LiquidityPoolAmount(poolAddress);

  pool.protocol = protocol.id;
  pool.name =
    protocol.name +
    " " +
    token0.name +
    "/" +
    token1.name +
    " " +
    convertFeeToPercent(fees).toString() +
    "%";
  pool.symbol = token0.name + "/" + token1.name;
  pool.inputTokens = [token0.id, token1.id];
  pool.fees = createPoolFees(poolAddress, fees);
  pool.isSingleSided = false;
  pool.createdTimestamp = event.block.timestamp;
  pool.createdBlockNumber = event.block.number;
  pool.totalValueLockedUSD = BIGDECIMAL_ZERO;
  pool.cumulativeSupplySideRevenueUSD = BIGDECIMAL_ZERO;
  pool.cumulativeProtocolSideRevenueUSD = BIGDECIMAL_ZERO;
  pool.cumulativeTotalRevenueUSD = BIGDECIMAL_ZERO;
  pool.cumulativeVolumeUSD = BIGDECIMAL_ZERO;
  pool.inputTokenBalances = [BIGINT_ZERO, BIGINT_ZERO];
  pool.inputTokenWeights = [BIGDECIMAL_FIFTY, BIGDECIMAL_FIFTY];

  poolAmounts.inputTokens = [token0.id, token1.id];
  poolAmounts.inputTokenBalances = [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];
  poolAmounts.tokenPrices = [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];

  // Used to track the number of deposits in a liquidity pool
  let poolDeposits = new _HelperStore(poolAddress);
  poolDeposits.valueInt = INT_ZERO;

  protocol.totalPoolCount = protocol.totalPoolCount + INT_ONE;
  protocol.save();

  // Create and track the newly created pool contract based on the template specified in the subgraph.yaml file.
  PoolTemplate.create(Address.fromString(poolAddress));

  // populate pre-regenesis pools if needed
  if (
    NetworkConfigs.getNetwork() == Network.OPTIMISM &&
    protocol._regenesis == false
  ) {
    populateEmptyPools(event);
  }

  pool.save();
  token0.save();
  token1.save();
  poolAmounts.save();
  poolDeposits.save();
}

// create pool fee entities based on the fee structure received from pairCreated event.
export function createPoolFees(poolAddressString: string, fee: i64): string[] {
  // LP Fee
  let poolLpFee = new LiquidityPoolFee("lp-fee-" + poolAddressString);
  poolLpFee.feeType = LiquidityPoolFeeType.FIXED_LP_FEE;
  poolLpFee.feePercentage = convertFeeToPercent(fee);

  // Protocol Fee
  let poolProtocolFee = new LiquidityPoolFee(
    "protocol-fee-" + poolAddressString
  );
  poolProtocolFee.feeType = LiquidityPoolFeeType.FIXED_PROTOCOL_FEE;
  poolProtocolFee.feePercentage = PROTOCOL_FEE_TO_OFF;

  // Trading Fee
  let poolTradingFee = new LiquidityPoolFee("trading-fee-" + poolAddressString);
  poolTradingFee.feeType = LiquidityPoolFeeType.FIXED_TRADING_FEE;
  poolTradingFee.feePercentage = convertFeeToPercent(fee);

  poolLpFee.save();
  poolProtocolFee.save();
  poolTradingFee.save();

  return [poolLpFee.id, poolProtocolFee.id, poolTradingFee.id];
}

// Update store that tracks the deposit count per pool
function incrementDepositHelper(poolAddress: string): void {
  let poolDeposits = _HelperStore.load(poolAddress)!;
  poolDeposits.valueInt = poolDeposits.valueInt + INT_ONE;
  poolDeposits.save();
}

// Create a deposit from a Mint event from a particular pool contract.
// Also, updated token balances and total value locked.
export function createDeposit(
  event: ethereum.Event,
  owner: Address,
  amount0: BigInt,
  amount1: BigInt
): void {
  let poolAddress = event.address.toHexString();

  let pool = getLiquidityPool(poolAddress);
  let poolAmounts = getLiquidityPoolAmounts(poolAddress);

  let protocol = getOrCreateDex();

  let token0 = getOrCreateToken(pool.inputTokens[0]);
  let token1 = getOrCreateToken(pool.inputTokens[1]);

  // Convert tokens according to decimals
  let amount0Converted = convertTokenToDecimal(amount0, token0.decimals);
  let amount1Converted = convertTokenToDecimal(amount1, token1.decimals);

  // Get the value in USD of the deposit
  let amountUSD = amount0Converted
    .times(token0.lastPriceUSD!)
    .plus(amount1Converted.times(token1.lastPriceUSD!));

  // reset tvl aggregates until new amounts calculated
  protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.minus(
    pool.totalValueLockedUSD
  );

  // Update pool balances adjusted for decimals and not adjusted
  let poolInputTokenBalances: BigInt[] = [
    pool.inputTokenBalances[0].plus(amount0),
    pool.inputTokenBalances[1].plus(amount1),
  ];
  pool.inputTokenBalances = poolInputTokenBalances;

  let poolAmountsInputTokenBalances: BigDecimal[] = [
    poolAmounts.inputTokenBalances[0].plus(amount0Converted),
    poolAmounts.inputTokenBalances[1].plus(amount1Converted),
  ];
  poolAmounts.inputTokenBalances = poolAmountsInputTokenBalances;

  // Get the total value locked in USD
  pool.totalValueLockedUSD = poolAmounts.inputTokenBalances[0]
    .times(token0.lastPriceUSD!)
    .plus(poolAmounts.inputTokenBalances[1].times(token1.lastPriceUSD!));

  // Add pool value back to protocol total value locked
  protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.plus(
    pool.totalValueLockedUSD
  );

  let deposit = new Deposit(
    event.transaction.hash
      .toHexString()
      .concat("-")
      .concat(event.logIndex.toString())
  );

  deposit.hash = event.transaction.hash.toHexString();
  deposit.logIndex = event.logIndex.toI32();
  deposit.protocol = protocol.id;
  deposit.to = pool.id;
  deposit.from = owner.toHexString();
  deposit.blockNumber = event.block.number;
  deposit.timestamp = event.block.timestamp;
  deposit.inputTokens = [pool.inputTokens[0], pool.inputTokens[1]];
  deposit.inputTokenAmounts = [amount0, amount1];
  deposit.pool = pool.id;
  deposit.amountUSD = amountUSD;

  // Increment the amount of deposits in the pool. Used by getTrackedVolumeUSD in price.ts.
  incrementDepositHelper(poolAddress);

  deposit.save();
  pool.save();
  poolAmounts.save();
  protocol.save();
}

// Create a deposit from a Burn event from a particular pool contract.
// Also, updated token balances and total value locked.
export function createWithdraw(
  event: ethereum.Event,
  owner: Address,
  amount0: BigInt,
  amount1: BigInt
): void {
  let poolAddress = event.address.toHexString();

  let pool = getLiquidityPool(poolAddress);
  let poolAmounts = getLiquidityPoolAmounts(poolAddress);

  let protocol = getOrCreateDex();

  let token0 = getOrCreateToken(pool.inputTokens[0]);
  let token1 = getOrCreateToken(pool.inputTokens[1]);

  // Convert tokens according to decimals
  let amount0Converted = convertTokenToDecimal(amount0, token0.decimals);
  let amount1Converted = convertTokenToDecimal(amount1, token1.decimals);

  // Get the value in USD of the deposit
  let amountUSD = amount0Converted
    .times(token0.lastPriceUSD!)
    .plus(amount1Converted.times(token1.lastPriceUSD!));

  // reset tvl aggregates until new amounts calculated
  protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.minus(
    pool.totalValueLockedUSD
  );

  // Update pool balances adjusted for decimals and not adjusted
  let poolInputTokenBalances: BigInt[] = [
    pool.inputTokenBalances[0].minus(amount0),
    pool.inputTokenBalances[1].minus(amount1),
  ];
  pool.inputTokenBalances = poolInputTokenBalances;

  let poolAmountsInputTokenBalances: BigDecimal[] = [
    poolAmounts.inputTokenBalances[0].minus(amount0Converted),
    poolAmounts.inputTokenBalances[1].minus(amount1Converted),
  ];
  poolAmounts.inputTokenBalances = poolAmountsInputTokenBalances;

  // Get the total value locked in USD
  pool.totalValueLockedUSD = poolAmounts.inputTokenBalances[0]
    .times(token0.lastPriceUSD!)
    .plus(poolAmounts.inputTokenBalances[1].times(token1.lastPriceUSD!));

  // reset aggregates with new amounts
  protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.plus(
    pool.totalValueLockedUSD
  );

  let withdrawal = new Withdraw(
    event.transaction.hash
      .toHexString()
      .concat("-")
      .concat(event.logIndex.toString())
  );

  withdrawal.hash = event.transaction.hash.toHexString();
  withdrawal.logIndex = event.logIndex.toI32();
  withdrawal.protocol = protocol.id;
  withdrawal.to = owner.toHexString();
  withdrawal.from = pool.id;
  withdrawal.blockNumber = event.block.number;
  withdrawal.timestamp = event.block.timestamp;
  withdrawal.inputTokens = [pool.inputTokens[0], pool.inputTokens[1]];
  withdrawal.inputTokenAmounts = [amount0, amount1];
  withdrawal.pool = pool.id;
  withdrawal.amountUSD = amountUSD;

  withdrawal.save();
  pool.save();
  poolAmounts.save();
  protocol.save();
}

// Create a swap entity from a Swap event from a particular pool contract.
// Also, updated token prices, token balances, and total value locked.
export function createSwapHandleVolumeAndFees(
  event: ethereum.Event,
  amount0: BigInt,
  amount1: BigInt,
  recipient: Address,
  sender: Address,
  sqrtPriceX96: BigInt
): void {
  let poolAddress = event.address.toHexString();
  let protocol = getOrCreateDex();

  let pool = getLiquidityPool(poolAddress);
  let poolAmounts = getLiquidityPoolAmounts(poolAddress);

  // hot fix for bad pricing
  if (pool.id == "0x9663f2ca0454accad3e094448ea6f77443880454") {
    return;
  }

  let token0 = getOrCreateToken(pool.inputTokens[0]);
  let token1 = getOrCreateToken(pool.inputTokens[1]);

  // Convert tokens according to decimals
  let amount0Converted = convertTokenToDecimal(amount0, token0.decimals);
  let amount1Converted = convertTokenToDecimal(amount1, token1.decimals);

  // need absolute amounts for volume
  let amount0Abs = amount0Converted;
  if (amount0Converted.lt(BIGDECIMAL_ZERO)) {
    amount0Abs = amount0Converted.times(BIGDECIMAL_NEG_ONE);
  }
  let amount1Abs = amount1Converted;
  if (amount1Converted.lt(BIGDECIMAL_ZERO)) {
    amount1Abs = amount1Converted.times(BIGDECIMAL_NEG_ONE);
  }

  let amount0USD = amount0Abs.times(token0.lastPriceUSD!);
  let amount1USD = amount1Abs.times(token1.lastPriceUSD!);

  // Update the pool with the new active liquidity, price, and tick.
  let poolInputTokenBalances: BigInt[] = [
    pool.inputTokenBalances[0].plus(amount0),
    pool.inputTokenBalances[1].plus(amount1),
  ];
  pool.inputTokenBalances = poolInputTokenBalances;

  let poolAmountsInputTokenBalances: BigDecimal[] = [
    poolAmounts.inputTokenBalances[0].plus(amount0Converted),
    poolAmounts.inputTokenBalances[1].plus(amount1Converted),
  ];
  poolAmounts.inputTokenBalances = poolAmountsInputTokenBalances;

  // update USD pricing
  let nativeToken = updateNativeTokenPriceInUSD();
  nativeToken.save();

  poolAmounts.tokenPrices = sqrtPriceX96ToTokenPrices(
    sqrtPriceX96,
    token0 as Token,
    token1 as Token
  );
  poolAmounts.save();

  token0.lastPriceUSD = findUSDPricePerToken(token0, nativeToken);
  token1.lastPriceUSD = findUSDPricePerToken(token1, nativeToken);

  token0.lastPriceBlockNumber = event.block.number;
  token1.lastPriceBlockNumber = event.block.number;

  protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.minus(
    pool.totalValueLockedUSD
  );

  /**
   * Things afffected by new USD rates
   */
  // Get the total value locked in USD
  pool.totalValueLockedUSD = poolAmounts.inputTokenBalances[0]
    .times(token0.lastPriceUSD!)
    .plus(poolAmounts.inputTokenBalances[1].times(token1.lastPriceUSD!));

  protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.plus(
    pool.totalValueLockedUSD
  );

  // create Swap event
  let swap = new Swap(
    event.transaction.hash
      .toHexString()
      .concat("-")
      .concat(event.logIndex.toString())
  );

  swap.hash = event.transaction.hash.toHexString();
  swap.logIndex = event.logIndex.toI32();
  swap.protocol = protocol.id;
  swap.to = recipient.toHexString();
  swap.from = sender.toHexString();
  swap.blockNumber = event.block.number;
  swap.timestamp = event.block.timestamp;
  swap.tokenIn = amount0 > BIGINT_ZERO ? token0.id : token1.id;
  swap.amountIn = amount0 > BIGINT_ZERO ? amount0 : amount1;
  swap.amountInUSD = amount0 > BIGINT_ZERO ? amount0USD : amount1USD;
  swap.tokenOut = amount1 > BIGINT_ZERO ? token0.id : token1.id;
  swap.amountOut =
    amount1 > BIGINT_ZERO
      ? amount0.times(BIGINT_NEG_ONE)
      : amount1.times(BIGINT_NEG_ONE);
  swap.amountOutUSD = amount1 > BIGINT_ZERO ? amount0USD : amount1USD;
  swap.pool = pool.id;

  // get amount that should be tracked only - div 2 because cant count both input and output as volume
  let trackedAmountUSD = getTrackedVolumeUSD(
    poolAmounts,
    amount0USD,
    token0,
    amount1USD,
    token1
  );
  updateVolumeAndFees(
    event,
    protocol,
    pool,
    trackedAmountUSD,
    amount0,
    amount1
  );

  swap.save();
  token0.save();
  token1.save();
}
