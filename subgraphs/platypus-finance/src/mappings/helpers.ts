import { BigInt, Address, ethereum, BigDecimal } from "@graphprotocol/graph-ts";
import { Asset, Deposit, Swap, Withdraw } from "../../generated/schema";
import { Asset as AssetTemplate } from "../../generated/templates";
import { TransactionType } from "../common/constants";
import { getOrCreateDexAmm, getOrCreateLiquidityPool, getOrCreateToken, updatePricesForToken } from "../common/getters";
import { updateProtocolTVL } from "../common/metrics";
import { tokenAmountToUSDAmount } from "../common/utils/numbers";

export function createAsset(
  event: ethereum.Event,
  poolAddress: Address,
  tokenAddress: Address,
  assetAddress: Address,
): void {
  let asset = new Asset(assetAddress.toHexString());
  asset.token = tokenAddress.toHexString();
  asset.pool = poolAddress.toHexString();
  asset.maxSupply = BigInt.zero();
  asset.blockNumber = event.block.number;
  asset.timestamp = event.block.timestamp;
  asset.save();

  const token = getOrCreateToken(event, tokenAddress);
  token._asset = assetAddress.toHexString();
  token.save();

  const pool = getOrCreateLiquidityPool(poolAddress);

  let assets: string[] = pool._assets;
  let inputTokens: string[] = pool.inputTokens;
  let inputTokenBalances: BigInt[] = pool.inputTokenBalances;

  // Start Watching the Asset for updates
  AssetTemplate.create(assetAddress);

  assets.push(assetAddress.toHexString());
  inputTokens.push(token.id);
  inputTokenBalances.push(BigInt.zero());

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

  updatePricesForToken(event, inputTokenAddress);
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

  updatePricesForToken(event, inputTokenAddress);
  withdraw.amountUSD = tokenAmountToUSDAmount(inputToken, amount);
  withdraw.save();
  updateBalancesInPool<Withdraw>(event, withdraw, TransactionType.WITHDRAW);
  updateProtocolTVL(event);
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

// T extends is a work-around for not having union types in assemblyscript
export function updateBalancesInPool<T extends Deposit>(
  event: ethereum.Event,
  transaction: T,
  transactionType: TransactionType,
): void {
  let pool = getOrCreateLiquidityPool(Address.fromString(transaction.pool));
  let balances: BigInt[] = pool.inputTokenBalances;

  for (let j = 0; j < transaction.inputTokens.length; j++) {
    for (let i = 0; i < pool.inputTokens.length; i++) {
      if (pool.inputTokens[i] == transaction.inputTokens[j]) {
        if (transactionType == TransactionType.DEPOSIT) {
          balances[i] = balances[i].plus(transaction.inputTokenAmounts[j]);
        } else if (transactionType == TransactionType.WITHDRAW) {
          balances[i] = balances[i].minus(transaction.inputTokenAmounts[j]);
        }
      }
    }
  }

  pool.inputTokenBalances = balances;
  pool.save();
}
