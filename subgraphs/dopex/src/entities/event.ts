import { BigInt, Address, ethereum } from "@graphprotocol/graph-ts";
import { Deposit, Withdraw, LiquidityPool } from "../../generated/schema";
import { getOrCreateToken } from "./token";
import { getOrCreateProtocol } from "./protocol";
import { BIGINT_ONE, BIGINT_ZERO } from "../utils/constants";
import { convertTokenToDecimal } from "../utils/numbers";

export enum EventType {
  Deposit,
  Withdraw,
  Purchase,
  Settle,
}

// Create a Deposit entity and update deposit count on a liquid providing event for the specific pool..
export function createDeposit(
  event: ethereum.Event,
  pool: LiquidityPool,
  accountAddress: Address,
  inputTokenAddress: Address,
  inputTokenAmount: BigInt
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
  deposit.outputTokenAmount = BIGINT_ONE;
  deposit.amountUSD = convertTokenToDecimal(
    inputTokenAmount,
    inputToken.decimals
  ).times(inputToken.lastPriceUSD!);
  deposit.pool = pool.id;

  deposit.save();
}

export function createWithdraw(
  event: ethereum.Event,
  pool: LiquidityPool,
  accountAddress: Address,
  inputTokenAddress: Address,
  inputTokenAmount: BigInt
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
  withdrawal.outputTokenAmount = BIGINT_ONE;
  withdrawal.amountUSD = convertTokenToDecimal(
    inputTokenAmount,
    inputToken.decimals
  ).times(inputToken.lastPriceUSD!);
  withdrawal.pool = pool.id;

  withdrawal.save();
}
