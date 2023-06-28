import {
  BigInt,
  Address,
  ethereum,
  BigDecimal,
  Bytes,
} from "@graphprotocol/graph-ts";
import {
  Deposit,
  Withdraw,
  Swap,
  Position,
  CollateralIn,
  CollateralOut,
  Liquidate,
  Borrow,
  LiquidityPool,
} from "../../generated/schema";
import { getOrCreateToken } from "./token";
import { getOrCreateProtocol } from "./protocol";
import { BIGINT_ZERO } from "../utils/constants";

export enum EventType {
  Deposit,
  Withdraw,
  CollateralIn,
  CollateralOut,
  ClosePosition,
  Swap,
  Liquidate,
  Liquidated,
}

// Create a Deposit entity and update deposit count on a liquid providing event for the specific pool..
export function createDeposit(
  event: ethereum.Event,
  pool: LiquidityPool,
  accountAddress: Address,
  inputTokenAddress: Address,
  inputTokenAmount: BigInt,
  inputTokenAmountUSD: BigDecimal,
  outputTokenAmount: BigInt
): void {
  const protocol = getOrCreateProtocol();

  const transactionHash = event.transaction.hash;
  const logIndexI32 = event.logIndex.toI32();
  const deposit = new Deposit(transactionHash.concatI32(logIndexI32));

  deposit.hash = transactionHash;
  deposit.logIndex = logIndexI32;
  deposit.protocol = protocol.id;
  deposit.to = pool.id;
  deposit.from = accountAddress;
  deposit.account = accountAddress;
  deposit.blockNumber = event.block.number;
  deposit.timestamp = event.block.timestamp;
  deposit.inputTokens = pool.inputTokens;

  const inputTokenAmounts = new Array<BigInt>(deposit.inputTokens.length).fill(
    BIGINT_ZERO
  );
  const inputToken = getOrCreateToken(event, inputTokenAddress);
  const inputTokenIndex = deposit.inputTokens.indexOf(inputToken.id);
  if (inputTokenIndex >= 0) {
    inputTokenAmounts[inputTokenIndex] = inputTokenAmount;
  }
  deposit.inputTokenAmounts = inputTokenAmounts;

  deposit.outputToken = pool.outputToken;
  deposit.outputTokenAmount = outputTokenAmount;
  deposit.amountUSD = inputTokenAmountUSD;
  deposit.pool = pool.id;

  deposit.save();
}

export function createWithdraw(
  event: ethereum.Event,
  pool: LiquidityPool,
  accountAddress: Address,
  inputTokenAddress: Address,
  inputTokenAmount: BigInt,
  inputTokenAmountUSD: BigDecimal,
  outputTokenAmount: BigInt
): void {
  const protocol = getOrCreateProtocol();
  const transactionHash = event.transaction.hash;
  const logIndexI32 = event.logIndex.toI32();
  const withdrawal = new Withdraw(transactionHash.concatI32(logIndexI32));

  withdrawal.hash = transactionHash;
  withdrawal.logIndex = logIndexI32;
  withdrawal.protocol = protocol.id;
  withdrawal.to = accountAddress;
  withdrawal.from = pool.id;
  withdrawal.account = accountAddress;
  withdrawal.blockNumber = event.block.number;
  withdrawal.timestamp = event.block.timestamp;
  withdrawal.inputTokens = pool.inputTokens;

  const inputTokenAmounts = new Array<BigInt>(
    withdrawal.inputTokens.length
  ).fill(BIGINT_ZERO);
  const inputToken = getOrCreateToken(event, inputTokenAddress);
  const inputTokenIndex = withdrawal.inputTokens.indexOf(inputToken.id);
  if (inputTokenIndex >= 0) {
    inputTokenAmounts[inputTokenIndex] = inputTokenAmount;
  }
  withdrawal.inputTokenAmounts = inputTokenAmounts;

  withdrawal.outputToken = pool.outputToken;
  withdrawal.outputTokenAmount = outputTokenAmount;
  withdrawal.amountUSD = inputTokenAmountUSD;
  withdrawal.pool = pool.id;

  withdrawal.save();
}

export function createBorrow(
  event: ethereum.Event,
  pool: LiquidityPool,
  accountAddress: Address,
  inputTokenAddress: Address,
  inputTokenAmount: BigInt,
  inputTokenAmountUSD: BigDecimal,
  position: Position
): void {
  const protocol = getOrCreateProtocol();
  const transactionHash = event.transaction.hash;
  const logIndexI32 = event.logIndex.toI32();
  const borrow = new Borrow(
    Bytes.fromUTF8("borrow").concat(transactionHash.concatI32(logIndexI32))
  );

  borrow.hash = transactionHash;
  borrow.logIndex = logIndexI32;
  borrow.protocol = protocol.id;
  borrow.to = pool.id;
  borrow.from = accountAddress;
  borrow.account = accountAddress;
  borrow.position = position.id;
  borrow.blockNumber = event.block.number;
  borrow.timestamp = event.block.timestamp;
  borrow.asset = inputTokenAddress;
  borrow.amount = inputTokenAmount;
  borrow.amountUSD = inputTokenAmountUSD;
  borrow.pool = pool.id;

  borrow.save();
}

export function createCollateralIn(
  event: ethereum.Event,
  pool: LiquidityPool,
  accountAddress: Address,
  inputTokenAddress: Address,
  inputTokenAmount: BigInt,
  inputTokenAmountUSD: BigDecimal,
  outputTokenAmount: BigInt,
  position: Position
): void {
  const protocol = getOrCreateProtocol();

  const transactionHash = event.transaction.hash;
  const logIndexI32 = event.logIndex.toI32();
  const collateralIn = new CollateralIn(transactionHash.concatI32(logIndexI32));

  collateralIn.hash = transactionHash;
  collateralIn.logIndex = logIndexI32;
  collateralIn.protocol = protocol.id;
  collateralIn.to = pool.id;
  collateralIn.from = accountAddress;
  collateralIn.account = accountAddress;
  collateralIn.position = position.id;
  collateralIn.blockNumber = event.block.number;
  collateralIn.timestamp = event.block.timestamp;
  collateralIn.inputTokens = pool.inputTokens;

  const inputTokenAmounts = new Array<BigInt>(
    collateralIn.inputTokens.length
  ).fill(BIGINT_ZERO);
  const inputToken = getOrCreateToken(event, inputTokenAddress);
  const inputTokenIndex = collateralIn.inputTokens.indexOf(inputToken.id);
  if (inputTokenIndex >= 0) {
    inputTokenAmounts[inputTokenIndex] = inputTokenAmount;
  }
  collateralIn.inputTokenAmounts = inputTokenAmounts;

  collateralIn.outputToken = pool.outputToken;
  collateralIn.outputTokenAmount = outputTokenAmount;
  collateralIn.amountUSD = inputTokenAmountUSD;
  collateralIn.pool = pool.id;

  collateralIn.save();
}

export function createCollateralOut(
  event: ethereum.Event,
  pool: LiquidityPool,
  accountAddress: Address,
  inputTokenAddress: Address,
  inputTokenAmount: BigInt,
  inputTokenAmountUSD: BigDecimal,
  outputTokenAmount: BigInt,
  position: Position
): void {
  const protocol = getOrCreateProtocol();
  const transactionHash = event.transaction.hash;
  const logIndexI32 = event.logIndex.toI32();
  const collateralOut = new CollateralOut(
    transactionHash.concatI32(logIndexI32)
  );

  collateralOut.hash = transactionHash;
  collateralOut.logIndex = logIndexI32;
  collateralOut.protocol = protocol.id;
  collateralOut.to = accountAddress;
  collateralOut.from = pool.id;
  collateralOut.account = accountAddress;
  collateralOut.position = position.id;
  collateralOut.blockNumber = event.block.number;
  collateralOut.timestamp = event.block.timestamp;
  collateralOut.inputTokens = pool.inputTokens;

  const inputTokenAmounts = new Array<BigInt>(
    collateralOut.inputTokens.length
  ).fill(BIGINT_ZERO);
  const inputToken = getOrCreateToken(event, inputTokenAddress);
  const inputTokenIndex = collateralOut.inputTokens.indexOf(inputToken.id);
  if (inputTokenIndex >= 0) {
    inputTokenAmounts[inputTokenIndex] = inputTokenAmount;
  }
  collateralOut.inputTokenAmounts = inputTokenAmounts;

  collateralOut.outputToken = pool.outputToken;
  collateralOut.outputTokenAmount = outputTokenAmount;
  collateralOut.amountUSD = inputTokenAmountUSD;
  collateralOut.pool = pool.id;

  collateralOut.save();
}

export function createLiquidate(
  event: ethereum.Event,
  pool: LiquidityPool,
  asset: Address,
  amountLiquidated: BigInt,
  amountLiquidatedUSD: BigDecimal,
  profitUSD: BigDecimal,
  liquidator: Address,
  liquidatee: Address,
  position: Position
): void {
  const protocol = getOrCreateProtocol();
  const transactionHash = event.transaction.hash;
  const logIndexI32 = event.logIndex.toI32();
  const liquidate = new Liquidate(transactionHash.concatI32(logIndexI32));

  liquidate.hash = transactionHash;
  liquidate.logIndex = logIndexI32;
  liquidate.protocol = protocol.id;
  liquidate.position = position.id;
  liquidate.to = liquidator;
  liquidate.from = liquidatee;
  liquidate.blockNumber = event.block.number;
  liquidate.timestamp = event.block.timestamp;
  liquidate.account = liquidator;
  liquidate.liquidatee = liquidatee;
  liquidate.asset = asset;
  liquidate.amount = amountLiquidated;
  liquidate.amountUSD = amountLiquidatedUSD;
  liquidate.profitUSD = profitUSD;
  liquidate.pool = pool.id;

  liquidate.save();
}

export function createSwap(
  event: ethereum.Event,
  pool: LiquidityPool,
  accountAddress: Address,
  inputTokenAddress: Address,
  inputTokenAmount: BigInt,
  inputTokenAmountUSD: BigDecimal,
  outputTokenAddress: Address,
  outputTokenAmount: BigInt,
  outputTokenAmountUSD: BigDecimal
): void {
  const protocol = getOrCreateProtocol();
  const transactionHash = event.transaction.hash;
  const logIndexI32 = event.logIndex.toI32();
  const swap = new Swap(transactionHash.concatI32(logIndexI32));

  swap.hash = transactionHash;
  swap.logIndex = logIndexI32;
  swap.protocol = protocol.id;
  swap.to = pool.id;
  swap.from = accountAddress;
  swap.account = accountAddress;
  swap.blockNumber = event.block.number;
  swap.timestamp = event.block.timestamp;
  swap.tokenIn = inputTokenAddress;
  swap.amountIn = inputTokenAmount;
  swap.amountInUSD = inputTokenAmountUSD;
  swap.tokenOut = outputTokenAddress;
  swap.amountOut = outputTokenAmount;
  swap.amountOutUSD = outputTokenAmountUSD;
  swap.tradingPair = pool.id;
  swap.pool = pool.id;

  swap.save();
}
