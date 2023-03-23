import { BigInt, Address, ethereum } from "@graphprotocol/graph-ts";
import { Deposit, Swap, Withdraw } from "../../generated/schema";
import { Asset as AssetTemplate } from "../../generated/templates";
import { getOrCreateAsset, getOrCreateAssetPool, getOrCreateDexAmm, getOrCreateToken } from "../common/getters";
import { tokenAmountToUSDAmount } from "../common/utils/numbers";

export function createAsset(
  event: ethereum.Event,
  poolAddress: Address,
  tokenAddress: Address,
  assetAddress: Address,
): void {
  getOrCreateAsset(event, tokenAddress, assetAddress);
  getOrCreateAssetPool(event, assetAddress, poolAddress, tokenAddress);
  AssetTemplate.create(assetAddress);
}

// Generate the deposit entity and update deposit account for the according pool.
export function createDeposit(
  event: ethereum.Event,
  amount: BigInt,
  inputTokenAddress: Address,
  assetAddress: Address,
  liquidity: BigInt,
  to: Address,
  sender: Address,
): Deposit {
  const protocol = getOrCreateDexAmm();
  const deposit = new Deposit(event.transaction.hash.toHexString().concat("-").concat(event.logIndex.toString()));

  const pool = getOrCreateAssetPool(event, assetAddress, event.address, inputTokenAddress);
  const inputToken = getOrCreateToken(event, inputTokenAddress);

  deposit.hash = event.transaction.hash.toHexString();
  deposit.logIndex = event.logIndex.toI32();
  deposit.protocol = protocol.id;
  deposit.to = to.toHexString();
  deposit.pool = pool.id;
  deposit.from = sender.toHexString();
  deposit.blockNumber = event.block.number;
  deposit.timestamp = event.block.timestamp;
  deposit.inputTokens = [inputToken.id];
  deposit.inputTokenAmounts = [amount];
  deposit.outputToken = inputToken._asset;
  deposit.outputTokenAmount = liquidity;
  deposit.amountUSD = tokenAmountToUSDAmount(inputToken, amount);
  deposit.save();
  return deposit;
}

// Generate the withdraw entity
export function createWithdraw(
  event: ethereum.Event,
  amount: BigInt,
  inputTokenAddress: Address,
  assetAddress: Address,
  liquidity: BigInt,
  to: Address,
  sender: Address,
): Withdraw {
  const withdraw = new Withdraw(event.transaction.hash.toHexString().concat("-").concat(event.logIndex.toString()));

  const protocol = getOrCreateDexAmm();
  const pool = getOrCreateAssetPool(event, assetAddress, event.address, inputTokenAddress);
  const inputToken = getOrCreateToken(event, inputTokenAddress);

  withdraw.hash = event.transaction.hash.toHexString();
  withdraw.logIndex = event.logIndex.toI32();
  withdraw.protocol = protocol.id;
  withdraw.to = to.toHexString();
  withdraw.pool = pool.id;
  withdraw.from = sender.toHexString();
  withdraw.blockNumber = event.block.number;
  withdraw.timestamp = event.block.timestamp;
  withdraw.inputTokens = [inputToken.id];
  withdraw.inputTokenAmounts = [amount];
  withdraw.outputToken = inputToken._asset;
  withdraw.outputTokenAmount = liquidity;
  withdraw.amountUSD = tokenAmountToUSDAmount(inputToken, amount);
  withdraw.save();
  return withdraw;
}

// Handle swaps data and update entities volumes and fees
export function createSwap(
  event: ethereum.Event,
  sender: Address,
  inputTokenAddress: Address,
  outputTokenAddress: Address,
  inputAssetAddress: Address,
  outputAssetAddress: Address,
  inputTokenAmount: BigInt,
  actualOutputTokenAmount: BigInt,
  to: Address,
): Swap {
  const swap = new Swap(event.transaction.hash.toHexString().concat("-").concat(event.logIndex.toString()));

  const protocol = getOrCreateDexAmm();
  const inputToken = getOrCreateToken(event, inputTokenAddress);
  const outputToken = getOrCreateToken(event, outputTokenAddress);

  const amountInUsd = tokenAmountToUSDAmount(inputToken, inputTokenAmount);
  const amountOutUsd = tokenAmountToUSDAmount(outputToken, actualOutputTokenAmount);

  swap.hash = event.transaction.hash.toHexString();
  swap.logIndex = event.logIndex.toI32();
  swap.protocol = protocol.id;
  swap.to = to.toHexString();
  swap.pool = getOrCreateAssetPool(event, inputAssetAddress, event.address, inputTokenAddress).id;
  swap.fromPool = getOrCreateAssetPool(event, inputAssetAddress, event.address, inputTokenAddress).id;
  swap.toPool = getOrCreateAssetPool(event, outputAssetAddress, event.address, outputTokenAddress).id;
  swap.from = sender.toHexString();
  swap.blockNumber = event.block.number;
  swap.timestamp = event.block.timestamp;
  swap.tokenIn = inputToken.id;
  swap.amountIn = inputTokenAmount;
  swap.amountInUSD = amountInUsd;
  swap.tokenOut = outputToken.id;
  swap.amountOut = actualOutputTokenAmount;
  swap.amountOutUSD = amountOutUsd;

  swap.save();
  return swap;
}
