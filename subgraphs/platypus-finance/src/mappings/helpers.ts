import { BigInt, Address, ethereum, log } from "@graphprotocol/graph-ts";
import {
  _Asset,
  Deposit,
  Swap,
  Withdraw,
  LiquidityPoolHourlySnapshot,
  LiquidityPoolDailySnapshot,
} from "../../generated/schema";
import { Asset as AssetTemplate } from "../../generated/templates";
import { BIGDECIMAL_ZERO, BIGINT_ZERO, SECONDS_PER_DAY, SECONDS_PER_HOUR, TransactionType } from "../common/constants";
import { getOrCreateAsset, getOrCreateDexAmm, getOrCreateLiquidityPool, getOrCreateToken } from "../common/getters";
import { tokenAmountToUSDAmount } from "../common/utils/numbers";
import { fetchTokenSymbol, fetchTokenName, fetchTokenDecimals } from "../common/tokens";
import { addToArrayAtIndex, removeFromArrayAtIndex } from "../common/utils/arrays";

export function createAsset(
  event: ethereum.Event,
  poolAddress: Address,
  tokenAddress: Address,
  assetAddress: Address,
): void {
  let asset = getOrCreateAsset(event, poolAddress, tokenAddress, assetAddress);
  const token = getOrCreateToken(event, tokenAddress);
  const pool = getOrCreateLiquidityPool(poolAddress, event);

  let assets: string[] = pool._assets;
  let inputTokens: string[] = pool.inputTokens;
  let inputTokenBalances: BigInt[] = pool.inputTokenBalances;
  let _stakedAssetsAmounts: BigInt[] = pool._stakedAssetsAmounts;
  // Start Watching the Asset for updates
  AssetTemplate.create(assetAddress);

  assets.push(asset.id);
  inputTokens.push(token.id);

  assets = assets.sort();
  inputTokens = inputTokens.sort();

  let _index = inputTokens.indexOf(token.id);
  log.info("new asset {} for token {}, pool {} at index {}", [asset.id, asset.token, asset.pool, _index.toString()]);

  inputTokenBalances.push(BIGINT_ZERO);
  _stakedAssetsAmounts.push(BIGINT_ZERO);

  pool._assets = assets;
  pool.inputTokens = inputTokens;
  pool.inputTokenBalances = inputTokenBalances;
  pool._stakedAssetsAmounts = _stakedAssetsAmounts;

  pool.save();

  let timestampDaily: i64 = event.block.timestamp.toI64() / SECONDS_PER_DAY;
  let idDaily: string = pool.id.concat("-").concat(timestampDaily.toString());
  let dailySnapshot = LiquidityPoolDailySnapshot.load(idDaily);

  if (dailySnapshot) {
    dailySnapshot._assets = pool._assets;
    dailySnapshot._inputTokens = pool.inputTokens;
    dailySnapshot.inputTokenBalances = pool.inputTokenBalances;
    dailySnapshot._stakedAssetsAmounts = pool._stakedAssetsAmounts;

    let newSwapVolumeTokenAmount = addToArrayAtIndex(dailySnapshot.dailyVolumeByTokenAmount, BIGINT_ZERO, _index);
    let newSwapVolumeUSD = addToArrayAtIndex(dailySnapshot.dailyVolumeByTokenUSD, BIGDECIMAL_ZERO, _index);

    dailySnapshot.dailyVolumeByTokenAmount = newSwapVolumeTokenAmount;
    dailySnapshot.dailyVolumeByTokenUSD = newSwapVolumeUSD;
    dailySnapshot.save();
  }

  let timestampHourly: i64 = event.block.timestamp.toI64() / SECONDS_PER_HOUR;
  let idHourly: string = pool.id.concat("-").concat(timestampHourly.toString());
  let hourlySnapshot = LiquidityPoolHourlySnapshot.load(idHourly);

  if (hourlySnapshot) {
    hourlySnapshot._assets = pool._assets;
    hourlySnapshot._inputTokens = pool.inputTokens;
    hourlySnapshot.inputTokenBalances = pool.inputTokenBalances;
    hourlySnapshot._stakedAssetsAmounts = pool._stakedAssetsAmounts;

    let newSwapVolumeTokenAmount = addToArrayAtIndex(hourlySnapshot.hourlyVolumeByTokenAmount, BIGINT_ZERO, _index);
    let newSwapVolumeUSD = addToArrayAtIndex(hourlySnapshot.hourlyVolumeByTokenUSD, BIGDECIMAL_ZERO, _index);

    hourlySnapshot.hourlyVolumeByTokenAmount = newSwapVolumeTokenAmount;
    hourlySnapshot.hourlyVolumeByTokenUSD = newSwapVolumeUSD;
    hourlySnapshot.save();
  }
}

// Generate the deposit entity and update deposit account for the according pool.
export function createDeposit(
  event: ethereum.Event,
  amount: BigInt,
  inputTokenAddress: Address,
  liquidity: BigInt,
  to: Address,
  sender: Address,
): Deposit {
  let deposit = new Deposit(event.transaction.hash.toHexString().concat("-").concat(event.logIndex.toString()));

  let protocol = getOrCreateDexAmm();
  let pool = getOrCreateLiquidityPool(event.address, event);
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
  return deposit;
}

// Generate the withdraw entity
export function createWithdraw(
  event: ethereum.Event,
  amount: BigInt,
  inputTokenAddress: Address,
  liquidity: BigInt,
  to: Address,
  sender: Address,
): Withdraw {
  let withdraw = new Withdraw(event.transaction.hash.toHexString().concat("-").concat(event.logIndex.toString()));

  let protocol = getOrCreateDexAmm();
  let pool = getOrCreateLiquidityPool(event.address, event);
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
  return withdraw;
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
  let pool = getOrCreateLiquidityPool(event.address, event);
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
