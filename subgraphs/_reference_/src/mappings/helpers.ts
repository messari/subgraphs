// import { log } from "@graphprotocol/graph-ts"
import { BigInt, BigDecimal, Address, store, ethereum } from "@graphprotocol/graph-ts";
import { DexAmmProtocol, LiquidityPool, Token } from "../../generated/schema";
import { Pair as PairTemplate } from "../../generated/templates";
import { Factory as FactoryContract } from "../../generated/templates/Pair/Factory";
import { FACTORY_ADDRESS } from "../common/constants";

export let factoryContract = FactoryContract.bind(Address.fromString(FACTORY_ADDRESS));

// Create a liquidity pool from PairCreated contract call
export function createLiquidityPool(
  event: ethereum.Event,
  protocol: DexAmmProtocol,
  poolAddress: Address,
  token0: Token,
  token1: Token,
  LPtoken: Token,
): void {
  // let pool = new LiquidityPool(poolAddress.toHexString());
  // pool.protocol = protocol.id;
  // pool.inputTokens = [token0.id, token1.id];
  // pool.outputToken = LPtoken.id;
  // ...
  // pool.save();
  // // create the tracked contract based on the template
  // PairTemplate.create(poolAddress);
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
