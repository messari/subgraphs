// import { log } from '@graphprotocol/graph-ts'
import { BigInt, Address, ethereum, log } from "@graphprotocol/graph-ts";
import { LiquidityPool, Token, Deposit, Withdraw, Swap, _HelperStore, _LiquidityPoolAmount, LiquidityPoolFee } from "../../generated/schema";
import { Pool as PoolTemplate } from "../../generated/templates";
import { Factory as FactoryContract } from "../../generated/templates/Pool/Factory";

import { getLiquidityPool, getLiquidityPoolAmounts, getOrCreateDex, getOrCreateLPToken, getOrCreateToken } from "./getters";
import { NetworkConfigs } from "../../config/paramConfig";
import {
  BIGDECIMAL_NEG_ONE,
  BIGDECIMAL_ONE,
  BIGDECIMAL_TWO,
  BIGDECIMAL_ZERO,
  BIGINT_NEG_ONE,
  BIGINT_ONE,
  BIGINT_ZERO,
  INT_ONE,
  INT_ZERO,
  LiquidityPoolFeeType,
  PROTOCOL_FEE_TO_OFF,
} from "./constants";
import { getTrackedVolumeUSD, findNativeTokenPerToken, sqrtPriceX96ToTokenPrices, updateNativeTokenPriceInUSD } from "./price/price";
import { updateTokenWhitelists, updateVolumeAndFees } from "./updateMetrics";
import { convertFeeToPercent, convertTokenToDecimal } from "./utils/utils";

export let factoryContract = FactoryContract.bind(Address.fromString(NetworkConfigs.FACTORY_ADDRESS));

// rebass tokens, dont count in tracked volume
export let UNTRACKED_PAIRS: string[] = ["0x9ea3b5b4ec044b70375236a281986106457b20ef"];

// Create a liquidity pool from PairCreated contract call
export function createLiquidityPool(event: ethereum.Event, poolAddress: string, token0Address: string, token1Address: string, fees: i32): void {
  let protocol = getOrCreateDex();

  // create the tokens and tokentracker
  let token0 = getOrCreateToken(token0Address);
  let token1 = getOrCreateToken(token1Address);
  let LPtoken = getOrCreateLPToken(poolAddress, token0, token1);

  updateTokenWhitelists(token0, token1, poolAddress);

  let pool = new LiquidityPool(poolAddress);
  let poolAmounts = new _LiquidityPoolAmount(poolAddress);

  pool.protocol = protocol.id;
  pool.inputTokens = [token0.id, token1.id];
  pool.outputToken = LPtoken.id;
  pool.totalValueLockedUSD = BIGDECIMAL_ZERO;
  pool.cumulativeVolumeUSD = BIGDECIMAL_ZERO;
  pool.inputTokenBalances = [BIGINT_ZERO, BIGINT_ZERO];
  pool.inputTokenWeights = [BIGDECIMAL_ONE.div(BIGDECIMAL_TWO), BIGDECIMAL_ONE.div(BIGDECIMAL_TWO)];
  pool.outputTokenSupply = BIGINT_ZERO;
  pool.outputTokenPriceUSD = BIGDECIMAL_ZERO;
  pool.rewardTokens = NetworkConfigs.REWARD_TOKENS;
  pool.stakedOutputTokenAmount = BIGINT_ZERO;
  pool.rewardTokenEmissionsAmount = [BIGINT_ZERO, BIGINT_ZERO];
  pool.rewardTokenEmissionsUSD = [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];
  pool.fees = createPoolFees(poolAddress, fees);
  pool.createdTimestamp = event.block.timestamp;
  pool.createdBlockNumber = event.block.number;
  pool.name = protocol.name + " " + LPtoken.symbol;
  pool.symbol = LPtoken.symbol;

  poolAmounts.inputTokens = [token0.id, token1.id];
  poolAmounts.inputTokenBalances = [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];

  // Used to track the number of deposits in a liquidity pool
  let poolDeposits = new _HelperStore(poolAddress);
  poolDeposits.valueInt = INT_ZERO;

  // create the tracked contract based on the template
  PoolTemplate.create(Address.fromString(poolAddress));

  pool.save();
  token0.save();
  token1.save();
  LPtoken.save();
  poolAmounts.save();
  poolDeposits.save();
}

function createPoolFees(poolAddressString: string, fee: i64): string[] {
  // LP Fee
  let poolLpFee = new LiquidityPoolFee("lp-fee-" + poolAddressString);
  poolLpFee.feeType = LiquidityPoolFeeType.FIXED_LP_FEE;
  poolLpFee.feePercentage = convertFeeToPercent(fee);

  // Protocol Fee
  let poolProtocolFee = new LiquidityPoolFee("protocol-fee-" + poolAddressString);
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

export function createDeposit(event: ethereum.Event, amount0: BigInt, amount1: BigInt): void {
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
    .plus(amount1Converted
      .times(token1.lastPriceUSD!));

  // reset tvl aggregates until new amounts calculated
  protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.minus(pool.totalValueLockedUSD);

  // Update pool balances adjusted for decimals and not adjusted
  pool.inputTokenBalances = [
    pool.inputTokenBalances[0].plus(amount0), 
    pool.inputTokenBalances[1].plus(amount1)
  ];
  poolAmounts.inputTokenBalances = [
    poolAmounts.inputTokenBalances[0].plus(amount0Converted), 
    poolAmounts.inputTokenBalances[1].plus(amount1Converted)
  ];

  // Get the total value locked in USD
  pool.totalValueLockedUSD = poolAmounts.inputTokenBalances[0]
    .times(token0.lastPriceUSD!)
    .plus(poolAmounts.inputTokenBalances[1]
      .times(token1.lastPriceUSD!));

  // Increment for NFT minted representing the position
  pool.outputTokenSupply = pool.outputTokenSupply!.plus(BIGINT_ONE);

  // Add pool value back to protocol total value locked
  protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.plus(pool.totalValueLockedUSD);

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
  deposit.from = event.transaction.from.toHexString();
  deposit.blockNumber = event.block.number;
  deposit.timestamp = event.block.timestamp;
  deposit.inputTokens = [pool.inputTokens[0], pool.inputTokens[1]];
  deposit.outputToken = pool.outputToken;
  deposit.inputTokenAmounts = [amount0, amount1];
  deposit.outputTokenAmount = BIGINT_ONE;
  deposit.pool = pool.id;
  deposit.amountUSD = amountUSD;

  incrementDepositHelper(poolAddress);

  deposit.save();
  pool.save();
  poolAmounts.save();
  protocol.save();
}

export function createWithdraw(event: ethereum.Event, amount0: BigInt, amount1: BigInt): void {
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
    .plus(amount1Converted
      .times(token1.lastPriceUSD!));

  // reset tvl aggregates until new amounts calculated
  protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.minus(pool.totalValueLockedUSD);

  // Update pool balances adjusted for decimals and not adjusted
  pool.inputTokenBalances = [
    pool.inputTokenBalances[0].minus(amount0), 
    pool.inputTokenBalances[1].minus(amount1)
  ];
  poolAmounts.inputTokenBalances = [
    poolAmounts.inputTokenBalances[0].minus(amount0Converted), 
    poolAmounts.inputTokenBalances[1].minus(amount1Converted)
  ];

  // Get the total value locked in USD
  pool.totalValueLockedUSD = poolAmounts.inputTokenBalances[0].times(token0.lastPriceUSD!).plus(poolAmounts.inputTokenBalances[1].times(token1.lastPriceUSD!));

  // Increment for NFT minted representing the position
  pool.outputTokenSupply = pool.outputTokenSupply!.minus(BIGINT_ONE);

  // reset aggregates with new amounts
  protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.plus(pool.totalValueLockedUSD);

  let withdrawal = new Withdraw(
    event.transaction.hash
      .toHexString()
      .concat("-")
      .concat(event.logIndex.toString())
  );

  withdrawal.hash = event.transaction.hash.toHexString();
  withdrawal.logIndex = event.logIndex.toI32();
  withdrawal.protocol = protocol.id;
  withdrawal.to = event.transaction.from.toHexString();
  withdrawal.from = pool.id;
  withdrawal.blockNumber = event.block.number;
  withdrawal.timestamp = event.block.timestamp;
  withdrawal.inputTokens = [pool.inputTokens[0], pool.inputTokens[1]];
  withdrawal.outputToken = pool.outputToken;
  withdrawal.inputTokenAmounts = [amount0, amount1];
  withdrawal.outputTokenAmount = BIGINT_ONE;
  withdrawal.pool = pool.id;
  withdrawal.amountUSD = amountUSD;

  withdrawal.save();
  pool.save();
  poolAmounts.save();
  protocol.save();
}

export function createSwapHandleVolumeAndFees(event: ethereum.Event, amount0: BigInt, amount1: BigInt, to: Address, from: Address, sqrtPriceX96: BigInt): void {
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
  pool.inputTokenBalances = [
    pool.inputTokenBalances[0].plus(amount0), 
    pool.inputTokenBalances[1].plus(amount1)
  ];
  poolAmounts.inputTokenBalances = [
    poolAmounts.inputTokenBalances[0].plus(amount0Converted), 
    poolAmounts.inputTokenBalances[1].plus(amount1Converted)
  ];

  // update USD pricing
  let nativeToken = updateNativeTokenPriceInUSD();
  nativeToken.save();

  poolAmounts.tokenPrices = sqrtPriceX96ToTokenPrices(sqrtPriceX96, token0 as Token, token1 as Token);
  poolAmounts.save();

  token0.lastPriceUSD = findNativeTokenPerToken(token0, nativeToken);
  token1.lastPriceUSD = findNativeTokenPerToken(token1, nativeToken);

  token0.lastPriceBlockNumber = event.block.number;
  token1.lastPriceBlockNumber = event.block.number;

  protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.minus(pool.totalValueLockedUSD);

  /**
   * Things afffected by new USD rates
   */
  // Get the total value locked in USD
  pool.totalValueLockedUSD = poolAmounts.inputTokenBalances[0]
    .times(token0.lastPriceUSD!)
    .plus(poolAmounts.inputTokenBalances[1]
    .times(token1.lastPriceUSD!));

  protocol.totalValueLockedUSD = protocol.totalValueLockedUSD.plus(pool.totalValueLockedUSD);

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
  swap.to = to.toHexString();
  swap.from = from.toHexString();
  swap.blockNumber = event.block.number;
  swap.timestamp = event.block.timestamp;
  swap.tokenIn = amount0 > BIGINT_ZERO ? token0.id : token1.id;
  swap.amountIn = amount0 > BIGINT_ZERO ? amount0 : amount1;
  swap.amountInUSD = amount0 > BIGINT_ZERO ? amount0USD : amount1USD;
  swap.tokenOut = amount1 > BIGINT_ZERO ? token0.id : token1.id;
  swap.amountOut = amount1 > BIGINT_ZERO ? amount0.times(BIGINT_NEG_ONE) : amount1.times(BIGINT_NEG_ONE);
  swap.amountOutUSD = amount1 > BIGINT_ZERO ? amount0USD : amount1USD;
  swap.pool = pool.id;

  // get amount that should be tracked only - div 2 because cant count both input and output as volume
  let trackedAmountUSD = getTrackedVolumeUSD(poolAmounts, amount0Abs, token0 as Token, amount1Abs, token1 as Token);
  updateVolumeAndFees(event, protocol, pool, trackedAmountUSD, amount0, amount1);

  swap.save();
  token0.save();
  token1.save();
}
