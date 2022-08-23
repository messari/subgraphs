// import { log } from "@graphprotocol/graph-ts"
import { BigInt, Address, ethereum } from "@graphprotocol/graph-ts";
import { LiquidityPool, LiquidityPoolFee } from "../../generated/schema";
import { Pair as PairTemplate } from "../../generated/templates";
import { Factory as FactoryContract } from "../../generated/templates/Pair/Factory";
import { BIGDECIMAL_ONE, BIGDECIMAL_TWO, BIGDECIMAL_ZERO, BIGINT_ZERO, FACTORY_ADDRESS, LiquidityPoolFeeType, LP_FEE_TO_ON, PROTOCOL_FEE_TO_ON, TRADING_FEE } from "../common/constants";
import { getOrCreateDex, getOrCreateToken } from "../common/getters";

export let factoryContract = FactoryContract.bind(Address.fromString(FACTORY_ADDRESS));

// Create a liquidity pool from PairCreated contract call
export function createLiquidityPool(event: ethereum.Event, poolAddress: Address, token0Address: Address, token1Address: Address): void {
  
  let protocol = getOrCreateDex();

  // create the tokens and tokentracker
  let token0 = getOrCreateToken(token0Address);
  let token1 = getOrCreateToken(token1Address);
  let LPtoken = getOrCreateToken(poolAddress);

  let pool = new LiquidityPool(poolAddress.toHexString());

  pool.protocol = protocol.id;
  pool.inputTokens = [token0.id, token1.id];
  pool.outputToken = LPtoken.id;
  pool.totalValueLockedUSD = BIGDECIMAL_ZERO;
  pool.cumulativeVolumeUSD = BIGDECIMAL_ZERO;
  pool.inputTokenBalances = [BIGINT_ZERO, BIGINT_ZERO];
  pool.inputTokenWeights = [BIGDECIMAL_ONE.div(BIGDECIMAL_TWO), BIGDECIMAL_ONE.div(BIGDECIMAL_TWO)]
  pool.outputTokenSupply = BIGINT_ZERO;
  pool.outputTokenPriceUSD = BIGDECIMAL_ZERO;
  pool.stakedOutputTokenAmount = BIGINT_ZERO;
  pool.rewardTokenEmissionsAmount = [BIGINT_ZERO, BIGINT_ZERO];
  pool.rewardTokenEmissionsUSD = [BIGDECIMAL_ZERO, BIGDECIMAL_ZERO];
  pool.fees = createPoolFees(poolAddress.toHexString());
  pool.createdTimestamp = event.block.timestamp;
  pool.createdBlockNumber = event.block.number;
  pool.name = protocol.name + " " + LPtoken.symbol;
  pool.symbol = LPtoken.symbol;

  // create the tracked contract based on the template
  PairTemplate.create(poolAddress);

  pool.save();
  token0.save();
  token1.save();
  LPtoken.save();
}

function createPoolFees(poolAddress: string): string[] {
  let poolLpFee = new LiquidityPoolFee(poolAddress.concat("-lp-fee"));
  let poolProtocolFee = new LiquidityPoolFee(poolAddress.concat("-protocol-fee"));
  let poolTradingFee = new LiquidityPoolFee(poolAddress.concat("-trading-fee"));

  poolLpFee.feeType = LiquidityPoolFeeType.FIXED_LP_FEE;
  poolProtocolFee.feeType = LiquidityPoolFeeType.FIXED_PROTOCOL_FEE;
  poolTradingFee.feeType = LiquidityPoolFeeType.FIXED_TRADING_FEE;

  poolLpFee.feePercentage = LP_FEE_TO_ON;
  poolProtocolFee.feePercentage = PROTOCOL_FEE_TO_ON;
  poolTradingFee.feePercentage = TRADING_FEE;

  poolLpFee.save();
  poolProtocolFee.save();
  poolTradingFee.save();

  return [poolLpFee.id, poolProtocolFee.id, poolTradingFee.id];
}

// Generate the deposit entity and update deposit account for the according pool.
export function createDeposit(event: ethereum.Event, amount0: BigInt, amount1: BigInt, sender: Address): void {
  // let deposit = new Deposit(event.transaction.hash.toHexString().concat("-").concat(event.logIndex.toString()));
  // deposit.hash = event.transaction.hash.toHexString();
  // deposit.logIndex = event.logIndex.toI32();
  // deposit.protocol = FACTORY_ADDRESS;
  // ..
  // deposit.save();
}

// Generate the withdraw entity
export function createWithdraw(
  event: ethereum.Event,
  amount0: BigInt,
  amount1: BigInt,
  sender: Address,
  to: Address,
): void {
  // let withdrawal = new Withdraw(event.transaction.hash.toHexString().concat("-").concat(event.logIndex.toString()));
  // withdrawal.hash = event.transaction.hash.toHexString();
  // withdrawal.logIndex = event.logIndex.toI32();
  // withdrawal.protocol = FACTORY_ADDRESS;
  // ..
  // withdrawal.save();
}

// Handle swaps data and update entities volumes and fees
export function createSwapHandleVolumeAndFees(
  event: ethereum.Event,
  to: Address,
  sender: Address,
  amount0In: BigInt,
  amount1In: BigInt,
  amount0Out: BigInt,
  amount1Out: BigInt,
): void {
  // let swap = new SwapEvent(event.transaction.hash.toHexString().concat("-").concat(event.logIndex.toString()));
  // // update swap event
  // swap.hash = event.transaction.hash.toHexString();
  // swap.logIndex = event.logIndex.toI32();
  // swap.protocol = FACTORY_ADDRESS;
  // ..
  // swap.save();
  // updateVolumeAndFees(event, trackedAmountUSD, feeUSD);
}
