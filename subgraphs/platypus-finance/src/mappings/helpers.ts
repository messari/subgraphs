import { BigInt, Address, ethereum, BigDecimal } from "@graphprotocol/graph-ts";
import { _Asset, Deposit, Swap, Withdraw } from "../../generated/schema";
import { Asset as AssetTemplate } from "../../generated/templates";
import { TransactionType } from "../common/constants";
import { getOrCreateDexAmm, getOrCreateLiquidityPool, getOrCreateToken } from "../common/getters";
import { updateProtocolTVL } from "../common/metrics";
import { tokenAmountToUSDAmount } from "../common/utils/numbers";

export function createAsset(
  event: ethereum.Event,
  poolAddress: Address,
  tokenAddress: Address,
  assetAddress: Address,
): void {
  let asset = new _Asset(assetAddress.toHexString());
  asset.token = tokenAddress.toHexString();
  asset.pool = poolAddress.toHexString();
  asset.maxSupply = BigInt.zero();
  asset.blockNumber = event.block.number;
  asset.timestamp = event.block.timestamp;

  const token = getOrCreateToken(event, tokenAddress);
  // token._asset = assetAddress.toHexString();

  const pool = getOrCreateLiquidityPool(poolAddress);

  let assets: string[] = pool._assets;
  let inputTokens: string[] = pool.inputTokens;
  let inputTokenBalances: BigInt[] = pool.inputTokenBalances;

  // Start Watching the Asset for updates
  AssetTemplate.create(assetAddress);

  let _index = assets.length;
  asset._index = BigInt.fromI32(_index);
  asset.save();

  inputTokens.push(token.id);
  inputTokenBalances.push(BigInt.zero());
  assets.push(assetAddress.toHexString());

  pool._assets = assets;
  pool.inputTokens = inputTokens;
  pool.inputTokenBalances = inputTokenBalances;

  pool.save();
}

// Generate the deposit entity and update deposit account for the according pool.
export function createDeposit(
  event: ethereum.Event,
  amount: BigInt,
  inputTokenAddress: Address,
  liquidity: BigInt,
  to: Address,
  sender: Address,
): void {
  let deposit = new Deposit(event.transaction.hash.toHexString().concat("-").concat(event.logIndex.toString()));

  let protocol = getOrCreateDexAmm();
  let pool = getOrCreateLiquidityPool(event.address);
  let inputToken = getOrCreateToken(event, inputTokenAddress);

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
  updateBalancesInPool<Deposit>(event, deposit, TransactionType.DEPOSIT);
  updateProtocolTVL(event);
}

// Generate the withdraw entity
export function createWithdraw(
  event: ethereum.Event,
  amount: BigInt,
  inputTokenAddress: Address,
  liquidity: BigInt,
  to: Address,
  sender: Address,
): void {
  let withdraw = new Withdraw(event.transaction.hash.toHexString().concat("-").concat(event.logIndex.toString()));

  let protocol = getOrCreateDexAmm();
  let pool = getOrCreateLiquidityPool(event.address);
  let inputToken = getOrCreateToken(event, inputTokenAddress);

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
  updateBalancesInPool<Withdraw>(event, withdraw, TransactionType.WITHDRAW);
  updateProtocolTVL(event);
}

// Handle swaps data and update entities volumes and fees
export function createSwap(
  event: ethereum.Event,
  sender: Address,
  inputTokenAddress: Address,
  outputTokenAddress: Address,
  inputTokenAmount: BigInt,
  actualOutputTokenAmount: BigInt,
  to: Address,
): Swap {
  let swap = new Swap(event.transaction.hash.toHexString().concat("-").concat(event.logIndex.toString()));

  let protocol = getOrCreateDexAmm();
  let pool = getOrCreateLiquidityPool(event.address);
  let inputToken = getOrCreateToken(event, inputTokenAddress);
  let outputToken = getOrCreateToken(event, outputTokenAddress);

  let amountInUsd = tokenAmountToUSDAmount(inputToken, inputTokenAmount);
  let amountOutUsd = tokenAmountToUSDAmount(outputToken, actualOutputTokenAmount);

  swap.hash = event.transaction.hash.toHexString();
  swap.logIndex = event.logIndex.toI32();
  swap.protocol = protocol.id;
  swap.to = to.toHexString();
  swap.pool = pool.id;
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

// T extends is a work-around for not having union types in assemblyscript
export function updateBalancesInPool<T extends Deposit>(
  event: ethereum.Event,
  transaction: T,
  transactionType: TransactionType,
): void {
  let pool = getOrCreateLiquidityPool(Address.fromString(transaction.pool));
  let balances: BigInt[] = pool.inputTokenBalances;

  // There is always only one element in tx.inputTokens
  for (let i = 0; i < pool._assets.length; i++) {
    let _asset = _Asset.load(pool._assets[i])!;
    let _index = _asset._index.toI32();
    let token = _asset.token;

    if (token == transaction.inputTokens[0]) {
      if (transactionType == TransactionType.DEPOSIT) {
        balances[_index] = balances[_index].plus(transaction.inputTokenAmounts[0]);
      } else if (transactionType == TransactionType.WITHDRAW) {
        balances[_index] = balances[_index].minus(transaction.inputTokenAmounts[0]);
      }
    }
  }

  pool.inputTokenBalances = balances;
  pool.save();
}
