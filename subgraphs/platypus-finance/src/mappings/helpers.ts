import { BigInt, Address, ethereum, log } from "@graphprotocol/graph-ts";
import { _Asset, Deposit, Swap, Withdraw } from "../../generated/schema";
import { Asset as AssetTemplate } from "../../generated/templates";
import { TransactionType } from "../common/constants";
import { getOrCreateDexAmm, getOrCreateLiquidityPool, getOrCreateToken } from "../common/getters";
import { updateProtocolTVL } from "../common/metrics";
import { tokenAmountToUSDAmount } from "../common/utils/numbers";
import { fetchTokenSymbol, fetchTokenName, fetchTokenDecimals } from "../common/tokens";

export function getOrCreateAsset(
  event: ethereum.Event,
  poolAddress: Address,
  tokenAddress: Address,
  assetAddress: Address,
): _Asset {
  let id = assetAddress.toHexString();

  let _asset = _Asset.load(id);
  // fetch info if null
  if (!_asset) {
    _asset = new _Asset(id);
    _asset.symbol = fetchTokenSymbol(assetAddress);
    _asset.name = fetchTokenName(assetAddress);
    _asset.decimals = fetchTokenDecimals(assetAddress);

    _asset.token = tokenAddress.toHexString();
    _asset.pool = poolAddress.toHexString();
    _asset.maxSupply = BigInt.zero();
    _asset.blockNumber = event.block.number;
    _asset.timestamp = event.block.timestamp;
    _asset.cash = BigInt.zero();
    _asset.save();
  }

  return _asset;
}

export function createAsset(
  event: ethereum.Event,
  poolAddress: Address,
  tokenAddress: Address,
  assetAddress: Address,
): void {
  let asset = getOrCreateAsset(event, poolAddress, tokenAddress, assetAddress);
  const token = getOrCreateToken(event, tokenAddress);
  const pool = getOrCreateLiquidityPool(poolAddress);

  let assets: string[] = pool._assets;
  let inputTokens: string[] = pool.inputTokens;
  let inputTokenBalances: BigInt[] = pool.inputTokenBalances;

  // Start Watching the Asset for updates
  AssetTemplate.create(assetAddress);

  if (!asset._index) {
    let _index = assets.length;
    asset._index = BigInt.fromI32(_index);
    asset.save();
    log.info("new asset {} for token {}, pool {} at index {}", [asset.id, asset.token, asset.pool, _index.toString()]);

    inputTokens.push(token.id);
    inputTokenBalances.push(BigInt.zero());
    assets.push(asset.id);
  }

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
    let _index = _asset._index!.toI32();
    let token = _asset.token.toLowerCase();

    let txToken = transaction.inputTokens[0].toLowerCase();
    let txAmt = transaction.inputTokenAmounts[0];

    if (token == txToken) {
      log.debug("[UpdateBalancesInPool] Processing: {} {} {} Before {}", [
        transactionType.toString(),
        transaction.hash,
        token,
        _asset.cash.toString(),
      ]);

      if (transactionType == TransactionType.DEPOSIT) {
        _asset.cash = _asset.cash.plus(txAmt);
        balances[_index] = balances[_index].plus(txAmt);
      } else if (transactionType == TransactionType.WITHDRAW) {
        _asset.cash = _asset.cash.minus(txAmt);
        balances[_index] = balances[_index].minus(txAmt);
      }

      log.debug("[UpdateBalancesInPool] Processing: {} {} {} After {}", [
        transactionType.toString(),
        transaction.hash,
        token,
        _asset.cash.toString(),
      ]);
      _asset.save();
      break;
    }
  }

  pool.inputTokenBalances = balances;
  pool.save();
}
